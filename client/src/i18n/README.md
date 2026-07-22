# Internationalization (i18n)

Global Jobs International uses **i18next** + **react-i18next**.

## Rules for all future UI

1. Never hardcode user-visible English in components.
2. Add strings to `src/locales/en.json` under the right namespace (`nav`, `common`, `auth`, `dashboard`, …).
3. Use `const { t } = useTranslation()` and `t('namespace.key')`.
4. For forms/validation, use schema factories (`createLoginSchema()`) so messages follow the active language.
5. After adding English keys, refresh other locales:
   - `node scripts/extract-en-strings.mjs` — list unique English source strings
   - Add/update phrases in `scripts/locale-dicts/{lang}.json` (English → translation)
   - `node scripts/generate-locales.mjs` — write `src/locales/{lang}.json`
6. Arabic (`ar`) automatically sets `dir="rtl"` on `<html>` via `DocumentLanguage` + `applyDocumentLanguage`.

## Behaviour

- Instant language switch with `i18n.changeLanguage` (no page reload)
- Preference stored in `localStorage` (`gji-language`)
- First visit: browser language auto-detected when supported
- Brand name **Global Jobs International** stays in English across locales

## Supported languages

en, sw, fr, es, pt, de, it, nl, ar, zh, ja, ko, hi, tr, ru
