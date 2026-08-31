'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, sendOtp, verifyOtp } from '@/lib/api';
import { saveSession } from '@/lib/session';
import { Brand, Icon } from '@/components/chopsave-ui';

type Step = 'phone' | 'code';

function messageFor(error: unknown): string {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePhoneSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await sendOtp(phone);
      setPhone(response.phone);
      setNotice('Your six-digit code is on its way.');
      setStep('code');
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setLoading(false);
    }
  }

  async function handleCodeSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await verifyOtp({ phone, otp, fullName: fullName.trim() || undefined });
      saveSession(response);
      router.replace('/feed');
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col rounded-3xl border border-line bg-white shadow-card lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-l-3xl bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-heading text-xl font-extrabold tracking-tight text-white"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-forest"><Icon name="leaf" size={17} /></span>ChopSave</Link>
          <div>
            <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-lime-100">Lagos pilot</p>
            <h1 className="max-w-md font-heading text-5xl font-extrabold leading-tight">Good food deserves a second chance.</h1>
            <p className="mt-5 max-w-sm text-lg leading-8 text-white/75">Discover nearby surprise bags, save money, and help keep great food out of the bin.</p>
          </div>
          <p className="text-sm text-white/60">Simple phone sign-in. No password required.</p>
        </section>

        <section className="flex flex-1 flex-col justify-center p-6 sm:p-10 lg:p-12">
          <div className="mb-12 lg:hidden"><Brand /></div>
          <div className="mx-auto w-full max-w-md">
            <p className="eyebrow"><Icon name="shield" size={16} />Secure sign-in</p>
            <h1 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-slate-900">{step === 'phone' ? 'Welcome to ChopSave' : 'Check your phone'}</h1>
            <p className="mt-3 leading-6 text-slate-600">{step === 'phone' ? 'Enter your Nigerian phone number to find food near you.' : `We sent a six-digit code to ${phone}.`}</p>

            {notice && <p role="status" className="mt-5 rounded-xl bg-forest-50 px-4 py-3 text-sm font-medium text-forest">{notice}</p>}
            {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

            {step === 'phone' ? (
              <form className="mt-8 space-y-5" onSubmit={handlePhoneSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Nigerian phone number</span>
                  <input required autoComplete="tel" inputMode="tel" placeholder="0801 234 5678" value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-xl border border-line bg-white px-4 py-3.5 text-lg text-slate-900 placeholder:text-slate-400" />
                </label>
                <button className="primary-button w-full" disabled={loading} type="submit">{loading ? 'Sending code…' : 'Continue with phone'}</button>
              </form>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={handleCodeSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Verification code</span>
                  <input required autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="000000" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} className="w-full rounded-xl border border-line bg-white px-4 py-3.5 text-center font-heading text-2xl font-bold tracking-[0.35em] text-slate-900 placeholder:tracking-normal placeholder:text-slate-400" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Your name <span className="font-normal text-slate-400">(new customers only)</span></span>
                  <input autoComplete="name" placeholder="Ada Okafor" value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-xl border border-line bg-white px-4 py-3.5 text-lg text-slate-900 placeholder:text-slate-400" />
                </label>
                <button className="primary-button w-full" disabled={loading} type="submit">{loading ? 'Verifying…' : 'Verify and continue'}</button>
                <button className="w-full text-sm font-bold text-forest hover:text-forest-dark" disabled={loading} type="button" onClick={() => { setStep('phone'); setError(''); setNotice(''); }}>Use a different number</button>
              </form>
            )}

            <p className="mt-8 text-center text-sm leading-6 text-slate-500">By continuing, you agree to receive a one-time verification code. Standard SMS rates may apply.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
