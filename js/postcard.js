// La cartolina: il panorama della zona, composto a layer dai tag della zona.
// Regola d'oro: niente di ciò che si vede è inventato, tutto viene dai tag.
//
// La scena è pixel art 120 × 80, con un retino ordinato per le sfumature.
// Espone l'oggetto globale `Cartolina`.
const Cartolina = (() => {
  // 120 × 80 in orizzontale; le città, come le foto da cui nascono, 80 × 120 in verticale
  let PW = 120;
  let PH = 80;
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

  // Un colore più scuro dello stesso tono
  const shade = (hex, k) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, "0")).join("");

  // I colori dei biomi sono quelli del pomeriggio: l'alba li scalda, la notte li spegne
  const TINTS = { alba: ["#f2a35e", 0.22, 0.95], pomeriggio: ["#ffffff", 0, 1], notte: ["#1a2a55", 0.5, 0.5] };
  function tintHex(hex, time) {
    const [tc, amount, light] = TINTS[time];
    const a = rgb(hex), b = rgb(tc);
    return "#" + a.map((v, i) => Math.round((v + (b[i] - v) * amount) * light).toString(16).padStart(2, "0")).join("");
  }

  // --- Composizione della scena ---

  function compose(zone) {
    [PW, PH] = zone.city ? [80, 120] : [120, 80];
    const r = rng(zone.seed ^ 0x5bd1e995);
    const biome = BIOMI[[...zone.tags].find((t) => BIOMI[t]) || "foresta"];
    const P = { ...PALETTES[zone.time] };
    for (const [k, hex] of Object.entries(biome.cartolina)) P[k] = tintHex(hex, zone.time);
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
    const sunX = (PW / 120) * (zone.time === "alba" ? 10 + r() * 100 : zone.time === "pomeriggio" ? 78 + r() * 30 : 14 + r() * 92);
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
    const items = [["fiume", 28, 28], ["lago", 40, 26], ["castello", 30, 30], ["villaggio", 34, 14], ["rovine", 26, 14], ["torre", 14, 12]]
      .filter(([tag]) => zone.tags.has(tag))
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
    let rx = spots.fiume ? spots.fiume.x + spots.fiume.w / 2 : -100;
    // Dal ponte, a volte il cielo è coperto e il sole non si vede
    const cloudy = zone.sea && r() < 0.3;

    // Il ponte della nave: parapetto a ringhiera, assi, l'albero maestro con le sartie e il fondo della vela
    const drawDeck = () => {
      const wood = tintHex("#4a3424", zone.time), woodDark = tintHex("#2a1c12", zone.time), woodLight = tintHex("#7a5a3c", zone.time);
      const sail = tintHex("#e6dcc0", zone.time), sailShadow = tintHex("#b4a888", zone.time);
      const railY = PH - 15, deckY = PH - 5;
      const mastX = r() < 0.5 ? PW - 24 - Math.floor(r() * 8) : 18 + Math.floor(r() * 8);
      // la vela, vista da sotto: un arco di tela in cima
      for (let x = mastX - 26; x <= mastX + 26; x++) {
        const bottom = Math.round(8 - 4 * ((x - mastX) / 26) ** 2);
        for (let y = 0; y <= bottom; y++) px(x, y, y > bottom - 2 ? sailShadow : sail);
      }
      // le sartie, dalla cima dell'albero al parapetto
      for (const toX of [mastX - 30, mastX + 30]) {
        for (let k = 0; k <= 60; k++) {
          const t = k / 60;
          px(mastX + (toX - mastX) * t, 6 + (railY - 6) * t, woodDark);
        }
      }
      for (let y = 0; y < deckY; y++) {
        px(mastX - 1, y, woodLight); px(mastX, y, wood); px(mastX + 1, y, woodDark);
      }
      // la ringhiera: corrimano, colonnine, assi del ponte
      for (let x = 0; x < PW; x++) {
        px(x, railY, woodLight); px(x, railY + 1, wood); px(x, railY + 2, woodDark);
        for (let y = deckY; y < PH; y++) px(x, y, (x + (y - deckY) * 7) % 23 === 0 ? woodDark : y === deckY ? woodLight : wood);
      }
      for (let x = 3; x < PW; x += 9) {
        for (let y = railY + 3; y < deckY; y++) { px(x, y, woodLight); px(x + 1, y, wood); px(x + 2, y, woodDark); }
      }
    };

    const tint = (hex) => tintHex(hex, zone.time);
    const lit = (on) => (night ? P.windowLit : on ? P.window : P.window);
    // Una persona vista da lontano: testa, cappello o cuffia, vestiti dai colori accesi
    const person = (x, y, h = 5) => {
      const coat = [tint("#b8342a"), tint("#2e5a9a"), tint("#d8a030"), tint("#3a7a3a"), tint("#6a3a7a"), tint("#e8e0d0")][Math.floor(r() * 6)];
      const coatDark = tint("#1e1814");
      px(x, y - h, tint("#f0c098"));
      if (h > 4) { px(x, y - h - 1, coatDark); px(x + 1, y - h - 1, coatDark); }
      for (let k = 1; k < h; k++) { px(x, y - h + k, coat); if (k > 1) px(x + 1, y - h + k, k === h - 1 ? coatDark : coat); }
    };
    // Una casa di città vista di fronte: intonaco colorato, travi, tetto di coppi rossi o d'ardesia, finestre
    const PLASTER = ["#f0dcb0", "#e8b47a", "#d8806a", "#c8d4dc", "#f4ecd8", "#e8c860"];
    const townHouse = (x0, y0, w, h, roofH, { plaster = PLASTER[Math.floor(r() * PLASTER.length)], slate = r() < 0.35, timber = r() < 0.5, lights = 0.7 } = {}) => {
      const wall = tint(plaster), wallShadow = tint(shade(plaster, 0.72)), beam = tint("#3a2618");
      const roof = tint(slate ? "#4a5468" : "#c04a2e"), roofDark = tint(slate ? "#2a3040" : "#7a2a1a"), roofLight = tint(slate ? "#6a7488" : "#e07050");
      block(x0, y0, w, h, wall, wallShadow);
      if (timber) {
        for (let x = x0; x < x0 + w; x += 4) for (let y = y0; y < y0 + h; y++) px(x, y, beam);
        for (let y = y0; y < y0 + h; y += 6) for (let x = x0; x < x0 + w; x++) px(x, y, beam);
      }
      for (let k = 0; k < roofH; k++) {
        for (let x = x0 - 1 + Math.floor(k / 2); x <= x0 + w - Math.floor(k / 2); x++) px(x, y0 - 1 - k, k === 0 ? roofDark : (x + k) % 4 === 0 ? roofDark : k === roofH - 1 ? roofLight : roof);
      }
      for (let y = y0 + 2; y < y0 + h - 4; y += 6) {
        for (let x = x0 + 2; x < x0 + w - 2; x += 4) {
          const on = night && r() < lights;
          for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) px(x + dx, y + dy, on ? P.windowLit : tint("#2a2430"));
          px(x, y + 2, beam); px(x + 1, y + 2, beam); // il davanzale
        }
      }
    };
    // Una tenda a righe sopra una bottega, con la merce sotto
    const awning = (x0, w, y0, dir, colors) => {
      const [a, b] = colors.map(tint);
      for (let k = 0; k < 4; k++) for (let x = x0; x < x0 + w; x++) px(x + dir * k, y0 + k, k === 3 ? tint("#3a2618") : (Math.floor((x - x0) / 2) % 2 ? a : b));
      for (let x = x0 + 2; x < x0 + w - 1; x += 2) px(x, y0 + 7, [tint("#e86a2a"), tint("#f2d040"), tint("#6aaa3a"), tint("#c8302a")][Math.floor(r() * 4)]);
      for (let x = x0 + 1; x < x0 + w; x++) px(x, y0 + 8, tint("#5a3a20"));
    };
    // Un'insegna appesa a una staffa
    const signboard = (x, y, dir, color) => {
      for (let k = 0; k < 4; k++) px(x + dir * k, y, tint("#2a1a10"));
      for (let yy = y + 1; yy < y + 5; yy++) for (let k = 1; k < 5; k++) px(x + dir * k, yy, yy === y + 1 || k === 1 || k === 4 || yy === y + 4 ? tint("#2a1a10") : tint(color));
    };
    // Una nave alla fonda, di lato: scafo, vele gonfie, bandiera
    const anchored = (cx, base, size) => {
      const hull = tint("#6a3a1e"), hullDark = tint("#3a1e10"), sail = tint("#f4ecd4"), sailShade = tint("#c8b88e");
      for (let k = 0; k < size; k++) for (let x = cx - size * 2 + k; x <= cx + size * 2 - k; x++) px(x, base - size + k, k === size - 1 ? hullDark : (x + k) % 5 === 0 ? hullDark : hull);
      for (const [mx, mh] of [[cx - size, size * 4], [cx + size, size * 3.4]]) {
        for (let y = base - size - mh; y < base - size; y++) px(mx, y, hullDark);
        for (let y = base - size - mh + 2; y < base - size - 2; y++) for (let x = mx - size - 1; x <= mx + size + 1; x++) px(x, y, x > mx + size - 1 || y > base - size - 4 ? sailShade : sail);
        px(mx, base - size - mh - 1, tint("#c8302a")); px(mx + 1, base - size - mh - 1, tint("#c8302a"));
      }
    };

    // Il Forte (80 × 120), visto dall'alto di una strada: a sinistra le mura che corrono lungo il mare
    // verso il fondo, con una nave ormeggiata e una torre di guardia a metà; in fondo un arco nelle
    // mura e la salita al castello sulla collina, tra due palazzi; a destra le case; in primo piano la
    // strada col mercato e la gente. Di notte fiaccole sulle mura, poche finestre e il castello acceso;
    // all'alba non c'è nessuno in giro
    const drawForte = () => {
      const dawn = zone.time === "alba";
      const lerp = (a, b, t) => a + (b - a) * t;
      const depth = (y) => Math.max(0, Math.min(1, (PH - y) / (PH - 56)));   // 0 in primo piano, 1 all'arco
      const stone = tint("#d0bc98"), stoneShadow = tint("#94805e"), stoneDark = tint("#5a4a36"), walk = tint("#b8a47e");
      const red = tint("#c8302a"), gold = tint("#f2c230");
      // il castello di notte è illuminato: pietra calda, non spenta dal buio
      const cStone = night ? "#d8a860" : stone, cShadow = night ? "#9a6a3a" : stoneShadow, cWin = night ? "#fff0a0" : tint("#2a2430");
      // la fiaccola: un palo, la fiamma e un piccolo alone caldo sulla pietra
      const torch = (x, y) => {
        for (let yy = y - 3; yy <= y + 2; yy++) for (let xx = x - 2; xx <= x + 2; xx++) if (Math.hypot(xx - x, yy - y + 0.5) < 2.6) px(xx, yy, "#7a4a24");
        px(x, y + 1, tint("#2a1a10")); px(x, y + 2, tint("#2a1a10"));
        px(x, y, "#ff9a30"); px(x, y - 1, "#ffd060"); px(x - 1, y, "#e8702a"); px(x + 1, y, "#e8702a");
      };

      // il mare a sinistra, fino all'orizzonte
      for (let y = HY - 2; y < PH; y++) for (let x = 0; x < 40; x++) {
        let c = ramp([P.waterLight, P.water, P.waterDark], (y - HY) / 60, x, y);
        if ((y * 5 + Math.floor((x + y * 3) / 4)) % 13 === 0) c = P.foam;
        px(x, y, c);
      }
      // la collina col castello, in fondo al centro
      for (let x = 14; x < PW; x++) {
        const top = Math.round(24 + ((x - 46) / 26) ** 2 * 18);
        for (let y = top; y < 62; y++) px(x, y, y < top + 2 ? P.hillLight : ramp([P.hill, P.hillShadow], (y - top) / 30, x, y));
      }
      // la salita che va dall'arco al portone del castello
      for (let y = 30; y < 58; y++) { const x = 46 + Math.round(Math.sin(y * 0.35) * 3); for (let k = -1; k <= 1; k++) px(x + k, y, tint("#a89a80")); }
      block(30, 16, 32, 14, cStone, cShadow);
      crenels(30, 16, 32, cStone, cShadow);
      for (const [tx, th] of [[28, 22], [58, 22]]) { block(tx, 30 - th, 6, th, cStone, cShadow); crenels(tx, 30 - th, 6, cStone, cShadow); }
      block(41, 4, 10, 14, cStone, cShadow); crenels(41, 4, 10, cStone, cShadow);   // il mastio
      for (let y = 0; y < 5; y++) px(46, -1 + y, stoneDark);
      for (let y = 0; y < 3; y++) for (let x = 47; x < 51; x++) px(x, y, red);
      for (const [wx, wy] of [[44, 8], [48, 8], [33, 21], [38, 21], [54, 21], [59, 12], [30, 12], [44, 13], [48, 13]]) { px(wx, wy, cWin); px(wx, wy + 1, cWin); }
      block(44, 24, 4, 6, tint("#2a1a12"), tint("#2a1a12"));                        // il portone
      if (night) { torch(30, 15); torch(61, 15); torch(44, 22); torch(49, 22); }
      // i due palazzi ai lati della salita, alti, coi tetti d'ardesia
      townHouse(18, 40, 16, 18, 6, { plaster: "#f0dcb0", slate: true, timber: false, lights: 0.2 });
      townHouse(56, 40, 16, 18, 6, { plaster: "#e8c860", slate: true, timber: false, lights: 0.2 });
      for (const x of [20, 24, 28, 58, 62, 66]) for (let y = 48; y < 58; y++) if (y % 2 === 0) px(x, y, tint("#c8bca4")); // le colonne
      // l'arco nelle mura, in fondo alla strada
      block(30, 50, 34, 14, stone, stoneShadow);
      crenels(30, 50, 34, stone, stoneShadow);
      for (let x = 30; x < 64; x++) for (let y = 50; y < 64; y++) if ((x + (y % 4 < 2 ? 0 : 3)) % 6 === 0 && y % 2 === 0) px(x, y, stoneDark);
      for (let y = 54; y < 64; y++) {
        const half = y < 57 ? Math.round(Math.sqrt(Math.max(0, 9 - (57 - y) ** 2))) + 2 : 5;
        for (let x = 47 - half; x < 47 + half; x++) px(x, y, (x + y) % 3 === 0 ? tint("#4a3a2a") : night ? tint("#3a2a1a") : tint("#2a2024"));
      }
      for (const bx of [36, 54]) for (let y = 52; y < 60; y++) for (let x = bx; x < bx + 3; x++) px(x, y, y === 55 ? gold : red);  // gli stendardi
      if (night) { torch(40, 58); torch(54, 58); }

      // la strada in primo piano, che si allarga verso di noi, coi ciottoli
      const roadL = (y) => Math.round(lerp(16, 41, depth(y))), roadR = (y) => Math.round(lerp(76, 53, depth(y)));
      const cob = tint("#b0a284"), cobDark = tint("#6a5e4a"), cobLight = tint("#d0c4a4");
      for (let y = 64; y < PH; y++) for (let x = roadL(y); x <= roadR(y); x++) {
        const t = 1 - depth(y), step = 2 + Math.round(t * 3);
        px(x, y, ((x + (Math.floor(y / step) % 2) * 2) % (step + 1) === 0 || y % step === 0) ? cobDark : (x + y) % 7 === 0 ? cobLight : cob);
      }
      // le mura a sinistra: il camminamento con i merli verso il mare, e la parete che scende sulla strada
      for (let y = 56; y < PH; y++) {
        const t = depth(y), out = Math.round(lerp(0, 28, t)), inn = Math.round(lerp(12, 34, t)), face = Math.round(lerp(roadL(y) - 1, 40, t));
        for (let x = out; x < inn; x++) px(x, y, x < out + 2 ? ((y + x) % 3 === 0 ? stoneDark : stone) : (x + y * 2) % 7 === 0 ? stoneShadow : walk);
        for (let x = inn; x < face; x++) px(x, y, (x + (y % 4 < 2 ? 0 : 3)) % 6 === 0 && y % 2 === 0 ? stoneDark : stoneShadow);
        if (y % Math.max(2, Math.round(lerp(5, 2, t))) === 0) px(out - 1, y, stone);   // i merli
      }
      // la nave ormeggiata fuori dalle mura, vista dall'alto
      const sx = 9, s0 = 54, s1 = 84;
      for (let y = s0 + 2; y < s1 + 2; y++) for (let x = sx - 4; x <= sx + 6; x++) if (get(x, y) && Math.abs(x - sx - 1) < 5) px(x, y, mix(get(x, y), P.waterDark, 0.6, x, y)); // l'ombra sull'acqua
      for (let y = s0; y < s1; y++) {
        const t = (y - s0) / (s1 - s0 - 1), half = t < 0.3 ? 5 * Math.sqrt(t / 0.3) : t > 0.88 ? 5 * (1 - (t - 0.88) * 3) : 5;
        for (let x = Math.round(sx - half); x <= Math.round(sx + half); x++) px(x, y, Math.abs(x - sx) > half - 1.2 ? tint("#3a1e10") : t > 0.8 ? tint("#8a5a30") : x % 2 ? tint("#c09460") : tint("#9a7040"));
      }
      for (let y = s0 - 4; y < s0; y++) px(sx, y, tint("#3a1e10"));   // il bompresso
      for (const my of [61, 69, 76]) {
        for (let x = sx - 7; x <= sx + 7; x++) { px(x, my - 1, tint("#f4ecd4")); px(x, my, tint("#f4ecd4")); px(x, my + 1, tint("#c8b88e")); }
        px(sx, my + 2, tint("#3a1e10"));
      }
      for (let k = 0; k < 6; k++) px(sx + 6 + k * 0.6, 82 - k, tint("#5a3a22"));   // la cima d'ormeggio verso le mura
      if (night) { px(sx, s1 - 3, P.windowLit); px(sx, s0 + 2, P.windowLit); }
      // la torre di guardia a metà mura, tonda, col tetto a punta
      const ty = 102, tcx = 10;
      ellipse(tcx, ty, 8, 6, (x, y) => ((x + y) % 5 === 0 ? stoneDark : x < tcx ? stone : stoneShadow));
      for (let k = 0; k < 12; k++) for (let x = tcx - 8 + Math.floor(k * 0.7); x <= tcx + 8 - Math.floor(k * 0.7); x++) px(x, ty - 4 - k, (x + k) % 3 === 0 ? tint("#7a2a1a") : tint("#c04a2e"));
      for (let y = 0; y < 4; y++) px(tcx, ty - 16 - y, stoneDark);
      for (let y = 0; y < 2; y++) for (let x = 1; x < 4; x++) px(tcx + x, ty - 20 + y, red);
      if (night) for (const t of [0.15, 0.45, 0.8]) { const y = Math.round(PH - t * (PH - 56)); torch(Math.round(lerp(0, 28, t)) + 3, y); }

      // le case a destra della strada: le lontane piccole, le vicine grandi
      for (const [base, h] of [[66, 8], [74, 11], [86, 15], [100, 19], [118, 24]]) {
        const x0 = roadR(base) + 1;
        townHouse(x0, base - h, PW - x0 + 2, h, Math.round(h / 3), { lights: 0.15 });
      }
      // il mercato in primo piano: bancarelle con le tende a righe, chiuse all'alba
      if (dawn) {
        for (const [x0, y0, w] of [[24, 100, 14], [50, 104, 14]]) for (let x = x0; x < x0 + w; x++) { px(x, y0, tint("#8a2a24")); px(x, y0 + 1, tint("#5a3a20")); for (let y = y0 + 2; y < y0 + 8; y++) if (x === x0 || x === x0 + w - 1) px(x, y, tint("#5a3a20")); }
      } else {
        awning(24, 14, 98, 1, ["#c8302a", "#f4ecd8"]);
        awning(50, 14, 102, -1, ["#2e7a3a", "#f4ecd8"]);
        for (const [x0, y0] of [[25, 106], [49, 110]]) for (let x = x0; x < x0 + 13; x++) { px(x, y0, tint("#7a5030")); if (x % 4 === 0) for (let y = y0 + 1; y < y0 + 5; y++) px(x, y, tint("#5a3a20")); }
      }
      signboard(roadR(84) + 1, 76, 1, "#f2c230");
      // la gente: di giorno tanta, al tramonto qualcuno, di notte due con la lanterna, all'alba nessuno
      const crowd = dawn ? 0 : night ? 2 : 14;
      for (let i = 0; i < crowd; i++) {
        const y = 70 + Math.floor(r() * (PH - 72)), t = 1 - depth(y);
        const x = Math.round(lerp(roadL(y) + 3, roadR(y) - 3, r()));
        person(x, y, 3 + Math.round(t * 6));
        if (night) { px(x + 2, y - 3, "#ffd060"); px(x + 2, y - 2, "#ff9a30"); }
      }
    };

    // Il porticciolo del fiordo (80 × 120), dalla foto di riferimento: freddo ma accogliente. La banchina
    // di assi bagnate corre verso il fondo nella foschia; a sinistra, nell'acqua, una sola nave: il
    // peschereccio del Cinquecento, di legno, con il cassero alto a poppa e la vela serrata sul pennone;
    // a destra una fila di locande a un piano, di legno
    // grigio-azzurro, con le cornici bianche, le insegne, le finestre calde e il fumo dai comignoli; le
    // boe rosse e le gabbie per le aragoste lungo i muri. Di notte tutte le finestre si accendono
    const drawPorto = () => {
      const vx = 46, vy = 62;                                            // il punto di fuga della banchina
      const lerp = (a, b, t) => a + (b - a) * t;
      const fogHex = "#c8d0cc";
      // la foschia: il colore sfuma verso il grigio chiaro con la distanza, senza retino
      const fog = (hex, t) => tint("#" + [1, 3, 5].map((i) => Math.round(lerp(parseInt(hex.slice(i, i + 2), 16), parseInt(fogHex.slice(i, i + 2), 16), Math.max(0, Math.min(0.9, t)))).toString(16).padStart(2, "0")).join(""));
      const warm = night ? "#ffc860" : "#f0c070";
      // il cielo chiaro di foschia e gli abeti in fondo
      for (let y = 0; y < vy + 2; y++) for (let x = 0; x < PW; x++) px(x, y, fog("#98a4a4", Math.floor((y / (vy + 2)) * 8) / 8));
      for (let x = 24; x < PW; x += 3) { const h = 5 + Math.floor(r() * 9); for (let k = 0; k < h; k++) for (let j = -Math.floor(k / 3); j <= Math.floor(k / 3); j++) px(x + j, vy - h + k + 1, fog("#3e5048", 0.6)); }
      // l'acqua calma a sinistra
      for (let y = vy; y < PH; y++) for (let x = 0; x < PW; x++) {
        const t = (y - vy) / (PH - vy);
        px(x, y, (y * 5 + Math.floor(x / 7)) % 17 === 0 ? fog("#8a9a9c", 0.3) : fog(t < 0.3 ? "#8a9898" : t < 0.65 ? "#6a7a7c" : "#4e5e62", 0.5 - t * 0.5));
      }
      // la banchina: assi che corrono verso il fondo, scure e bagnate, con qualche riflesso
      const pl = (y) => Math.round(lerp(vx - 2, 20, (y - vy) / (PH - vy))), pr = (y) => Math.round(lerp(vx + 3, 82, (y - vy) / (PH - vy)));
      for (let y = vy + 1; y < PH; y++) {
        const t = (y - vy) / (PH - vy), far = (1 - t) * 0.8;
        for (let x = pl(y); x <= pr(y); x++) {
          const u = (x - pl(y)) / Math.max(1, pr(y) - pl(y)), board = Math.floor(u * 12);
          const seam = u * 12 - board < 0.08 + (1 - t) * 0.12;
          let c = seam ? "#2e2c2a" : ["#6a625a", "#5a544e", "#766e64"][board % 3];
          if (!seam && (x * 3 + y * 7) % 37 === 0) c = "#a09a90";       // la luce sul legno bagnato
          if (!seam && (x + y * 5) % 59 === 0) c = "#6a7a3a";           // il muschio tra le assi
          px(x, y, fog(c, far));
        }
        for (let k = 0; k < 2; k++) px(pl(y) - k, y, fog("#3a3430", far));   // il bordo della banchina
      }
      // le locande a destra, in fila lungo la banchina: le lontane piccole e velate, la vicina grande
      const inn = (x0, base, w, h, t, i) => {
        const siding = ["#6a7c88", "#7a8a8e", "#5e7080"][i % 3];
        for (let y = base - h; y < base; y++) for (let x = x0; x < x0 + w; x++) px(x, y, fog((x - x0) % 3 === 0 ? shade(siding, 0.78) : siding, t));
        // il tetto a capanna, il comignolo e il fumo
        const rh = Math.round(w * 0.42);
        for (let k = 0; k < rh; k++) for (let x = x0 - 1 + k; x < x0 + w + 1 - k; x++) px(x, base - h - 1 - k, fog(k === 0 ? "#e8e6dc" : "#3a3e44", t));
        const cx = x0 + Math.round(w * 0.7), cw = Math.max(2, Math.round(w / 8)), ch = Math.max(2, Math.round(h / 8));
        for (let y = base - h - rh - ch + 2; y < base - h - Math.round(rh * 0.4); y++) for (let x = cx; x < cx + cw; x++) px(x, y, fog("#8a4a3a", t));
        for (let k = 0; k < 10 + h / 3; k++) px(cx + Math.round(Math.sin(k * 0.6) * 1.5 + k * 0.3), base - h - rh - ch - k, fog("#e8ecec", t + k * 0.04));
        // le finestre con le cornici bianche: calde anche di giorno, accese di notte
        const ww = Math.max(1, Math.round(w / 9)), wh = Math.max(2, Math.round(h / 3));
        const dw = Math.max(1, Math.round(w / 7)), dh = Math.max(2, Math.round(h * 0.6));
        for (let y = base - h + Math.max(2, Math.round(h / 4)); y === base - h + Math.max(2, Math.round(h / 4)); y++) {
          for (let x = x0 + dw + 3; x + ww < x0 + w - 1; x += ww + Math.max(2, Math.round(w / 6))) {
            for (let yy = y - 1; yy <= y + wh; yy++) for (let xx = x - 1; xx <= x + ww; xx++) px(xx, yy, fog("#ecebe2", t));
            const on = night ? r() < 0.85 : r() < 0.4;
            for (let yy = y; yy < y + wh; yy++) for (let xx = x; xx < x + ww; xx++) px(xx, yy, on ? (t > 0.5 ? fog(warm, t * 0.6) : warm) : fog("#2a3238", t));
          }
        }
        // la porta e l'insegna appesa: un boccale dorato
        for (let y = base - dh; y < base; y++) for (let x = x0 + 1; x < x0 + 1 + dw; x++) px(x, y, fog(night ? "#a86a30" : "#4a3428", t));
        if (w > 8) {
          const sx = x0 - 1, sy = base - dh - 3;
          for (let k = 0; k < 3; k++) px(sx - k, sy - 2, fog("#2a1a10", t));
          for (let y = sy - 1; y < sy + 3; y++) for (let x = sx - 3; x < sx; x++) px(x, y, fog(y === sy - 1 ? "#2a1a10" : "#d8a030", t));
          if (night) { px(x0 + dw + 2, base - dh, "#ffcc60"); px(x0 + dw + 2, base - dh + 1, "#e89040"); }   // la lanterna accanto alla porta
        }
      };
      for (let i = 5; i >= 0; i--) {
        const t = i / 5, base = Math.round(lerp(PH - 18, vy + 1, t)), x0 = pr(base) - Math.round(lerp(10, 1, t));
        inn(x0, base, Math.round(lerp(34, 5, t)), Math.round(lerp(22, 4, t)), t * 0.85, i);   // a un piano
      }
      // le boe rosse appoggiate ai muri e le gabbie per le aragoste
      const buoy = (x, y, len, t) => {
        const w = Math.max(1, Math.round(len / 7));
        for (let k = 0; k < len; k++) for (let j = -w; j <= w; j++) px(x + j + Math.round(k * 0.12), y - k, fog(k > 0 && k % Math.max(3, Math.round(len / 3)) === 0 ? "#7a2a24" : j < 0 ? "#d0584a" : "#a83a30", t));
      };
      const cage = (x0, y0, w, h, t) => {
        for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x === x0 || x === x0 + w - 1 || y === y0 || y === y0 + h - 1 || (x - x0) % 3 === 0 || (y - y0) % 3 === 0) px(x, y, fog("#8a6a48", t));
      };
      buoy(pr(118) - 14, 118, 24, 0); buoy(pr(96) - 10, 96, 12, 0.3); buoy(pr(80) - 6, 80, 7, 0.5);
      cage(26, 100, 16, 11, 0); cage(pr(104) - 26, 100, 9, 7, 0.15); cage(pr(86) - 12, 84, 5, 4, 0.45);
      // il pilone di pietra col muschio, in basso a sinistra
      for (let y = 104; y < PH; y++) for (let x = 0; x < 20 - Math.round((y - 104) * 0.3); x++) px(x, y, y < 107 ? tint("#6a8a3a") : (x + y) % 4 ? tint("#5a5a52") : tint("#46463e"));
      // la nave: un peschereccio del Cinquecento, di legno incatramato, con la prua verso sinistra, il cassero
      // alto a poppa verso la banchina, un albero con la vela serrata sul pennone e le reti stese sulla murata
      const wood = tint("#7a5434"), woodDark = tint("#3e2a1a"), woodLight = tint("#a07448"), tar = tint("#2a2018");
      const deckY = (x) => Math.round(78 - ((x - 18) / 16) ** 2 * 5);   // la murata: un arco che sale a prua e a poppa
      const bottom = (x) => Math.round(92 - ((x - 18) / 16) ** 2 * 10);
      for (let x = 3; x < pl(90) - 1; x++) {
        for (let y = deckY(x); y < bottom(x); y++) {
          const plank = Math.floor((y - deckY(x)) / 3);
          px(x, y, y > bottom(x) - 3 ? tar : (y - deckY(x)) % 3 === 0 ? woodDark : plank % 2 ? wood : woodLight);
        }
        px(x, deckY(x), woodDark);
      }
      // il cassero di poppa, con la sua ringhiera e la lanterna
      const sx0 = 22, sx1 = pl(80) - 2, sTop = deckY(sx1) - 5;
      for (let x = sx0; x < sx1; x++) for (let y = sTop + Math.max(0, sx0 + 3 - x); y < deckY(x) + 1; y++) px(x, y, (y - sTop) % 3 === 0 ? woodDark : wood);
      for (let x = sx0; x < sx1; x += 2) { px(x, sTop - 1, woodDark); px(x, sTop - 2, woodDark); }
      for (let x = sx0; x < sx1; x++) px(x, sTop - 3, woodDark);
      for (const [wx, wy] of [[sx0 + 4, sTop + 4], [sx0 + 8, sTop + 4]]) { px(wx, wy, night ? warm : tar); px(wx + 1, wy, night ? warm : tar); }
      for (let y = sTop - 8; y < sTop - 3; y++) px(sx1 - 2, y, woodDark);
      for (const [dx, dy] of [[-1, 0], [0, 0], [1, 0], [0, 1]]) px(sx1 - 2 + dx, sTop - 10 + dy, night || zone.time === "alba" ? "#ffcc60" : tint("#c8b070"));
      // il bompresso a prua
      for (let k = 0; k < 12; k++) px(4 - k * 0.6, deckY(4) - 1 - k * 0.45, woodDark);
      // l'albero, il pennone con la vela serrata, le sartie
      const mx = 15, mTop = 10;
      for (let y = mTop; y < deckY(mx); y++) { px(mx, y, woodDark); px(mx + 1, y, wood); }
      for (let x = mx - 11; x <= mx + 12; x++) { px(x, mTop + 8, woodDark); px(x, mTop + 9, tint("#d8ccb0")); if (Math.abs(x - mx) < 10) px(x, mTop + 10, tint("#b8aa88")); }
      for (let y = mTop - 3; y < mTop; y++) for (let x = mx - 1; x <= mx + 2; x++) px(x, y, woodDark);   // la coffa
      for (let k = 0; k < 44; k++) { px(mx - 2 - k * 0.22, mTop + 2 + k * 1.1, tint("#3a3a36")); px(mx + 3 + k * 0.32, mTop + 2 + k * 1.1, tint("#3a3a36")); }
      // le reti stese sulla murata, coi galleggianti di sughero
      for (let x = 6; x < 24; x++) for (let k = 0; k < 4 + ((x * 7) % 3); k++) if ((x + k) % 2 === 0) px(x, deckY(x) + 1 + k, tint("#5a5a4a"));
      for (let x = 7; x < 24; x += 4) px(x, deckY(x) + 1, tint("#d8b060"));
      // il riflesso scuro della nave sull'acqua
      for (let x = 2; x < pl(100) - 1; x++) for (let y = bottom(x); y < bottom(x) + 6; y++) if (y < PH && (x + y) % 2 === 0) px(x, y, tint("#2e3a3c"));
      // la gente, poca: un pescatore di giorno, uno con la lanterna di notte
      if (zone.time === "pomeriggio") person(44, 78, 5);
      if (night) { person(40, 86, 6); px(42, 83, "#ffd060"); }
    };

    // Una città vista dal mare, col binocolo (120 × 80): le mura del Forte o le case colorate del fiordo
    const drawCityView = (id) => {
      const shoreY = HY + 10;
      for (let y = HY; y < PH; y++) for (let x = 0; x < PW; x++) {
        let c = ramp([P.waterLight, P.water, P.waterDark], (y - HY) / (PH - HY), x, y);
        if (y > shoreY + 2 && (y * 5 + Math.floor((x + y * 3) / 5)) % 13 === 0) c = P.foam;
        px(x, y, c);
      }
      if (id === "forte") {
        // la collina verde, il castello in cima a destra, la chiesa, le mura sul mare
        const hill = fbm(30);
        for (let x = 0; x < PW; x++) { const top = Math.round(HY - 2 - 8 * hill(x) - (x > 70 ? (x - 70) * 0.25 : 0)); for (let y = top; y < shoreY; y++) px(x, y, y < top + 2 ? P.hillLight : P.hill); }
        for (let i = 0; i < 16; i++) townHouse(14 + i * 5 + Math.floor(r() * 2), HY + 1 - Math.floor(r() * 5), 4, 6, 3, { timber: false });
        const stone = tint("#d0bc98"), stoneShadow = tint("#94805e"), slate = tint("#3e4a62"), red = tint("#c8302a");
        block(86, HY - 14, 22, 14, stone, stoneShadow); crenels(86, HY - 14, 22, stone, stoneShadow);
        for (const tx of [84, 104]) { block(tx, HY - 20, 6, 20, stone, stoneShadow); crenels(tx, HY - 20, 6, stone, stoneShadow); }
        block(94, HY - 24, 6, 10, stone, stoneShadow);
        for (let k = 0; k < 6; k++) for (let x = 94 + Math.floor(k / 2); x < 100 - Math.floor(k / 2); x++) px(x, HY - 25 - k, slate);
        for (let y = 0; y < 4; y++) px(97, HY - 31 - y, stoneShadow);
        for (let x = 98; x < 102; x++) for (let y = 0; y < 2; y++) px(x, HY - 35 + y, red);
        block(40, HY - 12, 5, 12, stone, stoneShadow);
        for (let k = 0; k < 7; k++) px(42, HY - 13 - k, slate); px(41, HY - 15, slate); px(43, HY - 15, slate);
        // le mura lungo la riva, con le torri e la porta sul porto
        block(8, shoreY - 8, PW - 16, 8, stone, stoneShadow);
        crenels(8, shoreY - 8, PW - 16, stone, stoneShadow);
        for (const tx of [8, 34, 60, 86, 106]) { block(tx, shoreY - 12, 6, 12, stone, stoneShadow); crenels(tx, shoreY - 12, 6, stone, stoneShadow); px(tx + 2, shoreY - 8, lit()); }
        for (let y = shoreY - 5; y < shoreY; y++) for (let x = 46; x < 52; x++) px(x, y, tint("#1a1418"));
        for (let x = 0; x < PW; x++) px(x, shoreY, stoneShadow);
        anchored(24, shoreY + 12, 2); anchored(78, shoreY + 18, 3);
      } else {
        // la foschia, gli abeti, le locande a un piano di legno grigio-azzurro in fila sulla riva,
        // la banchina e il peschereccio di legno: come nella cartolina del porticciolo
        for (let y = 0; y < shoreY; y++) for (let x = 0; x < PW; x++) px(x, y, ramp([tint("#98a4a4"), tint("#c8d0cc")], y / shoreY, x, y));
        for (let x = 0; x < PW; x += 3) { const h = 5 + Math.floor(r() * 8); for (let k = 0; k < h; k++) for (let j = -Math.floor(k / 3); j <= Math.floor(k / 3); j++) px(x + j, shoreY - 3 - h + k, tint("#7a8a84")); }
        for (let x = 0; x < PW; x++) for (let y = shoreY - 3; y < shoreY; y++) px(x, y, tint("#5a544e"));
        for (let x = 24, i = 0; x < 108; i++) {
          const w = 9 + Math.floor(r() * 3), h = 5, col = ["#6a7c88", "#7a8a8e", "#5e7080"][i % 3];
          for (let y = shoreY - 3 - h; y < shoreY - 3; y++) for (let xx = x; xx < x + w; xx++) px(xx, y, (xx - x) % 3 === 0 ? tint(shade(col, 0.78)) : tint(col));
          for (let k = 0; k < 4; k++) for (let xx = x - 1 + k; xx <= x + w - k; xx++) px(xx, shoreY - 4 - h - k, k === 0 ? tint("#e8e6dc") : tint("#3a3e44"));
          for (const wx of [x + 2, x + w - 3]) px(wx, shoreY - 6, night || r() < 0.4 ? (night ? "#ffc860" : "#f0c070") : tint("#2a3238"));
          for (let k = 0; k < 6; k++) px(x + w - 3 + Math.round(Math.sin(k) * 0.8), shoreY - 9 - h - k, tint("#e8ecec"));
          x += w + 2;
        }
        for (let y = shoreY; y < PH; y++) for (let x = 0; x < PW; x++) px(x, y, (y * 5 + Math.floor(x / 7)) % 17 === 0 ? tint("#a4b0b0") : ramp([tint("#8a9898"), tint("#5a6a6e"), tint("#3e4c50")], (y - shoreY) / (PH - shoreY), x, y));
        for (let x = 30; x < 80; x++) { px(x, shoreY, tint("#6a625a")); px(x, shoreY + 1, tint("#3e3a34")); }
        for (let x = 30; x < 80; x += 5) for (let y = shoreY + 2; y < shoreY + 6; y++) px(x, y, tint("#3e3a34"));
        anchored(56, shoreY + 12, 2);
      }
    };

    // 1. Cielo sfumato, con l'alone attorno al sole o alla luna
    for (let y = 0; y < HY + 10; y++) {
      for (let x = 0; x < PW; x++) px(x, y, ramp(P.sky, y / (HY + 4), x, y));
    }
    const haloR = cloudy ? 0 : zone.time === "alba" ? 30 : 16;
    for (let y = 0; y < HY + 10 && haloR; y++) {
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
    if (!cloudy) ellipse(sunX, sunY, discR, discR, () => P.sun);
    if (night && !cloudy) [[-2, -1], [1, 1], [2, -2], [-1, 2]].forEach(([dx, dy]) => px(sunX + dx, sunY + dy, P.moonShade));

    // 3. Nuvole: luce in alto, ombra in basso
    const clouds = cloudy ? 5 + Math.floor(r() * 3) : 1 + Math.floor(r() * 3);
    for (let i = 0; i < clouds; i++) {
      const cx = 8 + r() * (PW - 16), cy = 6 + r() * 14;
      const puffs = Array.from({ length: 3 + Math.floor(r() * 3) }, (_, k) => ({
        x: cx + (k - 2) * (4 + r() * 4), y: cy - r() * 3, rx: 5 + r() * 6, ry: 2.5 + r() * 2,
      }));
      for (const p of puffs) {
        ellipse(p.x, p.y, p.rx, p.ry, (x, y) => mix(P.cloud, P.cloudShadow, (y - (p.y - p.ry)) / (p.ry * 2) - 0.2, x, y));
      }
    }

    // Le due città hanno la loro cartolina, dalle foto di riferimento
    if (zone.city === "forte") { drawForte(); return buf; }
    if (zone.city === "porto") { drawPorto(); return buf; }
    if (zone.cityView) { drawCityView(zone.cityView); return buf; }

    // Dal ponte della nave: solo mare fino all'orizzonte
    if (zone.sea) {
      for (let y = HY; y < PH; y++) {
        const t = (y - HY) / (PH - HY);
        const spacing = Math.max(3, Math.round(14 * (1 - t))); // le onde lontane sono fitte e piccole
        for (let x = 0; x < PW; x++) {
          let c = ramp([P.haze, P.waterLight, P.water, P.waterDark], 0.25 + t * 0.75, x, y);
          if (y > HY + 1 && (y * 5 + Math.floor((x + y * 3) / (2 + t * 6))) % (spacing + 4) === 0) c = t > 0.6 ? P.foam : P.waterLight;
          if (!cloudy && Math.abs(x - sunX) < 2 + t * 6 && r() < 0.45 - t * 0.3) c = P.glow; // la scia di luce
          px(x, y, c);
        }
      }
      for (let x = 0; x < PW; x++) px(x, HY, P.haze);
      // A volte uno scoglio all'orizzonte, a volte dei gabbiani
      if (r() < 0.4) {
        const x0 = 8 + r() * 90, w = 6 + r() * 12, h = 2 + r() * 4;
        for (let x = Math.floor(x0); x < x0 + w; x++) {
          const top = HY - Math.round(h * Math.sin(((x - x0) / w) * Math.PI));
          for (let y = top; y <= HY; y++) px(x, y, (lightLeft ? x > x0 + w / 2 : x < x0 + w / 2) ? P.nearShadow : P.near);
        }
      }
      if (!night && r() < 0.5) {
        for (let i = 0, n = 1 + Math.floor(r() * 3); i < n; i++) {
          const bx = 10 + r() * 70, by = 6 + r() * 18;
          [[0, 0], [1, 1], [2, 1], [3, 0], [-1, -1], [4, -1]].forEach(([dx, dy]) => px(bx + dx, by + dy, P.bird));
        }
      }
      // Il Kraken: l'acqua diventa nera d'inchiostro, e dall'acqua escono i tentacoli
      if (zone.ink) {
        for (let y = HY + 1; y < PH; y++) for (let x = 0; x < PW; x++) px(x, y, mix("#0c0a12", "#1c1626", (y * 7 + x * 3) % 11 === 0 ? 0.8 : 0.1, x, y));
        const flesh = "#3a1e3a", fleshDark = "#22102a", sucker = "#8a5a7a";
        for (const [x0, h, dir] of [[18 + r() * 10, 30, 1], [62 + r() * 12, 40, -1], [94 + r() * 10, 26, -1]]) {
          for (let k = 0; k < h; k++) {
            const t = k / h, w = 3.2 * (1 - t) + 0.6;
            const cx = x0 + Math.sin(t * Math.PI * 1.6) * 6 * dir + t * t * 8 * dir, cy = PH - 18 - k;
            for (let j = -w; j <= w; j++) px(cx + j, cy, j > w / 3 ? fleshDark : flesh);
            if (k % 4 === 0 && t < 0.8) px(cx - w + 1, cy, sucker);
          }
        }
      }
      // La nebbia del pesce gatto: fitta, grigia; e se ti ha sentito, una lucina che si accende
      if (zone.fog) {
        for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) px(x, y, mix(get(x, y), y < HY ? "#4a525a" : "#3a4248", 0.72, x, y));
        if (zone.catfish) {
          // il pesce gatto: una testa enorme che esce dalla nebbia, la bocca aperta piena di denti
          const cx = PW / 2, cy = PH - 30;
          ellipse(cx, cy, 54, 30, (x, y) => (y < cy - 20 ? "#2a3038" : "#161a20"));
          ellipse(cx, cy + 4, 40, 13, () => "#05070a");
          for (let x = cx - 36; x < cx + 36; x += 4) {
            const up = Math.round(Math.sqrt(Math.max(0, 1 - ((x - cx) / 40) ** 2)) * 13);
            px(x, cy + 4 - up, "#e8e4d0"); px(x + 1, cy + 5 - up, "#e8e4d0"); px(x + 1, cy + 6 - up, "#c8c4b0");
            px(x + 2, cy + 3 + up, "#e8e4d0"); px(x + 2, cy + 2 + up, "#c8c4b0");
          }
          for (const ex of [cx - 30, cx + 30]) { px(ex, cy - 16, "#8a96a0"); px(ex + 1, cy - 16, "#5a6670"); }
          for (let k = 0; k < 18; k++) px(cx + Math.sin(k / 5) * 6, cy - 30 - k, "#2a3038");
          ellipse(cx + Math.sin(18 / 5) * 6, cy - 49, 2.5, 2.5, () => "#fff6c0");
        } else if (zone.lure) {
          const lx = 30 + r() * 60, ly = HY + 4 + r() * 8;
          ellipse(lx, ly, 3, 3, (x, y) => mix(get(x, y), "#a8a070", 0.6, x, y));
          px(lx, ly, "#fff6c0"); px(lx + 1, ly, "#fff6c0");
        }
      }
      drawDeck();
      return buf;
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

    // Il vulcano: un cono scuro sullo sfondo, la bocca accesa, colate e un pennacchio di fumo
    if (zone.tags.has("vulcano")) {
      const vx = 16 + r() * 88, top = HY - 20, base = HY + 10, crater = 4;
      const rock = tintHex("#4a3e3e", zone.time), rockDark = tintHex("#2e2628", zone.time);
      const lava = night ? "#ff7a30" : "#e8582a", glowC = night ? "#ffc060" : "#f2a040";
      const smoke = tintHex("#9a9490", zone.time), smokeDark = tintHex("#6a6462", zone.time);
      for (let y = top; y < base; y++) {
        const half = crater + (y - top) * 1.5;
        for (let x = Math.floor(vx - half); x <= vx + half; x++) {
          const lit = lightLeft ? x < vx : x > vx;
          px(x, y, mix(lit ? rock : rockDark, P.haze, ((y - top) / (base - top)) * 0.35, x, y));
        }
      }
      for (let x = vx - crater; x <= vx + crater; x++) { px(x, top, glowC); px(x, top + 1, lava); }
      for (const side of [-1, 1]) {
        let lx = vx + side * 2;
        for (let y = top + 2; y < top + 12 + r() * 6; y++) {
          lx += side * (0.4 + r() * 0.8);
          px(lx, y, lava);
        }
      }
      for (let i = 0; i < 6; i++) {
        const drift = (i * i) / 3;
        ellipse(vx + drift, top - 3 - i * 4, 2.5 + i * 1.1, 1.8 + i * 0.6, (x, y) => mix(smoke, smokeDark, r() * 0.8, x, y));
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
    // La torre della donna: alta e stretta, col tetto a punta e una finestra (accesa di notte)
    if (zone.tags.has("torre") && spots.torre) {
      const x0 = spots.torre.x + Math.floor(spots.torre.w / 2) - 4, base = groundAt(x0, 8);
      block(x0, base - 30, 8, 30, P.stone, P.stoneShadow);
      for (let k = 0; k < 9; k++) for (let x = x0 - 1 + Math.floor(k / 2); x <= x0 + 8 - Math.floor(k / 2); x++) px(x, base - 31 - k, (lightLeft ? x > x0 + 4 : x < x0 + 4) ? P.roofShadow : P.roof);
      for (let y = base - 24; y < base - 20; y++) for (let x = x0 + 3; x < x0 + 5; x++) px(x, y, night ? P.windowLit : P.window);
      block(x0 + 3, base - 5, 2, 5, P.window, P.window);
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

    // 7. La vegetazione lontana: abeti, palme, alberi secchi; nel deserto solo dune
    const forestY = HY + 16;
    for (let x = -2; x < PW + 2; x += 2 + Math.floor(r() * 2)) {
      const h = 5 + Math.floor(r() * 5), base = forestY + Math.floor(r() * 3);
      const shade = (j) => ((lightLeft ? j > 0 : j < 0) ? P.treeFarShadow : P.treeFar);
      if (biome.albero === "cactus") {
        if (r() < 0.12) for (let k = 0; k < 4; k++) px(x, base - k, P.treeFar); // un cactus lontano, raro
        continue;
      }
      if (biome.neve && r() < 0.55) continue; // al nord gli alberi sono radi
      if (biome.albero === "palma") {
        for (let k = 0; k < h; k++) px(x, base - k, P.trunk);
        for (let j = -3; j <= 3; j++) px(x + j, base - h + Math.abs(j) / 2, shade(j));
        continue;
      }
      if (biome.albero === "secco") {
        for (let k = 0; k < h; k++) px(x, base - k, P.treeFarShadow);
        px(x - 1, base - h + 2, P.treeFarShadow); px(x + 1, base - h + 1, P.treeFarShadow);
        continue;
      }
      for (let k = 0; k < h; k++) {
        const half = Math.floor(k / 2);
        for (let j = -half; j <= half; j++) px(x + j, base - h + k, k < 2 && biome.neve ? P.snow : shade(j));
      }
    }
    // Nebbia bassa su taiga e palude
    if (biome.nebbia) {
      for (let y = HY + 4; y < forestY + 4; y++) {
        for (let x = 0; x < PW; x++) px(x, y, mix(get(x, y), P.haze, 0.45 - Math.abs(y - forestY + 4) / 30, x, y));
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
    // Il lago, calmo, con i riflessi
    if (spots.lago) {
      const cx = spots.lago.x + spots.lago.w / 2, cy = forestY + 7, lrx = spots.lago.w / 2, lry = 4;
      ellipse(cx, cy, lrx, lry, (x, y) => {
        if (y < cy - lry + 1) return P.waterDark;
        if ((y * 3 + Math.floor(x / 4)) % 7 === 0) return P.waterLight;
        return Math.abs(x - sunX) < 2 && r() < 0.6 ? P.waterLight : P.water;
      });
    }
    // Il fiume serpeggia di traverso, largo vicino e sottile lontano: parte dalla cascata ed esce da un
    // lato; senza cascata attraversa tutta la cartolina, da un lato all'altro
    if (spots.fiume) {
      const fromFall = zone.tags.has("cascata");
      const dir = r() < 0.5 ? 1 : -1;
      const x0 = fromFall ? rx : dir > 0 ? -8 : PW + 8, y0 = fromFall ? waterTop - 2 : forestY + 3;
      const x1 = dir > 0 ? PW + 8 : -8, y1 = PH - 12 - r() * 6;
      const phase = r() * Math.PI * 2, bends = 1.5 + r();
      const band = new Map();   // per colonna: il centro e la mezza altezza del fiume
      for (let t = 0; t <= 1; t += 0.002) {
        const x = Math.round(x0 + (x1 - x0) * t);
        const y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI * 2 * bends + phase) * (2 + t * 6) * (fromFall ? Math.min(1, t * 4) : 1);
        const half = 0.8 + Math.max(0, y - HY) * 0.09;
        if (!band.has(x)) band.set(x, []);
        band.get(x).push([y, half]);
      }
      for (const [x, list] of band) {
        for (const [cy, half] of list) {
          for (let y = Math.round(cy - half); y <= cy + half; y++) {
            const edge = y <= cy - half + 0.6;
            let c = edge ? P.waterDark : (y * 7 + Math.floor((x + y * 2) / 3) * 5) % 13 === 0 ? P.waterLight : P.water;
            if (Math.abs(x - sunX) < 3 && r() < 0.6) c = P.waterLight; // il riflesso del sole o della luna
            px(x, y, c);
          }
        }
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
    const palm = (x, base, h) => {
      const lean = r() < 0.5 ? -1 : 1;
      for (let k = 0; k < h; k++) { const xx = x + Math.round(lean * (k / h) ** 2 * 4); px(xx, base - k, P.trunk); px(xx + 1, base - k, P.trunk); }
      const tx = x + lean * 4, ty = base - h;
      for (let f = 0; f < 7; f++) { // le fronde ricadono ad arco, spesse due pixel
        const dir = (f / 6) * Math.PI;
        // fronde scure con il bordo superiore in luce, per staccarsi dal verde delle colline
        for (let k = 1; k < 14; k++) {
          const fx = tx + Math.cos(dir) * k, fy = ty - Math.sin(dir) * k * 0.55 + (k * k) / 22;
          px(fx, fy, P.tree);
          px(fx, fy + 1, P.treeShadow);
          px(fx, fy + 2, P.treeShadow);
        }
      }
      ellipse(tx, ty + 1, 2, 1.5, () => P.trunk); // le noci di cocco
    };
    const cactus = (x, base, h) => {
      const body = (x0, y0, len) => { for (let k = 0; k < len; k++) for (let j = 0; j < 3; j++) px(x0 + j, y0 - k, j === (lightLeft ? 2 : 0) ? P.treeShadow : P.tree); };
      body(x, base, h);
      body(x - 4, base - h / 3, h / 3); for (let j = -3; j < 0; j++) px(x + j, base - h / 3, P.tree);
      body(x + 4, base - h / 2, h / 4); for (let j = 3; j < 5; j++) px(x + j, base - h / 2, P.tree);
    };
    const deadTree = (x, base, h) => {
      for (let k = 0; k < h; k++) { px(x, base - k, P.trunk); px(x + 1, base - k, P.trunk); }
      for (const [y0, dir, len] of [[0.55, -1, 7], [0.7, 1, 6], [0.85, -1, 4], [0.4, 1, 5]]) {
        for (let k = 0; k < len; k++) px(x + dir * k, base - h * y0 - k * 0.7, P.trunk);
      }
    };
    const near = { pino: pine, palma: palm, cactus, secco: deadTree }[biome.albero];
    const inset = biome.albero === "palma" ? 10 : 0; // le fronde larghe non devono uscire dal bordo
    near(4 + inset + r() * 5, PH - 4, 34 + r() * 8);
    near(PW - 8 - inset - r() * 5, PH - 3, 30 + r() * 8);
    if (r() < 0.6) near(14 + r() * 10, PH - 2, 16 + r() * 6);
    // La neve sui rami
    if (biome.neve) {
      for (let y = HY; y < PH; y++) {
        for (let x = 0; x < PW; x++) if (get(x, y) === P.tree && get(x, y - 1) !== P.tree && r() < 0.7) px(x, y, P.snow);
      }
    }

    // 10. Primo piano: erba, fiori, rocce
    for (let x = 0; x < PW; x++) {
      if (isWater(get(x, PH - 1))) continue;
      // Canne alte in palude, poche erbe secche nel deserto, ciuffi altrove
      const blades = biome.albero === "secco" ? 2 + Math.floor(r() * 7) : biome.secco ? (r() < 0.3 ? 1 + Math.floor(r() * 2) : 0) : 1 + Math.floor(r() * 4);
      for (let y = PH - blades; y < PH; y++) px(x, y, r() < 0.5 ? P.grass : P.grassDark);
      if (biome.albero === "secco" && blades > 6) px(x, PH - blades, P.trunk); // la spiga della canna
      if (!night && r() < 0.04) px(x, PH - blades - 1, r() < 0.5 ? P.flower : P.flower2);
    }
    for (let i = 0; i < 3; i++) {
      const x = 20 + r() * (PW - 40), y = PH - 3;
      if ([-6, 0, 6].some((dx) => isWater(get(Math.round(x + dx), y)))) continue;
      ellipse(x, y, 3 + r() * 2, 2, (xx, yy) => (yy < y - 0.5 ? P.rockLight : P.rock));
    }

    // Il fuoco del ricercato, di notte: un puntino rosso tra gli alberi, e nient'altro
    if (zone.campfire) {
      const fx = Math.round(24 + r() * (PW - 48)), fy = Math.round(HY + 9 + r() * 5);
      for (const [dx, dy] of [[-1, 0], [2, 0], [0, -1], [1, -1], [0, 1], [1, 1]]) px(fx + dx, fy + dy, mix(get(fx + dx, fy + dy), "#8a2a14", 0.6, fx + dx, fy + dy));
      px(fx, fy, "#ff4a20");
      px(fx + 1, fy, "#ffb040");
    }

    // Il fumo grasso del campo dei bucanieri (il boucan, la carne affumicata): una colonna che sale dagli alberi
    if (zone.smoke) {
      let sx = 30 + r() * (PW - 60);
      const smoke = tintHex("#d8d4cc", zone.time), smokeDark = tintHex("#8a8680", zone.time);
      for (let y = HY + 14; y > 2; y--) {
        sx += Math.sin(y * 0.35) * 0.5 + 0.15;
        const w = y > HY ? 1 : 1 + (HY - y) / 14;
        for (let k = 0; k < w; k++) if (r() < (y < 12 ? 0.55 : 0.95)) px(sx + k, y, k === 0 ? smoke : smokeDark);
      }
      if (night) { px(Math.round(sx), HY + 15, "#ff9a40"); px(Math.round(sx) + 1, HY + 15, "#ffd060"); }
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
    // le cartoline verticali delle città riempiono l'altezza del riquadro, senza uscirne
    const room = PH > PW ? container.parentElement.clientHeight - 12 : Infinity;
    const width = Math.floor(Math.min(container.clientWidth || 440, (room * PW) / PH));
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
    last = { buf: compose(zone), container, size: [PW, PH] };
    redraw();
  }

  function redraw() {
    if (!last) return;
    [PW, PH] = last.size;
    drawPixels(last.buf, canvasFor(last.container));
  }

  return { render, redraw };
})();
