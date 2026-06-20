import { useEffect, useState } from 'react';
import { FiFilm } from 'react-icons/fi';
import { cn } from '@/utils';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  /** Text shown inside the fallback when the image fails to load. */
  label?: string;
  loading?: 'lazy' | 'eager';
}

/** Image with a graceful fallback; resets when `src` changes. Mirrors the client. */
export function ImageWithFallback({
  src,
  alt,
  className,
  wrapperClassName,
  label,
  loading = 'lazy',
}: ImageWithFallbackProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setErrored(false);
  }, [src]);

  return (
    <div
      className={cn('relative overflow-hidden bg-gradient-to-br from-panel to-ink', wrapperClassName)}
    >
      {!errored && (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
            className,
          )}
        />
      )}

      {errored && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
          <FiFilm className="h-6 w-6 text-slate-500" aria-hidden />
          {label && <span className="line-clamp-2 text-xs font-medium text-slate-400">{label}</span>}
        </div>
      )}

      {!loaded && !errored && (
        <div className="absolute inset-0 motion-safe:animate-pulse bg-white/5" aria-hidden />
      )}
    </div>
  );
}
