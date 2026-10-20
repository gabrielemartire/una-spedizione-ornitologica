// La cartolina: il panorama della zona in ASCII, composto a layer dai tag della zona.
// Regola d'oro: niente di ciò che si vede è inventato, tutto viene dai tag.
// Espone l'oggetto globale `Cartolina`.
const Cartolina = (() => {
  const W = 60;
  const H = 20;
  const HORIZON = 9; // prima riga sotto il cielo

  // Una palette ridotta per ogni momento del giorno
  const PALETTES = {
    alba: {
      sky: ["#3b2f5c", "#9a4f78", "#e8915a"], sun: "#ffe08a", star: "#f7c6a3", cloud: "#f2b49a",
      far: "#6b5a8a", snow: "#f4e1ec", hill: "#4a5f45", stone: "#8f8090", roof: "#b8574a",
      treeFar: "#384f38", tree: "#22382a", trunk: "#4a3326", water: "#7b8fb8", foam: "#f7d7c4",
      ground: "#28331f", grass: "#7a9a50", rock: "#5e5662", bird: "#1e1a26",
    },
    pomeriggio: {
      sky: ["#3f78b8", "#78aad6", "#bcdcec"], sun: "#fff4c2", star: "#ffffff", cloud: "#f4f8fa",
      far: "#7489a0", snow: "#ffffff", hill: "#5f8a44", stone: "#b0a898", roof: "#a84a35",
      treeFar: "#46703a", tree: "#2a5226", trunk: "#5a4030", water: "#4f8a9a", foam: "#e8f4f4",
      ground: "#34522a", grass: "#a3c46a", rock: "#7e7e70", bird: "#1a1a1a",
    },
    notte: {
      sky: ["#05080f", "#0b1528", "#16243e"], sun: "#e8ecd0", star: "#c8d0e0", cloud: "#22314a",
      far: "#1a2538", snow: "#8a98b0", hill: "#14221e", stone: "#3c4250", roof: "#2e2632",
      treeFar: "#0f1e1a", tree: "#091510", trunk: "#17120e", water: "#1e3650", foam: "#7f9fb8",
      ground: "#0b130f", grass: "#284232", rock: "#2e323c", bird: "#c8d0e0",
    },
  };

  // Nei disegni: "#" = blocco pieno del colore, spazio = trasparente, il resto = carattere
  const SPRITES = {
    castle: [
      "    ^        ",
      "  #_#_#   #_#",
      "  #####   ###",
      "#_#####_#_###",
      "#############",
      "###:####:####",
    ],
    village: [
      "  ^     ^   ",
      " ###   ###  ",
      "#####:#####:",
      "#:#:# #:#:# ",
    ],
    ruins: [
      "#     #   ",
      "#  #  # # ",
      "## # ## # ",
    ],
    pine: [
      "   #   ",
      "  ###  ",
      "  ###  ",
      " ##### ",
      " ##### ",
      "#######",
      "   |   ",
    ],
    cloud: [
      "  .--.   ",
      ".(    ).-.",
      " `-------'",
    ],
  };

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

  function compose(zone) {
    const r = rng(zone.seed ^ 0x5bd1e995);
    const P = PALETTES[zone.time];
    const grid = Array.from({ length: H }, () => Array.from({ length: W }, () => ({ ch: " ", fg: null, bg: P.ground })));
    const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

    const put = (x, y, ch, fg, bg) => {
      if (!inside(x, y)) return;
      const c = grid[y][x];
      c.ch = ch;
      if (fg) c.fg = fg;
      if (bg) c.bg = bg;
    };
    const fill = (x, y, color) => put(x, y, " ", null, color);
    const sprite = (name, x, y, color, glyph = color) => {
      SPRITES[name].forEach((line, dy) => [...line].forEach((ch, dx) => {
        if (ch === "#") fill(x + dx, y + dy, color);
        else if (ch !== " ") put(x + dx, y + dy, ch, glyph);
      }));
    };
    // Una linea di cresta morbida: la somma di qualche onda con fasi casuali
    const ridge = (base, amp, waves, period) => {
      const ph = Array.from({ length: waves }, () => r() * Math.PI * 2);
      return Array.from({ length: W }, (_, x) =>
        Math.round(base - amp * ph.reduce((sum, p, i) => sum + Math.sin(x / (period + i * 4) + p) / (i + 1), 0) / 1.5));
    };

    let rx = 18 + Math.floor(r() * 24);
    const taken = [[rx - 6, rx + 8]];
    // Sceglie una x libera per un disegno largo `width`, lontano da cascata ed edifici
    const freeX = (width) => {
      for (let i = 0; i < 40; i++) {
        const x = 2 + Math.floor(r() * (W - width - 4));
        if (taken.every(([a, b]) => x + width < a || x > b)) {
          taken.push([x, x + width]);
          return x;
        }
      }
      return -100; // nessun posto: meglio non disegnarlo che coprirlo
    };

    // 1. Cielo, a tre fasce
    for (let y = 0; y < HORIZON; y++) {
      const band = P.sky[Math.min(2, Math.floor((y / HORIZON) * 3))];
      for (let x = 0; x < W; x++) fill(x, y, band);
    }
    if (zone.time === "notte") {
      for (let i = 0; i < 26; i++) put(Math.floor(r() * W), Math.floor(r() * (HORIZON - 1)), r() < 0.2 ? "*" : "·", P.star);
      const mx = 8 + Math.floor(r() * 40);
      [" ## ", "####", " ## "].forEach((l, dy) => [...l].forEach((c, dx) => c === "#" && fill(mx + dx, 1 + dy, P.sun)));
    } else if (zone.time === "alba") {
      const sx = 6 + Math.floor(r() * 44);
      ["  ####  ", " ###### ", "########"].forEach((l, dy) => [...l].forEach((c, dx) => c === "#" && fill(sx + dx, HORIZON - 3 + dy, P.sun)));
    } else {
      const sx = 40 + Math.floor(r() * 14);
      [" ## ", "####", " ## "].forEach((l, dy) => [...l].forEach((c, dx) => c === "#" && fill(sx + dx, 1 + dy, P.sun)));
    }

    // 2. Nuvole
    const clouds = 1 + Math.floor(r() * 3);
    for (let i = 0; i < clouds; i++) sprite("cloud", Math.floor(r() * (W - 10)), Math.floor(r() * 4), P.cloud);

    // 3. Montagne lontane, con la neve sulle cime più alte
    if (zone.tags.has("montagne")) {
      const peaks = ridge(HORIZON - 3, 3, 3, 2);
      for (let x = 0; x < W; x++) {
        for (let y = Math.max(2, peaks[x]); y <= HORIZON + 3; y++) fill(x, y, y === peaks[x] && peaks[x] <= 4 ? P.snow : P.far);
      }
    }

    // 4. Il castello su un'altura lontana
    if (zone.tags.has("castello")) sprite("castle", freeX(13), HORIZON - 4, P.stone, P.sky[0]);

    // 5. Colline
    const hills = zone.tags.has("colline") ? ridge(HORIZON + 1, 2, 2, 6) : Array(W).fill(HORIZON);
    for (let x = 0; x < W; x++) {
      for (let y = hills[x]; y < H; y++) fill(x, y, y < HORIZON + 4 ? P.hill : P.ground);
    }

    // 6. Villaggio e rovine sulle colline
    if (zone.tags.has("villaggio")) sprite("village", freeX(12), HORIZON, P.roof, P.stone);
    if (zone.tags.has("rovine")) sprite("ruins", freeX(10), HORIZON + 3, P.stone, P.stone);

    // 7. La foresta lontana
    for (let x = 0; x < W; x++) {
      if (r() < 0.7) put(x, HORIZON + 4, "♣", P.treeFar);
      if (r() < 0.4) put(x, HORIZON + 5, "♣", P.treeFar);
    }

    // 8. L'acqua: il ruscello che scende verso di noi, forse da una cascata
    let top = HORIZON + 4;
    if (zone.tags.has("cascata")) {
      for (let y = HORIZON; y <= HORIZON + 5; y++) {
        for (let x = rx - 5; x <= rx + 6; x++) fill(x, y, P.rock);
      }
      for (let y = HORIZON; y <= HORIZON + 5; y++) {
        for (let x = rx - 1; x <= rx + 2; x++) put(x, y, (x + y) % 3 ? "|" : "!", P.foam, P.water);
      }
      for (let x = rx - 3; x <= rx + 4; x++) put(x, HORIZON + 6, x % 2 ? "*" : "~", P.foam, P.water);
      top = HORIZON + 7;
    }
    for (let y = top; y < H; y++) {
      const half = 1 + Math.floor((y - top) * 0.7);
      rx += r() < 0.3 ? -1 : r() < 0.4 ? 1 : 0;
      for (let x = rx - half; x <= rx + half + 1; x++) put(x, y, r() < 0.25 ? "~" : " ", P.foam, P.water);
    }

    // 9. I pini in primo piano fanno da cornice
    sprite("pine", -2 + Math.floor(r() * 3), H - 9, P.tree);
    sprite("pine", W - 6 - Math.floor(r() * 3), H - 8, P.tree);
    for (let y = H - 2; y < H; y++) {
      put(1 + Math.floor(r() * 3), y, "|", P.trunk);
    }

    // 10. Primo piano: erba e rocce
    for (let x = 0; x < W; x++) {
      const y = H - 1 - (r() < 0.4 ? 1 : 0);
      if (grid[y][x].bg !== P.water && r() < 0.55) put(x, y, r() < 0.5 ? '"' : ",", P.grass);
    }
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(r() * (W - 3)), y = H - 2 + Math.floor(r() * 2);
      if (grid[y][x].bg !== P.water) { fill(x, y, P.rock); fill(x + 1, y, P.rock); }
    }

    // 11. L'uccello della zona, in volo, solo se c'è ancora
    if (zone.bird) {
      const bx = 10 + Math.floor(r() * (W - 20)), by = 2 + Math.floor(r() * 4);
      put(bx, by, "v", P.bird);
      if (r() < 0.6) put(bx + 3, by + 1, "v", P.bird);
    }

    return grid;
  }

  function toHtml(grid) {
    const esc = (c) => (c === "<" ? "&lt;" : c === "&" ? "&amp;" : c === ">" ? "&gt;" : c);
    return grid.map((row) => {
      let html = "", run = "", style = null;
      for (const c of row) {
        const st = `color:${c.fg || "inherit"};background:${c.bg}`;
        if (st !== style) {
          if (run) html += `<span style="${style}">${run}</span>`;
          run = "";
          style = st;
        }
        run += esc(c.ch);
      }
      return html + `<span style="${style}">${run}</span>`;
    }).join("\n");
  }

  function render(zone, el) {
    el.innerHTML = toHtml(compose(zone));
    fit(el);
  }

  // Adatta la dimensione del carattere perché la cartolina riempia il riquadro
  function fit(el) {
    const probe = document.createElement("span");
    probe.textContent = "M".repeat(20);
    probe.style.visibility = "hidden";
    probe.style.position = "absolute";
    el.appendChild(probe);
    const ratio = probe.getBoundingClientRect().width / 20 / parseFloat(getComputedStyle(el).fontSize);
    probe.remove();
    const width = el.parentElement.clientWidth - 20;
    el.style.fontSize = `${Math.max(8, width / (W * ratio))}px`;
  }

  return { render, W, H };
})();
