// La cartolina: il panorama della zona, composto a layer dai tag della zona.
// Regola d'oro: niente di ciò che si vede è inventato, tutto viene dai tag.
//
// La scena è pixel art 120 × 80, con un retino ordinato per le sfumature.
// Espone l'oggetto globale `Cartolina`.
const Cartolina = (() => {
  const PW = 120;
  const PH = 80;
  const HY = 36; // l'orizzonte, in pixel

  // Una palette ridotta per ogni momento del giorno
  const PALETTES = {
    alba: {
      sky: ["#2c2850", "#6a3f72", "#c45f6e", "#f2a35e"], glow: "#ffd08a", sun: "#fff0b0", moonShade: "#fff0b0",
      star: "#f7c6a3", starDim: "#c4848a", cloud: "#f6b7a0", cloudShadow: "#9a5f7a",
      far: "#7a5f8c", farShadow: "#56456e", snow: "#f7d8e0", snowShadow: "#b896b8", haze: "#d88a86",
      near: "#4e4462", nearShadow: "#3a3350",
      hillLight: "#6f7a4c", hill: "#55623e", hillShadow: "#3e4a30", ground: "#34402a", groundDark: "#262f1f",
      treeFar: "#3a4a36", treeFarShadow: "#29362a", tree: "#26382a", treeShadow: "#18241c", trunk: "#4a3326",
      stone: "#b39a9a", stoneShadow: "#7e6a74", roof: "#b8574a", roofShadow: "#7e3a38", window: "#2e2430", windowLit: "#ffcf7a",
      water: "#7d86b8", waterLight: "#f2b08a", waterDark: "#5a5f8e", foam: "#f7d7c8",
      rock: "#6e6070", rockLight: "#9a8494", rockDark: "#4a3f4c",
      grass: "#8a9a5a", grassDark: "#5e6e3e", flower: "#f2c06a", flower2: "#e88aa0", bird: "#1e1a26",
    },
    pomeriggio: {
      sky: ["#2f6fb5", "#5b97d1", "#8fbfe3", "#cfe6f0"], glow: "#fff6d0", sun: "#fffbe6", moonShade: "#fffbe6",
      star: "#ffffff", starDim: "#ffffff", cloud: "#ffffff", cloudShadow: "#c9d9e6",
      far: "#7e95b0", farShadow: "#5f7591", snow: "#f4f8fb", snowShadow: "#c4d2e2", haze: "#b9d3e3",
      near: "#5a7a7e", nearShadow: "#44605f",
      hillLight: "#8bb556", hill: "#6a9a42", hillShadow: "#4f7a34", ground: "#3f6a2c", groundDark: "#2f5222",
      treeFar: "#3f6b3a", treeFarShadow: "#2c5030", tree: "#2f5a2a", treeShadow: "#1e3e1e", trunk: "#5a4030",
      stone: "#c2b8a3", stoneShadow: "#8f8676", roof: "#b5523b", roofShadow: "#7e3628", window: "#3a3a44", windowLit: "#3a3a44",
      water: "#4f8fae", waterLight: "#9fd0e0", waterDark: "#336f8a", foam: "#f2fafa",
      rock: "#8a8a7c", rockLight: "#b2b2a2", rockDark: "#5e5e54",
      grass: "#a8cc6c", grassDark: "#6f9a44", flower: "#f2d04a", flower2: "#e88aa8", bird: "#1a1a1a",
    },
    notte: {
      sky: ["#03050c", "#08101f", "#0f1c33", "#1a2a45"], glow: "#2e3e5c", sun: "#eef0dc", moonShade: "#c4c8b4",
      star: "#c8d0e0", starDim: "#5a6880", cloud: "#2a3a58", cloudShadow: "#1a253c",
      far: "#26334a", farShadow: "#1a2438", snow: "#8a9ab4", snowShadow: "#5c6a84", haze: "#1e2c44",
      near: "#18222e", nearShadow: "#111822",
      hillLight: "#1e3028", hill: "#16241e", hillShadow: "#0f1a16", ground: "#0e1712", groundDark: "#09110d",
      treeFar: "#10201a", treeFarShadow: "#0b1712", tree: "#0b1812", treeShadow: "#060f0b", trunk: "#16110d",
      stone: "#4a5062", stoneShadow: "#33384a", roof: "#30283a", roofShadow: "#221c2a", window: "#141018", windowLit: "#ffc860",
      water: "#1e3654", waterLight: "#8fa8c8", waterDark: "#142640", foam: "#8faac4",
      rock: "#2e3240", rockLight: "#454a5c", rockDark: "#1e2230",
      grass: "#2a4434", grassDark: "#1a2e22", flower: "#6a7a5a", flower2: "#5a5a70", bird: "#c8d0e0",
    },
  };

  // Retino ordinato 4 × 4: sfuma tra due colori senza inventarne di nuovi
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((row) => row.map((v) => (v + 0.5) / 16));

  let last = null;

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // --- Composizione della scena ---

  function compose(zone) {
    const r = rng(zone.seed ^ 0x5bd1e995);
    const P = PALETTES[zone.time];
    const night = zone.time === "notte";
    const buf = new Array(PW * PH).fill(P.ground);

    const inside = (x, y) => x >= 0 && y >= 0 && x < PW && y < PH;
    const px = (x, y, c) => {
      x = Math.round(x); y = Math.round(y);
      if (inside(x, y)) buf[y * PW + x] = c;
    };
    const get = (x, y) => (inside(x, y) ? buf[y * PW + x] : null);
    const mix = (a, b, t, x, y) => (t > BAYER[y & 3][x & 3] ? b : a);
    const ramp = (stops, t, x, y) => {
      const pos = Math.max(0, Math.min(0.999, t)) * (stops.length - 1);
      const i = Math.floor(pos);
      return mix(stops[i], stops[i + 1], pos - i, x, y);
    };
    // Rumore 1D morbido, per creste di montagne e colline
    const noise = () => {
      const pts = Array.from({ length: 64 }, r);
      return (x) => {
        const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f);
        return pts[i & 63] * (1 - t) + pts[(i + 1) & 63] * t;
      };
    };
    const fbm = (scale) => {
      const n = [noise(), noise(), noise()];
      return (x) => n[0](x / scale) * 0.6 + n[1](x / (scale / 2.4)) * 0.3 + n[2](x / (scale / 6)) * 0.1;
    };
    const ellipse = (cx, cy, rx, ry, color) => {
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
        for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
          if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) px(x, y, color(x, y));
        }
      }
    };

    // Da dove viene la luce: decide il versante illuminato di montagne, alberi, edifici
    const sunX = zone.time === "alba" ? 10 + r() * 100 : zone.time === "pomeriggio" ? 78 + r() * 30 : 14 + r() * 92;
    const sunY = zone.time === "alba" ? HY - 3 : zone.time === "pomeriggio" ? 11 : 10;
    const lightLeft = sunX < PW / 2;
    // Rettangolo con un lato in ombra
    const block = (x0, y0, w, h, lit, shadow) => {
      for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) {
          const shaded = lightLeft ? x >= x0 + w * 0.62 : x < x0 + w * 0.38;
          px(x, y, shaded ? shadow : lit);
        }
      }
    };
    const crenels = (x0, y, w, lit, shadow) => {
      for (let x = x0; x < x0 + w; x += 2) block(x, y - 2, 1, 2, lit, shadow);
    };

    // Impaginazione: castello, villaggio, rovine e ruscello (con l'eventuale cascata) stanno
    // in fila, in ordine casuale, senza mai coprirsi. Ognuno ha una larghezza minima e massima:
    // prima si riserva il minimo, poi si divide lo spazio avanzato.
    const GAP = 4;
    const items = [["fiume", 28, 28], ["castello", 30, 30], ["villaggio", 34, 14], ["rovine", 26, 14]]
      .filter(([tag]) => tag === "fiume" || zone.tags.has(tag))
      .map(([tag, max, min]) => ({ tag, max, min, w: min }))
      .sort(() => r() - 0.5);
    let slack = PW - 4 - items.reduce((sum, it) => sum + it.min, 0) - GAP * (items.length - 1);
    for (const it of items) {
      const grow = Math.min(it.max - it.min, Math.floor(slack * r()));
      it.w += grow;
      slack -= grow;
    }
    const spots = {};
    let cursor = 2;
    for (const it of items) {
      const air = Math.floor(r() * (slack + 1)); // un po' d'aria, a caso
      slack -= air;
      cursor += air;
      spots[it.tag] = { x: cursor, w: it.w };
      cursor += it.w + GAP;
    }
    let rx = spots.fiume.x + spots.fiume.w / 2;

    // 1. Cielo sfumato, con l'alone attorno al sole o alla luna
    for (let y = 0; y < HY + 10; y++) {
      for (let x = 0; x < PW; x++) px(x, y, ramp(P.sky, y / (HY + 4), x, y));
    }
    const haloR = zone.time === "alba" ? 30 : 16;
    for (let y = 0; y < HY + 10; y++) {
      for (let x = 0; x < PW; x++) {
        const d = Math.hypot(x - sunX, (y - sunY) * 1.3);
        if (d < haloR) px(x, y, mix(get(x, y), P.glow, (1 - d / haloR) * 0.85, x, y));
      }
    }

    // 2. Stelle, luna, sole
    if (night) {
      for (let i = 0; i < 70; i++) {
        const x = Math.floor(r() * PW), y = Math.floor(r() * (HY - 6));
        const bright = r() < 0.3;
        px(x, y, bright ? P.star : P.starDim);
      }
    }
    const discR = zone.time === "alba" ? 7 : 5;
    ellipse(sunX, sunY, discR, discR, () => P.sun);
    if (night) [[-2, -1], [1, 1], [2, -2], [-1, 2]].forEach(([dx, dy]) => px(sunX + dx, sunY + dy, P.moonShade));

    // 3. Nuvole: luce in alto, ombra in basso
    const clouds = 1 + Math.floor(r() * 3);
    for (let i = 0; i < clouds; i++) {
      const cx = 8 + r() * (PW - 16), cy = 6 + r() * 14;
      const puffs = Array.from({ length: 3 + Math.floor(r() * 3) }, (_, k) => ({
        x: cx + (k - 2) * (4 + r() * 4), y: cy - r() * 3, rx: 5 + r() * 6, ry: 2.5 + r() * 2,
      }));
      for (const p of puffs) {
        ellipse(p.x, p.y, p.rx, p.ry, (x, y) => mix(P.cloud, P.cloudShadow, (y - (p.y - p.ry)) / (p.ry * 2) - 0.2, x, y));
      }
    }

    // 4. Montagne: due catene, la lontana slavata dalla foschia, la vicina più scura
    if (zone.tags.has("montagne")) {
      const far = fbm(26);
      const top = Array.from({ length: PW }, (_, x) => Math.round(HY + 2 - 28 * far(x)));
      for (let x = 0; x < PW; x++) {
        const l = top[Math.max(0, x - 1)], rr = top[Math.min(PW - 1, x + 1)];
        const lit = lightLeft ? l >= rr : l <= rr;
        for (let y = Math.max(4, top[x]); y < HY + 8; y++) {
          let c = lit ? P.far : P.farShadow;
          if (y < 22 && y - top[x] < 4) c = mix(lit ? P.snow : P.snowShadow, c, (y - top[x]) / 4, x, y);
          px(x, y, mix(c, P.haze, ((y - top[x]) / (HY + 8 - top[x])) * 0.7, x, y));
        }
      }
      const near = fbm(18);
      for (let x = 0; x < PW; x++) {
        const t = Math.round(HY + 6 - 13 * near(x));
        const lit = lightLeft ? near(x - 1) <= near(x + 1) : near(x - 1) >= near(x + 1);
        for (let y = t; y < HY + 10; y++) px(x, y, lit ? P.near : P.nearShadow);
      }
    }

    // 5. Colline, illuminate in cima
    const hillNoise = fbm(30);
    const hillTop = Array.from({ length: PW }, (_, x) =>
      zone.tags.has("colline") ? Math.round(HY + 4 - 9 * hillNoise(x)) : HY + 3);
    for (let x = 0; x < PW; x++) {
      for (let y = hillTop[x]; y < PH; y++) {
        px(x, y, y < HY + 14
          ? ramp([P.hillLight, P.hill, P.hillShadow], (y - hillTop[x]) / 10, x, y)
          : ramp([P.ground, P.groundDark], (y - HY - 14) / 40, x, y));
      }
    }
    const groundAt = (x0, w) => Math.max(...hillTop.slice(Math.max(0, x0), Math.min(PW, x0 + w))) + 2;

    // 6. Castello, villaggio, rovine: appoggiati sulle colline
    if (zone.tags.has("castello")) {
      const spot = spots.castello;
      if (spot) {
        const x0 = spot.x, base = groundAt(x0, 30);
        block(x0, base - 10, 30, 10, P.stone, P.stoneShadow);
        crenels(x0, base - 10, 30, P.stone, P.stoneShadow);
        for (const [tx, th] of [[x0 - 2, 17], [x0 + 25, 17], [x0 + 11, 23]]) {
          const tw = th > 20 ? 8 : 7;
          block(tx, base - th, tw, th, P.stone, P.stoneShadow);
          crenels(tx, base - th, tw, P.stone, P.stoneShadow);
          px(tx + 3, base - th + 4, night ? P.windowLit : P.window);
          px(tx + 3, base - th + 5, night ? P.windowLit : P.window);
        }
        block(x0 + 13, base - 5, 4, 5, P.window, P.window); // il portone
        for (let y = 0; y < 5; y++) px(x0 + 15, base - 25 - y, P.stoneShadow); // l'asta
        block(x0 + 16, base - 30, 4, 2, P.roof, P.roofShadow); // la bandiera
      }
    }
    if (zone.tags.has("villaggio")) {
      const spot = spots.villaggio;
      if (spot) {
        const x0 = spot.x;
        let x = x0;
        while (x < x0 + spot.w - 6) {
          const w = 6 + Math.floor(r() * 3), h = 4 + Math.floor(r() * 2), base = groundAt(x, w);
          block(x, base - h, w, h, P.stone, P.stoneShadow);
          for (let k = 0; k <= w / 2 + 1; k++) { // tetto a capanna
            for (let xx = x - 1 + k; xx <= x + w - k; xx++) {
              px(xx, base - h - 1 - k, (lightLeft ? xx > x + w / 2 : xx < x + w / 2) ? P.roofShadow : P.roof);
            }
          }
          px(x + 2, base - h + 2, night ? P.windowLit : P.window);
          if (w > 6) px(x + w - 3, base - h + 2, night ? P.windowLit : P.window);
          x += w + 2 + Math.floor(r() * 3);
        }
      }
    }
    if (zone.tags.has("rovine")) {
      const spot = spots.rovine;
      if (spot) {
        const x0 = spot.x, base = groundAt(x0, spot.w) + 6;
        for (let k = 0; k < Math.floor(spot.w / 4) - 1; k++) {
          const w = 2 + Math.floor(r() * 3), h = 5 + Math.floor(r() * 9), xx = x0 + k * 4 + Math.floor(r() * 2);
          block(xx, base - h, w, h, P.stone, P.stoneShadow);
          if (r() < 0.6) px(xx + Math.floor(r() * w), base - h, P.grassDark); // muschio
        }
        // Un arco rimasto in piedi
        const ax = x0 + Math.floor(spot.w / 2) - 5, ah = 14;
        block(ax, base - ah, 2, ah, P.stone, P.stoneShadow);
        block(ax + 8, base - ah, 2, ah, P.stone, P.stoneShadow);
        for (let j = 0; j <= 8; j++) px(ax + 1 + j, base - ah - Math.round(Math.sin((j / 8) * Math.PI) * 3), P.stone);
      }
    }

    // 7. La foresta lontana: tanti piccoli abeti
    const forestY = HY + 16;
    for (let x = -2; x < PW + 2; x += 2 + Math.floor(r() * 2)) {
      const h = 5 + Math.floor(r() * 5), base = forestY + Math.floor(r() * 3);
      for (let k = 0; k < h; k++) {
        const half = Math.floor(k / 2);
        for (let j = -half; j <= half; j++) px(x + j, base - h + k, (lightLeft ? j > 0 : j < 0) ? P.treeFarShadow : P.treeFar);
      }
    }

    // 8. L'acqua: un ruscello che scende verso di noi, forse da una cascata
    let waterTop = forestY - 2;
    if (zone.tags.has("cascata")) {
      const cliffTop = HY + 2;
      for (let y = cliffTop; y < forestY + 4; y++) {
        for (let x = rx - 12; x <= rx + 12; x++) {
          if (Math.abs(x - rx) > 9 + Math.sin(y * 0.9) * 2) continue;
          px(x, y, r() < 0.15 ? P.rockLight : (lightLeft ? x > rx : x < rx) ? P.rockDark : P.rock);
        }
      }
      for (let y = cliffTop; y < forestY + 4; y++) {
        for (let x = rx - 3; x <= rx + 3; x++) px(x, y, (x + Math.floor(y / 2)) % 3 === 0 ? P.foam : P.water);
      }
      ellipse(rx, forestY + 5, 8, 2.5, (x, y) => mix(P.foam, P.water, r(), x, y)); // la schiuma alla base
      waterTop = forestY + 6;
    }
    const isWater = (c) => c === P.water || c === P.waterDark || c === P.waterLight;
    for (let y = waterTop; y < PH; y++) {
      const half = 1.5 + (y - waterTop) * 0.45;
      rx += Math.sin(y * 0.25) * 0.6;
      for (let x = Math.round(rx - half); x <= rx + half; x++) {
        const edge = x <= rx - half + 1 || x >= rx + half - 1;
        // Increspature: brevi lineette orizzontali di luce
        let c = edge ? P.waterDark : (y * 7 + Math.floor((x + y * 2) / 3) * 5) % 13 === 0 ? P.waterLight : P.water;
        if (Math.abs(x - sunX) < 3 && r() < 0.6) c = P.waterLight; // il riflesso del sole o della luna
        px(x, y, c);
      }
    }

    // 9. Pini in primo piano, a fare da cornice
    const pine = (x, base, h) => {
      for (let tier = 0; tier < 3; tier++) {
        const top = base - h + tier * (h / 4), height = h / 2.2;
        for (let k = 0; k < height; k++) {
          const half = Math.floor(1 + k * 0.6);
          for (let j = -half; j <= half; j++) {
            px(x + j, top + k, (lightLeft ? j > half / 3 : j < -half / 3) ? P.treeShadow : P.tree);
          }
        }
      }
      for (let y = base - 3; y <= base; y++) { px(x, y, P.trunk); px(x + 1, y, P.trunk); }
    };
    pine(4 + r() * 5, PH - 4, 34 + r() * 8);
    pine(PW - 6 - r() * 5, PH - 3, 30 + r() * 8);
    if (r() < 0.6) pine(14 + r() * 10, PH - 2, 16 + r() * 6);

    // 10. Primo piano: erba, fiori, rocce
    for (let x = 0; x < PW; x++) {
      if (isWater(get(x, PH - 1))) continue;
      const blades = 1 + Math.floor(r() * 4);
      for (let y = PH - blades; y < PH; y++) px(x, y, r() < 0.5 ? P.grass : P.grassDark);
      if (!night && r() < 0.04) px(x, PH - blades - 1, r() < 0.5 ? P.flower : P.flower2);
    }
    for (let i = 0; i < 3; i++) {
      const x = 20 + r() * (PW - 40), y = PH - 3;
      if (Math.abs(x - rx) < 12) continue;
      ellipse(x, y, 3 + r() * 2, 2, (xx, yy) => (yy < y - 0.5 ? P.rockLight : P.rock));
    }

    // 11. L'uccello della zona in volo, solo se c'è ancora
    if (zone.bird) {
      const flock = r() < 0.6 ? 2 : 1;
      for (let i = 0; i < flock; i++) {
        const bx = 20 + r() * (PW - 40), by = 8 + r() * 16;
        [[0, 0], [1, 1], [2, 1], [3, 0], [-1, -1], [4, -1]].forEach(([dx, dy]) => px(bx + dx, by + dy, P.bird));
      }
    }

    return buf;
  }

  // --- Disegno ---

  const rgbCache = new Map();
  function rgb(hex) {
    if (!rgbCache.has(hex)) rgbCache.set(hex, [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
    return rgbCache.get(hex);
  }

  function canvasFor(container) {
    let canvas = container.querySelector("canvas");
    if (!canvas) {
      container.innerHTML = "";
      canvas = document.createElement("canvas");
      container.appendChild(canvas);
    }
    const width = container.clientWidth || 440;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${(width * PH) / PW}px`;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(((width * PH) / PW) * dpr);
    return canvas;
  }

  function drawPixels(buf, canvas) {
    const small = document.createElement("canvas");
    small.width = PW;
    small.height = PH;
    const sctx = small.getContext("2d");
    const img = sctx.createImageData(PW, PH);
    buf.forEach((hex, i) => img.data.set([...rgb(hex), 255], i * 4));
    sctx.putImageData(img, 0, 0);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
  }

  function render(zone, container) {
    last = { buf: compose(zone), container };
    redraw();
  }

  function redraw() {
    if (last) drawPixels(last.buf, canvasFor(last.container));
  }

  return { render, redraw };
})();
