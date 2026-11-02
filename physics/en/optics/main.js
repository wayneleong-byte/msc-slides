// Chapter 16: Optics (Macao Science Center MVP) — optical rays, no explode.
import { startBook } from '../../engine/book.js';
import { buildWorld } from './world.js';
import { PAGES, PLATES } from './pages.js';
import * as M from './model.js';

const f = (x, n = 1) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);

let W = null;
let currentScene = 'shadow';

function ensureCtrl() {
  let el = document.getElementById('optic-ctrl');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'optic-ctrl';
  el.style.cssText = 'position:absolute;left:12px;bottom:36px;z-index:4;background:rgba(251,251,250,.92);border:1px solid #ddd;border-radius:10px;padding:8px 12px;font:500 12px/1.4 system-ui,sans-serif;color:#333;box-shadow:0 2px 10px rgba(0,0,0,.06);display:none;pointer-events:auto;min-width:200px';
  el.innerHTML = `
    <label style="display:flex;flex-direction:column;gap:4px">
      <span id="optic-ctrl-label">Incident angle <b id="optic-deg">35°</b></span>
      <input id="optic-range" type="range" min="10" max="70" step="1" value="35" style="width:180px">
    </label>
    <div style="margin-top:4px;color:#8a8a8f;font-size:11px">Drag to change angle; reflection / refraction update live</div>`;
  const fig = document.querySelector('.figure') || document.getElementById('right');
  fig.appendChild(el);
  el.querySelector('#optic-range').addEventListener('input', e => {
    const deg = +e.target.value;
    if (!W) return;
    if (currentScene === 'reflect' || currentScene === 'refract') {
      W.setIncidentDeg(currentScene, deg);
      el.querySelector('#optic-deg').textContent = `${deg}°`;
    }
  });
  return el;
}

function syncCtrl(scene) {
  currentScene = scene;
  const el = ensureCtrl();
  const show = scene === 'reflect' || scene === 'refract';
  el.style.display = show ? 'block' : 'none';
  if (!show) return;
  const deg = M.getIncidentDeg(scene) ?? 35;
  el.querySelector('#optic-range').value = String(Math.round(deg));
  el.querySelector('#optic-deg').textContent = `${Math.round(deg)}°`;
  const lab = el.querySelector('#optic-ctrl-label');
  lab.innerHTML = (scene === 'reflect' ? 'Incident (reflection) ' : 'Incident (refraction) ') + `<b id="optic-deg">${Math.round(deg)}°</b>`;
}

startBook({
  no: 16, PAGES, PLATES, clock0: 0,
  lookKeys: [],
  noExplode: true,
  plateKicker: 'Notes',
  hintDefault: 'Drag to turn · shift-drag to pan · click for notes · use slider on reflection/refraction',
  buildWorld(E) {
    W = buildWorld(E);
    ensureCtrl();
    return {
      update(s) {
        W.update(s.clock);
      },
      labels: W.labels,
    };
  },
  state: (clock, reduced) => ({ clock: reduced ? 0 : clock }),
  readout(s, page) {
    syncCtrl(page.scene);
    switch (page.scene) {
      case 'shadow': return 'Light travels in straight lines\nA block casts a shadow';
      case 'reflect': {
        const a = M.reflAngles();
        return `i = ${f(a.i, 0)}°\nr = ${f(a.r, 0)}°\n(slider)`;
      }
      case 'mirror': return `|u| = ${f(Math.abs(M.MIRROR.objX), 1)}\n|v| = ${f(Math.abs(M.mirrorImageX()), 1)}`;
      case 'refract': {
        const r = M.snell();
        return `n₁=${M.REFR.n1}  n₂=${M.REFR.n2}\ni=${f(r.iDeg, 0)}°  r=${f(r.rDeg, 0)}°\n(slider)`;
      }
      case 'prism': {
        const g = M.prismExit(M.PRISM.nG);
        return `A=${M.PRISM.A}°\ngreen exit ≈ ${f(g.i2, 0)}°`;
      }
      case 'lens': {
        const L = M.thinLens();
        return `f=${f(M.LENS.f, 1)}\nu=${f(L.u, 1)}  v=${f(L.v, 1)}\nm=${f(L.m, 2)}`;
      }
    }
    return '';
  },
});
