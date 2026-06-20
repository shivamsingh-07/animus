import type { ReactNode } from 'react';
import { cn } from '@/utils';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message: string;
  plain?: boolean;
}

export function EmptyState({ icon, title, message, plain = false }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-24 text-center',
        !plain && 'rounded-3xl bg-surface/40 backdrop-blur-sm',
      )}
    >
      <div
        className={cn(
          'grid h-14 w-14 place-items-center rounded-full text-muted',
          !plain && 'bg-content/[0.06]',
        )}
      >
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-content">{title}</h2>
      <p className="max-w-sm text-sm text-muted">{message}</p>
    </div>
  );
}
