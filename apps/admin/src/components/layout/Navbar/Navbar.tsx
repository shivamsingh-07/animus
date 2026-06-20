import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { tap } from '@/animations';
import { cn } from '@/utils';

const MotionLink = motion(Link);

const TABS = [
  { to: '/', label: 'Dashboard' },
  { to: '/movies/new', label: 'Add Movie' },
];

/**
 * Fixed, client-style top bar: gradient scrim + glass, brand on the left and a
 * floating segmented control (with a sliding indicator) for the two sections.
 */
export function Navbar() {
  const { pathname } = useLocation();
  const activeIndex = pathname === '/movies/new' ? 1 : 0;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink via-ink/85 to-transparent"
      />

      <nav className="relative grid h-16 w-full grid-cols-3 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex select-none items-center gap-2.5 justify-self-start">
          <img src="/animus-logo.svg" alt="" aria-hidden className="h-8 w-8 object-contain" />
          <span className="hidden text-lg font-black tracking-tight text-white sm:inline">
            Animus Play
          </span>
          <span className="rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-300">
            Admin
          </span>
        </div>

        <div className="relative inline-flex justify-self-center rounded-full p-1 glass-strong backdrop-saturate-150">
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-24 rounded-full bg-brand-gradient shadow-glow-sm transition-transform duration-300 ease-out sm:w-28"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
          {TABS.map((tab, index) => {
            const active = index === activeIndex;
            return (
              <MotionLink
                key={tab.to}
                to={tab.to}
                whileTap={tap}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative z-10 w-24 rounded-full px-4 py-1.5 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 sm:w-28',
                  active ? 'text-white' : 'text-slate-300 hover:text-white',
                )}
              >
                {tab.label}
              </MotionLink>
            );
          })}
        </div>

        <div aria-hidden />
      </nav>
    </header>
  );
}
