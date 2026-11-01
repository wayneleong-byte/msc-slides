// Chapter 6: oscillations, on the shared book.
import { startBook } from '../engine/book.js';
import { buildWorld } from './world.js';
import { PAGES, PLATES, CURSORS, LIVE } from './pages.js';
import * as M from './model.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);

startBook({
  no: 6, PAGES, PLATES, clock0: 0,
  lookKeys: [],
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: s => W.update(s.t), labels: W.labels };
  },
  // physics time runs at SLOW × real time; a reduced-motion reader gets one still moment
  state: (clock, reduced) => ({ t: reduced ? 0.3 * M.T0 : clock * M.SLOW }),
  readout({ t }, page) {
    switch (page.scene) {
      case 'spring': case 'hooke': case 'trace': { const s = M.spring(t); return `x ${f(s.x)} m   v ${f(s.v)} m/s\nF ${f(s.F)} N   a ${f(s.a)} m/s²`; }
      case 'energy': { const s = M.spring(t); return `K ${f(s.KE)} J   U ${f(s.U)} J\nK + U ${f(s.KE + s.U)} J`; }
      case 'hang': { const s = M.hang(t); return `y ${f(s.y)} m   spring ${f(s.Fs)} N   weight ${f(M.WEIGHT)} N\nΣF ${f(s.net)} N   a ${f(s.a)} m/s²`; }
      case 'pendulum': { const p = M.pendulum(t); return `θ ${f(p.th / M.DEG, 1)}°   v ${f(p.v)} m/s\nrestoring ${f(p.restoring, 3)} N   T ${f(M.P_T, 3)} s`; }
      case 'double': { const a = M.periodSpring(1, M.K), b = M.periodSpring(4, M.K), c = M.periodPendulum(M.DOUBLE.L), d = M.periodPendulum(M.DOUBLE.L4);
        return `cycles  m ${f(t / a, 1)}   4m ${f(t / b, 1)}\n        L ${f(t / c, 1)}   4L ${f(t / d, 1)}`; }
      case 'ignore': return `springs: T ${f(M.T0, 3)} s, both   cycles ${f(t / M.T0, 1)}\npendulums: T ${f(M.periodPendulum(M.IGNORE.L), 3)} s, both   cycles ${f(t / M.periodPendulum(M.IGNORE.L), 1)}`;
      case 'ode': { const a = M.start(0, t), b = M.start(1, t); return `let go: x ${f(a.x)} m   v ${f(a.v)} m/s\npushed: x ${f(b.x)} m   v ${f(b.v)} m/s`; }
      case 'physical': { const r = M.physical(M.ROD, t), p = M.pendulum(t, M.ROD.L, M.ROD.th0); return `rod θ ${f(r.th / M.DEG, 1)}°   T ${f(M.ROD.T, 3)} s\nstring θ ${f(p.th / M.DEG, 1)}°   T ${f(M.periodPendulum(M.ROD.L), 3)} s`; }
      case 'torsion': { const r = M.torsion(t); return `θ ${f(r.th / M.DEG, 1)}°   τ ${f(r.torque, 3)} N·m\nT ${f(M.TORS.T, 3)} s`; }
      case 'life': return `car: T ${f(M.CAR.T, 2)} s   bounces ${f(t / M.CAR.T, 1)}\nswing: T ${f(M.SWING.T, 2)} s   swings ${f(t / M.SWING.T, 1)}`;
    }
    return '';
  },
  onFrame({ t }, sheets) {
    // chart cursors follow the live motion
    const s = M.spring(t), u = (t % (2 * M.T0)) / (2 * M.T0), p = M.pendulum(t);
    const vals = { x0: [u, s.x], Fx: [s.x, s.F], tx: [u, s.x / M.A], tv: [u, s.v / M.VMAX], ta: [u, s.a / M.AMAX], U: [s.x, s.U], K: [s.x, s.KE], th: [Math.abs(p.th) / M.DEG, Math.sin(Math.abs(p.th))],
      st0: [u, M.start(0, t).x], st1: [u, M.start(1, t).x], rodNow: [0, M.physical(M.ROD, t).th / M.DEG], strNow: [0, M.pendulum(t, M.ROD.L, M.ROD.th0).th / M.DEG],
      tq: [M.torsion(t).th / M.DEG, M.torsion(t).torque] };
    for (const el of sheets) el.querySelectorAll('circle[data-cursor]').forEach(c => {
      const k = c.dataset.cursor; if (!vals[k] || !CURSORS[k]) return;
      const [cx, cy] = CURSORS[k](...vals[k]); c.setAttribute('cx', cx); c.setAttribute('cy', cy);
    });
    // series drawn over the last few seconds, redrawn as time runs
    for (const el of sheets) el.querySelectorAll('path[data-live]').forEach(p => { const fn = LIVE[p.dataset.live]; if (fn) p.setAttribute('d', fn(t)); });
  },
});
