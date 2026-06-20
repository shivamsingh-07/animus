import { searchMovies } from '@/services/movieApi';
import type { Movie } from '@/types';
import { useAsync } from './useAsync';

export function useMovieSearch(query: string) {
  return useAsync<Movie[]>(() => searchMovies(query), [query], { keepPreviousData: true });
}
