// Chapter 15: electromagnetic induction, on the shared book.
import { startBook } from '../engine/book.js';
import { buildWorld } from './world.js';
import { PAGES, PLATES, CH, R, BARS } from './pages.js';
import * as M from './model.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);

startBook({
  no: 15, PAGES, PLATES, clock0: 0,
  lookKeys: [],
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: s => W.update(s), labels: W.labels };
  },
  state: (clock, reduced) => {
    const c = reduced ? 1.4 : clock, L = run => M.loop(c, run);
    return { clock: c, flux: { t: c % M.FLUX.T }, lenz: L(M.LENZ.run), coil: { t: c % M.COILS.T }, wire: L(M.WIRE.run), bar: L(M.BAR.run),
      cross: L(M.CROSS.run), rail: L(M.RAIL.run), sol: { t: c % M.SOL.T }, rl: { t: c % (2 * M.RL.phase) },
      lc: { t: (c % (2 * M.LC.show)) / M.LC.slow } };
  },
  readout(s, page) {
    switch (page.scene) {
      case 'flux': { const r = M.fluxScene(s.flux.t); return `Φ ${f(r.Phi * 1e6)} µWb\nε ${f(r.emf * 1e6, 1)} µV   I ${f(r.I * 1e3)} mA`; }
      case 'lenz': { const r = M.lenzCase(M.CASES[0], s.lenz.t); return `N approaching: Φ ${f(r.Phi * 1e6)} µWb\nε ${f(r.emf * 1e6)} µV`; }
      case 'mutual': { const a = M.coilsScene(s.coil.t), b = M.coreScene(s.coil.t); return `coils: I₁ ${f(a.I1)} A   ε₂ ${f(a.emf * 1e3, 3)} mV\ncore: B ${f(b.B, 3)} T   ε₂ ${f(b.emf2 * 1e3)} mV`; }
      case 'wire': { const r = M.wireScene(s.wire.t); return `r ${f(r.r * 100, 1)} cm   Φ ${f(r.Phi * 1e6, 3)} µWb\nε ${f(r.emf * 1e6, 3)} µV`; }
      case 'bar': { const r = M.barScene(s.bar.t, s.bar.resting); return `v ${f(r.v)} m/s   E ${f(r.E)} V/m\nε = BLv ${f(r.emf, 3)} V   I 0`; }
      case 'crossing': { const r = M.crossScene(s.cross.t); return `Φ ${f(r.Phi * 1e3, 1)} mWb\nε ${f(r.emf * 1e3, 0)} mV   I ${f(r.I * 1e3, 0)} mA`; }
      case 'rails': { const r = M.railScene(s.rail.t); return `t ${f(s.rail.t)} s   v ${f(r.v, 3)} m/s\nI ${f(r.I, 3)} A   F ${f(r.F, 3)} N`; }
      case 'solenoid': { const r = M.solScene(s.sol.t); return `I ${f(r.I)} A   B ${f(r.B * 1e3)} mT\nε_L ${f(r.emfL * 1e3)} mV   U ${f(r.U * 1e3)} mJ`; }
      case 'rl': { const r = M.rlScene(s.rl.t); return `${r.growing ? 'growth' : 'decay'}: t ${f(r.s)} s   I ${f(r.I, 3)} A\nIR ${f(r.VR)} V   L dI/dt ${f(r.VL)} V`; }
      case 'lc': { const r = M.lcScene(s.lc.t); return `t ${f(s.lc.t * 1e3)} ms   q ${f(r.q * 1e6, 1)} µC   I ${f(r.I * 1e3, 1)} mA\nU_E ${f(r.UE * 1e3, 3)}  U_B ${f(r.UB * 1e3, 3)}  total ${f((r.UE + r.UB) * 1e3, 3)} mJ`; }
    }
    return '';
  },
  onFrame(s, sheets) {
    const q = sel => sheets.flatMap(el => [...el.querySelectorAll(sel)]);
    const put = (key, r, x, y) => q(`circle[data-cursor="${key}"]`).forEach(c => { c.setAttribute('cx', CH.sx(x, r.x0, r.x1)); c.setAttribute('cy', CH.sy(Math.min(Math.max(y, r.y0), r.y1), r.y0, r.y1)); });
    const fl = M.fluxScene(s.flux.t); put('phi0', R.phi0, s.flux.t, fl.Phi * 1e6); put('emf0', R.emf0, s.flux.t, fl.emf * 1e6);
    const co = M.coilsScene(s.coil.t); put('i1', R.i1, s.coil.t, co.I1); put('emf2', R.emf2, s.coil.t, co.emf * 1e3);
    const wi = M.wireScene(s.wire.t); put('phiW', R.phiW, s.wire.t, wi.Phi * 1e6); put('emfW', R.emfW, s.wire.t, wi.emf * 1e6);
    const cr = M.crossScene(s.cross.t); put('phiX', R.phiX, s.cross.t, cr.Phi * 1e3); put('emfX', R.emfX, s.cross.t, cr.emf * 1e3);
    const ra = M.railScene(s.rail.t); put('v', R.v, s.rail.t, ra.v); put('pw', R.pw, s.rail.t, ra.P);
    { const Rp = R.pw, X = t => CH.sx(t, Rp.x0, Rp.x1).toFixed(1), Y = p => CH.sy(p, Rp.y0, Rp.y1).toFixed(1), n = 40, pts = [];
      for (let i = 0; i <= n; i++) { const t = s.rail.t * i / n; pts.push(`L${X(t)},${Y(M.railScene(t).P)}`); }
      q('path[data-area="pw"]').forEach(p => p.setAttribute('d', `M${X(0)},${Y(0)}${pts.join('')}L${X(s.rail.t)},${Y(0)}Z`));
      q('#raillive').forEach(el => { el.textContent = `shaded heat ${f(ra.heat * 1e3, 1)} mJ = kinetic energy lost ½m(v₀² − v²)`; }); }
    const so = M.solScene(s.sol.t); put('iS', R.iS, s.sol.t, so.I); put('eS', R.eS, s.sol.t, so.emfL * 1e3);
    const rl = M.rlScene(s.rl.t); put('iRL', R.iRL, s.rl.t, rl.I); put('vR', R.vRL, s.rl.t, rl.VR); put('vL', R.vRL, s.rl.t, rl.VL);
    const lc = M.lcScene(s.lc.t); put('qLC', R.qLC, s.lc.t * 1e3, lc.q * 1e6); put('iLC', R.iLC, s.lc.t * 1e3, lc.I * 1e3);
    for (const [k, v] of [['UE', lc.UE], ['UB', lc.UB], ['U', lc.UE + lc.UB]]) {
      const hh = (BARS.base - BARS.top) * v / M.LC.U;
      q(`rect[data-bar="lc-${k}"]`).forEach(r => { r.setAttribute('y', BARS.base - hh); r.setAttribute('height', hh); });
      q(`text[data-val="lc-${k}"]`).forEach(t => { t.setAttribute('y', BARS.base - hh - 6); t.textContent = `${f(v * 1e3, 3)} mJ`; });
    }
  },
});
