import { useEffect } from 'react';

const APP_TITLE = 'Animus Admin Panel';

/** Syncs `document.title` with the current page; restores the default on unmount. */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${APP_TITLE}` : APP_TITLE;
    return () => {
      document.title = APP_TITLE;
    };
  }, [title]);
}
