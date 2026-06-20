/** Transcoding pipeline state for a title. */
export type MovieStatus = 'created' | 'uploaded' | 'processing' | 'ready' | 'failed';

/**
 * Core domain model for a movie. Mirrors the records served by the API
 * (`/movies`). The admin owns its own copy of the contract so it stays fully
 * independent — keep this in sync with the backend.
 */
export interface Movie {
  id: string;
  title: string;
  tagline: string;
  description: string;
  year: number;
  /** Human-readable runtime, e.g. "2h 49m". */
  duration: string;
  /** Critic/audience score on a 0–10 scale. */
  rating: number;
  /** Content advisory label, e.g. "PG-13". */
  maturity_rating: string;
  genres: string[];
  poster: string;
  backdrop: string;
  /** CloudFront URL to the DASH .mpd the player streams. */
  manifest_url: string;
  trailer_url: string;
  cast_members: string[];
  director: string;
  language: string;
  status: MovieStatus;
}

/**
 * Payload accepted by the create endpoint. The backend assigns `id`/`status`,
 * and the catalog-only fields are optional (the API fills sensible defaults).
 */
export type MovieInput = Omit<
  Movie,
  'id' | 'status' | 'manifest_url' | 'tagline' | 'genres' | 'maturity_rating'
> &
  Partial<Pick<Movie, 'tagline' | 'genres' | 'maturity_rating' | 'status'>> & {
    /** Object key of the raw upload in the raw-files bucket. */
    raw_s3_key: string;
  };

/** Response from `POST /uploads/presign`. */
export interface PresignedUpload {
  upload_url: string;
  raw_s3_key: string;
  bucket: string;
  expires_in: number;
  /** Existing catalog entry (same title/year) to reuse, or null to create one. */
  movie_id: string | null;
  existing: boolean;
}

/**
 * Metadata returned by the TMDB import endpoint to pre-fill the Add Movie form.
 * Every field is optional/nullable since TMDB data can be incomplete.
 */
export interface ImportedMovie {
  title?: string;
  tagline?: string;
  description?: string;
  year?: number | null;
  duration?: string;
  rating?: number | null;
  maturity_rating?: string;
  genres?: string[];
  poster?: string;
  backdrop?: string;
  manifest_url?: string;
  trailer_url?: string;
  cast_members?: string[];
  director?: string;
  language?: string;
}
