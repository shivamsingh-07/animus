import type { ReactNode } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { PageTransition } from '@/components/common/PageTransition';
import { cn } from '@/utils';

export interface ErrorStateProps {
  variant?: 'inline' | 'page';
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  variant = 'inline',
  title,
  message,
  action,
  className,
}: ErrorStateProps) {
  const content = (
    <div
      className={cn(
        'flex flex-col items-center gap-4 text-center',
        variant === 'inline' &&
          'justify-center rounded-3xl bg-brand/5 px-6 py-24 backdrop-blur-sm',
        className,
      )}
    >
      <FiAlertTriangle className="h-10 w-10 text-brand" aria-hidden />
      <div>
        {variant === 'page' ? (
          <h1 className="text-2xl font-bold text-content">{title}</h1>
        ) : (
          <h2 className="text-lg font-semibold text-content">{title}</h2>
        )}
        {message && (
          <p
            className={cn('mt-1 text-sm text-muted', variant === 'page' && 'max-w-sm')}
          >
            {message}
          </p>
        )}
      </div>
      {action}
    </div>
  );

  if (variant === 'page') {
    return (
      <PageTransition className="grid min-h-dvh place-items-center px-6">{content}</PageTransition>
    );
  }

  return content;
}
