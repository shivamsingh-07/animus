import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiPlay, FiPlus } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { fadeUp, staggerContainer } from '@/animations';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { PageTransition } from '@/components/common/PageTransition';
import { ErrorState } from '@/components/common/ErrorState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { MovieDetailsSkeleton } from '@/components/movie/MovieDetailsSkeleton';
import { MovieMetadataRow } from '@/components/movie/MovieMetadataRow';
import { useMovie, useDocumentTitle } from '@/hooks';
import { useWatchlist } from '@/store';

export default function MovieDetailsPage() {
  const params = useParams();
  const movieId = params.id;

  const { data: movie, loading, error } = useMovie(movieId);
  const { isInWatchlist, toggle } = useWatchlist();

  useDocumentTitle(movie);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [movieId]);

  if (loading) {
    return (
      <PageTransition>
        <MovieDetailsSkeleton />
      </PageTransition>
    );
  }

  if (error || !movie) {
    return (
      <ErrorState
        variant="page"
        title="We couldn’t find that title"
        message={error?.message ?? 'The movie you’re looking for may have left ANIMUS.'}
        action={<PrimaryButton to="/">Back to browse</PrimaryButton>}
      />
    );
  }

  const isInWatchlistMovie = isInWatchlist(movie.id);

  return (
    <PageTransition>
      <section className="relative isolate min-h-dvh">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <ImageWithFallback
            src={movie.backdrop}
            alt={`${movie.title} backdrop`}
            wrapperClassName="h-full w-full"
            label={movie.title}
            loading="eager"
          />
          <div className="absolute inset-0 bg-hero-fade" />
        </div>

        <div className="relative z-10 flex min-h-dvh w-full flex-col justify-end px-4 pb-12 pt-24 sm:px-6 lg:px-8 xl:px-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid w-full gap-8 lg:grid-cols-[auto_minmax(0,1fr)_minmax(200px,280px)] lg:items-end lg:gap-10 xl:gap-12"
          >
            <motion.div variants={fadeUp} className="mx-auto shrink-0 lg:mx-0">
              <ImageWithFallback
                src={movie.poster}
                alt={`${movie.title} poster`}
                label={movie.title}
                loading="eager"
                wrapperClassName="w-40 overflow-hidden rounded-2xl shadow-card sm:w-48 md:w-52 lg:w-56 aspect-[2/3]"
              />
            </motion.div>

            <div className="min-w-0">
              <motion.h1
                variants={fadeUp}
                className="text-4xl font-black tracking-tight text-content sm:text-5xl lg:text-6xl"
              >
                {movie.title}
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-3 text-base font-medium italic text-brand-500 sm:text-lg"
              >
                {movie.tagline}
              </motion.p>

              <motion.div variants={fadeUp}>
                <MovieMetadataRow
                  rating={movie.rating}
                  year={movie.year}
                  duration={movie.duration}
                  maturityRating={movie.maturity_rating}
                  showHd
                  variant="details"
                />
              </motion.div>

              <motion.div variants={fadeUp} className="mt-4 flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-line/15 bg-content/10 px-3 py-1 text-xs font-medium text-content/80 backdrop-blur"
                  >
                    {genre}
                  </span>
                ))}
              </motion.div>

              <motion.p
                variants={fadeUp}
                className="mt-5 max-w-3xl text-sm leading-relaxed text-content/80 sm:text-base"
              >
                {movie.description}
              </motion.p>

              <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center gap-3">
                <PrimaryButton to={`/watch/${movie.id}`} className="px-7 py-3 text-base">
                  <FiPlay className="h-5 w-5 fill-current" aria-hidden /> Play Now
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => toggle(movie.id)}
                  aria-pressed={isInWatchlistMovie}
                  className="btn-secondary"
                >
                  {isInWatchlistMovie ? (
                    <>
                      <FiCheck className="h-5 w-5 text-green-500" aria-hidden /> Added to List
                    </>
                  ) : (
                    <>
                      <FiPlus className="h-5 w-5" aria-hidden /> Add to Watchlist
                    </>
                  )}
                </button>
              </motion.div>
            </div>

            <motion.dl variants={fadeUp} className="space-y-5 text-sm lg:pb-1">
              <div>
                <dt className="font-bold text-content/55">Cast</dt>
                <dd className="mt-1 leading-relaxed text-content/90">{movie.cast_members.join(', ')}</dd>
              </div>
              <div>
                <dt className="font-bold text-content/55">Director</dt>
                <dd className="mt-1 text-content/90">{movie.director}</dd>
              </div>
              <div>
                <dt className="font-bold text-content/55">Language</dt>
                <dd className="mt-1 text-content/90">{movie.language}</dd>
              </div>
              <div>
                <dt className="font-bold text-content/55">Genres</dt>
                <dd className="mt-1 text-content/90">{movie.genres.join(', ')}</dd>
              </div>
            </motion.dl>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}
