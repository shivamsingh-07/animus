import type { ReactNode } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { GlassCard } from '@/components/common/GlassCard';

interface ErrorStateProps {
  title: string;
  message?: string;
  action?: ReactNode;
}

export function ErrorState({ title, message, action }: ErrorStateProps) {
  return (
    <GlassCard className="flex flex-col items-center gap-3 p-10 text-center">
      <FiAlertTriangle className="h-9 w-9 text-brand" aria-hidden />
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {message && <p className="mt-1 text-sm text-slate-400">{message}</p>}
      </div>
      {action}
    </GlassCard>
  );
}
