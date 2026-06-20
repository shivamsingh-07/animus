import { useEffect } from 'react';
import { APP_DOCUMENT_TITLE, formatDocumentTitle } from '@/constants/app';

type DocumentTitleMovie = { title: string; year: number };

/** Syncs `document.title` with the current page; restores the default on unmount. */
export function useDocumentTitle(movie?: DocumentTitleMovie | null) {
  useEffect(() => {
    document.title = formatDocumentTitle(movie);
    return () => {
      document.title = APP_DOCUMENT_TITLE;
    };
  }, [movie?.title, movie?.year]);
}
