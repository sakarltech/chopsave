'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import {
  ApiError,
  BusinessApplication,
  CreateListing,
  ManagedListing,
  MyBusiness,
  createListing,
  deleteListing,
  getCurrentUser,
  getMyBusiness,
  getMyListings,
  refreshAccessToken,
  registerBusiness,
  updateListing,
  updateListingStatus,
} from '@/lib/api';
import { getSession, replaceSession, Session } from '@/lib/session';
import { Brand, Icon } from '@/components/chopsave-ui';

const locations = [
  { name: 'Victoria Island', address: 'Victoria Island, Lagos', lat: 6.4281, lng: 3.4219 },
  { name: 'Lekki Phase 1', address: 'Lekki Phase 1, Lagos', lat: 6.4474, lng: 3.4723 },
  { name: 'Yaba', address: 'Yaba, Lagos', lat: 6.5095, lng: 3.3718 },
  { name: 'Ikeja', address: 'Ikeja, Lagos', lat: 6.6018, lng: 3.3515 },
];

const businessTypes: Array<{ value: BusinessApplication['type']; label: string }> = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'buka', label: 'Buka / local kitchen' },
  { value: 'canteen', label: 'Canteen' },
  { value: 'food_stall', label: 'Food stall' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'cloud_kitchen', label: 'Cloud kitchen' },
];

const foodCategories = [
  ['local_dishes', 'Local dishes'], ['fast_food', 'Fast food'], ['pastries', 'Pastries & baked goods'], ['drinks', 'Drinks'],
  ['groceries', 'Groceries'], ['continental', 'Continental'], ['snacks', 'Snacks'], ['other', 'Other'],
] as const;

const dietaryTags = [
  ['halal', 'Halal'], ['vegetarian', 'Vegetarian'], ['vegan', 'Vegan'], ['gluten_free', 'Gluten-free'],
  ['buka_style', 'Buka style'], ['contains_pork', 'Contains pork'], ['contains_nuts', 'Contains nuts'],
] as const;

type ListingForm = {
  title: string;
  description: string;
  originalPrice: string;
  discountPrice: string;
  quantityTotal: string;
  pickupStart: string;
  pickupEnd: string;
  foodCategories: string[];
  dietaryTags: string[];
  photoUrl: string;
};

type EditListingForm = Pick<ListingForm, 'title' | 'description' | 'pickupStart' | 'pickupEnd' | 'dietaryTags'> & { id: string };

function toDateTimeInputValue(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function createListingForm(): ListingForm {
  const pickupStart = new Date();
  pickupStart.setHours(pickupStart.getHours() + 4, 0, 0, 0);
  const pickupEnd = new Date(pickupStart);
  pickupEnd.setHours(pickupEnd.getHours() + 2);
  return { title: '', description: '', originalPrice: '', discountPrice: '', quantityTotal: '1', pickupStart: toDateTimeInputValue(pickupStart), pickupEnd: toDateTimeInputValue(pickupEnd), foodCategories: [], dietaryTags: [], photoUrl: '' };
}

function messageFor(error: unknown): string {
  return error instanceof ApiError || error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function formatNaira(value: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function toEditForm(listing: ManagedListing): EditListingForm {
  return { id: listing.id, title: listing.title || '', description: listing.description || '', pickupStart: toDateTimeInputValue(new Date(listing.pickupStart)), pickupEnd: toDateTimeInputValue(new Date(listing.pickupEnd)), dietaryTags: listing.dietaryTags };
}

function isVerified(business: MyBusiness): boolean {
  return business.verificationTier === 'verified_informal' || business.verificationTier === 'verified_cac';
}

export default function BusinessPortalPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<MyBusiness | null>(null);
  const [listings, setListings] = useState<ManagedListing[]>([]);
  const [application, setApplication] = useState<BusinessApplication>({ businessName: '', type: 'restaurant', cacNumber: '', address: '', city: 'lagos', lat: 6.4281, lng: 3.4219, contactPhone: '', ownerFullName: '' });
  const [listingForm, setListingForm] = useState<ListingForm>(createListingForm);
  const [editing, setEditing] = useState<EditListingForm | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(true);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [submittingListing, setSubmittingListing] = useState(false);
  const [savingListing, setSavingListing] = useState(false);
  const [actionListingId, setActionListingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadPortal(activeSession: Session): Promise<void> {
    setLoadingPortal(true);
    try {
      const ownerBusiness = await getMyBusiness(activeSession.accessToken);
      const ownedListings = await getMyListings(activeSession.accessToken);
      setBusiness(ownerBusiness);
      setListings(ownedListings.listings);
    } catch (loadError) {
      if (loadError instanceof ApiError && (loadError.status === 403 || loadError.status === 404)) {
        setBusiness(null);
        setListings([]);
      } else {
        setError(messageFor(loadError));
      }
    } finally {
      setLoadingPortal(false);
    }
  }

  useEffect(() => {
    const currentSession = getSession();
    setSession(currentSession);
    if (!currentSession) {
      setLoadingPortal(false);
      return;
    }
    setApplication((current) => ({ ...current, ownerFullName: current.ownerFullName || currentSession.user.fullName }));
    void loadPortal(currentSession);
  }, []);

  function chooseLocation(location: typeof locations[number]): void {
    setApplication((current) => ({ ...current, address: current.address || location.address, lat: location.lat, lng: location.lng }));
  }

  async function handleApplicationSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!session) return;
    setSubmittingApplication(true); setError(''); setNotice('');
    try {
      await registerBusiness(session.accessToken, { ...application, cacNumber: application.cacNumber?.trim() || undefined });
      const { accessToken } = await refreshAccessToken(session.refreshToken);
      const user = await getCurrentUser(accessToken);
      const updatedSession = { ...session, accessToken, user };
      replaceSession(updatedSession); setSession(updatedSession);
      await loadPortal(updatedSession);
      setNotice('Your business is pending verification. We will email you when it is ready to publish.');
    } catch (submissionError) { setError(messageFor(submissionError)); } finally { setSubmittingApplication(false); }
  }

  async function handleCreateListing(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!session || !business) return;
    const originalPrice = Number(listingForm.originalPrice);
    const discountPrice = Number(listingForm.discountPrice);
    const quantityTotal = Number(listingForm.quantityTotal);
    const pickupStart = new Date(listingForm.pickupStart);
    const pickupEnd = new Date(listingForm.pickupEnd);
    if (listingForm.foodCategories.length === 0) { setError('Choose at least one food category for the surprise bag.'); return; }
    if (discountPrice > originalPrice * 0.5) { setError('The ChopSave price must be 50% or less of the original price.'); return; }
    if (pickupEnd.getTime() - pickupStart.getTime() < 30 * 60_000) { setError('Choose a pickup window of at least 30 minutes.'); return; }
    setSubmittingListing(true); setError(''); setNotice('');
    try {
      const payload: CreateListing = { type: 'surprise_bag', title: listingForm.title.trim(), description: listingForm.description.trim(), originalPrice, discountPrice, quantityTotal, pickupStart: pickupStart.toISOString(), pickupEnd: pickupEnd.toISOString(), foodCategories: listingForm.foodCategories, dietaryTags: listingForm.dietaryTags, ...(listingForm.photoUrl.trim() ? { photoUrl: listingForm.photoUrl.trim() } : {}) };
      await createListing(session.accessToken, payload);
      setListingForm(createListingForm());
      await loadPortal(session);
      setNotice('Surprise bag is live and can now be discovered in the consumer feed.');
    } catch (submissionError) { setError(messageFor(submissionError)); } finally { setSubmittingListing(false); }
  }

  async function handleSaveListing(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!session || !editing) return;
    const pickupStart = new Date(editing.pickupStart);
    const pickupEnd = new Date(editing.pickupEnd);
    if (pickupEnd.getTime() - pickupStart.getTime() < 30 * 60_000) { setError('Choose a pickup window of at least 30 minutes.'); return; }
    setSavingListing(true); setError(''); setNotice('');
    try {
      await updateListing(session.accessToken, editing.id, { title: editing.title.trim(), description: editing.description.trim(), pickupStart: pickupStart.toISOString(), pickupEnd: pickupEnd.toISOString(), dietaryTags: editing.dietaryTags });
      setEditing(null); await loadPortal(session); setNotice('Listing details updated.');
    } catch (updateError) { setError(messageFor(updateError)); } finally { setSavingListing(false); }
  }

  async function handleStatusChange(listing: ManagedListing, status: 'active' | 'paused' | 'sold_out' | 'closed'): Promise<void> {
    if (!session) return;
    setActionListingId(listing.id); setError(''); setNotice('');
    try {
      await updateListingStatus(session.accessToken, listing.id, status);
      await loadPortal(session); setNotice(`Listing marked ${status.replace('_', ' ')}.`);
    } catch (statusError) { setError(messageFor(statusError)); } finally { setActionListingId(null); }
  }

  async function handleDeleteListing(listing: ManagedListing): Promise<void> {
    if (!session || !window.confirm(`Delete “${listing.title || 'this listing'}”? This cannot be undone.`)) return;
    setActionListingId(listing.id); setError(''); setNotice('');
    try {
      await deleteListing(session.accessToken, listing.id);
      await loadPortal(session); setNotice('Listing deleted.');
    } catch (deleteError) { setError(messageFor(deleteError)); } finally { setActionListingId(null); }
  }

  return <main className="min-h-screen bg-cream"><header className="border-b border-line bg-white"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"><Brand /><Link href="/feed" className="text-sm font-bold text-slate-600 hover:text-forest">Browse bags</Link></div></header><section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{loadingPortal ? <div className="rounded-3xl border border-line bg-white p-10 text-center text-slate-600 shadow-card">Loading your business portal…</div> : !session ? <SignInCard /> : !business ? <BusinessApplicationForm application={application} error={error} notice={notice} loading={submittingApplication} onChooseLocation={chooseLocation} onChange={setApplication} onSubmit={handleApplicationSubmit} /> : !isVerified(business) ? <VerificationStatus business={business} error={error} notice={notice} /> : <BusinessDashboard business={business} listings={listings} listingForm={listingForm} editing={editing} error={error} notice={notice} submittingListing={submittingListing} savingListing={savingListing} actionListingId={actionListingId} onListingFormChange={setListingForm} onCreateListing={handleCreateListing} onEditListing={setEditing} onEditingChange={setEditing} onSaveListing={handleSaveListing} onStatusChange={handleStatusChange} onDeleteListing={handleDeleteListing} />}</section></main>;
}

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <><p className="eyebrow"><Icon name="building" size={16} />{eyebrow}</p><h1 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h1><p className="mt-3 max-w-2xl leading-7 text-slate-600">{description}</p></>;
}

function SignInCard() {
  return <><PageIntro eyebrow="For food businesses" title="Turn today’s surplus into new customers." description="Apply to sell surprise bags in the ChopSave Lagos pilot. Our team reviews every business before it goes live." /><section className="mt-8 rounded-2xl border border-line bg-white p-7 shadow-card"><h2 className="font-heading text-xl font-bold">Sign in to apply</h2><p className="mt-2 text-slate-600">Use your email sign-in first, then return here to submit your business details.</p><Link href="/login" className="primary-button mt-6">Sign in with email</Link></section></>;
}

function BusinessApplicationForm({ application, error, notice, loading, onChooseLocation, onChange, onSubmit }: { application: BusinessApplication; error: string; notice: string; loading: boolean; onChooseLocation: (location: typeof locations[number]) => void; onChange: (business: BusinessApplication) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <><PageIntro eyebrow="For food businesses" title="Turn today’s surplus into new customers." description="Apply to sell surprise bags in the ChopSave Lagos pilot. Our team reviews every business before it goes live." /><form className="mt-8 space-y-7 rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8" onSubmit={onSubmit}><div><h2 className="font-heading text-xl font-bold">Business application</h2><p className="mt-1 text-sm leading-6 text-slate-500">We use these details for verification and to help customers find your pickup location.</p></div><PortalMessages error={error} notice={notice} /><div className="grid gap-5 sm:grid-cols-2"><Field label="Business name"><input required minLength={2} value={application.businessName} onChange={(event) => onChange({ ...application, businessName: event.target.value })} placeholder="Lekki Fresh Bakes" className="form-input" /></Field><Field label="Business type"><select value={application.type} onChange={(event) => onChange({ ...application, type: event.target.value as BusinessApplication['type'] })} className="form-input bg-white">{businessTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></Field><Field label={<>CAC number <span className="font-normal text-slate-400">(optional)</span></>}><input inputMode="numeric" pattern="[0-9]{7}" maxLength={7} value={application.cacNumber} onChange={(event) => onChange({ ...application, cacNumber: event.target.value.replace(/\D/g, '') })} placeholder="1234567" className="form-input" /></Field><Field label="Owner name"><input required minLength={2} autoComplete="name" value={application.ownerFullName} onChange={(event) => onChange({ ...application, ownerFullName: event.target.value })} className="form-input" /></Field><Field label="Contact phone"><input required autoComplete="tel" inputMode="tel" value={application.contactPhone} onChange={(event) => onChange({ ...application, contactPhone: event.target.value })} placeholder="0801 234 5678" className="form-input" /></Field></div><div><div className="flex items-center justify-between gap-4"><span className="text-sm font-bold text-slate-700">Lagos area</span><span className="text-xs font-medium text-slate-500">Choose the closest area</span></div><div className="mt-3 flex flex-wrap gap-2">{locations.map((location) => <button key={location.name} type="button" onClick={() => onChooseLocation(location)} className={`rounded-full px-3 py-2 text-sm font-bold ${application.lat === location.lat ? 'bg-forest text-white' : 'border border-line bg-white text-slate-600 hover:border-forest hover:text-forest'}`}>{location.name}</button>)}</div></div><Field label="Pickup address"><textarea required minLength={5} rows={3} value={application.address} onChange={(event) => onChange({ ...application, address: event.target.value })} placeholder="12 Admiralty Way, Lekki Phase 1, Lagos" className="form-input" /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Latitude"><input required type="number" step="any" value={application.lat} onChange={(event) => onChange({ ...application, lat: Number(event.target.value) })} className="form-input" /></Field><Field label="Longitude"><input required type="number" step="any" value={application.lng} onChange={(event) => onChange({ ...application, lng: Number(event.target.value) })} className="form-input" /></Field></div><div className="rounded-xl bg-lime-100 px-4 py-3 text-sm leading-6 text-slate-700"><strong className="text-forest">What happens next:</strong> an admin verifies your location and business details before you can publish surprise bags.</div><button className="primary-button w-full" disabled={loading} type="submit">{loading ? 'Submitting application…' : 'Submit for verification'}</button></form></>;
}

function VerificationStatus({ business, error, notice }: { business: MyBusiness; error: string; notice: string }) {
  const rejected = business.verificationTier === 'rejected';
  return <><PageIntro eyebrow="Business portal" title={rejected ? 'Your application needs attention.' : 'Your business is being reviewed.'} description={rejected ? 'Our team could not approve this application yet.' : 'We are checking your contact, location, and registration details before you can publish surprise bags.'} /><section className="mt-8 rounded-3xl border border-line bg-white p-7 shadow-card"><PortalMessages error={error} notice={notice} /><div className={`rounded-2xl p-5 ${rejected ? 'bg-red-50 text-red-800' : 'bg-lime-100 text-forest'}`}><div className="flex items-center gap-3"><Icon name={rejected ? 'x' : 'shield'} size={22} /><div><h2 className="font-heading text-xl font-bold">{business.name}</h2><p className="mt-1 text-sm font-medium">{rejected ? 'Verification was not approved.' : 'Pending verification'}</p></div></div>{rejected && business.rejectionReason ? <p className="mt-4 text-sm leading-6">Reason: {business.rejectionReason}</p> : <p className="mt-4 text-sm leading-6">You will be able to create surprise bags as soon as an admin approves this application.</p>}</div><p className="mt-6 text-sm leading-6 text-slate-600">Need help with your application? Contact the ChopSave pilot team and include your business name.</p></section></>;
}

function BusinessDashboard({ business, listings, listingForm, editing, error, notice, submittingListing, savingListing, actionListingId, onListingFormChange, onCreateListing, onEditListing, onEditingChange, onSaveListing, onStatusChange, onDeleteListing }: { business: MyBusiness; listings: ManagedListing[]; listingForm: ListingForm; editing: EditListingForm | null; error: string; notice: string; submittingListing: boolean; savingListing: boolean; actionListingId: string | null; onListingFormChange: (form: ListingForm) => void; onCreateListing: (event: FormEvent<HTMLFormElement>) => void; onEditListing: (form: EditListingForm) => void; onEditingChange: (form: EditListingForm | null) => void; onSaveListing: (event: FormEvent<HTMLFormElement>) => void; onStatusChange: (listing: ManagedListing, status: 'active' | 'paused' | 'sold_out' | 'closed') => void; onDeleteListing: (listing: ManagedListing) => void }) {
  const activeListings = listings.filter((listing) => listing.status === 'active').length;
  return <><PageIntro eyebrow="Business portal" title={`Good to see you, ${business.name}.`} description="Create a simple surprise bag, set a clear pickup window, and manage availability as your surplus changes." /><PortalMessages error={error} notice={notice} /><div className="mt-8 grid gap-4 sm:grid-cols-3"><Metric label="Live bags" value={String(activeListings)} /><Metric label="Total listings" value={String(listings.length)} /><Metric label="Pickup location" value={business.city === 'lagos' ? 'Lagos' : business.city} /></div><div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"><section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-heading text-2xl font-extrabold">Your surprise bags</h2><p className="mt-1 text-sm text-slate-500">Update availability as soon as the day’s surplus changes.</p></div><span className="rounded-full bg-forest-50 px-3 py-1.5 text-sm font-bold text-forest">{activeListings} live</span></div><div className="mt-6 space-y-4">{listings.length === 0 ? <div className="rounded-2xl border border-dashed border-line bg-cream px-5 py-10 text-center"><Icon name="bag" size={28} className="mx-auto text-forest" /><h3 className="mt-3 font-heading text-lg font-bold">No surprise bags yet</h3><p className="mt-2 text-sm leading-6 text-slate-500">Use the form to publish the first bag for {business.name}.</p></div> : listings.map((listing) => <ListingManager key={listing.id} listing={listing} editing={editing?.id === listing.id ? editing : null} saving={savingListing} actionLoading={actionListingId === listing.id} onEdit={() => onEditListing(toEditForm(listing))} onEditChange={onEditingChange} onSave={onSaveListing} onCancelEdit={() => onEditingChange(null)} onStatusChange={onStatusChange} onDelete={onDeleteListing} />)}</div></section><CreateListingForm form={listingForm} loading={submittingListing} onChange={onListingFormChange} onSubmit={onCreateListing} /></div></>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-line bg-white px-5 py-4 shadow-card"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 font-heading text-2xl font-extrabold text-slate-900">{value}</p></div>;
}

function ListingManager({ listing, editing, saving, actionLoading, onEdit, onEditChange, onSave, onCancelEdit, onStatusChange, onDelete }: { listing: ManagedListing; editing: EditListingForm | null; saving: boolean; actionLoading: boolean; onEdit: () => void; onEditChange: (form: EditListingForm | null) => void; onSave: (event: FormEvent<HTMLFormElement>) => void; onCancelEdit: () => void; onStatusChange: (listing: ManagedListing, status: 'active' | 'paused' | 'sold_out' | 'closed') => void; onDelete: (listing: ManagedListing) => void }) {
  return <article className="rounded-2xl border border-line p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${listing.status === 'active' ? 'bg-forest-50 text-forest' : listing.status === 'sold_out' ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>{listing.status.replace('_', ' ')}</span><span className="text-xs font-medium text-slate-500">{listing.quantityRemaining} of {listing.quantityTotal} remaining</span></div><h3 className="mt-3 font-heading text-lg font-bold text-slate-900">{listing.title || 'Surprise bag'}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{listing.description || 'No description added.'}</p></div><div className="text-right"><p className="font-heading text-xl font-extrabold text-forest">{formatNaira(listing.discountPrice)}</p>{listing.originalPrice ? <p className="mt-1 text-xs text-slate-400 line-through">{formatNaira(listing.originalPrice)}</p> : null}</div></div><div className="mt-4 grid gap-2 border-t border-line pt-4 text-sm text-slate-600 sm:grid-cols-2"><p><span className="font-bold text-slate-700">Pickup:</span> {formatDateTime(listing.pickupStart)}</p><p><span className="font-bold text-slate-700">Until:</span> {formatDateTime(listing.pickupEnd)}</p></div>{editing ? <form className="mt-5 space-y-4 border-t border-line pt-5" onSubmit={onSave}><div className="grid gap-4 sm:grid-cols-2"><Field label="Bag title"><input required minLength={2} value={editing.title} onChange={(event) => onEditChange({ ...editing, title: event.target.value })} className="form-input" /></Field><Field label="Pickup starts"><input required type="datetime-local" value={editing.pickupStart} onChange={(event) => onEditChange({ ...editing, pickupStart: event.target.value })} className="form-input" /></Field><Field label="Pickup ends"><input required type="datetime-local" value={editing.pickupEnd} onChange={(event) => onEditChange({ ...editing, pickupEnd: event.target.value })} className="form-input" /></Field></div><Field label="Description"><textarea required minLength={8} rows={3} value={editing.description} onChange={(event) => onEditChange({ ...editing, description: event.target.value })} className="form-input" /></Field><TagSelector label="Dietary tags" options={dietaryTags} values={editing.dietaryTags} onChange={(tags) => onEditChange({ ...editing, dietaryTags: tags })} /><div className="flex flex-wrap gap-3"><button className="primary-button" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save changes'}</button><button className="secondary-button" type="button" onClick={onCancelEdit}>Cancel</button></div></form> : <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5"><button className="secondary-button" onClick={onEdit} disabled={actionLoading}>Edit</button>{listing.status === 'active' ? <button className="secondary-button" onClick={() => onStatusChange(listing, 'paused')} disabled={actionLoading}>Pause</button> : listing.status === 'paused' ? <button className="secondary-button" onClick={() => onStatusChange(listing, 'active')} disabled={actionLoading}>Resume</button> : null}{listing.status === 'active' || listing.status === 'paused' ? <button className="secondary-button" onClick={() => onStatusChange(listing, 'sold_out')} disabled={actionLoading}>Mark sold out</button> : null}{listing.status !== 'closed' ? <button className="secondary-button" onClick={() => onStatusChange(listing, 'closed')} disabled={actionLoading}>Close</button> : null}<button className="rounded-xl px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50" onClick={() => onDelete(listing)} disabled={actionLoading}>Delete</button></div>}</article>;
}

function CreateListingForm({ form, loading, onChange, onSubmit }: { form: ListingForm; loading: boolean; onChange: (form: ListingForm) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6" onSubmit={onSubmit}><div><p className="eyebrow"><Icon name="plus" size={16} />Create listing</p><h2 className="mt-3 font-heading text-2xl font-extrabold">Publish a surprise bag</h2><p className="mt-2 text-sm leading-6 text-slate-500">Keep the contents flexible. Customers save money and collect within your selected window.</p></div><div className="mt-6 space-y-5"><Field label="Bag title"><input required minLength={2} value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} placeholder="Evening bakery surprise bag" className="form-input" /></Field><Field label="What might be inside?"><textarea required minLength={8} rows={3} value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} placeholder="A mix of fresh pastries and savoury bakes from today." className="form-input" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Original value (₦)"><input required min="1" type="number" inputMode="decimal" value={form.originalPrice} onChange={(event) => onChange({ ...form, originalPrice: event.target.value })} placeholder="3000" className="form-input" /></Field><Field label="ChopSave price (₦)"><input required min="1" type="number" inputMode="decimal" value={form.discountPrice} onChange={(event) => onChange({ ...form, discountPrice: event.target.value })} placeholder="1200" className="form-input" /></Field></div><Field label="Number of bags"><input required min="1" type="number" inputMode="numeric" value={form.quantityTotal} onChange={(event) => onChange({ ...form, quantityTotal: event.target.value })} className="form-input" /></Field><Field label="Pickup starts"><input required type="datetime-local" value={form.pickupStart} onChange={(event) => onChange({ ...form, pickupStart: event.target.value })} className="form-input" /></Field><Field label="Pickup ends"><input required type="datetime-local" value={form.pickupEnd} onChange={(event) => onChange({ ...form, pickupEnd: event.target.value })} className="form-input" /></Field><TagSelector label="Food category" required options={foodCategories} values={form.foodCategories} onChange={(categories) => onChange({ ...form, foodCategories: categories })} /><TagSelector label="Dietary tags" options={dietaryTags} values={form.dietaryTags} onChange={(tags) => onChange({ ...form, dietaryTags: tags })} /><Field label={<>Photo URL <span className="font-normal text-slate-400">(optional)</span></>}><input type="url" value={form.photoUrl} onChange={(event) => onChange({ ...form, photoUrl: event.target.value })} placeholder="https://…" className="form-input" /></Field><div className="rounded-xl bg-lime-100 px-4 py-3 text-sm leading-6 text-slate-700">Your ChopSave price must be at least 50% off the original value. A live bag becomes visible in the consumer feed immediately.</div><button className="primary-button w-full" disabled={loading} type="submit">{loading ? 'Publishing surprise bag…' : 'Publish surprise bag'}</button></div></form>;
}

function TagSelector({ label, options, values, required = false, onChange }: { label: string; options: readonly (readonly [string, string])[]; values: string[]; required?: boolean; onChange: (values: string[]) => void }) {
  return <fieldset><legend className="mb-2 text-sm font-bold text-slate-700">{label}{required ? ' *' : ''}</legend><div className="flex flex-wrap gap-2">{options.map(([value, optionLabel]) => <label key={value} className={`cursor-pointer rounded-full border px-3 py-2 text-sm font-semibold transition ${values.includes(value) ? 'border-forest bg-forest text-white' : 'border-line bg-white text-slate-600 hover:border-forest hover:text-forest'}`}><input className="sr-only" type="checkbox" checked={values.includes(value)} onChange={() => onChange(toggleValue(values, value))} />{optionLabel}</label>)}</div></fieldset>;
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>{children}</label>;
}

function PortalMessages({ error, notice }: { error: string; notice: string }) {
  return <>{notice ? <p role="status" className="mt-5 rounded-xl bg-forest-50 px-4 py-3 text-sm font-medium text-forest">{notice}</p> : null}{error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}</>;
}
