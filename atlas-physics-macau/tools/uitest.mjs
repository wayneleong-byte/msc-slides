// node tools/uitest.mjs <chapter> <page> <out.png> [w h touch] — deep link, practice and compare blocks, a tap.
import puppeteer from 'puppeteer-core';
const [c, pg, out, w = 1440, h = 900, touch] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !m.location().url?.includes('/_vercel/insights/')) errors.push(m.text()); });
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 2, isMobile: !!touch, hasTouch: !!touch });
await page.goto(`http://127.0.0.1:8137/${c}/#${pg}`, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.__atlas'); await new Promise(r => setTimeout(r, 1500));
const info = await page.evaluate(() => ({ hash: location.hash, folio: document.getElementById('pagenum').textContent, title: document.querySelector('#sheet h1').textContent,
  practice: document.querySelectorAll('#sheet .practice .q').length, xref: [...document.querySelectorAll('#sheet .xref a')].map(a => a.getAttribute('href')),
  leftOverflow: document.getElementById('left').scrollHeight - document.getElementById('left').clientHeight, docW: document.documentElement.scrollWidth }));
console.log(JSON.stringify(info));
if (info.practice) {
  await page.evaluate(() => { const b = document.querySelector('#sheet .q [data-c]'); b && b.click(); const r = document.querySelector('#sheet .reveal'); r && r.click(); document.querySelector('#sheet .practice').scrollIntoView(); });
  console.log(await page.evaluate(() => [...document.querySelectorAll('#sheet .q')].map(q => ({ done: q.classList.contains('done'), shown: !q.querySelector('.why').hidden, right: !!q.querySelector('.right'), wrong: !!q.querySelector('.wrong') }))));
}
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: out });
console.log(errors.length ? errors.join('\n') : 'no console errors');
await browser.close();
