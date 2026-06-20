import { formatMovieTitle } from '@/utils/format';

export const APP_DOCUMENT_TITLE = 'Animus — Stream the Extraordinary';

export function formatDocumentTitle(
  movie?: { title: string; year: number } | null,
): string {
  if (!movie) return APP_DOCUMENT_TITLE;
  return `${formatMovieTitle(movie)} - Animus Play`;
}
