'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { type Listing, naira } from '@/lib/demo-listings';

export type IconName = 'leaf' | 'search' | 'map-pin' | 'clock' | 'bag' | 'user' | 'heart' | 'home' | 'chevron-down' | 'arrow-right' | 'check' | 'building' | 'shield' | 'bell' | 'sliders' | 'minus' | 'plus' | 'menu' | 'help' | 'logout' | 'chart' | 'users' | 'x';

const paths: Record<IconName, ReactNode> = {
  leaf: <path d="M20.8 3.2C12 3.8 5.3 8.7 5.3 15.5c0 3.2 2.5 5.3 5.4 5.3 6.6 0 10.2-8.1 10.1-17.6ZM3.2 21c4-4.4 7.6-7 12.2-9.3" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
  'map-pin': <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.4 2" /></>,
  bag: <><path d="M5 8.5h14l-1 11H6l-1-11Z" /><path d="M9 9V7a3 3 0 0 1 6 0v2" /></>,
  user: <><circle cx="12" cy="8" r="3.4" /><path d="M5.5 20c.5-3.6 3.1-5.5 6.5-5.5s6 1.9 6.5 5.5" /></>,
  heart: <path d="M20.8 8.8c0 5.5-8.8 10.3-8.8 10.3S3.2 14.3 3.2 8.8C3.2 4.8 8 3.3 12 7c4-3.7 8.8-2.2 8.8 1.8Z" />,
  home: <><path d="m3.5 11 8.5-7 8.5 7v9H14v-5H10v5H3.5v-9Z" /></>,
  'chevron-down': <path d="m7 9 5 5 5-5" />,
  'arrow-right': <><path d="M4 12h15" /><path d="m14 6 6 6-6 6" /></>,
  check: <path d="m5 12 4.3 4.3L19 6.7" />,
  building: <><path d="M5 21V5h10v16M3 21h18M8 8h1m3 0h1M8 12h1m3 0h1M8 16h1m3 0h1M15 21v-9h4v9" /></>,
  shield: <path d="M12 21s7-3.1 7-9.4V5.4L12 3 5 5.4v6.2C5 17.9 12 21 12 21Z" />,
  bell: <><path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 22h4" /></>,
  sliders: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2" /><circle cx="15" cy="17" r="2" /></>,
  minus: <path d="M6 12h12" />,
  plus: <path d="M12 6v12M6 12h12" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.7 2.7 0 1 1 4.6 1.9c-1.3 1.2-2.1 1.5-2.1 3.1M12 17h.01" /></>,
  logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></>,
  chart: <><path d="M4 20V4M4 20h17" /><path d="m7 16 4-4 3 2 5-7" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.4-3.5 2.4-5.5 5.5-5.5s5.1 2 5.5 5.5M16 5.5a3 3 0 0 1 0 5.7M17 14.8c2.1.6 3.2 2.3 3.5 5.2" /></>,
  x: <path d="m6 6 12 12M18 6 6 18" />,
};

export function Icon({ name, className = '', size = 20 }: { name: IconName; className?: string; size?: number }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function Brand() {
  return <Link href="/" className="inline-flex items-center gap-2 font-heading text-xl font-extrabold tracking-tight text-forest" aria-label="ChopSave home"><span className="grid h-8 w-8 place-items-center rounded-lg bg-forest text-white"><Icon name="leaf" size={17} /></span>ChopSave</Link>;
}

export function Header({ app = false, authenticated = false }: { app?: boolean; authenticated?: boolean }) {
  return <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur">
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
      <Brand />
      {app ? <div className="flex items-center gap-2"><span className="hidden items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 md:flex"><Icon name="map-pin" size={16} />Lagos</span>{authenticated ? <Link href="/profile" aria-label="Profile" className="tap-target rounded-full bg-forest-50 text-forest"><Icon name="user" /></Link> : <Link href="/login" className="rounded-full bg-forest px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-forest-dark">Sign in</Link>}</div> : <nav className="flex items-center gap-4"><Link href="/business" className="hidden text-sm font-semibold text-slate-600 hover:text-forest sm:block">For businesses</Link><Link href="/login" className="rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-forest-dark">Sign in</Link></nav>}
    </div>
  </header>;
}

export function BottomNav({ active }: { active: 'discover' | 'orders' | 'saved' | 'profile' }) {
  const links: { href: string; icon: IconName; label: typeof active }[] = [{ href: '/feed', icon: 'home', label: 'discover' }, { href: '/orders', icon: 'bag', label: 'orders' }, { href: '/saved', icon: 'heart', label: 'saved' }, { href: '/profile', icon: 'user', label: 'profile' }];
  return <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"><div className="mx-auto grid max-w-md grid-cols-4">{links.map((link) => <Link key={link.label} href={link.href} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${active === link.label ? 'text-forest' : 'text-slate-400'}`}><Icon name={link.icon} size={20} /><span>{link.label[0].toUpperCase() + link.label.slice(1)}</span></Link>)}</div></nav>;
}

export function ListingCard({ listing, href }: { listing: Listing; href?: string }) {
  const saving = Math.round((1 - listing.price / listing.originalPrice) * 100);
  const content = <><div className="relative aspect-[16/10] overflow-hidden bg-slate-100"><img src={listing.image} alt={`${listing.title} from ${listing.business}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-forest shadow-sm">Save {saving}%</span>{listing.left <= 2 && <span className="absolute bottom-3 left-3 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">Only {listing.left} left</span>}</div><div className="p-4"><div className="mb-1 flex items-center gap-1 text-sm font-bold text-slate-800">{listing.business}{listing.verified && <span className="text-forest" aria-label="Verified business"><Icon name="check" size={15} /></span>}</div><h2 className="min-h-10 text-sm leading-5 text-slate-600">{listing.title}</h2><div className="mt-3 flex items-baseline gap-2"><span className="font-heading text-xl font-extrabold text-forest">{naira(listing.price)}</span>{listing.originalPrice > listing.price && <span className="text-xs text-slate-400 line-through">{naira(listing.originalPrice)}</span>}</div><div className="mt-3 space-y-1.5 border-t border-line pt-3 text-xs text-slate-500"><p className="flex items-center gap-1.5"><Icon name="clock" size={14} className="text-forest" />{listing.pickup}</p><p className="flex items-center gap-1.5"><Icon name="map-pin" size={14} className="text-forest" />{listing.area} · {listing.distance}</p></div></div></>;
  const className = "group overflow-hidden rounded-2xl border border-line bg-white text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-card-lg";

  return href ? <Link href={href} className={`${className} focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2`}>{content}</Link> : <article className={className}>{content}</article>;
}

export function PageShell({ children, active, authenticated = false }: { children: ReactNode; active?: 'discover' | 'orders' | 'saved' | 'profile'; authenticated?: boolean }) {
  return <div className="min-h-screen bg-cream text-slate-900"><Header app authenticated={authenticated} /><main className="pb-20 md:pb-8">{children}</main>{active && <BottomNav active={active} />}</div>;
}
