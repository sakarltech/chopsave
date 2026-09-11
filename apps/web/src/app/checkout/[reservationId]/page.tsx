'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ApiError, getReservation, initiatePayment, type Reservation } from '@/lib/api';
import { getSession } from '@/lib/session';
import { Icon, PageShell } from '@/components/chopsave-ui';

type PaymentMethod = 'card' | 'bank_transfer' | 'ussd';

function naira(value: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

function formatPickup(start?: string, end?: string): string {
  if (!start || !end) return 'Pickup time will be confirmed shortly';
  const time = new Intl.DateTimeFormat('en-NG', { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' });
  const date = new Intl.DateTimeFormat('en-NG', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' });
  return `${date.format(new Date(start))} · ${time.format(new Date(start))}–${time.format(new Date(end))}`;
}

function messageFor(error: unknown): string {
  return error instanceof ApiError || error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function CheckoutPage({ params }: { params: { reservationId: string } }) {
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [paymentReturned, setPaymentReturned] = useState(false);

  useEffect(() => {
    setPaymentReturned(new URLSearchParams(window.location.search).get('payment') === 'return');
  }, []);

  const loadReservation = useCallback(async (): Promise<Reservation | null> => {
    const session = getSession();
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(`/checkout/${params.reservationId}`)}`);
      return null;
    }

    try {
      const result = await getReservation(session.accessToken, params.reservationId);
      setReservation(result);
      setError('');
      return result;
    } catch (requestError) {
      setError(messageFor(requestError));
      return null;
    } finally {
      setLoading(false);
    }
  }, [params.reservationId, router]);

  useEffect(() => { void loadReservation(); }, [loadReservation]);

  useEffect(() => {
    if (!paymentReturned) return;
    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts += 1;
      void loadReservation().then((result) => {
        if (!result || result.status !== 'pending_payment' || attempts >= 10) window.clearInterval(interval);
      });
    }, 3000);
    return () => window.clearInterval(interval);
  }, [loadReservation, paymentReturned]);

  async function pay(): Promise<void> {
    const session = getSession();
    if (!session) return;
    setPaying(true);
    setError('');
    try {
      const payment = await initiatePayment(session.accessToken, { reservationId: params.reservationId, method });
      window.location.assign(payment.paymentUrl);
    } catch (requestError) {
      setError(messageFor(requestError));
      setPaying(false);
    }
  }

  if (loading) return <PageShell active="orders"><main className="mx-auto max-w-xl px-4 py-12 sm:px-6"><div className="h-8 w-44 animate-pulse rounded bg-slate-100" /><div className="mt-6 h-80 animate-pulse rounded-3xl bg-slate-100" /></main></PageShell>;

  if (!reservation) return <PageShell active="orders"><main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6"><h1 className="font-heading text-3xl font-extrabold">We couldn’t find that reservation</h1><p className="mt-3 text-slate-600">{error || 'It may no longer be available.'}</p><Link href="/feed" className="primary-button mt-7">Return to the feed</Link></main></PageShell>;

  const confirmed = ['confirmed', 'ready', 'completed'].includes(reservation.status);
  const cancelled = ['cancelled', 'refunded', 'no_show'].includes(reservation.status);

  return <PageShell active="orders"><main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
    <Link href="/feed" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-600 hover:text-forest">← Back to discover</Link>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
    {confirmed ? <section className="mt-5 rounded-3xl border border-line bg-white p-6 text-center shadow-card"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime-100 text-forest"><Icon name="check" size={28} /></span><p className="mt-4 text-sm font-bold text-forest">Payment confirmed</p><h1 className="mt-1 font-heading text-3xl font-extrabold">Your bag is reserved</h1><p className="mt-3 text-slate-600">Show this code to the business during the pickup window.</p><article className="mt-7 rounded-2xl bg-forest p-6 text-white"><p className="text-xs font-semibold tracking-widest text-white/70">COLLECTION CODE</p><p className="mt-3 font-heading text-5xl font-extrabold tracking-[0.18em]">{reservation.pickupCode}</p></article><div className="mt-6 space-y-3 text-left"><p className="font-heading text-xl font-bold">{reservation.businessName}</p><p className="flex items-start gap-2 text-sm text-slate-600"><Icon name="clock" size={17} className="mt-0.5 shrink-0 text-forest" />Pick up {formatPickup(reservation.pickupStart, reservation.pickupEnd)}</p><p className="flex items-start gap-2 text-sm text-slate-600"><Icon name="map-pin" size={17} className="mt-0.5 shrink-0 text-forest" />{reservation.businessAddress}</p></div><Link href="/orders" className="secondary-button mt-7 w-full">View your orders</Link></section> : cancelled ? <section className="mt-5 rounded-3xl border border-line bg-white p-7 text-center shadow-card"><h1 className="font-heading text-3xl font-extrabold">This reservation is no longer active</h1><p className="mt-3 text-slate-600">Its status is {reservation.status.replace(/_/g, ' ')}. You can choose another available bag.</p><Link href="/feed" className="primary-button mt-7">Find another bag</Link></section> : <section className="mt-5 rounded-3xl border border-line bg-white p-6 shadow-card"><p className="eyebrow"><Icon name="bag" size={16} />Almost there</p><h1 className="mt-4 font-heading text-3xl font-extrabold">Secure your reservation</h1><p className="mt-2 text-slate-600">{reservation.listingTitle || 'Surprise bag'} from {reservation.businessName || 'a ChopSave business'}</p><div className="mt-6 rounded-2xl bg-forest-50 p-5"><p className="text-sm text-slate-600">{reservation.quantity} bag{reservation.quantity === 1 ? '' : 's'}</p><p className="mt-1 font-heading text-3xl font-extrabold text-forest">{naira(reservation.amountPaid)}</p><p className="mt-3 flex items-start gap-2 text-sm text-slate-600"><Icon name="clock" size={17} className="mt-0.5 shrink-0 text-forest" />Pick up {formatPickup(reservation.pickupStart, reservation.pickupEnd)}</p></div>{paymentReturned && <p role="status" className="mt-5 rounded-xl bg-orange-50 px-4 py-3 text-sm leading-6 text-orange-800">We’re confirming your payment with Paystack. This page checks automatically for 30 seconds; do not pay again unless Paystack showed a failure.</p>}<fieldset className="mt-7"><legend className="text-sm font-bold text-slate-700">Payment method</legend><div className="mt-3 grid gap-3">{([{ value: 'card', label: 'Debit or credit card', copy: 'Pay securely with your card.' }, { value: 'bank_transfer', label: 'Bank transfer', copy: 'Use Paystack’s bank transfer instructions.' }, { value: 'ussd', label: 'USSD', copy: 'Use your bank’s USSD payment option.' }] as const).map((option) => <label key={option.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${method === option.value ? 'border-forest bg-forest-50' : 'border-line bg-white'}`}><input type="radio" name="method" value={option.value} checked={method === option.value} onChange={() => setMethod(option.value)} /><span><span className="block text-sm font-bold text-slate-800">{option.label}</span><span className="mt-1 block text-xs text-slate-500">{option.copy}</span></span></label>)}</div></fieldset><p className="mt-5 rounded-xl bg-orange-50 px-4 py-3 text-xs leading-5 text-orange-800">You can cancel for a full refund until 1 hour before pickup. Missed pickups are not refundable.</p><button type="button" onClick={() => void pay()} disabled={paying || paymentReturned} className="primary-button mt-6 w-full">{paying ? 'Taking you to Paystack…' : paymentReturned ? 'Waiting for confirmation…' : `Pay ${naira(reservation.amountPaid)}`}</button></section>}
  </main></PageShell>;
}
