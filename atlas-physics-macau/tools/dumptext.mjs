// node tools/dumptext.mjs <chapter> [out.txt] — the rendered text of every page (left sheet with practice, plus the readout),
// for proofreading numbers as the reader sees them. Needs the static server on :8137.
import fs from 'fs';
import puppeteer from 'puppeteer-core';
const [c, out] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
await page.goto(`http://127.0.0.1:8137/${c}/`, { waitUntil: 'networkidle0' }); await page.waitForFunction('window.__atlas');
const n = await page.evaluate(() => document.querySelectorAll('#dots button').length);
let txt = '';
for (let i = 0; i < n; i++) {
  await page.evaluate(i => { location.hash = '#' + i; }, i);
  await page.waitForFunction(i => document.getElementById('pagenum').textContent.startsWith(i + 1 + ' /'), { timeout: 8000 }, i);
  await new Promise(r => setTimeout(r, 150));
  await page.evaluate(() => document.querySelectorAll('#sheet .why, #sheet .reveal *').forEach(e => { e.hidden = false; e.style.display = 'block'; }));
  txt += `\n===== ${c} #${i} =====\n` + await page.evaluate(() => document.getElementById('sheet').innerText) + '\n';
}
out ? fs.writeFileSync(out, txt) : console.log(txt);
await browser.close();
