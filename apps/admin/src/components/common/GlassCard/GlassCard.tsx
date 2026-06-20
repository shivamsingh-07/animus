import type { HTMLAttributes } from 'react';
import { cn } from '@/utils';

type GlassCardProps = HTMLAttributes<HTMLDivElement>;

export function GlassCard({ className, children, ...rest }: GlassCardProps) {
  return (
    <div className={cn('glass rounded-2xl', className)} {...rest}>
      {children}
    </div>
  );
}
