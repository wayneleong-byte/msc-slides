/*! EcoWeb procedural savanna backdrop — day/night, season, wind, weather.
   Canvas behind #webSvg; pointer-events none. Pauses when document.hidden. */
(() => {
  "use strict";

  const TARGET_FPS = 24;
  const FRAME_MS = 1000 / TARGET_FPS;
  const DAY_CYCLE_MS = 140000; // ~2.3 min teaching-slow day/night
  const SEASON_CYCLE_MS = 210000;
  const WEATHER_HOLD_MS = 48000;
  const WEATHER_FADE_MS = 9000;

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

  // Day phases: night → dawn → day → dusk → night (phase 0..1)
  const SKY = {
    night: [28, 36, 62],
    dawn: [214, 148, 110],
    day: [186, 214, 232],
    noon: [168, 204, 228],
    dusk: [232, 150, 98],
  };
  const GRASS = {
    night: [58, 72, 48],
    dawn: [168, 148, 88],
    dayWet: [154, 168, 86],
    dayDry: [198, 168, 96],
    dusk: [148, 118, 68],
  };

  function phaseColors(phase, seasonT) {
    // phase: 0 night, 0.2 dawn, 0.45 day, 0.75 dusk, 1 night
    let sky, grassBase;
    if (phase < 0.18) {
      const t = smoothstep(phase / 0.18);
      sky = mixRgb(SKY.night, SKY.dawn, t);
      grassBase = mixRgb(GRASS.night, GRASS.dawn, t);
    } else if (phase < 0.32) {
      const t = smoothstep((phase - 0.18) / 0.14);
      sky = mixRgb(SKY.dawn, SKY.day, t);
      grassBase = mixRgb(GRASS.dawn, mixRgb(GRASS.dayDry, GRASS.dayWet, seasonT), t);
    } else if (phase < 0.58) {
      const t = smoothstep((phase - 0.32) / 0.26);
      sky = mixRgb(SKY.day, SKY.noon, t * 0.55);
      grassBase = mixRgb(GRASS.dayDry, GRASS.dayWet, seasonT);
    } else if (phase < 0.72) {
      const t = smoothstep((phase - 0.58) / 0.14);
      sky = mixRgb(SKY.noon, SKY.dusk, t);
      grassBase = mixRgb(mixRgb(GRASS.dayDry, GRASS.dayWet, seasonT), GRASS.dusk, t);
    } else {
      const t = smoothstep((phase - 0.72) / 0.28);
      sky = mixRgb(SKY.dusk, SKY.night, t);
      grassBase = mixRgb(GRASS.dusk, GRASS.night, t);
    }
    // dry season (seasonT→0) warmer/yellower; wet (→1) greener
    const dryPush = 1 - seasonT;
    grassBase = [
      clamp(grassBase[0] + dryPush * 18, 0, 255),
      clamp(grassBase[1] - dryPush * 8, 0, 255),
      clamp(grassBase[2] - dryPush * 12, 0, 255),
    ];
    return { sky, grass: grassBase };
  }

  function sunPos(phase, w, h) {
    // arc across sky during day
    const day = clamp((phase - 0.15) / 0.6, 0, 1);
    const ang = Math.PI * (0.05 + day * 0.9);
    return {
      x: w * (0.12 + day * 0.76),
      y: h * (0.42 - Math.sin(ang) * 0.32),
      r: lerp(14, 22, Math.sin(ang)),
      visible: phase > 0.12 && phase < 0.78,
      moon: phase < 0.12 || phase > 0.78,
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
      this.weatherIndex = 0;
      this.weatherStart = this.t0;
      this._ro = null;
      this._raf = 0;
      this._onVis = () => this._syncVisibility();
    }

    mount() {
      this.resize();
      this._seed();
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
      this.clouds = Array.from({ length: 7 }, (_, i) => ({
        x: rnd(-0.2, 1.2) * w,
        y: rnd(0.06, 0.34) * h,
        s: rnd(0.55, 1.35),
        speed: rnd(0.008, 0.022),
        opacity: rnd(0.25, 0.55),
      }));
      this.trees = Array.from({ length: 9 }, (_, i) => ({
        x: (i / 8) * w + rnd(-18, 18),
        baseY: h * 0.52 + rnd(-8, 14),
        scale: rnd(0.55, 1.15),
        lean: rnd(-0.08, 0.08),
      }));
      // sparse grass tufts across lower band
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

    _weatherWeights(now) {
      const elapsed = now - this.weatherStart;
      if (elapsed > WEATHER_HOLD_MS + WEATHER_FADE_MS) {
        this.weatherStart = now;
        this.weatherIndex = (this.weatherIndex + 1) % WEATHERS.length;
      }
      const e = now - this.weatherStart;
      const cur = WEATHERS[this.weatherIndex];
      const next = WEATHERS[(this.weatherIndex + 1) % WEATHERS.length];
      if (e < WEATHER_HOLD_MS) return { cur, next, t: 0 };
      const t = smoothstep((e - WEATHER_HOLD_MS) / WEATHER_FADE_MS);
      return { cur, next, t };
    }

    _weatherAmount(name, mix) {
      // mix: {cur, next, t}
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
      const seasonT = 0.5 + 0.5 * Math.sin((elapsed / SEASON_CYCLE_MS) * Math.PI * 2);
      const windPulse = 0.55 + 0.45 * Math.sin(elapsed * 0.00035);
      this.wind += 0.35 * windPulse; // cumulative drift units

      const { sky, grass } = phaseColors(dayPhase, seasonT);
      const weather = this._weatherWeights(now);
      const cloudAmt = clamp(
        this._weatherAmount("clouds", weather) +
          this._weatherAmount("haze", weather) * 0.45 +
          this._weatherAmount("rain", weather) * 0.7 +
          this._weatherAmount("dust", weather) * 0.25 +
          0.15,
        0,
        1
      );
      const dustAmt = this._weatherAmount("dust", weather);
      const rainAmt = this._weatherAmount("rain", weather);
      const hazeAmt = this._weatherAmount("haze", weather) + dustAmt * 0.35;

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
        ctx.fillStyle = dayPhase > 0.6 ? "rgba(255,180,110,0.95)" : "rgba(255,240,200,0.95)";
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
        // soft stars
        ctx.fillStyle = "rgba(240,245,255,0.35)";
        for (let i = 0; i < 18; i++) {
          const sx = ((i * 97) % w);
          const sy = ((i * 53) % Math.floor(h * 0.4));
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }
      }

      // clouds
      for (const c of this.clouds) {
        c.x += c.speed * windPulse * 18 * (0.6 + cloudAmt);
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

      // tree silhouettes
      const treeColor = rgb(
        mixRgb(
          [48, 58, 36],
          [32, 38, 28],
          dayPhase < 0.2 || dayPhase > 0.75 ? 0.7 : 0.25
        ),
        0.72
      );
      for (const tr of this.trees) {
        this._drawAcacia(ctx, tr.x, tr.baseY, tr.scale, tr.lean + Math.sin(this.wind * 0.04 + tr.x) * 0.015, treeColor);
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

      // swaying blades
      ctx.strokeStyle = rgb(
        [clamp(grass[0] - 40, 0, 255), clamp(grass[1] - 10, 0, 255), clamp(grass[2] - 30, 0, 255)],
        0.45
      );
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      for (const blade of this.grass) {
        const sway = Math.sin(this.wind * 0.08 + blade.phase) * blade.amp * windPulse;
        ctx.beginPath();
        ctx.moveTo(blade.x, blade.y);
        ctx.quadraticCurveTo(blade.x + sway * 0.6, blade.y - blade.h * 0.55, blade.x + sway, blade.y - blade.h);
        ctx.stroke();
      }

      // dust particles
      if (dustAmt > 0.02) {
        ctx.fillStyle = `rgba(210,180,120,${0.22 * dustAmt})`;
        for (const d of this.dust) {
          d.x += d.vx * windPulse * (1.2 + dustAmt);
          d.y += d.vy;
          if (d.x > w) d.x = 0;
          if (d.y < h * 0.3 || d.y > h) d.y = h * 0.35 + Math.random() * h * 0.55;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
        // dust veil
        ctx.fillStyle = `rgba(200,170,110,${0.08 * dustAmt})`;
        ctx.fillRect(0, 0, w, h);
      }

      // light rain
      if (rainAmt > 0.02) {
        ctx.strokeStyle = `rgba(210,220,230,${0.28 * rainAmt})`;
        ctx.lineWidth = 1;
        for (const drop of this.rain) {
          drop.y += drop.spd * (0.8 + rainAmt);
          drop.x += 0.35 * windPulse;
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

      // haze / readability veil (keeps nodes readable)
      const veil = 0.10 + hazeAmt * 0.06 + (dayPhase < 0.15 || dayPhase > 0.8 ? 0.06 : 0);
      ctx.fillStyle = `rgba(232, 220, 196, ${veil})`;
      ctx.fillRect(0, 0, w, h);

      // soft vignette
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
      // trunk
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(3, 0);
      ctx.lineTo(2, -42);
      ctx.lineTo(-2, -42);
      ctx.closePath();
      ctx.fill();
      // flat canopy
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
