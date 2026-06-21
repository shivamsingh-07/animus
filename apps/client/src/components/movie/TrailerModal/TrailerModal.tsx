import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { pauseOverlayMotion } from '@/animations';

interface TrailerModalProps {
  open: boolean;
  /** A YouTube watch/short URL (as produced by the API's TMDB import). */
  trailerUrl: string;
  title: string;
  onClose: () => void;
}

/** Convert a YouTube watch/`youtu.be` URL into an autoplaying embed URL. */
function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let id = '';
    if (u.hostname === 'youtu.be') {
      id = u.pathname.slice(1);
    } else if (u.hostname.endsWith('youtube.com')) {
      id = u.searchParams.get('v') ?? u.pathname.split('/').pop() ?? '';
    }
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
  } catch {
    return null;
  }
}

/**
 * Full-screen modal that plays a title's trailer. Portaled to `document.body`
 * so its `fixed` layout isn't affected by the page-transition transform, and
 * closeable via the backdrop or Escape.
 */
export function TrailerModal({ open, trailerUrl, title, onClose }: TrailerModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const embedUrl = youtubeEmbedUrl(trailerUrl);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          {...pauseOverlayMotion}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} trailer`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black shadow-card">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={`${title} trailer`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <a href={trailerUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                    Watch on YouTube
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
