// node tools/taptest.mjs <chapter> <page> — on a phone viewport, a tap on the figure opens a breakdown; a swipe turns the page.
import puppeteer from 'puppeteer-core';
const [c, pg] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(`http://127.0.0.1:8137/${c}/#${pg}`, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.__atlas'); await new Promise(r => setTimeout(r, 1200));
// tap the centre of each lit assembly's projected position until one opens
// a grid of tap spots over the figure
const pts = await page.evaluate(() => { const r = document.getElementById('gl').getBoundingClientRect(), out = [];
  for (let i = 1; i < 6; i++) for (let j = 1; j < 6; j++) out.push(['', r.left + r.width * i / 6, r.top + r.height * j / 6]); return out; });
let opened = null;
for (const [k, x, y] of pts) { await page.touchscreen.tap(x, y); await new Promise(r => setTimeout(r, 400)); opened = await page.evaluate(() => document.getElementById('plate').hidden ? null : document.querySelector('#plate h1').textContent); if (opened) break; }
if (process.argv[4]) await page.screenshot({ path: process.argv[4] });
console.log('tap opened:', opened, '| hint:', await page.evaluate(() => document.getElementById('hint').textContent));
await browser.close();
