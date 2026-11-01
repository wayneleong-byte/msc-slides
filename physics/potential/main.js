// Chapter 11: electric potential, on the shared book.
import { startBook } from '../engine/book.js';
import { buildWorld } from './world.js';
import { PAGES, PLATES, CH, R } from './pages.js';
import * as M from './model.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);

startBook({
  no: 11, PAGES, PLATES, clock0: 0,
  lookKeys: [],
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: s => W.update(s), labels: W.labels };
  },
  state: (clock, reduced) => {
    const c = reduced ? 2.0 : clock, L = run => M.loop(c, run);
    return { clock: c, pair: L(M.PAIR.run), square: L(M.SQ.run), uniform: L(M.UNI.run), spheres: L(M.SPH.run), accel: L(M.ACC.run) };
  },
  readout(s, page) {
    switch (page.scene) {
      case 'pair': { const a = M.pair(s.pair.t, 1), b = M.pair(s.pair.t, -1); return `r ${f(a.r * 100, 1)} cm\nlike U ${f(a.U * 1e6, 3)} μJ   unlike U ${f(b.U * 1e6, 3)} μJ`; }
      case 'square': { const st = M.square(s.square.t); return `charges placed ${st.n} of 4\nU ${f(st.U * 1e6, 3)} μJ`; }
      case 'uniform': { const r = M.uniPath(s.uniform.t); return `x ${f(r.p[0] * 100, 1)} cm along E\nV ${f(r.V)} V   U = qV ${f(r.U * 1e9)} nJ`; }
      case 'hill': { const r = M.hillProbe(s.clock); return `r ${f(r * 100, 1)} cm   V ${f(M.Vpoint(M.HILL.Q, r), 1)} V\nE = −dV/dr ${f(M.Epoint(M.HILL.Q, r), 0)} N/C`; }
      case 'dipole': return `P (axis, ${M.DIP.axisX * 100} cm): V ${f(M.VdipAxis(M.DIP.axisX), 1)} V\nP′ (bisector): V 0.0 V`;
      case 'rod': { const a = M.rodProbe(s.clock); return `a ${f(a * 100, 1)} cm   V(P) ${f(M.VrodAxis(a), 1)} V\nV(P′) ${f(M.VrodBis(M.ROD.bisA), 1)} V`; }
      case 'ring': { const z = M.axisProbe(s.clock); return `z ${f(z * 100, 1)} cm   ring ${f(M.Vring(z), 1)} V   disc ${f(M.Vdisc(z), 1)} V\narc, at its centre: ${f(M.Varc0, 1)} V`; }
      case 'spheres': { const r = M.sphProbe(s.spheres.t); return `r ${f(r * 100, 1)} cm\nconductor V ${f(M.Vcond(r), 1)} V   insulator V ${f(M.Vins(r), 1)} V`; }
      case 'accel': { const u = s.accel.t / M.ACC.run, p = M.accel(u, 'p'), e = M.accel(u, 'e'); return `proton  ${f(M.eV(p.K))} eV   ${f(p.v / 1000, 1)} km/s\nelectron ${f(M.eV(e.K))} eV   ${f(e.v / 1e6, 3)} × 10⁶ m/s`; }
    }
    return '';
  },
  onFrame(s, sheets) {
    const q = sel => sheets.flatMap(el => [...el.querySelectorAll(sel)]);
    const put = (key, r, x, y) => q(`circle[data-cursor="${key}"]`).forEach(c => { c.setAttribute('cx', CH.sx(x, r.x0, r.x1)); c.setAttribute('cy', CH.sy(y, r.y0, r.y1)); });
    const a = M.pair(s.pair.t, 1), b = M.pair(s.pair.t, -1);
    put('pairL', R.pair, a.r * 100, a.U * 1e6); put('pairU', R.pair, b.r * 100, b.U * 1e6);
    put('square', R.square, s.square.t, M.square(s.square.t).U * 1e6);
    const u = M.uniPath(s.uniform.t); put('uni', R.uniform, u.p[0] * 100, u.V);
    // hill: the cursor and its tangent, whose slope is −E
    { const r = M.hillProbe(s.clock), v = M.Vpoint(M.HILL.Q, r), e = M.Epoint(M.HILL.Q, r), H = R.hill, w = 0.06;
      put('hill', H, r, v);
      const X = x => CH.sx(x, H.x0, H.x1), Y = y => CH.sy(Math.max(Math.min(y, H.y1), H.y0), H.y0, H.y1);
      q('path[data-tangent="hill"]').forEach(p => p.setAttribute('d', `M${X(r - w)},${Y(v + e * w)}L${X(r + w)},${Y(v - e * w)}`));
      q('#hilllive').forEach(el => { el.textContent = `at r = ${f(r * 100, 1)} cm the slope is ${f(-e, 0)} V/m, so E = ${f(e, 0)} N/C outward`; }); }
    const rr = M.rodProbe(s.clock); put('rod', R.rod, rr, M.VrodAxis(rr));
    const z = M.axisProbe(s.clock); put('ring', R.ring, z, M.Vring(z)); put('disc', R.ring, z, M.Vdisc(z));
    const r = M.sphProbe(s.spheres.t);
    put('sphVc', R.sphV, r, M.Vcond(r)); put('sphVi', R.sphV, r, M.Vins(r));
    put('sphEc', R.sphE, r, M.Econd(r) / 1000); put('sphEi', R.sphE, r, M.Eins(r) / 1000);
    const uu = s.accel.t / M.ACC.run, p = M.accel(uu, 'p'), e = M.accel(uu, 'e');
    put('accP', R.accel, p.x * 100, M.eV(p.K)); put('accE', R.accel, e.x * 100, M.eV(e.K));
  },
});
