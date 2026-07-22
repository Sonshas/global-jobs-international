/**
 * One-off / refresh: build locale-dicts/*.json from en-strings.json via Google Translate (unofficial).
 * Preserves "Global Jobs International" via placeholder. Run with network access.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dictsDir = path.join(__dirname, 'locale-dicts');
const enStrings = JSON.parse(fs.readFileSync(path.join(__dirname, 'en-strings.json'), 'utf8'));

const BRAND = 'Global Jobs International';
const BRAND_PH = '⟦GJI⟧';
const CONCURRENCY = 6;

const LANGS = {
  sw: 'sw',
  fr: 'fr',
  es: 'es',
  pt: 'pt',
  de: 'de',
  it: 'it',
  nl: 'nl',
  ar: 'ar',
  zh: 'zh-CN',
  ja: 'ja',
  ko: 'ko',
  hi: 'hi',
  tr: 'tr',
  ru: 'ru',
};

function protect(s) {
  return s.split(BRAND).join(BRAND_PH);
}

function restore(s) {
  return s.split(BRAND_PH).join(BRAND);
}

async function translateOne(text, tl) {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'en',
    tl,
    dt: 't',
    q: protect(text),
  });
  const url = `https://translate.googleapis.com/translate_a/single?${params}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GJI-locale-gen/1.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${tl}`);
  const data = await res.json();
  const translated = data[0].map((part) => part[0]).join('');
  return restore(translated);
}

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next;
      next += 1;
      let attempts = 0;
      while (attempts < 4) {
        try {
          results[i] = await fn(items[i], i);
          break;
        } catch (err) {
          attempts += 1;
          if (attempts >= 4) throw err;
          await sleep(800 * attempts);
        }
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function buildDict(code, tl) {
  let done = 0;
  const translated = await mapPool(enStrings, CONCURRENCY, async (en) => {
    const out = await translateOne(en, tl);
    done += 1;
    if (done % 50 === 0 || done === enStrings.length) {
      process.stdout.write(`  ${code}: ${done}/${enStrings.length}\r`);
    }
    await sleep(120);
    return out;
  });
  const dict = Object.fromEntries(enStrings.map((en, i) => [en, translated[i]]));
  console.log(`  ${code}: done (${enStrings.length} entries)`);
  dict[BRAND] = BRAND;
  return dict;
}

fs.mkdirSync(dictsDir, { recursive: true });

for (const [code, tl] of Object.entries(LANGS)) {
  const outPath = path.join(dictsDir, `${code}.json`);
  if (fs.existsSync(outPath)) {
    console.log('skip (exists)', code);
    continue;
  }
  console.log('building', code);
  const dict = await buildDict(code, tl);
  fs.writeFileSync(outPath, `${JSON.stringify(dict, null, 2)}\n`);
}

console.log('all locale dicts written to', dictsDir);
