import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  applyDocumentLanguage,
  detectInitialLanguage,
  persistLanguage,
  supportedLanguageCodes,
} from '@/i18n/languages';

import en from '@/locales/en.json';
import sw from '@/locales/sw.json';
import fr from '@/locales/fr.json';
import es from '@/locales/es.json';
import pt from '@/locales/pt.json';
import de from '@/locales/de.json';
import it from '@/locales/it.json';
import nl from '@/locales/nl.json';
import ar from '@/locales/ar.json';
import zh from '@/locales/zh.json';
import ja from '@/locales/ja.json';
import ko from '@/locales/ko.json';
import hi from '@/locales/hi.json';
import tr from '@/locales/tr.json';
import ru from '@/locales/ru.json';

const resources = {
  en: { translation: en },
  sw: { translation: sw },
  fr: { translation: fr },
  es: { translation: es },
  pt: { translation: pt },
  de: { translation: de },
  it: { translation: it },
  nl: { translation: nl },
  ar: { translation: ar },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  hi: { translation: hi },
  tr: { translation: tr },
  ru: { translation: ru },
};

const initialLng = detectInitialLanguage();

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: 'en',
  supportedLngs: supportedLanguageCodes,
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

applyDocumentLanguage(i18n.language);

i18n.on('languageChanged', (lng) => {
  persistLanguage(lng);
  applyDocumentLanguage(lng);
});

export default i18n;
