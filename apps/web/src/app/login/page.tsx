'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
      setStep('otp');
    } catch { alert('Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp }) });
      const data = await res.json();
      if (data.accessToken) { localStorage.setItem('token', data.accessToken); window.location.href = '/feed'; }
      else { alert(data.error || 'Verification failed'); }
    } catch { alert('Verification failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-2">Log in to ChopSave</h1>
        {step === 'phone' ? (
          <>
            <p className="text-gray-600 mb-6">Enter your Nigerian phone number</p>
            <input type="tel" placeholder="08X XXXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded-xl p-4 text-lg mb-4" maxLength={14} />
            <button onClick={sendOtp} disabled={loading}
              className="w-full bg-chopsave-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-chopsave-700 disabled:opacity-50">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-6">Enter the 6-digit code sent to {phone}</p>
            <input type="text" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value)}
              className="w-full border rounded-xl p-4 text-lg mb-4 text-center tracking-widest" maxLength={6} />
            <button onClick={verifyOtp} disabled={loading}
              className="w-full bg-chopsave-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-chopsave-700 disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
