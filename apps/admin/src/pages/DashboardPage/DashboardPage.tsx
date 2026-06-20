import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiFilm, FiPlusCircle, FiSearch, FiStar, FiTrash2 } from 'react-icons/fi';
import { fadeUp, staggerContainer } from '@/animations';
import { useDocumentTitle, useMovies } from '@/hooks';
import { deleteMovie } from '@/services/movieApi';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { GlassCard } from '@/components/common/GlassCard';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { PageTransition } from '@/components/common/PageTransition';
import { SearchBar } from '@/components/common/SearchBar';
import { StatCard } from '@/components/common/StatCard';

const COLUMNS = ['Poster', 'Title', 'Year', 'Duration', 'Rating', 'Language', 'Status'];

const STATUS_STYLES: Record<string, string> = {
  created: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
  uploaded: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  processing: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  ready: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  failed: 'bg-red-500/15 text-red-300 ring-red-500/30',
};

function DashboardSkeleton() {
  return (
    <div className="space-y-8 motion-safe:animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <GlassCard key={index} className="p-5">
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="mt-4 h-8 w-16 rounded bg-white/10" />
          </GlassCard>
        ))}
      </div>
      <GlassCard className="space-y-3 p-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="h-16 w-11 shrink-0 rounded-md bg-white/10" />
            <div className="h-4 flex-1 rounded bg-white/10" />
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { movies, loading, error, reload, removeMovie } = useMovies();
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const total = movies.length;
  const ready = movies.filter((movie) => movie.status === 'ready').length;
  const failed = movies.filter((movie) => movie.status === 'failed').length;
  const inProgress = total - ready - failed;

  const normalized = query.trim().toLowerCase();
  const filteredMovies = normalized
    ? movies.filter((movie) => {
      const haystack = [movie.title, movie.director, ...movie.cast_members, ...movie.genres]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized) || String(movie.year).includes(normalized);
    })
    : movies;

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
    setDeletingId(id);
    setActionError(null);
    try {
      await deleteMovie(id);
      removeMovie(id);
      setStatus(`${title} deleted.`);
      headingRef.current?.focus();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete movie.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageTransition>
      <h1 className="sr-only">Dashboard</h1>
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>

      {error ? (
        <ErrorState
          title="Couldn’t load movies"
          message={error}
          action={
            <button type="button" onClick={() => void reload()} className="btn-primary">
              Try again
            </button>
          }
        />
      ) : loading ? (
        <DashboardSkeleton />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
          <motion.div
            variants={staggerContainer}
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <motion.div variants={fadeUp} className="h-full">
              <StatCard icon={<FiFilm className="h-4 w-4" />} label="Total Movies" value={total} />
            </motion.div>
            <motion.div variants={fadeUp} className="h-full">
              <StatCard
                icon={<FiCheckCircle className="h-4 w-4" />}
                label="Ready"
                value={ready}
                accent="bg-emerald-500/15 text-emerald-300"
              />
            </motion.div>
            <motion.div variants={fadeUp} className="h-full">
              <StatCard
                icon={<FiClock className="h-4 w-4" />}
                label="In Progress"
                value={inProgress}
                accent="bg-amber-500/15 text-amber-300"
              />
            </motion.div>
            <motion.div variants={fadeUp} className="h-full">
              <StatCard
                icon={<FiAlertTriangle className="h-4 w-4" />}
                label="Failed"
                value={failed}
                accent="bg-red-500/15 text-red-300"
              />
            </motion.div>
          </motion.div>

          <motion.section variants={fadeUp}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="text-2xl font-bold tracking-tight text-white focus:outline-none"
              >
                All Movies
              </h2>
              <SearchBar value={query} onChange={setQuery} className="w-full sm:w-72" />
            </div>

            {actionError && (
              <GlassCard role="alert" className="mb-4 p-4 text-sm text-red-300">
                {actionError}
              </GlassCard>
            )}

            {movies.length === 0 ? (
              <EmptyState
                icon={<FiFilm className="h-6 w-6" />}
                title="No movies yet"
                message="Add your first title to the catalog."
                action={
                  <Link to="/movies/new" className="btn-primary">
                    <FiPlusCircle className="h-4 w-4" aria-hidden /> Add Movie
                  </Link>
                }
              />
            ) : filteredMovies.length === 0 ? (
              <EmptyState
                icon={<FiSearch className="h-6 w-6" />}
                title="No matches"
                message={`Nothing in the catalog matches “${query.trim()}”.`}
              />
            ) : (
              <GlassCard className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <caption className="sr-only">Movie catalog</caption>
                    <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        {COLUMNS.map((column) => (
                          <th key={column} scope="col" className="px-4 py-3 font-semibold">
                            {column}
                          </th>
                        ))}
                        <th scope="col" className="px-4 py-3 text-right font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredMovies.map((movie) => (
                        <tr key={movie.id} className="transition hover:bg-white/[0.03]">
                          <td className="px-4 py-3">
                            <ImageWithFallback
                              src={movie.poster}
                              alt=""
                              label={movie.title}
                              wrapperClassName="h-16 w-11 rounded-md ring-1 ring-white/10"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-white">{movie.title}</p>
                            <p className="text-xs text-slate-500">
                              {movie.genres.slice(0, 2).join(', ')}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{movie.year}</td>
                          <td className="px-4 py-3 text-slate-300">{movie.duration}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-amber-300">
                              <FiStar className="h-3.5 w-3.5" aria-hidden /> {movie.rating.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{movie.language}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ${STATUS_STYLES[movie.status] ?? STATUS_STYLES.created
                                }`}
                            >
                              {movie.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleDelete(movie.id, movie.title)}
                                disabled={deletingId === movie.id}
                                className="btn-danger px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <FiTrash2 className="h-3.5 w-3.5" aria-hidden />
                                {deletingId === movie.id ? 'Deleting…' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}
          </motion.section>
        </motion.div>
      )}
    </PageTransition>
  );
}
