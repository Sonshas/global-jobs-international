import { useEffect } from 'react';

/**
 * Sets `document.title` for the lifetime of the calling component.
 * Restores the previous title on unmount so nested/short-lived pages don't
 * leak a stale title into the next view.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
