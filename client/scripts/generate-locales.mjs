/**
 * Generates locale JSON files from English + per-language phrase maps.
 * Run: node client/scripts/generate-locales.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, '../src/locales');
const dictsDir = path.resolve(__dirname, 'locale-dicts');
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));

const BRAND = 'Global Jobs International';
const LOCALE_CODES = ['sw', 'fr', 'es', 'pt', 'de', 'it', 'nl', 'ar', 'zh', 'ja', 'ko', 'hi', 'tr', 'ru'];

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, next, out);
    else out[next] = value;
  }
  return out;
}

function unflatten(flat) {
  const root = {};
  for (const [pathKey, value] of Object.entries(flat)) {
    const parts = pathKey.split('.');
    let cursor = root;
    for (let i = 0; i < parts.length - 1; i += 1) {
      cursor[parts[i]] ??= {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
  }
  return root;
}

const enFlat = flatten(en);

function translateString(dict, value) {
  if (value === BRAND) return BRAND;
  return dict[value] ?? value;
}

function translateLeaf(dict, value) {
  if (typeof value === 'string') return translateString(dict, value);
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'string' ? translateString(dict, item) : item));
  }
  return value;
}

function translateFlat(dict) {
  const out = {};
  for (const [key, value] of Object.entries(enFlat)) {
    out[key] = translateLeaf(dict, value);
  }
  return out;
}

function loadDictionary(code) {
  const file = path.join(dictsDir, `${code}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing dictionary: ${file}. Run: node client/scripts/populate-locale-dicts.mjs`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

for (const code of LOCALE_CODES) {
  const dict = loadDictionary(code);
  const json = unflatten(translateFlat(dict));
  json.app = json.app || {};
  json.app.name = BRAND;
  if (json.home?.heroBrand !== undefined) json.home.heroBrand = BRAND;
  fs.writeFileSync(path.join(localesDir, `${code}.json`), `${JSON.stringify(json, null, 2)}\n`);
  console.log('wrote', code);
}

console.log('done');
