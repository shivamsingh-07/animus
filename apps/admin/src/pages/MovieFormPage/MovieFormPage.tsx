import { useState, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiDownloadCloud, FiFilm, FiStar, FiUploadCloud } from 'react-icons/fi';
import { tap } from '@/animations';
import type { ImportedMovie, PresignedUpload } from '@/types';
import {
  createMovie,
  importMovieFromTmdb,
  requestUploadUrl,
  updateMovie,
  uploadToS3,
} from '@/services/movieApi';
import { GlassCard } from '@/components/common/GlassCard';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { PageHeader } from '@/components/common/PageHeader';
import { PageTransition } from '@/components/common/PageTransition';
import { useDocumentTitle } from '@/hooks';

function Dot() {
  return (
    <span aria-hidden className="text-slate-500">
      •
    </span>
  );
}

/** Details-page-style preview of fetched metadata, mirroring the client. */
function MoviePreview({ movie }: { movie: ImportedMovie }) {
  const genres = movie.genres ?? [];
  const cast = movie.cast_members ?? [];

  return (
    <div className="relative isolate min-h-[440px] overflow-hidden rounded-2xl border border-white/10">
      <div className="absolute inset-0 -z-10">
        {movie.backdrop ? (
          <ImageWithFallback src={movie.backdrop} alt="" loading="eager" wrapperClassName="h-full w-full" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-panel to-ink" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/30" />
      </div>

      <div className="flex min-h-[440px] flex-col justify-end p-5 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)_minmax(180px,240px)] lg:items-end lg:gap-8">
          <div className="mx-auto shrink-0 lg:mx-0">
            <div className="aspect-[2/3] w-36 overflow-hidden rounded-xl ring-1 ring-white/10 sm:w-44 lg:w-48">
              {movie.poster ? (
                <ImageWithFallback
                  src={movie.poster}
                  alt=""
                  label={movie.title}
                  loading="eager"
                  wrapperClassName="h-full w-full"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-white/5 text-slate-500">
                  <FiFilm className="h-8 w-8" aria-hidden />
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              {movie.title || 'Untitled'}
            </h2>
            {movie.tagline && (
              <p className="mt-2 text-sm font-medium italic text-brand-400 sm:text-base">
                {movie.tagline}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-300">
              <span className="flex items-center gap-1 font-semibold text-amber-300">
                <FiStar className="h-4 w-4" aria-hidden /> {(movie.rating ?? 0).toFixed(1)}
              </span>
              {movie.year != null && (
                <>
                  <Dot />
                  <span>{movie.year}</span>
                </>
              )}
              {movie.duration && (
                <>
                  <Dot />
                  <span>{movie.duration}</span>
                </>
              )}
              {movie.maturity_rating && (
                <>
                  <Dot />
                  <span className="rounded border border-white/25 px-1.5 py-px text-xs font-medium">
                    {movie.maturity_rating}
                  </span>
                </>
              )}
            </div>

            {genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {movie.description && (
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
                {movie.description}
              </p>
            )}
          </div>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-slate-400">Cast</dt>
              <dd className="mt-1 leading-relaxed text-slate-200">{cast.join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-400">Director</dt>
              <dd className="mt-1 text-slate-200">{movie.director || '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-400">Language</dt>
              <dd className="mt-1 text-slate-200">{movie.language || '—'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export function MovieFormPage() {
  useDocumentTitle('Add Movie');
  const navigate = useNavigate();

  const [tmdbUrl, setTmdbUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const [movie, setMovie] = useState<ImportedMovie | null>(null);
  const [presign, setPresign] = useState<PresignedUpload | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  // Id of the catalog entry, created at "Fetch details" (status `created`) so an
  // abandoned or failed upload is left behind for the admin to delete.
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    const url = tmdbUrl.trim();
    if (!url || importing) return;
    setImporting(true);
    setError(null);
    setImportNotice(null);
    setMovie(null);
    setPresign(null);
    setFile(null);
    setProgress(0);
    setCreatedId(null);
    try {
      const data = await importMovieFromTmdb(url);
      if (data.year == null) {
        setError('This TMDB entry has no release year — pick a movie that has a release date.');
        return;
      }
      const upload = await requestUploadUrl(data.title ?? 'movie', data.year);

      // Create (or reuse) the catalog entry now, as `created` — before upload.
      let movieId = upload.movie_id;
      if (movieId) {
        await updateMovie(movieId, { status: 'created' });
      } else {
        const created = await createMovie({
          title: (data.title ?? '').trim(),
          tagline: data.tagline ?? '',
          description: data.description ?? '',
          poster: data.poster ?? '',
          backdrop: data.backdrop ?? '',
          trailer_url: data.trailer_url ?? '',
          year: data.year,
          duration: data.duration ?? '',
          rating: data.rating ?? 0,
          maturity_rating: data.maturity_rating ?? 'NR',
          genres: data.genres ?? [],
          cast_members: data.cast_members ?? [],
          director: data.director ?? '',
          language: data.language ?? '',
          raw_s3_key: upload.raw_s3_key,
          status: 'created',
        });
        movieId = created.id;
      }

      setMovie(data);
      setPresign(upload);
      setCreatedId(movieId);
      setImportNotice(
        upload.existing
          ? 'Already in the catalog — uploading replaces it.'
          : 'Ready to upload.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import from TMDB.');
    } finally {
      setImporting(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setProgress(0);
  }

  async function handleUpload() {
    if (!presign || !file || !createdId || uploading) return;
    setUploading(true);
    setError(null);
    setProgress(0);
    try {
      await uploadToS3(presign.upload_url, file, setProgress);
      await updateMovie(createdId, { status: 'uploaded' });
      navigate('/');
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Upload failed.';
      setError(`${reason} Delete the entry and try again.`);
      setUploading(false);
    }
  }

  return (
    <PageTransition>
      <PageHeader title="Add Movie" subtitle="Import from TMDB, then upload the video." />

      {error && <GlassCard className="mb-4 p-4 text-sm text-red-300">{error}</GlassCard>}

      <GlassCard className="mb-4 p-5">
        <h2 className="text-sm font-semibold text-white">Import from TMDB</h2>
        <p className="mt-1 text-xs text-slate-400">
          Paste a TMDB link to import a movie.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="input"
            value={tmdbUrl}
            onChange={(event) => setTmdbUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleImport();
              }
            }}
            placeholder="https://www.themoviedb.org/movie/27205-inception"
            aria-label="TMDB movie link"
          />
          <motion.button
            type="button"
            whileTap={tap}
            onClick={() => void handleImport()}
            disabled={importing || !tmdbUrl.trim()}
            className="btn-primary shrink-0"
          >
            <FiDownloadCloud className="h-4 w-4" aria-hidden />
            {importing ? 'Fetching…' : 'Fetch details'}
          </motion.button>
        </div>
        {importNotice && <p className="mt-2 text-xs text-emerald-300">{importNotice}</p>}
      </GlassCard>

      {movie ? (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <MoviePreview movie={movie} />

          <GlassCard className="p-5">
            <h2 className="text-sm font-semibold text-white">Upload movie file</h2>
            <p className="mt-1 text-xs text-slate-400">
              Choose the video file and upload it.
            </p>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-white/20"
              />
              <motion.button
                type="button"
                whileTap={tap}
                onClick={() => void handleUpload()}
                disabled={!file || uploading}
                className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiUploadCloud className="h-4 w-4" aria-hidden />
                {uploading ? 'Uploading…' : 'Upload file'}
              </motion.button>
            </div>

            {uploading && (
              <div className="mt-4">
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-lg font-bold tabular-nums text-white">
                  {progress}%
                </p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      ) : (
        <GlassCard className="grid place-items-center gap-3 p-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 text-brand-400">
            <FiFilm className="h-7 w-7" aria-hidden />
          </span>
          <h2 className="text-lg font-semibold text-white">Nothing loaded yet</h2>
          <p className="max-w-sm text-sm text-slate-400">
            Import a movie from TMDB to get started.
          </p>
        </GlassCard>
      )}
    </PageTransition>
  );
}
