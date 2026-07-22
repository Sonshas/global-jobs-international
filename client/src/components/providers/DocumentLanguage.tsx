import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { applyDocumentLanguage } from '@/i18n/languages';

/** Keeps <html lang/dir> in sync for RTL (Arabic) and accessibility. */
export function DocumentLanguage({ children }: { children?: ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    applyDocumentLanguage(i18n.resolvedLanguage || i18n.language);
  }, [i18n.language, i18n.resolvedLanguage]);

  return children ?? null;
}
