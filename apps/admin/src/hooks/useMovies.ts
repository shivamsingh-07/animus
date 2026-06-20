import { useCallback, useEffect, useState } from 'react';
import type { Movie } from '@/types';
import { fetchMovies } from '@/services/movieApi';

/** Loads the catalog with loading/error state, plus `reload` and optimistic `removeMovie`. */
export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMovies(await fetchMovies());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load movies.');
    } finally {
      setLoading(false);
    }
  }, []);

  const removeMovie = useCallback((id: string) => {
    setMovies((prev) => prev.filter((movie) => movie.id !== id));
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { movies, loading, error, reload, removeMovie };
}
