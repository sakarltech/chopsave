import Link from 'next/link';
import { Header, Icon } from '@/components/chopsave-ui';

const steps = [
  { icon: 'search' as const, title: 'Discover', copy: 'See surprise bags from nearby Lagos food businesses.' },
  { icon: 'bag' as const, title: 'Reserve', copy: 'Pick a bag and secure it before collection time.' },
  { icon: 'leaf' as const, title: 'Collect', copy: 'Enjoy great food and keep it from going to waste.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream text-slate-900">
      <Header />
      <main>
        <section className="relative overflow-hidden bg-forest px-4 py-20 text-white sm:px-6 sm:py-28">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-lime-500/20 blur-3xl" />
          <div className="absolute -bottom-36 left-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative mx-auto max-w-6xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-lime-100"><Icon name="map-pin" size={16} />Now rescuing food in Lagos</p>
            <h1 className="mt-6 max-w-3xl font-heading text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">Good food. Better prices. Less waste.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/80 sm:text-xl">ChopSave helps you discover surplus food from local businesses and collect it for less.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/feed" className="primary-button bg-white text-forest hover:bg-lime-100">Find food near you <Icon name="arrow-right" size={18} /></Link><Link href="/business" className="secondary-button border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white">I run a food business</Link></div>
            <p className="mt-7 text-sm text-white/60">Lagos pilot · Surprise bags from verified local businesses</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl"><p className="eyebrow">How ChopSave works</p><h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">A simple way to save a meal—and make a difference.</h2></div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">{steps.map((step, index) => <article key={step.title} className="rounded-2xl border border-line bg-white p-6 shadow-card"><span className="grid h-11 w-11 place-items-center rounded-xl bg-forest-50 text-forest"><Icon name={step.icon} size={21} /></span><p className="mt-6 text-sm font-bold text-lime-500">0{index + 1}</p><h3 className="mt-1 font-heading text-xl font-extrabold">{step.title}</h3><p className="mt-3 leading-6 text-slate-600">{step.copy}</p></article>)}</div>
        </section>
      </main>
      <footer className="border-t border-line bg-white px-4 py-8 text-center text-sm text-slate-500">© {new Date().getFullYear()} ChopSave. Chop well. Waste nothing.</footer>
    </div>
  );
}
