import { motion } from 'framer-motion';
import { cn } from '@/utils';

interface LoaderProps {
  /** Fill the viewport (used as a route/Suspense fallback). */
  fullscreen?: boolean;
  /** Compact inline spinner for toolbars and overlays. */
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-16 w-16',
} as const;

/** Branded cinematic loading indicator. */
export function Loader({
  fullscreen = false,
  size = 'md',
  className,
}: LoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={cn(
        'flex items-center justify-center',
        fullscreen ? 'min-h-dvh' : 'py-16',
        className,
      )}
    >
      <div className={cn('relative', sizeClasses[size])}>
        <span className="absolute inset-0 rounded-full border-2 border-line/10" />
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-transparent border-r-brand border-t-brand"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: 'linear', duration: 0.9 }}
        />
        {size === 'md' && (
          <span className="absolute inset-0 m-auto h-2.5 w-2.5 rounded-full bg-brand shadow-glow-sm" />
        )}
      </div>
    </div>
  );
}
