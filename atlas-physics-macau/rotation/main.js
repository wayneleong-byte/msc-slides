// Chapter 7: rotation, on the shared book.
import { startBook } from '../engine/book.js';
import { buildWorld } from './world.js';
import { PAGES, PLATES, CH } from './pages.js';
import * as M from './model.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const dg = r => (r * 180 / Math.PI).toFixed(1);

startBook({
  no: 7, PAGES, PLATES, clock0: 0,
  lookKeys: [],
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: s => W.update(s), labels: W.labels };
  },
  state: (clock, reduced) => {
    const c = reduced ? 1.5 / M.SLOW : clock;
    return { clock: c, wheel: M.loop(c, M.WHEEL.run), disc: M.loop(c, M.DISC.run), doors: M.loop(c, M.DOOR.run), inertia: M.loop(c, M.SHAPES.run), race: M.loop(c, M.RACE.run), well: M.loop(c, M.WELL.run), skater: M.loop(c, M.SKATE.run),
      integ: { t: c * M.SLOW }, parallel: M.loop(c, M.PAX.run), wrench: M.loop(c, M.WRENCH.run), slip: M.loop(c, M.BOWL.run), impulse: M.loop(c, M.IMP.run), particle: M.loop(c, M.HIT.run) };
  },
  readout(s, page) {
    switch (page.scene) {
      case 'wheel': { const q = M.wheel(s.wheel.t); return `t ${f(s.wheel.t)} s   θ ${f(q.th)} rad\nω ${f(q.w)} rad/s   α ${f(q.a)} rad/s²`; }
      case 'disc': { const q = M.disc(s.disc.t); return `ω ${f(q.w)} rad/s   α ${f(q.a)} rad/s²\nv₁ ${f(M.DISC.r1 * q.w)} m/s   v₂ ${f(M.DISC.r2 * q.w)} m/s`; }
      case 'doors': return M.DOOR.cases.map(c => `τ ${f(c.tau)} N·m   θ ${dg(M.door(c, s.doors.t).th).padStart(4)}°`).join('\n');
      case 'plank': { const q = M.plank(M.crateX(s.clock * M.SLOW)); return `crate at x ${f(q.x)} m\nF_A ${f(q.FA, 1)} N   F_B ${f(q.FB, 1)} N   Στ 0`; }
      case 'ladder': { const th = M.ladderAngle(s.clock * M.SLOW), q = M.ladder(th); return `θ ${dg(th)}°   F_w ${f(q.Fw, 1)} N\nfriction ${f(q.f, 1)} N of ${f(q.fMax, 1)} N available`; }
      case 'inertia': return M.SHAPES.list.map(sh => `${sh.key.padEnd(6)} ω ${f(M.shapeSpin(sh, s.inertia.t).w)} rad/s`).join('\n');
      case 'race': return `t ${f(s.race.t)} s\n` + M.RACE.list.map(o => `${o.key} ${f(M.race(o, s.race.t).v, 1)}`).join('   ') + ' m/s';
      case 'well': { const q = M.well(s.well.t); return `t ${f(s.well.t)} s   v ${f(q.v)} m/s\na ${f(M.WELL.a)} m/s²   T ${f(M.WELL.T)} N`; }
      case 'skater': { const q = M.skater(s.skater.t); return `I ${f(q.I)} kg·m²   ω ${f(q.w)} rad/s\nL ${f(q.L)} kg·m²/s   K ${f(q.K)} J`; }
      case 'integ': { const k = M.sliceAt(s.integ.t), x = M.ROD.L * (k + 0.5) / M.ROD.N; return `slice ${k + 1} of ${M.ROD.N}: dm = ${f(M.ROD.M / M.ROD.N, 3)} kg\nend rod r ${f(x)} m   r²dm ${f(M.ROD.M / M.ROD.N * x * x, 4)} kg·m²`; }
      case 'parallel': return M.PAX.list.map(p => `${p.key.padEnd(6)} I ${f(p.I)}   ω ${f(M.paxSpin(p, s.parallel.t).w)} rad/s`).join('\n');
      case 'wrench': { const q = M.wrench(s.wrench.t); return `τ ${f(M.WRENCH.tau, 0)} N·m   Δθ ${f(q.th)} rad\nW ${f(q.W, 1)} J   P ${f(q.P, 0)} W`; }
      case 'slip': { const q = M.bowl(s.slip.t); return `t ${f(s.slip.t)} s   ${q.slip ? 'sliding' : 'rolling'}\nv ${f(q.v)} m/s   Rω ${f(M.BOWL.R * q.w)} m/s`; }
      case 'impulse': return M.IMP.list.map(p => { const q = M.imp(p, s.impulse.t); return `${p.key}: τ ${f(q.tau, 0).padStart(3)} N·m   L ${f(q.L, 0).padStart(3)} kg·m²/s`; }).join('\n');
      case 'particle': { const q = M.hit(s.particle.t); return `L ball ${f(q.Lb)}   rod ${f(q.Lr)}\ntotal ${f(q.L)} kg·m²/s`; }
    }
    return '';
  },
  onFrame(s, sheets) {
    // chart cursors follow the live scenes
    const put = (key, x, y) => { for (const el of sheets) el.querySelectorAll(`circle[data-cursor="${key}"]`).forEach(c => { c.setAttribute('cx', x); c.setAttribute('cy', y); }); };
    const w = M.wheel(s.wheel.t); put('wheelW', CH.sx(s.wheel.t, 0, 4.8), CH.sy(w.w, 0, 4));
    const d = M.disc(s.disc.t); put('disc1', CH.sx(s.disc.t, 0, 5), CH.sy(M.DISC.r1 * d.w, 0, 2.5)); put('disc2', CH.sx(s.disc.t, 0, 5), CH.sy(M.DISC.r2 * d.w, 0, 2.5));
    const p = M.plank(M.crateX(s.clock * M.SLOW)); put('plankA', CH.sx(p.x, 0, 4), CH.sy(p.FA, 0, 400)); put('plankB', CH.sx(p.x, 0, 4), CH.sy(p.FB, 0, 400));
    const th = M.ladderAngle(s.clock * M.SLOW); put('ladder', CH.sx(th * 180 / Math.PI, 40, 85), CH.sy(M.ladder(th).f, 0, 120));
    M.SHAPES.list.forEach((sh, i) => put(`sh${i}`, CH.sx(s.inertia.t, 0, 2.4), CH.sy(M.shapeSpin(sh, s.inertia.t).w, 0, 8)));
    put('well', CH.sx(s.well.t, 0, 1.2), CH.sy(M.well(s.well.t).v, 0, 8));
    { const k = M.sliceAt(s.integ.t), x = M.ROD.L * (k + 0.5) / M.ROD.N, x2 = Math.abs(x - M.ROD.L / 2); put('integE', CH.sx(x, 0, 1.2), CH.sy(M.ROD.lam * x * x, 0, 1.8)); put('integC', CH.sx(x2, 0, 1.2), CH.sy(M.ROD.lam * x2 * x2, 0, 1.8)); }
    M.PAX.list.forEach((p, i) => put(`pax${i}`, CH.sx(s.parallel.t, 0, 2.4), CH.sy(M.paxSpin(p, s.parallel.t).w, 0, 4.5)));
    put('wrench', CH.sx(M.wrench(s.wrench.t).th, 0, 2.2), CH.sy(M.wrench(s.wrench.t).W, 0, 45));
    { const q = M.bowl(s.slip.t); put('slipV', CH.sx(s.slip.t, 0, 1.1), CH.sy(q.v, 0, 2.6)); put('slipW', CH.sx(s.slip.t, 0, 1.1), CH.sy(M.BOWL.R * q.w, 0, 2.6)); }
    M.IMP.list.forEach((p, i) => { const q = M.imp(p, s.impulse.t); put(`impT${i}`, CH.sx(s.impulse.t, 0, 3), CH.sy(q.tau, 0, 300)); put(`impL${i}`, CH.sx(s.impulse.t, 0, 3), CH.sy(q.L, 0, 160)); });
    { const q = M.hit(s.particle.t), x = CH.sx(s.particle.t, 0, 2.1); put('hitB', x, CH.sy(q.Lb, -0.4, 1.4)); put('hitR', x, CH.sy(q.Lr, -0.4, 1.4)); put('hitL', x, CH.sy(q.L, -0.4, 1.4)); }
    put('skater', CH.sx(s.skater.t, 0, +M.SKATE.run.toFixed(1)), CH.sy(M.skater(s.skater.t).w, 0, 5));
  },
});
