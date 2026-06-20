import { memo } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiInfo, FiPlay, FiPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { cardVariants, spring } from '@/animations';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { MovieMetadataRow } from '@/components/movie/MovieMetadataRow';
import { useWatchlist } from '@/store';
import type { MovieSummary } from '@/types';

interface MovieCardProps {
  movie: MovieSummary;
}

/** Poster card with cinematic hover: image zoom, blue glow + watchlist. */
export const MovieCard = memo(function MovieCard({ movie }: MovieCardProps) {
  const { id, title, poster, rating, year, maturity_rating: maturityRating } = movie;
  const { isInWatchlist, toggle } = useWatchlist();
  const isInList = isInWatchlist(id);

  return (
    <motion.article
      variants={cardVariants}
      className="group relative isolate overflow-hidden rounded-2xl shadow-card transition-shadow duration-300 hover:z-20 hover:shadow-glow"
    >
      <Link
        to={`/movie/${id}`}
        aria-label={`View details for ${title}`}
        className="relative block"
      >
        <ImageWithFallback
          src={poster}
          alt={`${title} poster`}
          label={title}
          wrapperClassName="aspect-[2/3] w-full"
          className="origin-center group-hover:scale-110"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-card-fade p-3 pt-12">
          <h3 className="truncate text-sm font-semibold text-content">{title}</h3>
          <MovieMetadataRow
            rating={rating}
            year={year}
            maturityRating={maturityRating}
            variant="card"
          />
        </div>
      </Link>

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 backdrop-blur-[5px] transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
        <div className="flex flex-col items-center gap-2 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
          <Link
            to={`/watch/${id}`}
            aria-label={`Play ${title}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-bold text-black shadow-lg transition-colors duration-200 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <FiPlay className="h-4 w-4 fill-current" aria-hidden />
            Play
          </Link>
          <Link
            to={`/movie/${id}`}
            aria-label={`More info about ${title}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-colors duration-200 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <FiInfo className="h-4 w-4" aria-hidden />
            Info
          </Link>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={(event) => {
          toggle(id);
          event.currentTarget.blur();
        }}
        whileTap={{ scale: 0.85 }}
        transition={spring}
        aria-pressed={isInList}
        aria-label={isInList ? `Remove ${title} from My List` : `Add ${title} to My List`}
        className="pointer-events-none absolute right-2 top-2 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-black/55 text-white opacity-0 backdrop-blur transition-[opacity,border-color] duration-300 hover:border-white/50 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:pointer-events-auto group-hover:opacity-100"
      >
        {isInList ? (
          <FiCheck className="h-4 w-4 text-green-500" aria-hidden />
        ) : (
          <FiPlus className="h-4 w-4" aria-hidden />
        )}
      </motion.button>
    </motion.article>
  );
});
