/*! EcoWeb procedural savanna backdrop.
   教學示意：東非稀樹草原乾雨季／日夜，非精確氣候模擬。
   Canvas behind #webSvg; pointer-events none. Pauses when document.hidden. ~24fps. */
(() => {
  "use strict";

  const TARGET_FPS = 24;
  const FRAME_MS = 1000 / TARGET_FPS;
  // Equatorial teaching day ≈ 12h light / 12h dark (compressed cycle)
  const DAY_CYCLE_MS = 144000; // ~2.4 min full day/night
  // Dry ↔ wet alternate slowly (two-state emphasis, not temperate 4 seasons)
  const SEASON_CYCLE_MS = 240000;
  const WEATHER_HOLD_MS = 52000;
  const WEATHER_FADE_MS = 10000;

  // Weather ids used in mix weights (season-biased, not equal cycle)
  const WEATHERS = ["clear", "haze", "clouds", "dust", "rain"];

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function smoothstep(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function mixRgb(c1, c2, t) {
    return [
      Math.round(lerp(c1[0], c2[0], t)),
      Math.round(lerp(c1[1], c2[1], t)),
      Math.round(lerp(c1[2], c2[2], t)),
    ];
  }
  function rgb(c, a) {
    return a == null ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  }
  function pickWeighted(items, weights, rnd) {
    let sum = 0;
    for (const w of weights) sum += w;
    let r = rnd * sum;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  // Day phases tuned for ~equal day/night near equator (teaching)
  const SKY = {
    night: [22, 30, 52],
    dawn: [214, 148, 110],
    day: [186, 214, 232],
    noon: [160, 200, 228], // dry clearer; wet will tint via haze/cloud
    dusk: [232, 150, 98],
  };
  const GRASS = {
    night: [58, 72, 48],
    dawn: [168, 148, 88],
    dayWet: [142, 166, 78], // greener in rains
    dayDry: [198, 168, 96], // yellow-brown dry season
    dusk: [148, 118, 68],
  };

  /** seasonT: 0 = dry, 1 = wet (slow sine, held toward extremes) */
  function seasonFactor(elapsed) {
    const raw = 0.5 + 0.5 * Math.sin((elapsed / SEASON_CYCLE_MS) * Math.PI * 2);
    // Push toward dry/wet poles so mid-season is shorter (two-state feel)
    return smoothstep(raw);
  }

  function phaseColors(phase, seasonT) {
    // phase: ~0–0.22 night, dawn, day(~12h), dusk, night — equatorial split
    let sky, grassBase;
    if (phase < 0.2) {
      const t = smoothstep(phase / 0.2);
      sky = mixRgb(SKY.night, SKY.dawn, t);
      grassBase = mixRgb(GRASS.night, GRASS.dawn, t);
    } else if (phase < 0.3) {
      const t = smoothstep((phase - 0.2) / 0.1);
      sky = mixRgb(SKY.dawn, SKY.day, t);
      grassBase = mixRgb(GRASS.dawn, mixRgb(GRASS.dayDry, GRASS.dayWet, seasonT), t);
    } else if (phase < 0.62) {
      // midday: dry = clearer/warmer sky; wet = slightly cooler/greyer via season
      const t = smoothstep((phase - 0.3) / 0.32);
      const noonSky = mixRgb(SKY.day, SKY.noon, 0.5 + (1 - seasonT) * 0.25);
      sky = mixRgb(SKY.day, noonSky, t * 0.7);
      // wet season sky a touch greyer/bluer
      if (seasonT > 0.5) {
        sky = mixRgb(sky, [150, 175, 200], (seasonT - 0.5) * 0.35);
      }
      grassBase = mixRgb(GRASS.dayDry, GRASS.dayWet, seasonT);
    } else if (phase < 0.74) {
      const t = smoothstep((phase - 0.62) / 0.12);
      sky = mixRgb(SKY.noon, SKY.dusk, t);
      grassBase = mixRgb(mixRgb(GRASS.dayDry, GRASS.dayWet, seasonT), GRASS.dusk, t);
    } else {
      const t = smoothstep((phase - 0.74) / 0.26);
      sky = mixRgb(SKY.dusk, SKY.night, t);
      grassBase = mixRgb(GRASS.dusk, GRASS.night, t);
    }
    // dry season: yellower/browner grass, clearer warm cast
    const dryPush = 1 - seasonT;
    grassBase = [
      clamp(grassBase[0] + dryPush * 22, 0, 255),
      clamp(grassBase[1] - dryPush * 10, 0, 255),
      clamp(grassBase[2] - dryPush * 16, 0, 255),
    ];
    return { sky, grass: grassBase };
  }

  function sunPos(phase, w, h) {
    // Visible ~half cycle (equatorial day); arc peaks near zenith at midday
    const day = clamp((phase - 0.18) / 0.56, 0, 1);
    const ang = Math.PI * (0.08 + day * 0.84);
    return {
      x: w * (0.1 + day * 0.8),
      y: h * (0.4 - Math.sin(ang) * 0.34),
      r: lerp(14, 22, Math.sin(ang)),
      visible: phase > 0.16 && phase < 0.76,
      moon: phase < 0.16 || phase > 0.76,
    };
  }

  /** Dry: clear / heat-haze / dust dominate; Wet: cumulus / convective rain */
  function weatherWeightsForSeason(seasonT) {
    // seasonT 0 dry → 1 wet
    const dry = 1 - seasonT;
    const wet = seasonT;
    return {
      clear: 0.12 + dry * 0.42, // dry clear skies common
      haze: 0.08 + dry * 0.28, // heat haze / dry haze
      dust: 0.02 + dry * 0.22, // dusty wind in dry season
      clouds: 0.1 + wet * 0.38, // cumulus in wet
      rain: 0.02 + wet * 0.32, // convective showers mainly wet
    };
  }

  class EnvBg {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.w = 0;
      this.h = 0;
      this.dpr = 1;
      this.running = false;
      this.lastDraw = 0;
      this.t0 = performance.now();
      this.wind = 0;
      this.clouds = [];
      this.grass = [];
      this.trees = [];
      this.dust = [];
      this.rain = [];
      this.curWeather = "clear";
      this.nextWeather = "haze";
      this.weatherStart = this.t0;
      this._seasonAtPick = 0;
      this._ro = null;
      this._raf = 0;
      this._onVis = () => this._syncVisibility();
    }

    mount() {
      this.resize();
      this._seed();
      this._pickNextWeather(seasonFactor(0));
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(this.canvas.parentElement || this.canvas);
      document.addEventListener("visibilitychange", this._onVis);
      this.running = !document.hidden;
      this._loop(performance.now());
    }

    destroy() {
      this.running = false;
      cancelAnimationFrame(this._raf);
      document.removeEventListener("visibilitychange", this._onVis);
      if (this._ro) this._ro.disconnect();
    }

    _syncVisibility() {
      if (document.hidden) {
        this.running = false;
        cancelAnimationFrame(this._raf);
      } else {
        this.running = true;
        this.lastDraw = 0;
        this._loop(performance.now());
      }
    }

    resize() {
      const parent = this.canvas.parentElement || this.canvas;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      if (w === this.w && h === this.h && dpr === this.dpr) return;
      this.w = w;
      this.h = h;
      this.dpr = dpr;
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.canvas.style.width = w + "px";
      this.canvas.style.height = h + "px";
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._seed();
    }

    _seed() {
      const w = this.w;
      const h = this.h;
      const rnd = (a, b) => a + Math.random() * (b - a);
      // Cumulus-like soft piles (wet) / thinner scraps (dry opacity handles look)
      this.clouds = Array.from({ length: 7 }, () => ({
        x: rnd(-0.2, 1.2) * w,
        y: rnd(0.06, 0.34) * h,
        s: rnd(0.55, 1.35),
        speed: rnd(0.006, 0.018),
        opacity: rnd(0.25, 0.55),
      }));
      // Acacia flat-canopy silhouettes only (savanna, not temperate forest)
      this.trees = Array.from({ length: 9 }, (_, i) => ({
        x: (i / 8) * w + rnd(-18, 18),
        baseY: h * 0.52 + rnd(-8, 14),
        scale: rnd(0.55, 1.15),
        lean: rnd(-0.08, 0.08),
      }));
      const nGrass = Math.min(90, Math.floor(w / 10));
      this.grass = Array.from({ length: nGrass }, () => ({
        x: rnd(0, w),
        y: rnd(h * 0.58, h * 0.96),
        h: rnd(8, 22),
        phase: rnd(0, Math.PI * 2),
        amp: rnd(2.5, 6.5),
      }));
      this.dust = Array.from({ length: 40 }, () => ({
        x: rnd(0, w),
        y: rnd(h * 0.35, h * 0.9),
        r: rnd(0.8, 2.4),
        vx: rnd(0.15, 0.55),
        vy: rnd(-0.05, 0.08),
      }));
      this.rain = Array.from({ length: 55 }, () => ({
        x: rnd(0, w),
        y: rnd(0, h),
        len: rnd(8, 16),
        spd: rnd(3.2, 5.5),
      }));
    }

    _pickNextWeather(seasonT) {
      const wmap = weatherWeightsForSeason(seasonT);
      const names = WEATHERS.slice();
      const weights = names.map((n) => wmap[n]);
      // Prefer not repeating current immediately when alternatives exist
      let next = pickWeighted(names, weights, Math.random());
      if (next === this.curWeather && Math.random() < 0.65) {
        const altW = weights.map((w, i) => (names[i] === this.curWeather ? w * 0.15 : w));
        next = pickWeighted(names, altW, Math.random());
      }
      this.nextWeather = next;
      this._seasonAtPick = seasonT;
    }

    _weatherMix(now, seasonT) {
      const elapsed = now - this.weatherStart;
      if (elapsed > WEATHER_HOLD_MS + WEATHER_FADE_MS) {
        this.curWeather = this.nextWeather;
        this.weatherStart = now;
        this._pickNextWeather(seasonT);
      }
      const e = now - this.weatherStart;
      const cur = this.curWeather;
      const next = this.nextWeather;
      if (e < WEATHER_HOLD_MS) return { cur, next, t: 0 };
      const t = smoothstep((e - WEATHER_HOLD_MS) / WEATHER_FADE_MS);
      return { cur, next, t };
    }

    _weatherAmount(name, mix) {
      const a = name === mix.cur ? 1 - mix.t : name === mix.next ? mix.t : 0;
      return a;
    }

    _loop(now) {
      if (!this.running) return;
      this._raf = requestAnimationFrame((t) => this._loop(t));
      if (now - this.lastDraw < FRAME_MS) return;
      this.lastDraw = now;
      this.draw(now);
    }

    draw(now) {
      const ctx = this.ctx;
      const w = this.w;
      const h = this.h;
      if (w < 2 || h < 2) return;

      const elapsed = now - this.t0;
      const dayPhase = (elapsed % DAY_CYCLE_MS) / DAY_CYCLE_MS;
      const seasonT = seasonFactor(elapsed);
      // Mild wind; slightly stronger in dry (dusty) season
      const windPulse = 0.5 + 0.35 * Math.sin(elapsed * 0.00035) + (1 - seasonT) * 0.12;
      this.wind += 0.28 * windPulse;

      const { sky, grass } = phaseColors(dayPhase, seasonT);
      const weather = this._weatherMix(now, seasonT);
      const cloudAmt = clamp(
        this._weatherAmount("clouds", weather) +
          this._weatherAmount("haze", weather) * 0.35 +
          this._weatherAmount("rain", weather) * 0.75 +
          this._weatherAmount("dust", weather) * 0.2 +
          0.08 +
          seasonT * 0.08,
        0,
        1
      );
      const dustAmt = this._weatherAmount("dust", weather);
      const rainAmt = this._weatherAmount("rain", weather);
      const hazeAmt = this._weatherAmount("haze", weather) + dustAmt * 0.4;

      // --- sky ---
      const gSky = ctx.createLinearGradient(0, 0, 0, h * 0.58);
      const skyTop = mixRgb(sky, [sky[0] - 20, sky[1] - 10, sky[2] + 10], 0.25);
      gSky.addColorStop(0, rgb(skyTop));
      gSky.addColorStop(1, rgb(sky));
      ctx.fillStyle = gSky;
      ctx.fillRect(0, 0, w, h);

      // sun / moon
      const sun = sunPos(dayPhase, w, h);
      if (sun.visible) {
        const glow = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, sun.r * 4.5);
        glow.addColorStop(0, "rgba(255,230,160,0.55)");
        glow.addColorStop(0.35, "rgba(255,200,120,0.18)");
        glow.addColorStop(1, "rgba(255,200,120,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sun.x, sun.y, sun.r * 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = dayPhase > 0.58 ? "rgba(255,180,110,0.95)" : "rgba(255,240,200,0.95)";
        ctx.beginPath();
        ctx.arc(sun.x, sun.y, sun.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (sun.moon) {
        const mx = w * 0.78;
        const my = h * 0.16;
        ctx.fillStyle = "rgba(230,235,245,0.55)";
        ctx.beginPath();
        ctx.arc(mx, my, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(240,245,255,0.35)";
        for (let i = 0; i < 18; i++) {
          const sx = (i * 97) % w;
          const sy = (i * 53) % Math.floor(h * 0.4);
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }
      }

      // clouds (more / denser look when wet via cloudAmt)
      for (const c of this.clouds) {
        c.x += c.speed * windPulse * 16 * (0.55 + cloudAmt);
        if (c.x > w + 120) c.x = -140;
        const alpha = c.opacity * cloudAmt * (dayPhase > 0.15 && dayPhase < 0.8 ? 1 : 0.45);
        this._drawCloud(ctx, c.x, c.y, c.s, alpha);
      }

      // distant hills
      ctx.fillStyle = rgb(
        mixRgb(grass, [clamp(grass[0] - 30, 0, 255), clamp(grass[1] - 20, 0, 255), clamp(grass[2] - 25, 0, 255)], 0.55),
        0.85
      );
      ctx.beginPath();
      ctx.moveTo(0, h * 0.52);
      ctx.quadraticCurveTo(w * 0.25, h * 0.46, w * 0.48, h * 0.51);
      ctx.quadraticCurveTo(w * 0.72, h * 0.56, w, h * 0.49);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // acacia silhouettes
      const treeColor = rgb(
        mixRgb([48, 58, 36], [32, 38, 28], dayPhase < 0.2 || dayPhase > 0.75 ? 0.7 : 0.25),
        0.72
      );
      for (const tr of this.trees) {
        this._drawAcacia(
          ctx,
          tr.x,
          tr.baseY,
          tr.scale,
          tr.lean + Math.sin(this.wind * 0.035 + tr.x) * 0.012,
          treeColor
        );
      }

      // grass field
      const gGrass = ctx.createLinearGradient(0, h * 0.5, 0, h);
      const grassDeep = [
        clamp(grass[0] - 28, 0, 255),
        clamp(grass[1] - 22, 0, 255),
        clamp(grass[2] - 18, 0, 255),
      ];
      gGrass.addColorStop(0, rgb(grass, 0.92));
      gGrass.addColorStop(1, rgb(grassDeep, 1));
      ctx.fillStyle = gGrass;
      ctx.fillRect(0, h * 0.52, w, h * 0.48);

      // swaying blades (gentle)
      ctx.strokeStyle = rgb(
        [clamp(grass[0] - 40, 0, 255), clamp(grass[1] - 10, 0, 255), clamp(grass[2] - 30, 0, 255)],
        0.45
      );
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      for (const blade of this.grass) {
        const sway = Math.sin(this.wind * 0.07 + blade.phase) * blade.amp * windPulse * 0.85;
        ctx.beginPath();
        ctx.moveTo(blade.x, blade.y);
        ctx.quadraticCurveTo(blade.x + sway * 0.6, blade.y - blade.h * 0.55, blade.x + sway, blade.y - blade.h);
        ctx.stroke();
      }

      // dry-season dust / dusty wind
      if (dustAmt > 0.02) {
        ctx.fillStyle = `rgba(210,180,120,${0.22 * dustAmt})`;
        for (const d of this.dust) {
          d.x += d.vx * windPulse * (1.1 + dustAmt);
          d.y += d.vy;
          if (d.x > w) d.x = 0;
          if (d.y < h * 0.3 || d.y > h) d.y = h * 0.35 + Math.random() * h * 0.55;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(200,170,110,${0.08 * dustAmt})`;
        ctx.fillRect(0, 0, w, h);
      }

      // wet-season convective shower
      if (rainAmt > 0.02) {
        ctx.strokeStyle = `rgba(210,220,230,${0.28 * rainAmt})`;
        ctx.lineWidth = 1;
        for (const drop of this.rain) {
          drop.y += drop.spd * (0.8 + rainAmt);
          drop.x += 0.3 * windPulse;
          if (drop.y > h) {
            drop.y = -10;
            drop.x = Math.random() * w;
          }
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 1.2, drop.y + drop.len);
          ctx.stroke();
        }
      }

      // readability veil
      const veil = 0.1 + hazeAmt * 0.06 + (dayPhase < 0.15 || dayPhase > 0.8 ? 0.06 : 0);
      ctx.fillStyle = `rgba(232, 220, 196, ${veil})`;
      ctx.fillRect(0, 0, w, h);

      const vig = ctx.createRadialGradient(w * 0.5, h * 0.45, h * 0.2, w * 0.5, h * 0.5, h * 0.85);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(40,30,15,0.12)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    }

    _drawCloud(ctx, x, y, s, a) {
      if (a < 0.02) return;
      ctx.fillStyle = `rgba(255,252,245,${a})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 38 * s, 16 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 28 * s, y + 4, 22 * s, 12 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 30 * s, y + 2, 24 * s, 13 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 6 * s, y - 10 * s, 20 * s, 14 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawAcacia(ctx, x, y, scale, lean, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(lean);
      ctx.scale(scale, scale);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(3, 0);
      ctx.lineTo(2, -42);
      ctx.lineTo(-2, -42);
      ctx.closePath();
      ctx.fill();
      // flat umbrella canopy (Vachellia / Acacia silhouette)
      ctx.beginPath();
      ctx.ellipse(0, -48, 36, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(-22, -42, 18, 10, -0.2, 0, Math.PI * 2);
      ctx.ellipse(24, -44, 16, 9, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function boot() {
    const canvas = document.getElementById("envBg");
    if (!canvas) return;
    const env = new EnvBg(canvas);
    env.mount();
    window.EcoWebEnvBg = env;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
