import { ReactNode } from 'react';

export default function DashboardCard({ title, value, detail, icon, tone = 'green' }: { title: string; value: string; detail: string; icon: ReactNode; tone?: 'green' | 'orange' | 'slate' }) {
  const tones = { green: 'bg-forest-50 text-forest', orange: 'bg-orange-50 text-orange-700', slate: 'bg-slate-100 text-slate-700' };
  return <article className="rounded-2xl border border-line bg-white p-5 shadow-card"><div className="mb-4 flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{title}</p><span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span></div><p className="font-heading text-3xl font-extrabold text-slate-900">{value}</p><p className="mt-1 text-sm text-slate-500">{detail}</p></article>;
}
