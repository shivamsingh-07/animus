import type { ReactNode } from 'react';
import { GlassCard } from '@/components/common/GlassCard';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
  /** Tailwind classes for the icon chip (background + text color). */
  accent?: string;
}

export function StatCard({
  icon,
  label,
  value,
  hint,
  accent = 'bg-brand/15 text-brand-400',
}: StatCardProps) {
  return (
    <GlassCard className="relative h-full p-5">
      <span
        className={`absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-lg ${accent}`}
      >
        {icon}
      </span>
      <p className="pr-12 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">
        {value}
        {hint && <span className="ml-2 text-sm font-medium text-slate-500">{hint}</span>}
      </p>
    </GlassCard>
  );
}
