// Chapter 13: Circuits, on the shared book.
import { startBook } from '../engine/book.js';
import { buildWorld } from './world.js';
import { PAGES, PLATES, CH, R } from './pages.js';
import * as M from './model.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
let W = null;

startBook({
  no: 13, PAGES, PLATES, clock0: 0,
  lookKeys: ['ohm'],
  buildWorld(E) {
    W = buildWorld(E);
    return { update: (s, look) => W.update(s, look), labels: W.labels };
  },
  state: (clock, reduced) => {
    const c = reduced ? 3 : clock * M.SLOW;
    return { clock: c, rc: M.rc(c), walk: W ? W.walk() : { sum: 0, loop: 1 } };
  },
  readout(s, page) {
    const c = s.clock;
    switch (page.scene) {
      case 'wire': return `I ${f(M.CU.I, 1)} A   v_d ${f(M.CU.vd * 1e3, 4)} mm/s\nJ ${f(M.CU.J / 1e6, 1)} MA/m²   E ${f(M.CU.E * 1e3, 1)} mV/m`;
      case 'wires': { const L = M.resLength(c); return `L ${f(L)} m   ΔV 1.50 V\nthin R ${f(M.rThin(L))} Ω   thick R ${f(M.rThick(L))} Ω`; }
      case 'ohm': return `ΔV ${f(M.OHM.E, 1)} V   R ${f(M.OHM.R, 1)} Ω\nI = ΔV/R = ${f(M.OHM.E / M.OHM.R, 2)} A`;
      case 'bulb': { const t = c % M.BULB.run, P = M.BULB.E ** 2 / M.BULB.R; return `t ${f(t, 1)} s   P ${f(P, 1)} W\nE = Pt = ${f(P * t, 1)} J`; }
      case 'cell': { const RL = M.cellLoad(c), I = M.cellI(RL); return `R ${f(RL)} Ω   I ${f(I)} A   terminal ${f(M.terminalV(I))} V\nbulb ${f(M.loadP(RL))} W   inside I²r ${f(I * I * M.CELL.r)} W`; }
      case 'sp': return `series: 6 Ω, 1.50 A\nparallel: ${f(M.parallelR([2, 4, 6]), 3)} Ω, 8.25 A`;
      case 'combo': return `R_eq ${f(M.COMBO.Req, 1)} Ω\nI ${f(9 / M.COMBO.Req, 2)} A at every stage`;
      case 'kirch': { const k = M.solve(M.KIRCH.edges, 'bl'), I = n => M.edgeI(M.KIRCH, k, n); return `I₁ ${f(I('R1'), 3)} A   I₂ ${f(I('R5'), 3)} A   I₃ ${f(I('R3'), 3)} A\nI₂ + I₃ = ${f(I('R5') + I('R3'), 3)} A`; }
      case 'rc': { const r = s.rc; return `${r.charging ? 'charging' : 'discharging'}   t ${f(r.s, 1)} s   q ${f(r.Q * 1e3)} mC\nI ${f(r.I * 1e3, 3)} mA   ΔV_C ${f(r.Vc)} V   ΔV_R ${f(Math.abs(r.VR))} V`; }
    }
    return '';
  },
  onFrame(s, sheets) {
    const q = sel => sheets.flatMap(el => [...el.querySelectorAll(sel)]);
    const put = (key, r, x, y) => q(`circle[data-cursor="${key}"]`).forEach(el => { el.setAttribute('cx', CH.sx(x, r.x0, r.x1)); el.setAttribute('cy', CH.sy(Math.min(Math.max(y, r.y0), r.y1), r.y0, r.y1)); });
    const c = s.clock;
    // the highlighted electron (phase from world.js: its sawtooth, in units of collisions)
    const u = W ? W.oneElectron(c) : 0; put('drude', R.drude, u % 4, M.drudeV(u, 1, 1));
    const L = M.resLength(c); put('thin', R.res, L, M.rThin(L)); put('thick', R.res, L, M.rThick(L));
    const t = c % M.BULB.run; put('energy', R.energy, t, M.BULB.E ** 2 / M.BULB.R * t);
    const RL = M.cellLoad(c), I = M.cellI(RL); put('pload', R.pload, RL, M.loadP(RL));
    put('rcq', R.rc, s.rc.c, 100 * s.rc.Q / M.RC.Qmax); put('rci', R.rc, s.rc.c, 100 * s.rc.I / M.RC.Imax);
  },
});
