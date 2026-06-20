import { useEffect, useState } from 'react';
import { FiFilm } from 'react-icons/fi';
import { cn } from '@/utils';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  /** Classes for the <img> element (e.g. hover zoom). */
  className?: string;
  /** Classes for the wrapping element (sizing / aspect ratio lives here). */
  wrapperClassName?: string;
  /** Text shown inside the fallback when the image fails to load. */
  label?: string;
  /** Browser loading strategy. Defaults to lazy for off-screen art. */
  loading?: 'lazy' | 'eager';
}

/**
 * Image with a graceful, on-brand fallback. While loading it shows a cinematic
 * gradient; on success the image fades in (and can zoom via `className`); on
 * error it keeps the gradient and shows a film glyph + label.
 */
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

  // Reset when the source changes so a reused instance never shows a stale image/fallback.
  useEffect(() => {
    setLoaded(false);
    setErrored(false);
  }, [src]);

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-surface2 via-surface to-background',
        wrapperClassName,
      )}
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
            'h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out',
            loaded ? 'opacity-100' : 'opacity-0',
            className,
          )}
        />
      )}

      {errored && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <FiFilm className="h-8 w-8 text-muted" aria-hidden />
          {label && (
            <span className="line-clamp-2 text-sm font-semibold text-content/80">{label}</span>
          )}
        </div>
      )}

      {!loaded && !errored && <div className="shimmer-overlay" aria-hidden />}
    </div>
  );
}
