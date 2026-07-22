import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/locales/en.json'), 'utf8'));

function collect(v, set) {
  if (typeof v === 'string') set.add(v);
  else if (Array.isArray(v)) v.forEach((x) => {
    if (typeof x === 'string') set.add(x);
  });
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collect(x, set));
}

const set = new Set();
collect(en, set);
const arr = [...set].sort();
console.log('unique strings:', arr.length);
fs.writeFileSync(path.join(__dirname, 'en-strings.json'), `${JSON.stringify(arr, null, 2)}\n`);
