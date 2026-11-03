/*! EcoWeb procedural ecosystem backdrop.
   教學示意：日夜／季節／天氣慢漸變，非精確氣候模擬。
   Canvas behind #webSvg; pointer-events none. Pauses when document.hidden. ~24fps.
   Scenes: savanna | temperate_forest | mangrove | freshwater_lake | coral_reef | tropical_rainforest | desert */
(() => {
  "use strict";

  const TARGET_FPS = 24;
  const FRAME_MS = 1000 / TARGET_FPS;
  const DAY_CYCLE_MS = 144000;
  const SEASON_CYCLE_MS = 240000;
  const WEATHER_HOLD_MS = 52000;
  const WEATHER_FADE_MS = 10000;

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

  const SCENES = {
    savanna: {
      weathers: ["clear", "haze", "clouds", "dust", "rain"],
      // equatorial ≈ equal day/night; dry↔wet two-state
      daySplit: "equatorial",
      seasonMode: "dry_wet",
    },
    temperate_forest: {
      weathers: ["clear", "clouds", "overcast", "rain", "snow"],
      daySplit: "temperate",
      seasonMode: "four",
    },
    mangrove: {
      weathers: ["clear", "haze", "clouds", "rain", "storm"],
      daySplit: "tropical",
      seasonMode: "wet_dry_mild",
    },
    freshwater_lake: {
      weathers: ["clear", "haze", "clouds", "rain", "mist"],
      daySplit: "temperate",
      seasonMode: "four",
    },
    coral_reef: {
      weathers: ["clear", "haze", "clouds", "storm"],
      daySplit: "tropical",
      seasonMode: "wet_dry_mild",
    },
    tropical_rainforest: {
      weathers: ["clear", "haze", "clouds", "rain", "storm"],
      daySplit: "equatorial",
      seasonMode: "wet_dry_mild",
    },
    desert: {
      weathers: ["clear", "haze", "dust", "clouds"],
      daySplit: "tropical",
      seasonMode: "dry_wet",
    },
  };

  function seasonFactor(elapsed, mode) {
    const raw = 0.5 + 0.5 * Math.sin((elapsed / SEASON_CYCLE_MS) * Math.PI * 2);
    if (mode === "dry_wet" || mode === "wet_dry_mild") return smoothstep(raw);
    // four seasons: 0 winter → 0.25 spring → 0.5 summer → 0.75 autumn → 1
    return (elapsed / SEASON_CYCLE_MS) % 1;
  }

  function seasonLeafTint(seasonT, mode) {
    // returns {leaf, trunk lean hint} for temperate trees
    if (mode !== "four") {
      return { leaf: [58, 92, 48], litter: [120, 100, 60], snow: 0 };
    }
    // seasonT 0..1 around year
    const ph = seasonT;
    if (ph < 0.2) {
      // winter
      return { leaf: [120, 125, 118], litter: [90, 85, 75], snow: 0.85 };
    }
    if (ph < 0.4) {
      const t = smoothstep((ph - 0.2) / 0.2);
      return {
        leaf: mixRgb([120, 125, 118], [72, 130, 62], t),
        litter: mixRgb([90, 85, 75], [110, 120, 70], t),
        snow: 1 - t,
      };
    }
    if (ph < 0.6) {
      return { leaf: [52, 118, 58], litter: [100, 110, 70], snow: 0 };
    }
    if (ph < 0.8) {
      const t = smoothstep((ph - 0.6) / 0.2);
      return {
        leaf: mixRgb([52, 118, 58], [180, 110, 40], t),
        litter: mixRgb([100, 110, 70], [160, 100, 45], t),
        snow: 0,
      };
    }
    const t = smoothstep((ph - 0.8) / 0.2);
    return {
      leaf: mixRgb([180, 110, 40], [120, 125, 118], t),
      litter: mixRgb([160, 100, 45], [90, 85, 75], t),
      snow: t * 0.5,
    };
  }

  const SKY_EQ = {
    night: [22, 30, 52],
    dawn: [214, 148, 110],
    day: [186, 214, 232],
    noon: [160, 200, 228],
    dusk: [232, 150, 98],
  };
  const SKY_TEMP = {
    night: [18, 24, 42],
    dawn: [200, 150, 130],
    day: [170, 200, 230],
    noon: [150, 185, 220],
    dusk: [210, 130, 100],
  };

  function phaseColorsSavanna(phase, seasonT) {
    const SKY = SKY_EQ;
    const GRASS = {
      night: [58, 72, 48],
      dawn: [168, 148, 88],
      dayWet: [142, 166, 78],
      dayDry: [198, 168, 96],
      dusk: [148, 118, 68],
    };
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
      const t = smoothstep((phase - 0.3) / 0.32);
      const noonSky = mixRgb(SKY.day, SKY.noon, 0.5 + (1 - seasonT) * 0.25);
      sky = mixRgb(SKY.day, noonSky, t * 0.7);
      if (seasonT > 0.5) sky = mixRgb(sky, [150, 175, 200], (seasonT - 0.5) * 0.35);
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
    const dryPush = 1 - seasonT;
    grassBase = [
      clamp(grassBase[0] + dryPush * 22, 0, 255),
      clamp(grassBase[1] - dryPush * 10, 0, 255),
      clamp(grassBase[2] - dryPush * 16, 0, 255),
    ];
    return { sky, ground: grassBase };
  }

  function phaseColorsGeneric(phase, palette) {
    let sky, ground;
    const SKY = palette.sky;
    const GND = palette.ground;
    if (phase < 0.22) {
      const t = smoothstep(phase / 0.22);
      sky = mixRgb(SKY.night, SKY.dawn, t);
      ground = mixRgb(GND.night, GND.dawn, t);
    } else if (phase < 0.32) {
      const t = smoothstep((phase - 0.22) / 0.1);
      sky = mixRgb(SKY.dawn, SKY.day, t);
      ground = mixRgb(GND.dawn, GND.day, t);
    } else if (phase < 0.62) {
      sky = mixRgb(SKY.day, SKY.noon, 0.4);
      ground = GND.day;
    } else if (phase < 0.74) {
      const t = smoothstep((phase - 0.62) / 0.12);
      sky = mixRgb(SKY.noon, SKY.dusk, t);
      ground = mixRgb(GND.day, GND.dusk, t);
    } else {
      const t = smoothstep((phase - 0.74) / 0.26);
      sky = mixRgb(SKY.dusk, SKY.night, t);
      ground = mixRgb(GND.dusk, GND.night, t);
    }
    return { sky, ground };
  }

  function sunPos(phase, w, h) {
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

  function weatherWeights(sceneId, seasonT) {
    if (sceneId === "savanna") {
      const dry = 1 - seasonT;
      const wet = seasonT;
      return {
        clear: 0.12 + dry * 0.42,
        haze: 0.08 + dry * 0.28,
        dust: 0.02 + dry * 0.22,
        clouds: 0.1 + wet * 0.38,
        rain: 0.02 + wet * 0.32,
      };
    }
    if (sceneId === "temperate_forest") {
      // seasonT 0..1 year; winter snow, summer clearer, spring/autumn rain
      const win = seasonT < 0.2 || seasonT > 0.85 ? 1 : 0;
      const sum = seasonT > 0.4 && seasonT < 0.65 ? 1 : 0;
      return {
        clear: 0.15 + sum * 0.35,
        clouds: 0.25,
        overcast: 0.15 + (1 - sum) * 0.15,
        rain: 0.12 + (1 - win - sum) * 0.2,
        snow: 0.02 + win * 0.45,
      };
    }
    if (sceneId === "mangrove") {
      const wet = seasonT;
      return {
        clear: 0.2 + (1 - wet) * 0.25,
        haze: 0.15,
        clouds: 0.2 + wet * 0.2,
        rain: 0.08 + wet * 0.3,
        storm: 0.02 + wet * 0.18,
      };
    }
    if (sceneId === "coral_reef") {
      const wet = seasonT;
      return {
        clear: 0.28 + (1 - wet) * 0.22,
        haze: 0.18,
        clouds: 0.22 + wet * 0.18,
        storm: 0.04 + wet * 0.2,
      };
    }
    // lake
    const win = seasonT < 0.2 || seasonT > 0.85 ? 1 : 0;
    return {
      clear: 0.22,
      haze: 0.12,
      clouds: 0.25,
      rain: 0.15 + (1 - win) * 0.1,
      mist: 0.1 + win * 0.25,
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
      this.sceneId = "savanna";
      this.clouds = [];
      this.grass = [];
      this.trees = [];
      this.dust = [];
      this.rain = [];
      this.waves = [];
      this.roots = [];
      this.curWeather = "clear";
      this.nextWeather = "haze";
      this.weatherStart = this.t0;
      this._ro = null;
      this._raf = 0;
      this._onVis = () => this._syncVisibility();
    }

    mount() {
      this.resize();
      this._seed();
      this._pickNextWeather(seasonFactor(0, SCENES[this.sceneId].seasonMode));
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(this.canvas.parentElement || this.canvas);
      document.addEventListener("visibilitychange", this._onVis);
      this.running = !document.hidden;
      this._loop(performance.now());
    }

    setScene(id) {
      if (!SCENES[id]) id = "savanna";
      if (this.sceneId === id) {
        this.resize();
        return;
      }
      this.sceneId = id;
      this.t0 = performance.now();
      this.weatherStart = this.t0;
      this.curWeather = "clear";
      this._seed();
      this._pickNextWeather(seasonFactor(0, SCENES[id].seasonMode));
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
      this.clouds = Array.from({ length: 7 }, () => ({
        x: rnd(-0.2, 1.2) * w,
        y: rnd(0.06, 0.34) * h,
        s: rnd(0.55, 1.35),
        speed: rnd(0.006, 0.018),
        opacity: rnd(0.25, 0.55),
      }));
      this.trees = Array.from({ length: this.sceneId === "temperate_forest" ? 11 : 9 }, (_, i) => ({
        x: (i / 8) * w + rnd(-18, 18),
        baseY: h * (this.sceneId === "mangrove" ? 0.58 : 0.52) + rnd(-8, 14),
        scale: rnd(0.55, 1.15),
        lean: rnd(-0.08, 0.08),
        kind: i % 3,
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
      this.waves = Array.from({ length: 18 }, (_, i) => ({
        y: h * (0.52 + i * 0.02),
        amp: rnd(2, 6),
        phase: rnd(0, Math.PI * 2),
        speed: rnd(0.8, 1.6),
      }));
      this.roots = Array.from({ length: 8 }, (_, i) => ({
        x: (i / 7) * w + rnd(-20, 20),
        baseY: h * 0.62 + rnd(-6, 10),
        scale: rnd(0.7, 1.2),
      }));
    }

    _pickNextWeather(seasonT) {
      const wmap = weatherWeights(this.sceneId, seasonT);
      const names = SCENES[this.sceneId].weathers.slice();
      const weights = names.map((n) => wmap[n] || 0.05);
      let next = pickWeighted(names, weights, Math.random());
      if (next === this.curWeather && Math.random() < 0.65) {
        const altW = weights.map((w, i) => (names[i] === this.curWeather ? w * 0.15 : w));
        next = pickWeighted(names, altW, Math.random());
      }
      this.nextWeather = next;
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
      return name === mix.cur ? 1 - mix.t : name === mix.next ? mix.t : 0;
    }

    _loop(now) {
      if (!this.running) return;
      this._raf = requestAnimationFrame((t) => this._loop(t));
      if (now - this.lastDraw < FRAME_MS) return;
      this.lastDraw = now;
      this.draw(now);
    }

    draw(now) {
      const id = this.sceneId;
      if (id === "temperate_forest") this._drawForest(now);
      else if (id === "mangrove") this._drawMangrove(now);
      else if (id === "freshwater_lake") this._drawLake(now);
      else if (id === "coral_reef") this._drawCoralReef(now);
      else if (id === "tropical_rainforest") this._drawTropicalRainforest(now);
      else if (id === "desert") this._drawDesert(now);
      else this._drawSavanna(now);
    }

    _drawSunMoon(ctx, dayPhase, w, h) {
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
          ctx.fillRect((i * 97) % w, (i * 53) % Math.floor(h * 0.4), 1.5, 1.5);
        }
      }
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
      ctx.beginPath();
      ctx.ellipse(0, -48, 36, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(-22, -42, 18, 10, -0.2, 0, Math.PI * 2);
      ctx.ellipse(24, -44, 16, 9, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    _drawDeciduous(ctx, x, y, scale, lean, trunk, leaf, bare) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(lean);
      ctx.scale(scale, scale);
      ctx.fillStyle = trunk;
      ctx.fillRect(-4, -55, 8, 55);
      ctx.beginPath();
      ctx.moveTo(-2, -40);
      ctx.lineTo(-18, -62);
      ctx.lineTo(-14, -62);
      ctx.lineTo(0, -44);
      ctx.lineTo(16, -66);
      ctx.lineTo(20, -64);
      ctx.lineTo(3, -40);
      ctx.closePath();
      ctx.fill();
      if (!bare) {
        ctx.fillStyle = leaf;
        ctx.beginPath();
        ctx.ellipse(0, -70, 28, 22, 0, 0, Math.PI * 2);
        ctx.ellipse(-18, -60, 16, 14, -0.3, 0, Math.PI * 2);
        ctx.ellipse(18, -62, 15, 13, 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    _drawMangroveRoot(ctx, x, y, scale, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      // prop roots
      for (const [dx, dy] of [
        [-22, 8],
        [-10, 14],
        [8, 12],
        [20, 6],
      ]) {
        ctx.beginPath();
        ctx.moveTo(0, -36);
        ctx.quadraticCurveTo(dx * 0.4, -10, dx, dy);
        ctx.stroke();
      }
      ctx.fillStyle = color;
      ctx.fillRect(-3, -50, 6, 20);
      ctx.beginPath();
      ctx.ellipse(0, -58, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    _commonSkyClouds(ctx, w, h, sky, dayPhase, windPulse, cloudAmt) {
      const gSky = ctx.createLinearGradient(0, 0, 0, h * 0.58);
      const skyTop = mixRgb(sky, [sky[0] - 20, sky[1] - 10, sky[2] + 10], 0.25);
      gSky.addColorStop(0, rgb(skyTop));
      gSky.addColorStop(1, rgb(sky));
      ctx.fillStyle = gSky;
      ctx.fillRect(0, 0, w, h);
      this._drawSunMoon(ctx, dayPhase, w, h);
      for (const c of this.clouds) {
        c.x += c.speed * windPulse * 16 * (0.55 + cloudAmt);
        if (c.x > w + 120) c.x = -140;
        const alpha = c.opacity * cloudAmt * (dayPhase > 0.15 && dayPhase < 0.8 ? 1 : 0.45);
        this._drawCloud(ctx, c.x, c.y, c.s, alpha);
      }
    }

    _veil(ctx, w, h, hazeAmt, dayPhase, tint) {
      const veil = 0.1 + hazeAmt * 0.06 + (dayPhase < 0.15 || dayPhase > 0.8 ? 0.06 : 0);
      ctx.fillStyle = `rgba(${tint[0]}, ${tint[1]}, ${tint[2]}, ${veil})`;
      ctx.fillRect(0, 0, w, h);
      const vig = ctx.createRadialGradient(w * 0.5, h * 0.45, h * 0.2, w * 0.5, h * 0.5, h * 0.85);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(40,30,15,0.12)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    }

    _drawSavanna(now) {
      const ctx = this.ctx;
      const w = this.w;
      const h = this.h;
      if (w < 2 || h < 2) return;
      const elapsed = now - this.t0;
      const dayPhase = (elapsed % DAY_CYCLE_MS) / DAY_CYCLE_MS;
      const seasonT = seasonFactor(elapsed, "dry_wet");
      const windPulse = 0.5 + 0.35 * Math.sin(elapsed * 0.00035) + (1 - seasonT) * 0.12;
      this.wind += 0.28 * windPulse;
      const { sky, ground: grass } = phaseColorsSavanna(dayPhase, seasonT);
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
      this._commonSkyClouds(ctx, w, h, sky, dayPhase, windPulse, cloudAmt);
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
      const gGrass = ctx.createLinearGradient(0, h * 0.5, 0, h);
      const grassDeep = [clamp(grass[0] - 28, 0, 255), clamp(grass[1] - 22, 0, 255), clamp(grass[2] - 18, 0, 255)];
      gGrass.addColorStop(0, rgb(grass, 0.92));
      gGrass.addColorStop(1, rgb(grassDeep, 1));
      ctx.fillStyle = gGrass;
      ctx.fillRect(0, h * 0.52, w, h * 0.48);
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
      this._veil(ctx, w, h, hazeAmt, dayPhase, [232, 220, 196]);
    }

    _drawForest(now) {
      const ctx = this.ctx;
      const w = this.w;
      const h = this.h;
      if (w < 2 || h < 2) return;
      const elapsed = now - this.t0;
      const dayPhase = (elapsed % DAY_CYCLE_MS) / DAY_CYCLE_MS;
      const seasonT = seasonFactor(elapsed, "four");
      const leaf = seasonLeafTint(seasonT, "four");
      const windPulse = 0.45 + 0.3 * Math.sin(elapsed * 0.0004);
      this.wind += 0.25 * windPulse;
      const { sky, ground } = phaseColorsGeneric(dayPhase, {
        sky: SKY_TEMP,
        ground: {
          night: [40, 48, 36],
          dawn: [90, 100, 70],
          day: mixRgb(leaf.litter, [70, 100, 55], 0.35),
          dusk: [80, 70, 50],
        },
      });
      // winter sky cooler
      let skyUse = sky;
      if (leaf.snow > 0.4) skyUse = mixRgb(sky, [180, 195, 215], leaf.snow * 0.35);
      const weather = this._weatherMix(now, seasonT);
      const cloudAmt = clamp(
        this._weatherAmount("clouds", weather) +
          this._weatherAmount("overcast", weather) * 0.9 +
          this._weatherAmount("rain", weather) * 0.7 +
          this._weatherAmount("snow", weather) * 0.55 +
          0.12,
        0,
        1
      );
      const rainAmt = this._weatherAmount("rain", weather);
      const snowAmt = this._weatherAmount("snow", weather);
      const hazeAmt = this._weatherAmount("overcast", weather) * 0.5;
      this._commonSkyClouds(ctx, w, h, skyUse, dayPhase, windPulse, cloudAmt);

      // forest floor
      const floor = mixRgb(ground, [245, 248, 252], leaf.snow * 0.55);
      ctx.fillStyle = rgb(floor);
      ctx.fillRect(0, h * 0.55, w, h * 0.45);

      // trunks + seasonal canopy
      const trunk = rgb(mixRgb([72, 52, 34], [40, 32, 24], dayPhase < 0.2 || dayPhase > 0.75 ? 0.5 : 0.15), 0.9);
      const leafCol = rgb(leaf.leaf, 0.82);
      const bare = leaf.snow > 0.7 || (seasonT > 0.85 || seasonT < 0.12);
      for (const tr of this.trees) {
        this._drawDeciduous(
          ctx,
          tr.x,
          tr.baseY + 20,
          tr.scale,
          tr.lean + Math.sin(this.wind * 0.03 + tr.x) * 0.015,
          trunk,
          leafCol,
          bare && tr.kind !== 1 // keep some evergreens (pine-like) with leaf
        );
        if (tr.kind === 1) {
          // simple pine triangle
          ctx.save();
          ctx.translate(tr.x + 30, tr.baseY + 20);
          ctx.scale(tr.scale * 0.85, tr.scale * 0.85);
          ctx.fillStyle = trunk;
          ctx.fillRect(-2, -50, 4, 50);
          ctx.fillStyle = bare ? rgb([40, 70, 45], 0.85) : rgb(mixRgb(leaf.leaf, [30, 80, 45], 0.5), 0.9);
          ctx.beginPath();
          ctx.moveTo(0, -95);
          ctx.lineTo(22, -40);
          ctx.lineTo(-22, -40);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // understory sway
      ctx.strokeStyle = rgb([clamp(leaf.leaf[0] - 20, 0, 255), leaf.leaf[1], clamp(leaf.leaf[2] - 10, 0, 255)], 0.35);
      ctx.lineWidth = 1.1;
      for (const blade of this.grass) {
        const sway = Math.sin(this.wind * 0.06 + blade.phase) * blade.amp * windPulse * 0.7;
        ctx.beginPath();
        ctx.moveTo(blade.x, blade.y);
        ctx.quadraticCurveTo(blade.x + sway * 0.5, blade.y - blade.h * 0.5, blade.x + sway, blade.y - blade.h * 0.85);
        ctx.stroke();
      }

      if (rainAmt > 0.02) {
        ctx.strokeStyle = `rgba(200,210,225,${0.3 * rainAmt})`;
        for (const drop of this.rain) {
          drop.y += drop.spd * (0.85 + rainAmt);
          drop.x += 0.25 * windPulse;
          if (drop.y > h) {
            drop.y = -10;
            drop.x = Math.random() * w;
          }
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 1, drop.y + drop.len);
          ctx.stroke();
        }
      }
      if (snowAmt > 0.02 || leaf.snow > 0.3) {
        const a = Math.max(snowAmt, leaf.snow * 0.35);
        ctx.fillStyle = `rgba(245,248,255,${0.55 * a})`;
        for (const d of this.dust) {
          d.y += 0.6 + a;
          d.x += Math.sin(this.wind * 0.02 + d.y) * 0.4;
          if (d.y > h) {
            d.y = 0;
            d.x = Math.random() * w;
          }
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r * 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      this._veil(ctx, w, h, hazeAmt, dayPhase, [220, 230, 220]);
    }

    _drawMangrove(now) {
      const ctx = this.ctx;
      const w = this.w;
      const h = this.h;
      if (w < 2 || h < 2) return;
      const elapsed = now - this.t0;
      const dayPhase = (elapsed % DAY_CYCLE_MS) / DAY_CYCLE_MS;
      const seasonT = seasonFactor(elapsed, "wet_dry_mild");
      const windPulse = 0.4 + 0.25 * Math.sin(elapsed * 0.00038) + seasonT * 0.1;
      this.wind += 0.22 * windPulse;
      // tide oscillation (teaching): slow rise/fall of waterline
      const tide = 0.5 + 0.5 * Math.sin(elapsed * 0.00012);
      const waterLine = h * (0.58 - tide * 0.04);
      const { sky, ground } = phaseColorsGeneric(dayPhase, {
        sky: {
          night: [18, 28, 48],
          dawn: [210, 150, 120],
          day: [150, 200, 220],
          noon: [120, 180, 210],
          dusk: [220, 140, 100],
        },
        ground: {
          night: [40, 50, 42],
          dawn: [90, 100, 70],
          day: [70, 110, 80],
          dusk: [60, 80, 60],
        },
      });
      const weather = this._weatherMix(now, seasonT);
      const cloudAmt = clamp(
        this._weatherAmount("clouds", weather) +
          this._weatherAmount("rain", weather) * 0.7 +
          this._weatherAmount("storm", weather) * 0.9 +
          this._weatherAmount("haze", weather) * 0.4 +
          0.15,
        0,
        1
      );
      const rainAmt = this._weatherAmount("rain", weather) + this._weatherAmount("storm", weather) * 0.85;
      const hazeAmt = this._weatherAmount("haze", weather) + this._weatherAmount("storm", weather) * 0.2;
      this._commonSkyClouds(ctx, w, h, sky, dayPhase, windPulse, cloudAmt);

      // mudflat
      ctx.fillStyle = rgb(mixRgb([92, 78, 58], [60, 70, 55], 0.35));
      ctx.fillRect(0, waterLine - 8, w, h);

      // water with salinity/estuarian tint
      const water = mixRgb([40, 90, 95], [55, 110, 100], seasonT);
      const wg = ctx.createLinearGradient(0, waterLine, 0, h);
      wg.addColorStop(0, rgb(water, 0.75));
      wg.addColorStop(1, rgb([25, 55, 60], 0.95));
      ctx.fillStyle = wg;
      ctx.fillRect(0, waterLine, w, h - waterLine);

      // humidity haze near water
      ctx.fillStyle = `rgba(180,210,210,${0.08 + hazeAmt * 0.1})`;
      ctx.fillRect(0, waterLine - 30, w, 50);

      // prop-root mangrove silhouettes
      const rootCol = rgb(mixRgb([36, 55, 42], ground, 0.25), 0.85);
      for (const r of this.roots) {
        this._drawMangroveRoot(
          ctx,
          r.x,
          Math.max(r.baseY, waterLine + 6),
          r.scale,
          rootCol
        );
      }

      // gentle wave glints
      ctx.strokeStyle = `rgba(220,240,235,${0.18 + (1 - dayPhase % 1) * 0.05})`;
      ctx.lineWidth = 1.2;
      for (const wave of this.waves) {
        const yy = waterLine + (wave.y - h * 0.52) * 0.7;
        if (yy < waterLine) continue;
        const ph = wave.phase + this.wind * 0.04 * wave.speed;
        ctx.beginPath();
        ctx.moveTo(0, yy);
        for (let x = 0; x <= w; x += 24) {
          ctx.lineTo(x, yy + Math.sin(ph + x * 0.02) * wave.amp * 0.35);
        }
        ctx.stroke();
      }

      if (rainAmt > 0.02) {
        ctx.strokeStyle = `rgba(200,220,230,${0.32 * rainAmt})`;
        for (const drop of this.rain) {
          drop.y += drop.spd * (0.9 + rainAmt);
          drop.x += 0.45 * windPulse;
          if (drop.y > h) {
            drop.y = -10;
            drop.x = Math.random() * w;
          }
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 2, drop.y + drop.len);
          ctx.stroke();
        }
      }
      this._veil(ctx, w, h, hazeAmt, dayPhase, [200, 220, 210]);
    }

    _drawLake(now) {
      const ctx = this.ctx;
      const w = this.w;
      const h = this.h;
      if (w < 2 || h < 2) return;
      const elapsed = now - this.t0;
      const dayPhase = (elapsed % DAY_CYCLE_MS) / DAY_CYCLE_MS;
      const seasonT = seasonFactor(elapsed, "four");
      const leaf = seasonLeafTint(seasonT, "four");
      const windPulse = 0.35 + 0.28 * Math.sin(elapsed * 0.00042);
      this.wind += 0.2 * windPulse;
      const { sky, ground } = phaseColorsGeneric(dayPhase, {
        sky: SKY_TEMP,
        ground: {
          night: [30, 50, 45],
          dawn: [70, 110, 90],
          day: [60, 120, 95],
          dusk: [50, 80, 70],
        },
      });
      let skyUse = sky;
      if (leaf.snow > 0.4) skyUse = mixRgb(sky, [175, 190, 210], leaf.snow * 0.3);
      const weather = this._weatherMix(now, seasonT);
      const cloudAmt = clamp(
        this._weatherAmount("clouds", weather) +
          this._weatherAmount("rain", weather) * 0.65 +
          this._weatherAmount("mist", weather) * 0.5 +
          0.12,
        0,
        1
      );
      const rainAmt = this._weatherAmount("rain", weather);
      const mistAmt = this._weatherAmount("mist", weather) + leaf.snow * 0.2;
      const hazeAmt = mistAmt * 0.6;
      this._commonSkyClouds(ctx, w, h, skyUse, dayPhase, windPulse, cloudAmt);

      // far shore
      ctx.fillStyle = rgb(mixRgb(ground, leaf.litter, 0.4), 0.9);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.48);
      ctx.quadraticCurveTo(w * 0.3, h * 0.44, w * 0.55, h * 0.49);
      ctx.quadraticCurveTo(w * 0.8, h * 0.52, w, h * 0.47);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // lake body — photic layer lighter near surface (teaching)
      const waterLine = h * 0.5;
      const deep = mixRgb([20, 55, 75], [30, 70, 80], 1 - leaf.snow * 0.3);
      const shallow = mixRgb([70, 140, 150], [180, 200, 210], leaf.snow * 0.4);
      const wg = ctx.createLinearGradient(0, waterLine, 0, h);
      wg.addColorStop(0, rgb(shallow, 0.78));
      wg.addColorStop(0.45, rgb(mixRgb(shallow, deep, 0.45), 0.88));
      wg.addColorStop(1, rgb(deep, 0.96));
      ctx.fillStyle = wg;
      ctx.fillRect(0, waterLine, w, h - waterLine);

      // specular wave glitter (day)
      if (dayPhase > 0.2 && dayPhase < 0.75) {
        ctx.strokeStyle = `rgba(230,245,250,${0.16 + windPulse * 0.08})`;
        ctx.lineWidth = 1.1;
        for (const wave of this.waves) {
          const yy = waterLine + 8 + (wave.y - h * 0.52) * 0.85;
          const ph = wave.phase + this.wind * 0.05 * wave.speed;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 18) {
            const y = yy + Math.sin(ph + x * 0.028) * wave.amp * 0.45;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      // reed silhouettes at margin
      ctx.strokeStyle = rgb([40, 70, 50], 0.45);
      ctx.lineWidth = 1.4;
      for (const blade of this.grass) {
        if (blade.y < h * 0.62) continue;
        const sway = Math.sin(this.wind * 0.05 + blade.phase) * blade.amp * windPulse;
        ctx.beginPath();
        ctx.moveTo(blade.x, Math.max(blade.y, waterLine + 4));
        ctx.quadraticCurveTo(blade.x + sway, blade.y - blade.h, blade.x + sway * 1.1, blade.y - blade.h * 1.3);
        ctx.stroke();
      }

      if (mistAmt > 0.05) {
        ctx.fillStyle = `rgba(210,225,230,${0.12 * mistAmt})`;
        ctx.fillRect(0, waterLine - 40, w, 70);
      }
      if (rainAmt > 0.02) {
        ctx.strokeStyle = `rgba(200,215,230,${0.28 * rainAmt})`;
        for (const drop of this.rain) {
          drop.y += drop.spd * (0.85 + rainAmt);
          if (drop.y > h) {
            drop.y = -10;
            drop.x = Math.random() * w;
          }
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 1, drop.y + drop.len);
          ctx.stroke();
        }
      }
      this._veil(ctx, w, h, hazeAmt, dayPhase, [210, 225, 230]);
    }
    _drawCoralReef(now) {
      const ctx = this.ctx;
      const w = this.w;
      const h = this.h;
      if (w < 2 || h < 2) return;
      const elapsed = now - this.t0;
      const dayPhase = (elapsed % DAY_CYCLE_MS) / DAY_CYCLE_MS;
      const seasonT = seasonFactor(elapsed, "wet_dry_mild");
      const windPulse = 0.35 + 0.2 * Math.sin(elapsed * 0.00035);
      this.wind += 0.18 * windPulse;

      // day brightness for underwater column (teaching, not physics)
      let dayBright = 1;
      if (dayPhase < 0.15) dayBright = lerp(0.32, 0.55, dayPhase / 0.15);
      else if (dayPhase < 0.25) dayBright = lerp(0.55, 1, (dayPhase - 0.15) / 0.1);
      else if (dayPhase < 0.7) dayBright = 1;
      else if (dayPhase < 0.82) dayBright = lerp(1, 0.38, (dayPhase - 0.7) / 0.12);
      else dayBright = 0.32;
      const isNight = dayPhase < 0.15 || dayPhase > 0.82;

      const weather = this._weatherMix(now, seasonT);
      const stormAmt = this._weatherAmount("storm", weather);
      const hazeAmt =
        this._weatherAmount("haze", weather) + this._weatherAmount("clouds", weather) * 0.35;
      const waveBoost = 1 + stormAmt * 0.9;

      // water column: top bright teal (#3EC7C0) → bottom deep blue (#0A2A4A)
      const topBase = mixRgb([62, 199, 192], [28, 90, 120], 1 - dayBright * 0.85);
      const botBase = mixRgb([10, 42, 74], [4, 18, 36], 1 - dayBright * 0.5);
      const topC = mixRgb(topBase, [8, 24, 48], hazeAmt * 0.25);
      const botC = mixRgb(botBase, [4, 12, 28], hazeAmt * 0.2);
      const wg = ctx.createLinearGradient(0, 0, 0, h);
      wg.addColorStop(0, rgb(topC));
      wg.addColorStop(0.45, rgb(mixRgb(topC, botC, 0.4)));
      wg.addColorStop(1, rgb(botC));
      ctx.fillStyle = wg;
      ctx.fillRect(0, 0, w, h);

      // sandy bottom band
      const sandY = h * 0.78;
      const sand = ctx.createLinearGradient(0, sandY, 0, h);
      sand.addColorStop(0, rgb(mixRgb([180, 160, 110], botC, 0.55), 0.55));
      sand.addColorStop(1, rgb(mixRgb([140, 120, 80], botC, 0.4), 0.85));
      ctx.fillStyle = sand;
      ctx.fillRect(0, sandY, w, h - sandY);

      // soft light shafts drifting (2–4)
      for (let i = 0; i < 3; i++) {
        const drift = (elapsed * 0.012 * (0.4 + i * 0.15) + i * 0.33) % 1;
        const sx = ((drift * 1.4 - 0.2) * w + i * w * 0.28 + w) % (w * 1.2) - w * 0.1;
        const alpha = (0.04 + 0.08 * dayBright) * (isNight ? 0.22 : 1);
        const topW = 18 + i * 8;
        const botW = 55 + i * 20;
        const sway = Math.sin(elapsed * 0.0004 + i) * 12 * waveBoost;
        ctx.beginPath();
        ctx.moveTo(sx - topW, 0);
        ctx.lineTo(sx + topW, 0);
        ctx.lineTo(sx + botW + sway, h * 0.85);
        ctx.lineTo(sx - botW + sway, h * 0.85);
        ctx.closePath();
        const sg = ctx.createLinearGradient(sx, 0, sx, h * 0.85);
        sg.addColorStop(0, `rgba(220,245,245,${alpha})`);
        sg.addColorStop(0.5, `rgba(180,230,230,${alpha * 0.55})`);
        sg.addColorStop(1, "rgba(150,210,220,0)");
        ctx.fillStyle = sg;
        ctx.fill();
      }

      // subtle caustic ellipses on sand
      if (!isNight || dayBright > 0.4) {
        const causticA = 0.05 + 0.08 * dayBright;
        for (let i = 0; i < 10; i++) {
          const ph = elapsed * 0.00055 * (0.3 + (i % 3) * 0.15) + i * 1.7;
          const cx = ((i * 0.13 + 0.05) * w + Math.sin(ph) * 28 * waveBoost + w) % w;
          const cy = sandY + 8 + (i % 4) * ((h - sandY) / 5) + Math.cos(ph * 0.8) * 6;
          const rx = 14 + (i % 3) * 8;
          const ry = 5 + (i % 2) * 3;
          ctx.fillStyle = `rgba(240,245,220,${causticA * (0.5 + 0.5 * Math.sin(ph * 2))})`;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, Math.sin(ph) * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // coral silhouettes: mound / staghorn / ridge
      const coralCol = rgb(mixRgb([12, 48, 55], [8, 30, 40], 1 - dayBright * 0.4), 0.78);
      ctx.fillStyle = coralCol;
      ctx.beginPath();
      ctx.ellipse(w * 0.18, h * 0.92, w * 0.09, h * 0.1, 0, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = coralCol;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      const baseX = w * 0.48;
      const baseY = h * 0.95;
      const branchSway = Math.sin(elapsed * 0.0005) * 4 * waveBoost;
      for (const [dx, dy] of [
        [-18, -55],
        [-5, -70],
        [12, -60],
        [22, -45],
        [-28, -40],
      ]) {
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(
          baseX + dx * 0.4 + branchSway,
          baseY + dy * 0.5,
          baseX + dx + branchSway,
          baseY + dy
        );
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(baseX + dx + branchSway, baseY + dy);
        ctx.lineTo(baseX + dx + branchSway - 8, baseY + dy - 14);
        ctx.moveTo(baseX + dx + branchSway, baseY + dy);
        ctx.lineTo(baseX + dx + branchSway + 10, baseY + dy - 12);
        ctx.stroke();
      }

      ctx.fillStyle = coralCol;
      ctx.beginPath();
      ctx.moveTo(w * 0.72, h);
      ctx.quadraticCurveTo(w * 0.78, h * 0.72, w * 0.88, h * 0.8);
      ctx.quadraticCurveTo(w * 0.95, h * 0.88, w, h * 0.85);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(w * 0.65, h * 0.94, w * 0.05, h * 0.06, 0, Math.PI, 0);
      ctx.fill();

      // sparse rising particulate
      for (const p of this.dust) {
        p.y -= 0.15 + p.r * 0.08;
        p.x += Math.sin(elapsed * 0.001 + p.x * 0.01) * 0.15 * waveBoost;
        if (p.y < 0) {
          p.y = h;
          p.x = Math.random() * w;
        }
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        ctx.fillStyle = `rgba(200,230,235,${0.12 + p.r * 0.04})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.6, p.r * 0.7), 0, Math.PI * 2);
        ctx.fill();
      }

      // night: faint bioluminescent dots
      if (isNight) {
        for (let i = 0; i < 22; i++) {
          const bx = (i * 97 + elapsed * 0.008) % w;
          const by = (i * 53 + Math.sin(elapsed * 0.0003 + i) * 20 + h) % h;
          const ba = 0.08 + 0.1 * (0.5 + 0.5 * Math.sin(elapsed * 0.002 + i));
          ctx.fillStyle = `rgba(120,230,220,${ba})`;
          ctx.fillRect(bx, by, 2, 2);
        }
      }

      // storm: stronger horizontal wave displacement mid-water
      if (stormAmt > 0.05) {
        ctx.strokeStyle = `rgba(180,220,230,${0.1 * stormAmt})`;
        ctx.lineWidth = 1;
        for (const wave of this.waves) {
          const yy = h * 0.25 + (wave.y - h * 0.52) * 0.5;
          const ph = wave.phase + this.wind * 0.08 * wave.speed * waveBoost;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 20) {
            const y = yy + Math.sin(ph + x * 0.03) * wave.amp * 0.6 * waveBoost;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      this._veil(ctx, w, h, hazeAmt * 0.5, dayPhase, [40, 100, 120]);
    }

    _drawTropicalRainforest(now) {
      const ctx = this.ctx;
      const w = this.w;
      const h = this.h;
      if (w < 2 || h < 2) return;
      const elapsed = now - this.t0;
      const dayPhase = (elapsed % DAY_CYCLE_MS) / DAY_CYCLE_MS;
      const seasonT = seasonFactor(elapsed, "wet_dry_mild");
      const windPulse = 0.4 + 0.25 * Math.sin(elapsed * 0.00038);
      this.wind += 0.2 * windPulse;

      const { sky, ground } = phaseColorsGeneric(dayPhase, {
        sky: {
          night: [8, 18, 22],
          dawn: [70, 110, 100],
          day: [110, 170, 165],
          noon: [95, 155, 150],
          dusk: [55, 80, 90],
        },
        ground: {
          night: [12, 28, 18],
          dawn: [28, 55, 32],
          day: [34, 72, 38],
          dusk: [22, 42, 28],
        },
      });
      const weather = this._weatherMix(now, seasonT);
      const cloudAmt = clamp(
        this._weatherAmount("clouds", weather) +
          this._weatherAmount("rain", weather) * 0.65 +
          this._weatherAmount("storm", weather) * 0.85 +
          0.2,
        0,
        1
      );
      const rainAmt = this._weatherAmount("rain", weather) + this._weatherAmount("storm", weather) * 0.7;
      const hazeAmt = this._weatherAmount("haze", weather) + 0.18;
      this._commonSkyClouds(ctx, w, h, sky, dayPhase, windPulse, cloudAmt);

      // dense canopy band (upper third) — layered greens
      const canopyY = h * 0.38;
      const canopy = ctx.createLinearGradient(0, 0, 0, canopyY + h * 0.2);
      canopy.addColorStop(0, rgb(mixRgb([18, 48, 28], sky, 0.15), 0.92));
      canopy.addColorStop(0.55, rgb([22, 68, 36], 0.95));
      canopy.addColorStop(1, rgb([16, 42, 24], 0.9));
      ctx.fillStyle = canopy;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, canopyY * 0.55);
      for (let i = 0; i <= 8; i++) {
        const x = w - (i / 8) * w;
        const y = canopyY + Math.sin(i * 1.3 + this.wind * 0.02) * h * 0.025 + (i % 2) * h * 0.02;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // mid-canopy mounds
      ctx.fillStyle = rgb([28, 78, 42], 0.78);
      for (const [fx, fy, rx, ry] of [
        [0.12, 0.42, 0.14, 0.1],
        [0.38, 0.4, 0.16, 0.12],
        [0.62, 0.43, 0.15, 0.1],
        [0.88, 0.41, 0.13, 0.11],
      ]) {
        ctx.beginPath();
        ctx.ellipse(w * fx, h * fy, w * rx, h * ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // forest floor
      ctx.fillStyle = rgb(ground);
      ctx.fillRect(0, h * 0.62, w, h * 0.38);

      // trunk silhouettes
      const trunkCol = rgb([48, 34, 22], 0.75);
      ctx.fillStyle = trunkCol;
      for (const [tx, tw, th] of [
        [0.18, 0.018, 0.28],
        [0.45, 0.022, 0.32],
        [0.72, 0.016, 0.26],
        [0.9, 0.02, 0.3],
      ]) {
        const lean = Math.sin(this.wind * 0.025 + tx * 10) * 4;
        ctx.beginPath();
        ctx.moveTo(w * tx - w * tw + lean * 0.2, h * 0.68);
        ctx.lineTo(w * tx + w * tw + lean * 0.2, h * 0.68);
        ctx.lineTo(w * tx + w * tw * 0.7 + lean, h * (0.68 - th));
        ctx.lineTo(w * tx - w * tw * 0.7 + lean, h * (0.68 - th));
        ctx.closePath();
        ctx.fill();
      }

      // light shafts / gaps through canopy
      const dayBright = dayPhase > 0.18 && dayPhase < 0.78 ? 1 : 0.35;
      for (let i = 0; i < 3; i++) {
        const drift = (elapsed * 0.008 * (0.35 + i * 0.12) + i * 0.27) % 1;
        const sx = ((drift * 1.2 - 0.1) * w + i * w * 0.3 + w) % (w * 1.15) - w * 0.08;
        const alpha = (0.05 + 0.07 * dayBright) * (1 - hazeAmt * 0.4);
        const sway = Math.sin(elapsed * 0.00045 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(sx - 10, h * 0.2);
        ctx.lineTo(sx + 10, h * 0.2);
        ctx.lineTo(sx + 36 + sway, h * 0.72);
        ctx.lineTo(sx - 36 + sway, h * 0.72);
        ctx.closePath();
        const sg = ctx.createLinearGradient(sx, h * 0.2, sx, h * 0.72);
        sg.addColorStop(0, `rgba(200,230,180,${alpha})`);
        sg.addColorStop(1, "rgba(160,200,140,0)");
        ctx.fillStyle = sg;
        ctx.fill();
      }

      // mist / fog veil mid height
      const mist = ctx.createLinearGradient(0, h * 0.45, 0, h * 0.7);
      mist.addColorStop(0, `rgba(180,210,195,${0.08 + hazeAmt * 0.12})`);
      mist.addColorStop(1, "rgba(160,190,170,0)");
      ctx.fillStyle = mist;
      ctx.fillRect(0, h * 0.45, w, h * 0.28);

      if (rainAmt > 0.02) {
        ctx.strokeStyle = `rgba(170,200,210,${0.28 * rainAmt})`;
        ctx.lineWidth = 1;
        for (const drop of this.rain) {
          drop.y += drop.spd * (0.9 + rainAmt);
          drop.x += 0.2 * windPulse;
          if (drop.y > h) {
            drop.y = -10;
            drop.x = Math.random() * w;
          }
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 1, drop.y + drop.len);
          ctx.stroke();
        }
      }

      this._veil(ctx, w, h, hazeAmt * 0.55, dayPhase, [40, 80, 55]);
    }

    _drawDesert(now) {
      const ctx = this.ctx;
      const w = this.w;
      const h = this.h;
      if (w < 2 || h < 2) return;
      const elapsed = now - this.t0;
      const dayPhase = (elapsed % DAY_CYCLE_MS) / DAY_CYCLE_MS;
      const seasonT = seasonFactor(elapsed, "dry_wet");
      const windPulse = 0.5 + 0.35 * Math.sin(elapsed * 0.00042);
      this.wind += 0.28 * windPulse;

      const { sky, ground } = phaseColorsGeneric(dayPhase, {
        sky: {
          night: [18, 22, 48],
          dawn: [255, 160, 100],
          day: [120, 185, 230],
          noon: [100, 175, 225],
          dusk: [230, 120, 70],
        },
        ground: {
          night: [48, 36, 28],
          dawn: [180, 130, 85],
          day: [210, 170, 110],
          dusk: [150, 95, 60],
        },
      });
      const weather = this._weatherMix(now, seasonT);
      const cloudAmt = clamp(
        this._weatherAmount("clouds", weather) * 0.7 + this._weatherAmount("haze", weather) * 0.25,
        0,
        0.75
      );
      const dustAmt =
        this._weatherAmount("dust", weather) + this._weatherAmount("haze", weather) * 0.55 + 0.08;
      this._commonSkyClouds(ctx, w, h, sky, dayPhase, windPulse, cloudAmt);

      // sand dunes silhouette
      const duneBase = mixRgb(ground, [190, 145, 90], 0.35);
      ctx.fillStyle = rgb(duneBase);
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.62);
      for (let x = 0; x <= w; x += 24) {
        const y =
          h * 0.58 +
          Math.sin(x * 0.008 + this.wind * 0.015) * h * 0.04 +
          Math.sin(x * 0.003 + 1.2) * h * 0.03;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // second dune ridge
      ctx.fillStyle = rgb(mixRgb(duneBase, [160, 110, 70], 0.35), 0.92);
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.78);
      for (let x = 0; x <= w; x += 20) {
        const y =
          h * 0.72 +
          Math.sin(x * 0.012 + this.wind * 0.02 + 2) * h * 0.035 +
          Math.cos(x * 0.004) * h * 0.02;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // sparse cactus / shrub silhouettes
      const plantCol = rgb(mixRgb([40, 70, 45], [30, 50, 35], dayPhase < 0.2 || dayPhase > 0.8 ? 0.4 : 0), 0.7);
      ctx.fillStyle = plantCol;
      for (const [px, ph, pw] of [
        [0.22, 0.09, 0.012],
        [0.55, 0.12, 0.014],
        [0.78, 0.08, 0.011],
      ]) {
        const baseY = h * 0.7;
        ctx.fillRect(w * px - w * pw * 0.5, baseY - h * ph, w * pw, h * ph);
        // arms
        ctx.fillRect(w * px - w * pw * 2.2, baseY - h * ph * 0.65, w * pw * 1.8, w * pw * 0.9);
        ctx.fillRect(w * px + w * pw * 0.4, baseY - h * ph * 0.5, w * pw * 1.6, w * pw * 0.9);
      }

      // heat haze shimmer bands
      const heat = 0.04 + 0.06 * (dayPhase > 0.25 && dayPhase < 0.7 ? 1 : 0.2);
      ctx.strokeStyle = `rgba(255,220,160,${heat})`;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) {
        const yy = h * (0.55 + i * 0.05);
        const ph = elapsed * 0.0012 + i;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 16) {
          const y = yy + Math.sin(ph + x * 0.04) * 2.5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // dust particles
      if (dustAmt > 0.05) {
        for (const p of this.dust) {
          p.x += (0.4 + p.r * 0.15) * windPulse * (0.8 + dustAmt);
          p.y += Math.sin(elapsed * 0.001 + p.x) * 0.15;
          if (p.x > w) {
            p.x = 0;
            p.y = Math.random() * h * 0.7 + h * 0.2;
          }
          ctx.fillStyle = `rgba(210,180,130,${0.1 + dustAmt * 0.15})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.7, p.r * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      this._veil(ctx, w, h, dustAmt * 0.65, dayPhase, [220, 180, 120]);
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
