import { motion, useReducedMotion } from 'framer-motion';
import { FiBookmark, FiFilm, FiSearch } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import { staggerContainer } from '@/animations';
import { Loader } from '@/components/common/Loader';
import { PageTransition } from '@/components/common/PageTransition';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { MovieCard, MovieCardSkeleton } from '@/components/movie/MovieCard';
import { useDebounce, useMovieSearch } from '@/hooks';
import { useWatchlist } from '@/store';
import { cn } from '@/utils';

const BACKGROUND_ORBS = [
  {
    className: '-left-32 -top-24 h-[26rem] w-[26rem] bg-brand/55',
    animate: { x: [0, 160, 60, 0], y: [0, 80, 180, 0], scale: [1, 1.2, 0.9, 1], opacity: [0.6, 0.95, 0.55, 0.6] },
    duration: 18,
  },
  {
    className: 'right-[-8rem] -top-16 h-[30rem] w-[30rem] bg-[#6366F1]/45',
    animate: { x: [0, -180, -60, 0], y: [0, 120, 40, 0], scale: [1, 0.9, 1.25, 1], opacity: [0.55, 0.85, 0.65, 0.55] },
    duration: 23,
  },
  {
    className: 'left-1/3 top-1/2 h-80 w-80 bg-brand-400/40',
    animate: { x: [0, 220, -80, 0], y: [0, -140, -40, 0], scale: [1, 1.3, 0.95, 1], opacity: [0.5, 0.85, 0.45, 0.5] },
    duration: 26,
  },
  {
    className: 'bottom-[-7rem] right-1/4 h-[28rem] w-[28rem] bg-[#7C3AED]/38',
    animate: { x: [0, -150, 70, 0], y: [0, -90, -180, 0], scale: [1, 1.15, 0.85, 1], opacity: [0.55, 0.9, 0.5, 0.55] },
    duration: 21,
  },
  {
    className: 'bottom-[-4rem] left-[12%] h-72 w-72 bg-[#06B6D4]/35',
    animate: { x: [0, 120, -40, 0], y: [0, -70, 30, 0], scale: [1, 1.25, 0.9, 1], opacity: [0.45, 0.8, 0.4, 0.45] },
    duration: 28,
  },
];

export default function HomePage() {
  const [params] = useSearchParams();
  const rawQuery = params.get('q') ?? '';
  const listMode = params.get('list') === '1';
  const query = useDebounce(rawQuery, 300);

  const { data: searchResults, loading, error, reload } = useMovieSearch(query);
  const { isInWatchlist } = useWatchlist();

  const catalogMovies = searchResults ?? [];
  const movies = listMode
    ? catalogMovies.filter((movie) => isInWatchlist(movie.id))
    : catalogMovies;

  const heading = listMode ? 'Watch Later' : rawQuery ? 'Search results' : 'Collections';
  const subheading = listMode
    ? 'Movies you have saved to watch later.'
    : rawQuery
      ? `Showing matches for “${rawQuery}”.`
      : 'A hand-picked selection of modern movies and timeless cinema.';

  const isInitialLoad = loading && !searchResults;
  const isRefreshing = loading && !!searchResults;
  const reduceMotion = useReducedMotion();

  return (
    <PageTransition className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-brand/25 via-brand/8 to-transparent" />
        {BACKGROUND_ORBS.map((orb, index) => (
          <motion.span
            key={index}
            aria-hidden
            className={cn('absolute rounded-full blur-3xl', orb.className)}
            animate={reduceMotion ? undefined : orb.animate}
            transition={
              reduceMotion
                ? undefined
                : { duration: orb.duration, repeat: Infinity, ease: 'easeInOut' }
            }
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-28 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-content sm:text-4xl">
                {heading}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">{subheading}</p>
            </div>
            {isRefreshing && <Loader size="sm" className="py-0" />}
          </div>
        </header>

        {error ? (
          <ErrorState
            title="Something went wrong"
            message={error.message}
            action={
              <PrimaryButton onClick={reload} className="px-5 py-2">
                Try again
              </PrimaryButton>
            }
          />
        ) : isInitialLoad ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <MovieCardSkeleton key={index} />
            ))}
          </div>
        ) : movies.length === 0 ? (
          listMode ? (
            <EmptyState
              plain
              icon={<FiBookmark className="h-6 w-6" />}
              title="Your list is empty"
              message="Tap the bookmark on any title to save it here for later."
            />
          ) : rawQuery.trim() ? (
            <EmptyState
              plain
              icon={<FiSearch className="h-6 w-6" />}
              title="No matches found"
              message={`We couldn’t find anything for “${rawQuery}”. Try a different title, actor, or genre.`}
            />
          ) : (
            <EmptyState
              plain
              icon={<FiFilm className="h-6 w-6" />}
              title="No titles available"
              message="The catalog is empty right now. Check back soon."
            />
          )
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className={cn(
              'grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
              isRefreshing && 'pointer-events-none opacity-50',
            )}
          >
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
