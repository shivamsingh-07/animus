import type { ReactNode } from 'react';
import { GlassCard } from '@/components/common/GlassCard';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <GlassCard className="grid place-items-center gap-3 p-12 text-center">
      {icon && (
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 text-brand-400">
          {icon}
        </span>
      )}
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {message && <p className="max-w-sm text-sm text-slate-400">{message}</p>}
      {action}
    </GlassCard>
  );
}
