// Chapter 16: Optics (Macao Science Center MVP), on the shared book.
import { startBook } from '../../engine/book.js';
import { buildWorld } from './world.js';
import { PAGES, PLATES } from './pages.js';
import * as M from './model.js';

const f = (x, n = 1) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);

startBook({
  no: 16, PAGES, PLATES, clock0: 0,
  lookKeys: [],
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: s => W.update(s.clock), labels: W.labels };
  },
  state: (clock, reduced) => ({ clock: reduced ? 0 : clock }),
  readout(s, page) {
    switch (page.scene) {
      case 'shadow': return '光沿直線前進\n障礙物後方形成影子';
      case 'reflect': {
        const a = M.reflAngles();
        return `入射角 i = ${f(a.i, 0)}°\n反射角 r = ${f(a.r, 0)}°`;
      }
      case 'mirror': return `物距 |u| = ${f(Math.abs(M.MIRROR.objX), 1)}\n像距 |v| = ${f(Math.abs(M.mirrorImageX()), 1)}`;
      case 'refract': {
        const r = M.snell();
        return `n₁=${M.REFR.n1}  n₂=${M.REFR.n2}\ni=${f(r.iDeg, 0)}°  r=${f(r.rDeg, 0)}°`;
      }
      case 'prism': {
        const g = M.prismExit(M.PRISM.nG);
        return `稜鏡頂角 A=${M.PRISM.A}°\n綠光出射 ≈ ${f(g.i2, 0)}°`;
      }
      case 'lens': {
        const L = M.thinLens();
        return `f=${f(M.LENS.f, 1)}\nu=${f(L.u, 1)}  v=${f(L.v, 1)}\n放大率 m=${f(L.m, 2)}`;
      }
    }
    return '';
  },
});
