import type { PointerEvent } from 'react';
import { motion } from 'framer-motion';
import {
  overlayContainerVariants,
  overlayItemVariants,
  pauseOverlayMotion,
} from '@/animations';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { MovieMetadataRow } from '@/components/movie/MovieMetadataRow';
import type { Movie } from '@/types';

export interface PauseOverlayProps {
  movie: Movie;
  /** Left click on the backdrop invokes this; mouse movement is handled by the parent. */
  onResume: () => void;
}

function PauseOverlayInfo({ movie }: { movie: Movie }) {
  return (
    <motion.div
      variants={overlayContainerVariants}
      initial="hidden"
      animate="visible"
      className="pointer-events-none mx-auto flex w-full max-w-5xl flex-col items-start gap-8 px-6 sm:flex-row sm:items-center sm:px-10"
    >
      <motion.div variants={overlayItemVariants} className="shrink-0">
        <ImageWithFallback
          src={movie.poster}
          alt=""
          label={movie.title}
          loading="eager"
          wrapperClassName="hidden w-40 overflow-hidden rounded-2xl shadow-card sm:block md:w-52 aspect-[2/3]"
        />
      </motion.div>

      <div className="max-w-xl">
        <motion.p
          variants={overlayItemVariants}
          className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-400"
        >
          You’re watching
        </motion.p>

        <motion.h2
          variants={overlayItemVariants}
          className="mt-2 text-4xl font-black tracking-tight text-white drop-shadow-lg sm:text-5xl"
        >
          {movie.title}
        </motion.h2>

        <motion.div variants={overlayItemVariants}>
          <MovieMetadataRow
            rating={movie.rating}
            year={movie.year}
            duration={movie.duration}
            maturityRating={movie.maturity_rating}
            variant="overlay"
          />
        </motion.div>

        <motion.p
          variants={overlayItemVariants}
          className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/75 sm:text-base"
        >
          {movie.description}
        </motion.p>
      </div>
    </motion.div>
  );
}

/**
 * Netflix-style info panel shown while paused after the idle delay.
 * Left click anywhere on the backdrop resumes; moving the mouse hides this
 * overlay and reveals controls (handled by PlayerPage + useIdleChrome).
 */
export function PauseOverlay({ movie, onResume }: PauseOverlayProps) {
  const handleBackdropPointerDown = (event: PointerEvent) => {
    // Prevent the stage's idle handler from unmounting this overlay before
    // the click event fires — otherwise resume may never run.
    if (event.button === 0) event.stopPropagation();
  };

  return (
    <motion.div
      {...pauseOverlayMotion}
      onPointerDown={handleBackdropPointerDown}
      onClick={onResume}
      className="absolute inset-0 z-30 flex cursor-pointer items-center bg-black/60 backdrop-blur-sm"
    >
      <PauseOverlayInfo movie={movie} />
    </motion.div>
  );
}
