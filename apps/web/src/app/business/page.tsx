'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ApiError, BusinessApplication, getCurrentUser, refreshAccessToken, registerBusiness } from '@/lib/api';
import { getSession, replaceSession, Session } from '@/lib/session';
import { Brand, Icon } from '@/components/chopsave-ui';

const locations = [
  { name: 'Victoria Island', address: 'Victoria Island, Lagos', lat: 6.4281, lng: 3.4219 },
  { name: 'Lekki Phase 1', address: 'Lekki Phase 1, Lagos', lat: 6.4474, lng: 3.4723 },
  { name: 'Yaba', address: 'Yaba, Lagos', lat: 6.5095, lng: 3.3718 },
  { name: 'Ikeja', address: 'Ikeja, Lagos', lat: 6.6018, lng: 3.3515 },
];

const businessTypes: Array<{ value: BusinessApplication['type']; label: string }> = [
  { value: 'restaurant', label: 'Restaurant' }, { value: 'bakery', label: 'Bakery' }, { value: 'buka', label: 'Buka / local kitchen' }, { value: 'canteen', label: 'Canteen' }, { value: 'food_stall', label: 'Food stall' }, { value: 'supermarket', label: 'Supermarket' }, { value: 'cloud_kitchen', label: 'Cloud kitchen' },
];

function messageFor(error: unknown): string {
  return error instanceof ApiError || error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function BusinessPortalPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [form, setForm] = useState<BusinessApplication>({ businessName: '', type: 'restaurant', cacNumber: '', address: '', city: 'lagos', lat: 6.4281, lng: 3.4219, contactPhone: '', ownerFullName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const currentSession = getSession();
    setSession(currentSession);
    if (currentSession) setForm((current) => ({ ...current, ownerFullName: current.ownerFullName || currentSession.user.fullName }));
  }, []);

  function chooseLocation(location: typeof locations[number]): void {
    setForm((current) => ({ ...current, address: current.address || location.address, lat: location.lat, lng: location.lng }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!session) return;
    setLoading(true); setError(''); setNotice('');
    try {
      const business = await registerBusiness(session.accessToken, { ...form, cacNumber: form.cacNumber?.trim() || undefined });
      const { accessToken } = await refreshAccessToken(session.refreshToken);
      const user = await getCurrentUser(accessToken);
      const updatedSession = { ...session, accessToken, user };
      replaceSession(updatedSession); setSession(updatedSession);
      setNotice(`${business.name} is now pending verification. We will notify you once the review is complete.`);
    } catch (submissionError) { setError(messageFor(submissionError)); } finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-cream"><header className="border-b border-line bg-white"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6"><Brand /><Link href="/feed" className="text-sm font-bold text-slate-600 hover:text-forest">Browse bags</Link></div></header><section className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><p className="eyebrow"><Icon name="building" size={16} />For food businesses</p><h1 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Turn today’s surplus into new customers.</h1><p className="mt-3 max-w-2xl leading-7 text-slate-600">Apply to sell surprise bags in the ChopSave Lagos pilot. Our team reviews every business before it goes live.</p>{!session ? <section className="mt-8 rounded-2xl border border-line bg-white p-7 shadow-card"><h2 className="font-heading text-xl font-bold">Sign in to apply</h2><p className="mt-2 text-slate-600">Use your email sign-in first, then return here to submit your business details.</p><Link href="/login" className="primary-button mt-6">Sign in with email</Link></section> : <form className="mt-8 space-y-7 rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8" onSubmit={handleSubmit}><div><h2 className="font-heading text-xl font-bold">Business application</h2><p className="mt-1 text-sm leading-6 text-slate-500">We use these details for verification and to help customers find your pickup location.</p></div>{notice && <p role="status" className="rounded-xl bg-forest-50 px-4 py-3 text-sm font-medium text-forest">{notice}</p>}{error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}<div className="grid gap-5 sm:grid-cols-2"><label className="block sm:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Business name</span><input required minLength={2} value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} placeholder="Lekki Fresh Bakes" className="w-full rounded-xl border border-line px-4 py-3 text-slate-900" /></label><label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Business type</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as BusinessApplication['type'] })} className="w-full rounded-xl border border-line bg-white px-4 py-3 text-slate-900">{businessTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label><label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">CAC number <span className="font-normal text-slate-400">(optional)</span></span><input inputMode="numeric" pattern="[0-9]{7}" maxLength={7} value={form.cacNumber} onChange={(event) => setForm({ ...form, cacNumber: event.target.value.replace(/\D/g, '') })} placeholder="1234567" className="w-full rounded-xl border border-line px-4 py-3 text-slate-900" /></label><label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Owner name</span><input required minLength={2} autoComplete="name" value={form.ownerFullName} onChange={(event) => setForm({ ...form, ownerFullName: event.target.value })} className="w-full rounded-xl border border-line px-4 py-3 text-slate-900" /></label><label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Contact phone</span><input required autoComplete="tel" inputMode="tel" value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} placeholder="0801 234 5678" className="w-full rounded-xl border border-line px-4 py-3 text-slate-900" /></label></div><div><div className="flex items-center justify-between gap-4"><span className="text-sm font-bold text-slate-700">Lagos area</span><span className="text-xs font-medium text-slate-500">Choose the closest area</span></div><div className="mt-3 flex flex-wrap gap-2">{locations.map((location) => <button key={location.name} type="button" onClick={() => chooseLocation(location)} className={`rounded-full px-3 py-2 text-sm font-bold ${form.lat === location.lat ? 'bg-forest text-white' : 'border border-line bg-white text-slate-600 hover:border-forest hover:text-forest'}`}>{location.name}</button>)}</div></div><label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Pickup address</span><textarea required minLength={5} rows={3} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="12 Admiralty Way, Lekki Phase 1, Lagos" className="w-full rounded-xl border border-line px-4 py-3 text-slate-900" /></label><div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Latitude</span><input required type="number" step="any" value={form.lat} onChange={(event) => setForm({ ...form, lat: Number(event.target.value) })} className="w-full rounded-xl border border-line px-4 py-3 text-slate-900" /></label><label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Longitude</span><input required type="number" step="any" value={form.lng} onChange={(event) => setForm({ ...form, lng: Number(event.target.value) })} className="w-full rounded-xl border border-line px-4 py-3 text-slate-900" /></label></div><div className="rounded-xl bg-lime-100 px-4 py-3 text-sm leading-6 text-slate-700"><strong className="text-forest">What happens next:</strong> an admin verifies your location and business details before you can publish surprise bags.</div><button className="primary-button w-full" disabled={loading || Boolean(notice)} type="submit">{loading ? 'Submitting application…' : 'Submit for verification'}</button></form>}</section></main>;
}
