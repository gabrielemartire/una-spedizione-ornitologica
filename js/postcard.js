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
    const finish = () => (zone.style ? stylize(buf, PW, PH, zone.style) : buf);
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
    const items = [["fiume", 28, 28], ["lago", 40, 26], ["castello", 30, 30], ["villaggio", 34, 14], ["rovine", 26, 14]]
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
    const townHouse = (x0, y0, w, h, roofH, { plaster = PLASTER[Math.floor(r() * PLASTER.length)], slate = r() < 0.35, timber = r() < 0.5 } = {}) => {
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
          const on = night && r() < 0.7;
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
    // Montagne a punta fino a `base`: [x della cima, y della cima, pendenza]; la cima innevata
    const peaks = (base, list) => {
      for (const [cx, cy, slope] of list) {
        for (let y = cy; y < base; y++) {
          const half = (y - cy) * slope * 1.4;
          for (let x = Math.floor(cx - half); x <= cx + half; x++) {
            const left = x < cx, lit = lightLeft ? left : !left;
            const snowy = y - cy < 6 + Math.abs(Math.sin(x * 1.7)) * 3;
            px(x, y, snowy ? (lit ? P.snow : P.snowShadow) : lit ? P.far : P.farShadow);
          }
        }
      }
    };
    // Le case di legno del nord: falu rosso, ocra, blu; cornici bianche e neve sul tetto
    const NORDIC = ["#a8322a", "#d89a30", "#2e4e86", "#ece6d8", "#8a2a24", "#3a6a5a"];

    // Il Forte (80 × 120): si guarda giù per la strada principale, fino alla porta nelle mura; dietro, il mare e le navi
    const drawForte = () => {
      const seaY = 28, wallTop = 50;
      for (let y = seaY; y < wallTop; y++) for (let x = 0; x < PW; x++) {
        let c = ramp([P.waterLight, P.water, P.waterDark], (y - seaY) / 22, x, y);
        if ((y * 5 + Math.floor((x + y * 3) / 4)) % 11 === 0) c = P.foam;
        px(x, y, c);
      }
      // il promontorio verde a destra, con il faro
      for (let x = 46; x < PW; x++) { const top = seaY - Math.round(6 * Math.sin(((x - 46) / 36) * Math.PI)); for (let y = top; y <= seaY; y++) px(x, y, y < top + 2 ? P.hillLight : P.hill); }
      block(66, seaY - 13, 3, 8, tint("#f4ecd8"), tint("#c8bca4")); px(66, seaY - 14, tint("#c8302a")); px(67, seaY - 14, tint("#c8302a")); px(68, seaY - 14, tint("#c8302a"));
      px(67, seaY - 15, night ? P.windowLit : tint("#f2c230"));
      // le navi alla fonda dietro le mura
      anchored(52, 47, 2); anchored(70, 45, 2);
      // le mura con i merli, due torri e il torrione della porta
      const stone = tint("#d0bc98"), stoneShadow = tint("#94805e"), stoneDark = tint("#5a4a36");
      const slate = tint("#3e4a62"), slateDark = tint("#262e40"), red = tint("#c8302a"), gold = tint("#f2c230");
      block(0, wallTop, PW, 14, stone, stoneShadow);
      crenels(0, wallTop, PW, stone, stoneShadow);
      for (let x = 0; x < PW; x++) for (let y = wallTop; y < wallTop + 14; y++) if ((x + (y % 4 < 2 ? 0 : 3)) % 6 === 0 && y % 2 === 0) px(x, y, stoneDark);
      for (let x = 0; x < PW; x++) px(x, wallTop + 13, stoneDark);
      for (const [tx, tw, th, cone, roofCol] of [[2, 12, 26, true, [tint("#c04a2e"), tint("#7a2a1a")]], [62, 12, 32, true, [slate, slateDark]]]) {
        const top = wallTop + 12 - th;
        block(tx, top, tw, th, stone, stoneShadow);
        crenels(tx, top, tw, stone, stoneShadow);
        if (cone) for (let k = 0; k < 10; k++) for (let x = tx + Math.floor(k * 0.65); x < tx + tw - Math.floor(k * 0.65); x++) px(x, top - 2 - k, (x + k) % 3 === 0 ? roofCol[1] : roofCol[0]);
        // la bandiera rossa in cima
        for (let y = 0; y < 5; y++) px(tx + tw / 2, top - 12 - y, stoneDark);
        for (let y = 0; y < 3; y++) for (let x = 1; x < 5; x++) px(tx + tw / 2 + x, top - 16 + y, (x + y) % 3 === 0 ? gold : red);
        for (const wy of [top + 6, top + 14]) { px(tx + tw / 2, wy, lit()); px(tx + tw / 2, wy + 1, lit()); }
      }
      // il torrione della porta, col tetto d'ardesia a punta, gli stendardi e l'arco
      const gx = 26, gw = 28, gTop = 42;
      block(gx, gTop, gw, 26, stone, stoneShadow);
      for (let x = gx; x < gx + gw; x++) for (let y = gTop; y < gTop + 26; y++) if ((x + (y % 4 < 2 ? 0 : 3)) % 7 === 0 && y % 2 === 0) px(x, y, stoneDark);
      for (let k = 0; k < 12; k++) for (let x = gx - 2 + k; x < gx + gw + 2 - k; x++) px(x, gTop - 1 - k, (x + k) % 4 === 0 ? slateDark : slate);
      block(gx + 12, gTop - 8, 4, 4, stone, stoneShadow); px(gx + 13, gTop - 7, lit()); px(gx + 14, gTop - 7, lit());
      for (const bx of [gx + 3, gx + gw - 7]) for (let y = gTop + 2; y < gTop + 14; y++) for (let x = bx; x < bx + 4; x++) px(x, y, y === gTop + 13 && (x - bx) % 3 !== 0 ? stone : x === bx + 1 || x === bx + 2 ? (y === gTop + 6 ? gold : red) : red);
      for (let y = gTop + 12; y < gTop + 26; y++) {
        const half = y < gTop + 15 ? Math.round(Math.sqrt(9 - (gTop + 15 - y) ** 2)) + 2 : 5;
        for (let x = gx + 14 - half; x < gx + 14 + half; x++) px(x, y, y > gTop + 21 ? tint("#d8cca8") : (x + y) % 3 === 0 && y < gTop + 18 ? tint("#4a3a2a") : tint("#1a1418"));
      }
      // la strada di ciottoli che scende verso di noi, allargandosi
      const roadTop = gTop + 26, cob = tint("#b0a284"), cobDark = tint("#6a5e4a"), cobLight = tint("#d0c4a4");
      for (let y = roadTop; y < PH; y++) {
        const t = (y - roadTop) / (PH - roadTop), half = 5 + t * 26;
        for (let x = Math.round(40 - half); x <= 40 + half; x++) {
          px(x, y, ((x + (y % 2) * 2) % 4 === 0 || y % 3 === 0) ? cobDark : (x + y) % 7 === 0 ? cobLight : cob);
        }
      }
      // le case ai lati della strada, alte e strette, colorate
      townHouse(-2, 44, 16, 76, 10, { plaster: "#e8b47a", timber: true });
      townHouse(14, 64, 8, 56, 5, { plaster: "#c8d4dc", slate: true });
      townHouse(66, 46, 16, 74, 10, { plaster: "#f0dcb0", timber: true });
      townHouse(58, 66, 8, 54, 5, { plaster: "#d8806a" });
      awning(8, 14, 92, 1, ["#c8302a", "#f4ecd8"]);
      awning(58, 14, 96, -1, ["#2e7a3a", "#f4ecd8"]);
      signboard(14, 76, 1, "#f2c230");
      signboard(66, 80, -1, "#2e5a9a");
      // le lanterne accese, di notte
      if (night) for (const [lx, ly] of [[13, 70], [67, 72]]) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) px(lx + dx, ly + dy, P.windowLit);
      // la gente per strada
      for (let i = 0; i < 12; i++) {
        const y = roadTop + 4 + Math.floor(r() * (PH - roadTop - 4)), t = (y - roadTop) / (PH - roadTop);
        person(Math.round(40 + (r() - 0.5) * (8 + t * 46)), y, 3 + Math.round(t * 6));
      }
    };

    // Il porticciolo del fiordo (80 × 120): le montagne innevate, la banchina di legno, le case colorate e il peschereccio
    const drawPorto = () => {
      const vx = 46, vy = 54; // il punto di fuga della banchina
      // le montagne del fiordo: tre cime, un versante in luce e uno in ombra, la neve in cima
      peaks(vy, [[8, 22, 0.9], [34, 14, 1.1], [64, 20, 1]]);
      // l'acqua del fiordo, con i riflessi delle case
      for (let y = vy; y < PH; y++) for (let x = 0; x < PW; x++) {
        let c = ramp([P.waterLight, P.water, P.waterDark], (y - vy) / 40, x, y);
        if ((y * 3 + Math.floor(x / 5)) % 9 === 0) c = P.waterLight;
        px(x, y, c);
      }
      // la riva lontana e i pini scuri
      for (let x = 0; x < PW; x++) for (let y = vy - 3; y <= vy; y++) px(x, y, P.snow);
      for (let x = 0; x < PW; x += 3) { const h = 4 + Math.floor(r() * 6); for (let k = 0; k < h; k++) for (let j = -Math.floor(k / 3); j <= Math.floor(k / 3); j++) px(x + j, vy - 2 - h + k, k === 0 ? P.snow : P.treeFar); }
      // le case di legno a destra, sempre più piccole verso il fondo: ognuna del suo colore, neve sui tetti
      const trim = tint("#f4f0e4"), roofCol = tint("#2a2a32"), snowRoof = P.snow;
      for (let i = 4; i >= 0; i--) {
        const t = i / 4, x0 = Math.round(vx + 3 + (1 - t) * 16), h = Math.round(5 + (1 - t) * 24), w = Math.round(7 + (1 - t) * 20);
        const base = Math.round(vy + 3 + (1 - t) * 44);
        const col = NORDIC[(i + Math.floor(r() * 3)) % NORDIC.length], wood = tint(col), woodDark = tint(shade(col, 0.7));
        for (let y = base - h; y < base; y++) for (let x = x0; x < Math.min(PW, x0 + w); x++) px(x, y, x === x0 ? trim : (x - x0) % 3 === 0 ? woodDark : wood);
        // il tetto ripido a capanna, con la neve sopra
        const rh = Math.round((w + 2) / 2);
        for (let k = 0; k < rh; k++) for (let x = x0 - 1 + k; x < Math.min(PW, x0 + w + 1 - k); x++) px(x, base - h - 1 - k, k >= rh - 3 || x === x0 - 1 + k || (k === 0 && x % 2) ? snowRoof : roofCol);
        const step = Math.max(4, Math.round(h / 2.2));
        for (let y = base - h + 2; y < base - 3; y += step) for (let x = x0 + 2; x < Math.min(PW, x0 + w) - 2; x += 5) {
          for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) px(x + dx, y + dy, night ? P.windowLit : tint("#1e2430"));
          for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [2, -1], [-1, 2], [0, 2], [1, 2], [2, 2]]) px(x + dx, y + dy, trim);
        }
        // il riflesso della casa nell'acqua, a righe
        for (let y = base; y < Math.min(PH, base + Math.round(h / 3)); y += 2) for (let x = x0; x < Math.min(PW, x0 + w); x += 2) if (get(x, y) !== null && x > vx + 3 + (y - vy) * 0.2) px(x, y, woodDark);
      }
      // la banchina di assi, in prospettiva, con i pali
      const plank = tint("#9a7048"), plankDark = tint("#5a3a22"), plankLight = tint("#c09468");
      for (let y = vy + 1; y < PH; y++) {
        const t = (y - vy) / (PH - vy);
        const xl = Math.round(vx - 2 - t * 30), xr = Math.round(vx + 3 + t * 10);
        for (let x = xl; x <= xr; x++) px(x, y, (Math.floor((x - vx) / (1 + t * 5)) % 2 === 0) ? plank : (y % 5 === 0 ? plankLight : plankDark));
        px(xl, y, plankDark);
        if (y % 9 === 0) for (let k = 0; k < 3 + t * 6; k++) px(xl - 1, y + k, plankDark);
      }
      // il peschereccio rosso ormeggiato a sinistra, con la cabina bianca e gli alberi
      const hull = tint("#c83a2a"), hullDark = tint("#7a1e14"), white = tint("#f4f0e4");
      for (let y = 74; y < 90; y++) for (let x = 0; x < 20 - Math.round((y - 74) * 0.3); x++) px(x, y, y < 77 ? white : y > 86 ? hullDark : y === 80 ? white : hull);
      for (let y = 66; y < 74; y++) for (let x = 3; x < 15; x++) px(x, y, (x === 6 || x === 11) && y < 70 ? (night ? P.windowLit : tint("#2a3a4a")) : y === 66 ? tint("#3a3a44") : white);
      for (const [mx, top] of [[4, 16], [13, 28]]) for (let y = top; y < 74; y++) px(mx, y, tint("#5a3a22"));
      for (let k = 0; k < 40; k++) px(4 + k * 0.35, 18 + k, tint("#3a3a3a"));
      px(13, 27, tint("#f2c230")); px(14, 27, tint("#f2c230"));
      // le boe a righe rosse e bianche e le gabbie per le aragoste
      for (const [bx, by, bh] of [[62, 112, 18], [56, 98, 12], [52, 82, 8], [50, 70, 5]]) {
        for (let y = by - bh; y < by; y++) for (let x = bx; x < bx + Math.ceil(bh / 3); x++) px(x, y, Math.floor((y - by) / Math.max(2, bh / 5)) % 2 ? white : x === bx ? hullDark : hull);
      }
      for (const [cx, cy, cs] of [[18, 116, 12], [38, 92, 7]]) {
        for (let y = cy - cs; y < cy; y++) for (let x = cx; x < cx + cs * 1.4; x++) if (x % 2 === 0 || y % 2 === 0) px(x, y, tint("#a07040"));
      }
      // il lampione in fondo alla banchina
      for (let y = 100; y < 118; y++) px(30, y, tint("#2a2a2a"));
      for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0]]) px(30 + dx, 99 + dy, night ? P.windowLit : tint("#e8d8a0"));
      if (r() < 0.6) person(vx + 2, vy + 14, 5);
      person(36, 112, 9);
      // un velo di foschia solo lontano, sulle montagne
      for (let y = 18; y < vy - 3; y++) for (let x = 0; x < PW; x++) px(x, y, mix(get(x, y), P.haze, 0.18, x, y));
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
        // le montagne innevate, i pini, le case colorate in fila sulla riva, la banchina e i pescherecci
        peaks(shoreY, [[10, 10, 1.2], [44, 4, 1], [80, 8, 1.3], [112, 12, 1]]);
        for (let x = 0; x < PW; x += 3) { const h = 4 + Math.floor(r() * 5); for (let k = 0; k < h; k++) for (let j = -Math.floor(k / 3); j <= Math.floor(k / 3); j++) px(x + j, shoreY - 6 - h + k, k === 0 ? P.snow : P.treeFar); }
        for (let x = 0; x < PW; x++) for (let y = shoreY - 6; y < shoreY; y++) px(x, y, P.snow);
        for (let x = 18, i = 0; x < 104; i++) {
          const w = 6 + Math.floor(r() * 4), h = 6 + Math.floor(r() * 4), col = NORDIC[i % NORDIC.length];
          for (let y = shoreY - h; y < shoreY; y++) for (let xx = x; xx < x + w; xx++) px(xx, y, xx === x ? tint("#f4f0e4") : tint(col));
          for (let k = 0; k < 4; k++) for (let xx = x - 1 + k; xx <= x + w - k; xx++) px(xx, shoreY - h - 1 - k, k >= 2 ? P.snow : tint("#2a2a32"));
          px(x + 2, shoreY - h + 2, night ? P.windowLit : tint("#1e2430")); px(x + w - 3, shoreY - h + 2, night ? P.windowLit : tint("#1e2430"));
          x += w + 1;
        }
        for (let x = 30; x < 70; x++) { px(x, shoreY + 1, tint("#9a7048")); px(x, shoreY + 2, tint("#5a3a22")); }
        for (let x = 30; x < 70; x += 5) for (let y = shoreY + 3; y < shoreY + 6; y++) px(x, y, tint("#5a3a22"));
        for (const bx of [36, 58]) {
          for (let y = shoreY + 6; y < shoreY + 9; y++) for (let x = bx - 6 + (y - shoreY - 6); x < bx + 6 - (y - shoreY - 6); x++) px(x, y, y === shoreY + 6 ? tint("#f4f0e4") : tint("#c83a2a"));
          block(bx - 2, shoreY + 3, 4, 3, tint("#f4f0e4"), tint("#c8c4b8"));
          for (let y = shoreY - 6; y < shoreY + 3; y++) px(bx + 3, y, tint("#5a3a22"));
        }
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
    if (zone.city === "forte") { drawForte(); return finish(); }
    if (zone.city === "porto") { drawPorto(); return finish(); }
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
    for (let y = waterTop; y < PH && spots.fiume; y++) {
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
      if (Math.abs(x - rx) < 12) continue;
      ellipse(x, y, 3 + r() * 2, 2, (xx, yy) => (yy < y - 0.5 ? P.rockLight : P.rock));
    }

    // Il fumo del fuoco del ricercato: una colonna sottile che sale dagli alberi
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

  // La variante delle cartoline delle città, da provare: i contorni scuri dove cambia la forma
  const lum = (hex) => { const [r, g, b] = rgb(hex); return 0.3 * r + 0.59 * g + 0.11 * b; };
  function stylize(buf, w, h, style) {
    if (style === "contorni") {
      const out = buf.slice();
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const l = lum(buf[y * w + x]);
          const jump = [[1, 0], [0, 1], [-1, 0], [0, -1]].some(([dx, dy]) => {
            const nx = x + dx, ny = y + dy;
            return nx >= 0 && ny >= 0 && nx < w && ny < h && lum(buf[ny * w + nx]) - l > 70;
          });
          if (jump) out[y * w + x] = "#14100c";
        }
      }
      return out;
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
