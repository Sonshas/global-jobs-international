#!/usr/bin/env node
/**
 * Deep-merges missing keys from `en.json` into every other locale file under
 * `client/src/locales`, using the English string as a fallback value.
 * Existing translations are never overwritten — only missing keys are added.
 *
 * Usage: node client/scripts/sync-locale-keys.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, '../src/locales');

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Merges `source` (en.json) into `target` (other locale), adding any key
 * present in `source` but missing in `target`. Returns the number of keys
 * that were added.
 */
function deepMergeMissing(source, target, pathPrefix = []) {
  let added = 0;
  for (const [key, sourceValue] of Object.entries(source)) {
    const keyPath = [...pathPrefix, key];
    if (!(key in target)) {
      target[key] = sourceValue;
      added += 1;
      continue;
    }
    if (isPlainObject(sourceValue) && isPlainObject(target[key])) {
      added += deepMergeMissing(sourceValue, target[key], keyPath);
    } else if (isPlainObject(sourceValue) && !isPlainObject(target[key])) {
      // Type mismatch (target has a non-object where en.json has an object) —
      // leave target untouched rather than clobbering an existing translation.
      console.warn(`  ! Skipped ${keyPath.join('.')} — type mismatch, left as-is`);
    }
  }
  return added;
}

function main() {
  const enPath = path.join(localesDir, 'en.json');
  const en = JSON.parse(readFileSync(enPath, 'utf8'));

  const files = readdirSync(localesDir).filter(
    (file) => file.endsWith('.json') && file !== 'en.json',
  );

  let totalAdded = 0;
  for (const file of files) {
    const filePath = path.join(localesDir, file);
    const locale = JSON.parse(readFileSync(filePath, 'utf8'));
    const added = deepMergeMissing(en, locale, []);
    if (added > 0) {
      writeFileSync(filePath, `${JSON.stringify(locale, null, 2)}\n`, 'utf8');
      console.log(`✓ ${file}: added ${added} missing key(s)`);
    } else {
      console.log(`  ${file}: up to date`);
    }
    totalAdded += added;
  }

  console.log(`\nDone. ${totalAdded} key(s) added across ${files.length} locale file(s).`);
}

main();
