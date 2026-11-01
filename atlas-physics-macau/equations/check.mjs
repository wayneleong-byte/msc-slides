// Checks every chapter link in equations/index.html: the chapter dir exists and #index < its page count.
// node equations/check.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const html = fs.readFileSync(path.join(HERE, 'index.html'), 'utf8');
let ok = 0, bad = 0;
for (const [, dir, idx] of html.matchAll(/href="\.\.\/([a-z]+)\/#(\d+)"/g)) {
  const file = path.join(ROOT, dir, 'pages.js');
  const n = fs.existsSync(file) ? (fs.readFileSync(file, 'utf8').match(/kicker:/g) || []).length : 0;
  if (+idx < n) ok++; else { bad++; console.log(`BAD ${dir}/#${idx} (pages: ${n})`); }
}
const other = [...html.matchAll(/href="([^"#][^"]*)"/g)].map(m => m[1]).filter(h => !/^\.\.\/[a-z]+\/$|^\.\.\/$|^\.\.\/atlas\.css$|^https:/.test(h) && !/^\.\.\/[a-z]+\/#\d+$/.test(h));
console.log(`${ok} links ok, ${bad} bad${other.length ? ', other hrefs: ' + other.join(' ') : ''}`);
process.exit(bad ? 1 : 0);
