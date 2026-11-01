// Chapter 5: momentum and impulse, on the shared book.
import { startBook } from '../engine/book.js';
import { buildWorld } from './world.js';
import { PAGES, PLATES, CH, COLL_T } from './pages.js';
import * as M from './model.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);

startBook({
  no: 5, PAGES, PLATES, clock0: 0,
  lookKeys: [],
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: (s) => W.update(s), labels: W.labels };
  },
  state: (clock, reduced) => {
    const c = reduced ? 1.6 / M.SLOW : clock;
    return {
      clock: c,
      mom: M.loop(c, M.MOM_T), wall: M.loop(c, M.WALL.run, M.SLOW_HIT), eggs: M.loop(c, M.EGG.run, M.SLOW_HIT),
      stick: M.loop(c, M.STICK.run), bounce: M.loop(c, M.BOUNCE.run), burst: M.loop(c, M.BURST.run),
      pend: M.loop(c, M.PEND.run), crash: M.loop(c, M.CRASH.run), shell: M.loop(c, M.SHELL.run),
      sweep: M.loop(c, M.SWEEP, 1),
    };
  },
  readout(s, page) {
    switch (page.scene) {
      case 'mom': return `ball p = ${f(M.BALL.m, 1)} × ${f(M.BALL.v, 1)} = ${f(M.p(M.BALL.m, M.BALL.v))} kg·m/s\ncart p = ${f(M.CART.m, 1)} × ${f(M.CART.v, 1)} = ${f(M.p(M.CART.m, M.CART.v))} kg·m/s`;
      case 'wall': { const w = M.wall(s.wall.t); return `t ${f(s.wall.t, 3)} s   F ${f(Math.abs(w.F), 1)} N\nv ${f(w.v)} m/s   p ${f(w.p)} kg·m/s`; }
      case 'eggs': { const a = M.egg(s.eggs.t, M.EGG.tauSoft), b = M.egg(s.eggs.t, M.EGG.tauHard); return `pillow: v ${f(a.v)} m/s   F_net ${f(a.Fnet)} N\nfloor: v ${f(b.v)} m/s   F_net ${f(b.Fnet)} N`; }
      case 'stick': case 'bounce': case 'burst': { const c = { stick: M.STICK, bounce: M.BOUNCE, burst: M.BURST }[page.scene], r = M.track(c, s[page.scene].t);
        return `p₁ ${f(r.p1, 1)}   p₂ ${f(r.p2, 1)}   P ${f(r.P, 1)} kg·m/s\nKE ${f(r.K)} J`; }
      case 'pend': { const q = M.pend(s.pend.t); return q.stuck ? `θ ${(q.th * 180 / Math.PI).toFixed(1)}°   KE ${f(q.K)} J   Ug ${f(q.U)} J\nKE + Ug = ${f(q.K + q.U)} J` : `clay: v ${f(M.PEND.u, 1)} m/s   p ${f(M.PEND.m * M.PEND.u)} kg·m/s\nKE ${f(q.K)} J`; }
      case 'crash': { const q = M.crash(s.crash.t), C = M.CRASH; return q.after ? `together: v′ ${f(C.v)} m/s at ${C.angle.toFixed(1)}°\nP ${Math.round(C.P)} kg·m/s` : `car ${f(C.v1, 0)} m/s east   truck ${f(C.v2, 0)} m/s north\nP ${Math.round(C.P)} kg·m/s`; }
      case 'shell': { const q = M.shell(s.shell.t); return `t ${f(s.shell.t)} s   x_cm ${f(q.cm[0])} m\n${q.burst ? `halves at ${f(q.a[0])} m and ${f(q.b[0])} m` : 'in one piece'}`; }
      case 'rods': { const x = M.ROD.L * Math.min(s.sweep.t / M.SWEEP, 1), q = M.rodPiece('N', 0, x);
        return `slice at x ${f(x)} m   λ ${f(M.lam('N', x))} kg/m\n∫₀ˣ dm ${f(q.dm)} kg   ∫₀ˣ x dm ${f(q.mx)} kg·m`; }
      case 'plates': { const k = Math.min(s.sweep.t / M.SWEEP, 1), u1 = k * M.TRI.h, u2 = k * M.SEMI.R;
        return `triangle strip: u ${f(u1)} m   w ${f(M.triW(u1))} m\nsemicircle strip: u ${f(u2)} m   w ${f(M.semiW(u2))} m`; }
      case 'parts': return `L: centre of mass (${f(M.ELL.cm[0])}, ${f(M.ELL.cm[1])}) m, in the gap\nholed plate: (${f(M.HOLE.cm[0], 3)}, ${f(M.HOLE.cm[1], 3)}) m`;
    }
    return '';
  },
  onFrame(s, sheets) {
    const put = (key, x, y) => { for (const el of sheets) el.querySelectorAll(`circle[data-cursor="${key}"]`).forEach(c => { c.setAttribute('cx', x); c.setAttribute('cy', y); }); };
    const tw = Math.min(Math.max(s.wall.t, 0.15), 0.35);
    put('wall', CH.sx(tw, 0.15, 0.35), CH.sy(-M.wall(tw).F, 0, 50));
    const te = Math.min(Math.max(s.eggs.t - M.EGG.tf, 0), 0.2);
    put('eggS', CH.sx(te, 0, 0.2), CH.sy(M.pulse(te, M.EGG.J, M.EGG.tauSoft, M.EGG.m).F, 0, 8));
    put('eggH', CH.sx(te, 0, 0.2), CH.sy(M.pulse(te, M.EGG.J, M.EGG.tauHard, M.EGG.m).F, 0, 8));
    for (const [key, c] of [['stick', M.STICK], ['bounce', M.BOUNCE], ['burst', M.BURST]]) put(key, CH.sx(s[key].t, 0, c.run), CH.sy(M.track(c, s[key].t).P, COLL_T.y0, COLL_T.y1));
    const tp = Math.min(Math.max(s.pend.t - M.PEND.lead, 0), 2.4), q = M.pend(M.PEND.lead + tp);
    put('pendK', CH.sx(tp, 0, 2.4), CH.sy(q.K, 0, 2)); put('pendU', CH.sx(tp, 0, 2.4), CH.sy(q.U, 0, 2));
    const sc = M.shell(s.shell.t).cm;
    put('shell', CH.sx(sc[0], 0, 14), CH.sy(sc[1], 0, 5));
    const xr = M.ROD.L * Math.min(s.sweep.t / M.SWEEP, 1);
    put('rodL', CH.sx(xr, 0, M.ROD.L), CH.sy(M.lam('N', xr), 0, 3)); put('rodM', CH.sx(xr, 0, M.ROD.L), CH.sy(xr * M.lam('N', xr), 0, 3));
  },
});
