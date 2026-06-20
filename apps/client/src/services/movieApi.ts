import type { Movie } from '@/types';
import { apiRequest } from './apiClient';

/**
 * Read-only movie API client for the public site. Every call goes through the
 * ANIMUS backend (`client → API → data`) behind a Promise-based contract.
 */

export function fetchMovieById(id: string): Promise<Movie> {
  return apiRequest<Movie>(`/movies/${id}`);
}

export function searchMovies(query: string): Promise<Movie[]> {
  const trimmed = query.trim();
  const suffix = trimmed ? `?q=${encodeURIComponent(trimmed)}` : '';
  return apiRequest<Movie[]>(`/movies/search${suffix}`);
}
