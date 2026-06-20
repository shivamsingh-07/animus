import { fetchMovieById } from '@/services/movieApi';
import type { Movie } from '@/types';
import { useAsync } from './useAsync';

export function useMovie(id: string | undefined) {
  return useAsync<Movie>(() => {
    if (!id) {
      return Promise.reject(new Error('Invalid movie id'));
    }
    return fetchMovieById(id);
  }, [id]);
}
