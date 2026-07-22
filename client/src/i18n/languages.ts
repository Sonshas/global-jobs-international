export const LANGUAGE_STORAGE_KEY = 'gji-language';

export type AppLanguage = {
  code: string;
  label: string;
  nativeLabel: string;
  dir: 'ltr' | 'rtl';
};

export const appLanguages: AppLanguage[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr' },
  { code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili', dir: 'ltr' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', dir: 'ltr' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', dir: 'ltr' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', dir: 'ltr' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', dir: 'ltr' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano', dir: 'ltr' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
  { code: 'zh', label: 'Chinese (Simplified)', nativeLabel: '简体中文', dir: 'ltr' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', dir: 'ltr' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', dir: 'ltr' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', dir: 'ltr' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', dir: 'ltr' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', dir: 'ltr' },
];

export const supportedLanguageCodes = appLanguages.map((l) => l.code);

export function isRtlLanguage(code: string) {
  return appLanguages.find((l) => l.code === code)?.dir === 'rtl';
}

export function applyDocumentLanguage(code: string) {
  if (typeof document === 'undefined') return;
  const meta = appLanguages.find((l) => l.code === code) ?? appLanguages[0];
  document.documentElement.lang = meta.code;
  document.documentElement.dir = meta.dir;
  document.documentElement.classList.toggle('rtl', meta.dir === 'rtl');
}

export function detectInitialLanguage(): string {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && supportedLanguageCodes.includes(stored)) return stored;
  } catch {
    // ignore
  }

  if (typeof navigator !== 'undefined') {
    const candidates = [navigator.language, ...(navigator.languages || [])];
    for (const candidate of candidates) {
      const lower = candidate.toLowerCase();
      if (lower.startsWith('zh')) return 'zh';
      const short = lower.slice(0, 2);
      if (supportedLanguageCodes.includes(short)) return short;
    }
  }

  return 'en';
}

export function persistLanguage(code: string) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    // ignore
  }
}
