/**
 * Core domain model for a streamable title. Mirrors the records served by the
 * API (`GET /movies`). This app owns its own copy of the contract so it stays
 * fully independent.
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
}

/** Lightweight projection used by cards and grids. */
export type MovieSummary = Pick<
  Movie,
  'id' | 'title' | 'poster' | 'rating' | 'year' | 'maturity_rating'
>;
