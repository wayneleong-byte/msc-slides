// node tools/perf.mjs [chapter ...] — frame time, script and layout cost per second of each chapter.
import puppeteer from 'puppeteer-core';
const chapters = process.argv.slice(2).length ? process.argv.slice(2) : ['kinematics','newton','circular','energy','momentum','oscillations','rotation','fluids','electrostatics','gauss','potential','capacitors','circuits','magnetism','induction'];
const W = +(process.env.W || 1440), H = +(process.env.H || 900);
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: +(process.env.DPR || 2) });
const cdp = await page.createCDPSession(); await cdp.send('Performance.enable');
const wait = ms => new Promise(r => setTimeout(r, ms));
const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
for (const c of chapters) {
  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:8137/${c}/`, { waitUntil: 'load' });
  await page.waitForFunction('window.__atlas', { timeout: 30000 });
  const ready = Date.now() - t0;
  await page.evaluate(() => scrollTo(0, 3 * innerHeight)); await wait(1500);
  const a = await metric();
  const frames = await page.evaluate(() => new Promise(res => { let n = 0; const t = performance.now(); const f = () => { n++; performance.now() - t < 3000 ? requestAnimationFrame(f) : res(n / 3); }; requestAnimationFrame(f); }));
  const b = await metric();
  const per = k => ((b[k] - a[k]) / 3 * 1000).toFixed(0);
  console.log(`${c.padEnd(15)} ready ${String(ready).padStart(5)} ms  fps ${frames.toFixed(0).padStart(3)}  script ${per('ScriptDuration').padStart(4)} ms/s  layout ${per('LayoutDuration').padStart(3)} ms/s  recalc ${per('RecalcStyleDuration').padStart(3)} ms/s  layouts/s ${((b.LayoutCount - a.LayoutCount) / 3).toFixed(0)}`);
}
await browser.close();
