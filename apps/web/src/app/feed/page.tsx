'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, getNearbyListings, NearbyListing } from '@/lib/api';
import { getSession } from '@/lib/session';
import { Icon, ListingCard, PageShell } from '@/components/chopsave-ui';
import { type Listing } from '@/lib/demo-listings';

const locations = [
  { name: 'Central Lagos', lat: 6.5244, lng: 3.3792 },
  { name: 'Yaba', lat: 6.5095, lng: 3.3711 },
  { name: 'Victoria Island', lat: 6.4281, lng: 3.4219 },
  { name: 'Lekki', lat: 6.4474, lng: 3.4736 },
];

const fallbackImages = [
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=85',
];

function formatDistance(distanceMetres: number): string {
  if (distanceMetres < 1000) return `${distanceMetres} m away`;
  return `${(distanceMetres / 1000).toFixed(1)} km away`;
}

function formatPickup(start: string, end: string): string {
  const time = new Intl.DateTimeFormat('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
  });
  const date = new Intl.DateTimeFormat('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Lagos',
  });

  return `${date.format(new Date(start))} · ${time.format(new Date(start))}–${time.format(new Date(end))}`;
}

function toCardListing(listing: NearbyListing, index: number): Listing {
  return {
    slug: listing.id,
    business: listing.business.name,
    title: listing.title,
    area: listing.business.address.split(',')[0] || 'Lagos',
    distance: formatDistance(listing.distanceMetres),
    price: listing.discountPrice,
    originalPrice: listing.originalPrice ?? listing.discountPrice,
    pickup: formatPickup(listing.pickupStart, listing.pickupEnd),
    left: listing.quantityRemaining,
    image: listing.photoUrl || fallbackImages[index % fallbackImages.length],
    category: listing.foodCategories[0]?.replace(/_/g, ' ') || 'Surprise bag',
    verified: listing.business.verificationTier.startsWith('verified'),
  };
}

function messageFor(error: unknown): string {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : 'We could not load nearby food. Please try again.';
}

export default function FeedPage() {
  const [locationIndex, setLocationIndex] = useState(0);
  const [listings, setListings] = useState<NearbyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const location = locations[locationIndex];

  const loadListings = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      const response = await getNearbyListings({ lat: location.lat, lng: location.lng, city: 'lagos' });
      setListings(response.listings);
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setLoading(false);
    }
  }, [location.lat, location.lng]);

  useEffect(() => {
    setAuthenticated(Boolean(getSession()));
    void loadListings();
  }, [loadListings]);

  const visibleListings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return listings;

    return listings.filter((listing) => `${listing.title} ${listing.business.name} ${listing.foodCategories.join(' ')}`.toLowerCase().includes(query));
  }, [listings, search]);

  return (
    <PageShell active="discover" authenticated={authenticated}>
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <p className="eyebrow"><Icon name="leaf" size={16} />Save food, spend less</p>
          <div className="mt-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Good food near you</h1>
              <p className="mt-2 max-w-xl leading-6 text-slate-600">Fresh surprise bags from Lagos businesses, ready for collection at a better price.</p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-xl border border-line bg-cream px-3 py-2 text-sm font-bold text-slate-700 sm:self-auto"><Icon name="map-pin" size={17} className="text-forest" />{location.name}</div>
          </div>

          <label className="relative mt-7 block max-w-2xl">
            <span className="sr-only">Search food and businesses</span>
            <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search surprise bags or businesses" className="w-full rounded-xl border border-line bg-cream py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-400" />
          </label>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Choose a Lagos area">
            {locations.map((option, index) => <button key={option.name} type="button" onClick={() => setLocationIndex(index)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${locationIndex === index ? 'bg-forest text-white shadow-sm' : 'border border-line bg-white text-slate-600 hover:border-forest hover:text-forest'}`}>{option.name}</button>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div><h2 className="font-heading text-2xl font-extrabold text-slate-900">Available today</h2><p className="mt-1 text-sm text-slate-500">{loading ? 'Finding the best nearby bags…' : `${visibleListings.length} surprise bag${visibleListings.length === 1 ? '' : 's'} near ${location.name}`}</p></div>
          <button type="button" onClick={() => void loadListings()} disabled={loading} className="secondary-button min-h-10 px-4 py-2 text-sm"><Icon name="sliders" size={16} />Refresh</button>
        </div>

        {error && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-800"><p className="font-bold">We could not load food near you.</p><p className="mt-1 text-sm">{error}</p><button type="button" className="mt-4 text-sm font-bold underline" onClick={() => void loadListings()}>Try again</button></div>}

        {loading && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-line bg-white shadow-card"><div className="aspect-[16/10] animate-pulse bg-slate-100" /><div className="space-y-3 p-4"><div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" /><div className="h-4 w-full animate-pulse rounded bg-slate-100" /><div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" /></div></div>)}</div>}

        {!loading && !error && visibleListings.length === 0 && <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-lime-100 text-forest"><Icon name="bag" size={23} /></span><h3 className="mt-5 font-heading text-xl font-extrabold text-slate-900">No matching bags right now</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">Try another Lagos area or check back later—new surplus food is added throughout the day.</p><button type="button" onClick={() => { setSearch(''); void loadListings(); }} className="secondary-button mt-6 text-sm">Clear search</button></div>}

        {!loading && !error && visibleListings.length > 0 && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleListings.map((listing, index) => <ListingCard key={listing.id} listing={toCardListing(listing, index)} />)}</div>}

        {!authenticated && <aside className="mt-8 flex flex-col gap-4 rounded-2xl bg-forest p-6 text-white sm:flex-row sm:items-center sm:justify-between"><div><p className="font-heading text-xl font-extrabold">Found something you like?</p><p className="mt-1 text-sm text-white/75">Sign in with your email to reserve a surprise bag when reservations launch.</p></div><a href="/login" className="secondary-button shrink-0 border-white bg-white text-forest hover:border-white hover:text-forest">Sign in to ChopSave</a></aside>}
      </section>
    </PageShell>
  );
}
