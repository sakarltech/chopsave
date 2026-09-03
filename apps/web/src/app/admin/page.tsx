'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiError, approveBusiness, getPendingBusinesses, PendingBusiness, rejectBusiness } from '@/lib/api';
import { getSession, Session } from '@/lib/session';
import { Brand, Icon } from '@/components/chopsave-ui';

function messageFor(error: unknown): string {
  return error instanceof ApiError || error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function AdminDashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [businesses, setBusinesses] = useState<PendingBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [rejectingId, setRejectingId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const currentSession = getSession();
    setSession(currentSession);
    if (!currentSession || currentSession.user.role !== 'admin') { setLoading(false); return; }
    void loadBusinesses(currentSession);
  }, []);

  async function loadBusinesses(currentSession: Session): Promise<void> {
    setLoading(true); setError('');
    try { const response = await getPendingBusinesses(currentSession.accessToken); setBusinesses(response.businesses); } catch (requestError) { setError(messageFor(requestError)); } finally { setLoading(false); }
  }

  async function approve(business: PendingBusiness): Promise<void> {
    if (!session) return;
    setActionId(business.id); setError('');
    try {
      await approveBusiness(session.accessToken, business.id, business.cacNumber ? 'verified_cac' : 'verified_informal');
      setBusinesses((current) => current.filter((item) => item.id !== business.id));
      setNotice(`${business.name} was approved.`);
    } catch (requestError) { setError(messageFor(requestError)); } finally { setActionId(''); }
  }

  async function reject(business: PendingBusiness): Promise<void> {
    if (!session || reason.trim().length < 10) { setError('Add a rejection reason with at least 10 characters.'); return; }
    setActionId(business.id); setError('');
    try {
      await rejectBusiness(session.accessToken, business.id, reason);
      setBusinesses((current) => current.filter((item) => item.id !== business.id));
      setNotice(`${business.name} was declined.`); setRejectingId(''); setReason('');
    } catch (requestError) { setError(messageFor(requestError)); } finally { setActionId(''); }
  }

  return <main className="min-h-screen bg-cream"><header className="border-b border-line bg-white"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6"><Brand /><Link href="/feed" className="text-sm font-bold text-slate-600 hover:text-forest">View marketplace</Link></div></header><section className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><p className="eyebrow"><Icon name="shield" size={16} />Pilot operations</p><h1 className="mt-5 font-heading text-3xl font-extrabold tracking-tight">Business verification queue</h1><p className="mt-2 text-slate-600">Approve businesses once their contact, location, and registration details are checked.</p>{!loading && (!session || session.user.role !== 'admin') ? <section className="mt-8 rounded-2xl border border-line bg-white p-7 shadow-card"><h2 className="font-heading text-xl font-bold">Admin access required</h2><p className="mt-2 leading-6 text-slate-600">Sign in with an email listed in the API project’s <code>ADMIN_EMAILS</code> variable, then refresh this page.</p><Link href="/login" className="primary-button mt-6">Sign in</Link></section> : <section className="mt-8 rounded-3xl border border-line bg-white shadow-card"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-6"><div><h2 className="font-heading text-xl font-bold">Pending applications</h2><p className="mt-1 text-sm text-slate-500">{loading ? 'Loading applications…' : `${businesses.length} awaiting review`}</p></div><button type="button" onClick={() => session && void loadBusinesses(session)} className="secondary-button min-h-10 px-4 text-sm" disabled={loading}>Refresh</button></div>{notice && <p role="status" className="mx-6 mt-5 rounded-xl bg-forest-50 px-4 py-3 text-sm font-medium text-forest">{notice}</p>}{error && <p role="alert" className="mx-6 mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}{!loading && businesses.length === 0 && <div className="px-6 py-14 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest"><Icon name="check" size={24} /></span><h3 className="mt-5 font-heading text-xl font-bold">All caught up</h3><p className="mt-2 text-sm text-slate-500">New business applications will appear here.</p></div>}{businesses.map((business) => <article key={business.id} className="border-b border-line p-6 last:border-0"><div className="flex flex-col gap-5 lg:flex-row lg:items-start"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest"><Icon name="building" size={22} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-heading text-xl font-bold">{business.name}</h3><span className="rounded-full bg-lime-100 px-2.5 py-1 text-xs font-bold text-forest">{business.cacNumber ? 'CAC supplied' : 'Informal business'}</span></div><p className="mt-1 text-sm capitalize text-slate-500">{business.type.replace('_', ' ')} · {business.city}</p><dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-semibold text-slate-500">Owner</dt><dd className="mt-1 text-slate-800">{business.ownerName}</dd></div><div><dt className="font-semibold text-slate-500">Contact</dt><dd className="mt-1 text-slate-800">{business.ownerEmail || 'No email'}{business.contactPhone ? ` · ${business.contactPhone}` : ''}</dd></div><div className="sm:col-span-2"><dt className="font-semibold text-slate-500">Pickup address</dt><dd className="mt-1 text-slate-800">{business.address}</dd></div></dl>{business.cacNumber && <p className="mt-3 text-sm text-slate-600">CAC number: <span className="font-semibold text-slate-800">{business.cacNumber}</span></p>}</div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => void approve(business)} disabled={Boolean(actionId)} className="min-h-11 rounded-xl bg-forest px-4 text-sm font-bold text-white disabled:opacity-60">{actionId === business.id ? 'Saving…' : 'Approve'}</button><button type="button" onClick={() => { setRejectingId(rejectingId === business.id ? '' : business.id); setError(''); }} disabled={Boolean(actionId)} className="min-h-11 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-700 disabled:opacity-60">Reject</button></div></div>{rejectingId === business.id && <div className="mt-5 rounded-2xl bg-red-50 p-4"><label className="block"><span className="text-sm font-bold text-red-800">Reason for rejection</span><textarea rows={3} minLength={10} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain what the business needs to correct before reapplying." className="mt-2 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-slate-900" /></label><div className="mt-3 flex gap-2"><button type="button" onClick={() => void reject(business)} disabled={Boolean(actionId)} className="min-h-10 rounded-lg bg-red-700 px-4 text-sm font-bold text-white disabled:opacity-60">Confirm rejection</button><button type="button" onClick={() => { setRejectingId(''); setReason(''); }} className="min-h-10 rounded-lg px-4 text-sm font-bold text-slate-600">Cancel</button></div></div>}</article>)}</section>}</section></main>;
}
