'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ApiError, createReservation, getListing, type ListingDetail } from '@/lib/api';
import { getSession } from '@/lib/session';
import { Icon, PageShell } from '@/components/chopsave-ui';

const fallbackImage = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85';

function naira(value: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

function formatPickup(start: string, end: string): string {
  const time = new Intl.DateTimeFormat('en-NG', { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' });
  const date = new Intl.DateTimeFormat('en-NG', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' });
  return `${date.format(new Date(start))} · ${time.format(new Date(start))}–${time.format(new Date(end))}`;
}

function messageFor(error: unknown): string {
  return error instanceof ApiError || error instanceof Error ? error.message : 'We could not prepare your reservation. Please try again.';
}

export default function ListingDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void getListing(params.slug)
      .then((result) => {
        if (!active) return;
        setListing(result);
        setQuantity(Math.min(1, Math.max(result.quantityRemaining, 1)));
      })
      .catch((requestError) => active && setError(messageFor(requestError)))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [params.slug]);

  const canReserve = useMemo(() => Boolean(
    listing
    && listing.status === 'active'
    && listing.quantityRemaining > 0
    && new Date(listing.pickupEnd) > new Date(),
  ), [listing]);

  async function reserve(): Promise<void> {
    if (!listing || !canReserve) return;
    const session = getSession();
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(`/listing/${listing.id}`)}`);
      return;
    }

    setReserving(true);
    setError('');
    try {
      const reservation = await createReservation(session.accessToken, { listingId: listing.id, quantity });
      router.push(`/checkout/${reservation.id}`);
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setReserving(false);
    }
  }

  if (loading) {
    return <PageShell active="discover"><main className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><div className="h-10 w-36 animate-pulse rounded bg-slate-100" /><div className="mt-6 grid gap-8 lg:grid-cols-2"><div className="aspect-[4/3] animate-pulse rounded-3xl bg-slate-100" /><div className="h-96 animate-pulse rounded-3xl bg-slate-100" /></div></main></PageShell>;
  }

  if (!listing) {
    return <PageShell active="discover"><main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6"><h1 className="font-heading text-3xl font-extrabold">This bag is unavailable</h1><p className="mt-3 text-slate-600">{error || 'It may have sold out or been removed.'}</p><Link href="/feed" className="primary-button mt-7">Browse available bags</Link></main></PageShell>;
  }

  const discount = listing.originalPrice && listing.originalPrice > listing.discountPrice
    ? Math.round((1 - listing.discountPrice / listing.originalPrice) * 100)
    : null;
  const category = listing.foodCategories[0]?.replace(/_/g, ' ') || 'Surprise bag';
  const unavailableLabel = listing.quantityRemaining <= 0 ? 'Sold out' : new Date(listing.pickupEnd) <= new Date() ? 'Expired' : 'Unavailable';

  return <PageShell active="discover">
    <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
      <Link href="/feed" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-600 hover:text-forest">← Back to discover</Link>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      <div className="mt-2 grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <div className="overflow-hidden rounded-3xl bg-slate-100"><img src={listing.photoUrl || fallbackImage} alt={listing.title || 'Surprise bag'} className="aspect-[4/3] h-full w-full object-cover" /></div>
          <section className="mt-6 rounded-2xl border border-line bg-white p-5">
            <h2 className="font-heading text-lg font-bold">What’s in the bag?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{listing.description || 'It’s a surprise bag made from today’s available surplus food.'}</p>
            {listing.dietaryTags.length > 0 && <div className="mt-5 border-t border-line pt-5"><h3 className="font-heading font-bold">Dietary information</h3><p className="mt-1 text-sm text-slate-600">{listing.dietaryTags.map((tag) => tag.replace(/_/g, ' ')).join(' · ')}</p></div>}
            <div className="mt-5 border-t border-line pt-5"><h3 className="font-heading font-bold">Food safety & allergens</h3><p className="mt-1 text-sm leading-6 text-slate-500">Please ask the business about allergens when collecting. Items are prepared for same-day collection and should be enjoyed promptly.</p></div>
          </section>
        </div>
        <div>
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-1 text-sm font-bold text-slate-800">{listing.business.name}{listing.business.verificationTier.startsWith('verified') && <span className="text-forest"><Icon name="check" size={16} /></span>}</p><p className="mt-1 text-sm capitalize text-slate-500">{category} · {listing.business.address}</p></div>{discount && <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-bold text-forest">Save {discount}%</span>}</div>
            <h1 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight">{listing.title || 'Surprise bag'}</h1>
            <div className="mt-5 rounded-xl bg-forest-50 p-4">{listing.originalPrice && <p className="text-sm text-slate-600">Worth <span className="line-through">{naira(listing.originalPrice)}</span></p>}<p className="mt-1 font-heading text-3xl font-extrabold text-forest">Today: {naira(listing.discountPrice)}</p></div>
            <div className="mt-5 space-y-3"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime-100 text-forest"><Icon name="clock" size={17} /></span><div><p className="text-sm font-bold text-slate-800">Pick up {formatPickup(listing.pickupStart, listing.pickupEnd)}</p><p className="mt-0.5 text-sm text-slate-500">Don’t be late — the pickup window is fixed.</p></div></div><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime-100 text-forest"><Icon name="map-pin" size={17} /></span><div><p className="text-sm font-bold text-slate-800">{listing.business.name}</p><p className="mt-0.5 text-sm text-slate-500">{listing.business.address}</p></div></div></div>
            {canReserve ? <><div className="mt-5 flex items-center justify-between border-t border-line pt-5"><span className="text-sm font-semibold text-slate-700">Quantity</span><div className="flex items-center rounded-xl border border-line"><button disabled={quantity <= 1 || reserving} onClick={() => setQuantity(quantity - 1)} aria-label="Decrease quantity" className="tap-target text-forest disabled:text-slate-300"><Icon name="minus" size={17} /></button><span className="w-8 text-center font-heading font-bold">{quantity}</span><button disabled={quantity >= listing.quantityRemaining || reserving} onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity" className="tap-target text-forest disabled:text-slate-300"><Icon name="plus" size={17} /></button></div></div><p className="mt-4 rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">{listing.quantityRemaining} bag{listing.quantityRemaining === 1 ? '' : 's'} remaining — reserve before they’re gone.</p></> : <p className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-600">{unavailableLabel}</p>}
          </div>
          <p className="mt-4 text-center text-xs leading-5 text-slate-500">Free cancellation until 1 hour before pickup. Missed pickups are not refundable.</p>
        </div>
      </div>
    </main>
    {canReserve && <div className="sticky bottom-0 border-t border-line bg-white/95 px-4 py-3 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center gap-4"><div className="hidden sm:block"><p className="text-xs text-slate-500">{quantity} surprise bag{quantity > 1 ? 's' : ''}</p><p className="font-heading text-xl font-extrabold text-forest">{naira(listing.discountPrice * quantity)}</p></div><button type="button" onClick={() => void reserve()} disabled={reserving} className="primary-button flex-1">{reserving ? 'Reserving…' : `Reserve for ${naira(listing.discountPrice * quantity)}`}</button></div></div>}
  </PageShell>;
}
