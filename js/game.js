// Prototipo della battlemap: una zona, un uccello da osservare, un orso da evitare.
// Espone l'oggetto globale `Gioco`.
const Gioco = (() => {
  const W = 24;
  const H = 16;
  const OBSERVE = 5.5;    // portata del binocolo
  const BEAR_SIGHT = 8;
  const BEAR_HEARING = 3; // l'orso sente un po' più lontano del rumore stesso
  const BEAR_DAMAGE = 4;
  const MAX_HP = 10;

  // noise = raggio del rumore in caselle; hide = chi ci sta dentro si vede solo da vicino
  const TILES = {
    sea:   { ch: "≈", cls: "t-sea",   walk: false, sight: true },
    grass: { ch: ".", cls: "t-grass", walk: true,  sight: true, noise: 2, sound: "passoErba" },
    tall:  { ch: '"', cls: "t-tall",  walk: true,  sight: true, noise: 1, sound: "passoErba", hide: true },
    bush:  { ch: "♠", cls: "t-bush",  walk: true,  sight: true, noise: 3, sound: "cespuglio", hide: true },
    tree:  { ch: "♣", cls: "t-tree",  walk: false, sight: false, name: "un albero" },
    rock:  { ch: "▲", cls: "t-rock",  walk: false, sight: false, name: "una roccia" },
    water: { ch: "≈", cls: "t-water", walk: true,  sight: true, noise: 4, sound: "passoAcqua" },
    deep:  { ch: "≈", cls: "t-deep",  walk: false, sight: true },
    ship:  { ch: "⚓", cls: "t-ship",  walk: true,  sight: true, noise: 0 },
  };

  const BIRD = { id: 17, nome: "Becco Blu", flee: 2.5, need: 4 };

  let s = null;
  let el = null;

  // --- Utilità ---

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

  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const same = (a, b) => a.x === b.x && a.y === b.y;
  const tile = (map, x, y) => TILES[map[y][x]];
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // Linea di vista (Bresenham): alberi e rocce intermedi bloccano la vista
  function los(map, a, b) {
    let x = a.x, y = a.y;
    const dx = Math.abs(b.x - x), dy = -Math.abs(b.y - y);
    const sx = x < b.x ? 1 : -1, sy = y < b.y ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      if (x === b.x && y === b.y) return true;
      if ((x !== a.x || y !== a.y) && !tile(map, x, y).sight) return false;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  }

  function reachable(map, from) {
    const seen = new Set([`${from.x},${from.y}`]);
    const queue = [from];
    while (queue.length) {
      const c = queue.shift();
      for (const [dx, dy] of DIRS) {
        const x = c.x + dx, y = c.y + dy, key = `${x},${y}`;
        if (inside(x, y) && tile(map, x, y).walk && !seen.has(key)) {
          seen.add(key);
          queue.push({ x, y });
        }
      }
    }
    return seen;
  }

  // Le caselle da cui si può osservare l'uccello: fuori dall'anello di fuga, dentro la portata, in vista
  function bandCells(map, bird) {
    const cells = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const d = dist({ x, y }, bird);
        if (d > BIRD.flee && d <= OBSERVE && tile(map, x, y).walk && los(map, { x, y }, bird)) cells.push({ x, y });
      }
    }
    return cells;
  }

  // --- Generazione della zona ---

  function generate(seed) {
    for (let attempt = 0; ; attempt++) {
      const zone = tryGenerate(rng(seed + attempt * 7919));
      if (zone) return zone;
    }
  }

  function tryGenerate(r) {
    const map = Array.from({ length: H }, () => Array(W).fill("grass"));
    const pick = (arr) => arr[Math.floor(r() * arr.length)];
    const shipY = 3 + Math.floor(r() * (H - 6));

    // Il mare a ovest, la nave ormeggiata sulla costa
    for (let y = 0; y < H; y++) {
      const shore = Math.abs(y - shipY) <= 1 ? 1 : 1 + (r() < 0.4 ? 1 : 0);
      for (let x = 0; x < shore; x++) map[y][x] = "sea";
    }
    map[shipY][0] = "ship";
    const ship = { x: 0, y: shipY };
    const start = { x: 1, y: shipY };

    // Un ruscello che scende da nord a sud, con qualche pozza profonda
    let sx = 11 + Math.floor(r() * 7);
    for (let y = 0; y < H; y++) {
      sx = Math.max(7, Math.min(W - 3, sx + (r() < 0.3 ? -1 : r() < 0.45 ? 1 : 0)));
      map[y][sx] = "water";
      if (r() < 0.45) map[y][sx + 1] = "water";
      else if (r() < 0.12) map[y][sx] = "deep";
    }

    const blob = (type, count, radius, density) => {
      for (let i = 0; i < count; i++) {
        const cx = 2 + Math.floor(r() * (W - 2)), cy = Math.floor(r() * H);
        for (let y = cy - radius; y <= cy + radius; y++) {
          for (let x = cx - radius; x <= cx + radius; x++) {
            if (inside(x, y) && map[y][x] === "grass" && Math.hypot(x - cx, y - cy) <= radius + 0.3 && r() < density) {
              map[y][x] = type;
            }
          }
        }
      }
    };
    blob("tree", 7, 2, 0.6);
    blob("tall", 5, 2, 0.7);
    blob("bush", 14, 0, 1);
    blob("rock", 8, 0, 1);

    // Spazio libero allo sbarco
    for (let y = shipY - 1; y <= shipY + 1; y++) {
      for (let x = 1; x <= 2; x++) if (inside(x, y) && map[y][x] !== "sea") map[y][x] = "grass";
    }

    const ok = reachable(map, start);
    const free = [...ok].map((k) => { const [x, y] = k.split(",").map(Number); return { x, y }; })
      .filter((c) => map[c.y][c.x] === "grass" || map[c.y][c.x] === "tall");

    // L'uccello ama stare vicino all'acqua o agli alberi
    const nearWater = (c) => DIRS.some(([dx, dy]) => inside(c.x + dx, c.y + dy) && ["water", "tree"].includes(map[c.y + dy][c.x + dx]));
    const birdSpots = free.filter((c) => dist(c, start) >= 9 && nearWater(c)
      && bandCells(map, c).filter((b) => ok.has(`${b.x},${b.y}`)).length >= 4);
    if (!birdSpots.length) return null;
    const bird = pick(birdSpots);

    const bearSpots = free.filter((c) => dist(c, start) >= 10 && dist(c, bird) >= 4);
    if (!bearSpots.length) return null;
    const bear = pick(bearSpots);

    return { map, ship, start, bird, bear };
  }

  // --- Partita ---

  function start() {
    const seed = Math.floor(Math.random() * 1e9);
    const zone = generate(seed);
    s = {
      seed,
      map: zone.map,
      ship: zone.ship,
      startPos: zone.start,
      player: { ...zone.start, hp: MAX_HP },
      bird: { ...zone.bird, progress: 0, observed: false, flights: 0, gone: false },
      bear: { ...zone.bear, state: "idle", dir: null, stun: 0, target: null },
      turn: 0,
      noise: 0,
      log: [],
      over: false,
    };
    buildDom();
    log("Sbarchi in una radura. Da qualche parte, vicino all'acqua, canta un uccello.");
    Suoni.toggleAmbient("vento");
    render();
  }

  function log(msg) {
    s.log.unshift(msg);
    s.log.length = Math.min(s.log.length, 7);
  }

  function hidden() {
    return !!tile(s.map, s.player.x, s.player.y).hide;
  }

  function bearSees() {
    const o = s.bear, p = s.player, d = dist(o, p);
    return d <= BEAR_SIGHT && los(s.map, o, p) && (!hidden() || d < 1.5);
  }

  function act(dx, dy) {
    if (!s || s.over) return;
    const p = s.player;
    let noise = 0;

    if (dx || dy) {
      const nx = p.x + dx, ny = p.y + dy;
      if (!inside(nx, ny) || !tile(s.map, nx, ny).walk || same(s.bear, { x: nx, y: ny })) return;
      p.x = nx;
      p.y = ny;
      const t = tile(s.map, nx, ny);
      if (t === TILES.ship) return endZone();
      noise = t.noise;
      Suoni.play(t.sound);
    }

    s.turn++;
    s.noise = noise;
    birdTurn(!dx && !dy);
    bearTurn();
    render();
  }

  // --- Uccello ---

  function birdTurn(waited) {
    const b = s.bird, p = s.player;
    if (b.gone || b.observed) return;
    const d = dist(p, b);

    if (d <= BIRD.flee || (s.noise > 0 && d <= s.noise)) return flyAway(d <= BIRD.flee ? "Troppo vicino" : "Troppo rumore");

    if (waited && d <= OBSERVE && los(s.map, p, b)) {
      b.progress++;
      if (b.progress >= BIRD.need) {
        b.observed = true;
        Suoni.play("osservato");
        log(`✎ ${BIRD.nome} osservato e annotato nel taccuino! Torna alla nave.`);
      } else {
        log(`Osservi il ${BIRD.nome}… (${b.progress}/${BIRD.need})`);
      }
    } else if (d <= 10 && s.turn % 3 === 0) {
      Suoni.play("cinguettio", BIRD.id); // lo senti prima di vederlo
    }
  }

  function flyAway(reason) {
    const b = s.bird;
    b.flights++;
    b.progress = 0;
    Suoni.play("cinguettio", BIRD.id);
    if (b.flights >= 3) {
      b.gone = true;
      log(`${reason}: il ${BIRD.nome} vola via dalla zona per sempre.`);
      return;
    }
    const spots = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const c = { x, y };
        if (["grass", "tall"].includes(s.map[y][x]) && dist(c, s.player) >= 6 && !same(c, s.bear)) spots.push(c);
      }
    }
    Object.assign(b, spots[Math.floor(Math.random() * spots.length)]);
    log(`${reason}: il ${BIRD.nome} si sposta altrove. (${3 - b.flights} possibilità)`);
  }

  // --- Orso ---

  function bearTurn() {
    const o = s.bear, p = s.player;

    if (o.stun > 0) {
      o.stun--;
      if (!o.stun) { o.state = "idle"; log("L'orso si riprende, scuotendo la testa."); }
      return;
    }
    if (o.state === "charge") return charge();
    if (bearSees()) return aim();

    if (s.noise > 0 && dist(o, p) <= s.noise + BEAR_HEARING) {
      if (o.state !== "alert") log("L'orso ha sentito qualcosa e si avvicina.");
      o.state = "alert";
      o.target = { x: p.x, y: p.y };
    }
    if (o.state === "alert" && o.target) {
      step(o, o.target);
      if (same(o, o.target)) { o.state = "idle"; o.target = null; }
    } else if (Math.random() < 0.35) {
      step(o, null);
    }
  }

  function aim() {
    const o = s.bear, p = s.player;
    const dx = p.x - o.x, dy = p.y - o.y;
    o.dir = Math.abs(dx) >= Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
    o.state = "charge";
    Suoni.play("orso");
    log("L'orso ti ha visto! Caricherà in linea retta: spostati!");
  }

  // Le caselle che l'orso attraverserà caricando, e cosa lo fermerà
  function chargePath() {
    const o = s.bear, cells = [];
    let x = o.x, y = o.y;
    for (;;) {
      const nx = x + o.dir.x, ny = y + o.dir.y;
      if (!inside(nx, ny)) return { cells, stop: null };
      const t = tile(s.map, nx, ny);
      if (!t.walk || t === TILES.ship) return { cells, stop: t };
      cells.push({ x: nx, y: ny });
      x = nx;
      y = ny;
    }
  }

  function charge() {
    const o = s.bear, p = s.player;
    const { cells, stop } = chargePath();
    const hit = cells.findIndex((c) => same(c, p));
    const end = hit >= 0 ? cells[hit - 1] || { x: o.x, y: o.y } : cells[cells.length - 1] || { x: o.x, y: o.y };
    o.x = end.x;
    o.y = end.y;
    o.dir = null;
    o.state = "idle";

    if (hit >= 0) {
      Suoni.play("tonfo");
      p.hp = Math.max(0, p.hp - BEAR_DAMAGE);
      log(`L'orso ti travolge! −${BEAR_DAMAGE} vita.`);
      if (!p.hp) die();
    } else if (stop && !stop.sight) {
      o.stun = 3;
      Suoni.play("tonfo");
      log(`L'orso si schianta contro ${stop.name}! È stordito per 3 turni.`);
    } else {
      log("L'orso carica a vuoto e si ferma, confuso.");
    }
  }

  function step(o, target) {
    const options = DIRS.map(([dx, dy]) => ({ x: o.x + dx, y: o.y + dy }))
      .filter((c) => inside(c.x, c.y) && tile(s.map, c.x, c.y).walk && s.map[c.y][c.x] !== "ship" && !same(c, s.player));
    if (!options.length) return;
    const next = target
      ? options.sort((a, b) => dist(a, target) - dist(b, target))[0]
      : options[Math.floor(Math.random() * options.length)];
    o.x = next.x;
    o.y = next.y;
  }

  // --- Fine zona ---

  function endZone() {
    s.over = true;
    const b = s.bird;
    const esito = b.observed ? `Hai annotato il <strong>${BIRD.nome}</strong> nel taccuino.`
      : b.gone ? `Il ${BIRD.nome} è volato via. Andrà meglio la prossima volta.`
      : `Torni a bordo senza aver osservato il ${BIRD.nome}.`;
    showOverlay("Di nuovo a bordo", `${esito}<br>Turni a terra: ${s.turn} · Vita: ${s.player.hp}/${MAX_HP}`, true);
    Suoni.play("campana");
  }

  function die() {
    s.over = true;
    showOverlay("Sbranato", `L'orso ha avuto la meglio.<br>Nel gioco completo qui finirebbe la spedizione.`, false);
  }

  function showOverlay(title, html, canStay) {
    render();
    el.overlay.innerHTML = `
      <h3>${title}</h3>
      <p>${html}</p>
      <nav class="menu">
        <button class="menu-item" data-game-action="new-zone">Salpa verso una nuova zona</button>
        ${canStay ? '<button class="menu-item" data-game-action="stay">Resta a terra</button>' : ""}
        <button class="menu-item" data-goto="screen-menu">Torna al menu</button>
      </nav>`;
    el.overlay.hidden = false;
    el.overlay.querySelector(".menu-item").focus();
  }

  function stay() {
    s.over = false;
    Object.assign(s.player, s.startPos);
    el.overlay.hidden = true;
    render();
  }

  // --- Disegno ---

  function buildDom() {
    el = {
      map: document.getElementById("map"),
      overlay: document.getElementById("map-overlay"),
      status: document.getElementById("status"),
      notebook: document.getElementById("notebook"),
      log: document.getElementById("log"),
    };
    el.overlay.hidden = true;
    el.map.innerHTML = "";
    el.cells = [];
    for (let y = 0; y < H; y++) {
      el.cells.push([]);
      for (let x = 0; x < W; x++) {
        const c = document.createElement("div");
        c.dataset.x = x;
        c.dataset.y = y;
        el.map.appendChild(c);
        el.cells[y].push(c);
      }
    }
    fitMap();
  }

  function fitMap() {
    if (!el) return;
    const box = el.map.parentElement.getBoundingClientRect();
    const cell = Math.max(14, Math.min(36, Math.floor(Math.min(box.width / W, (window.innerHeight * 0.62) / H))));
    el.map.style.setProperty("--cell", `${cell}px`);
  }

  function render() {
    const { map, player: p, bird: b, bear: o } = s;
    const band = !b.observed && !b.gone ? new Set(bandCells(map, b).map((c) => `${c.x},${c.y}`)) : new Set();
    const danger = o.state === "charge" && o.dir ? new Set(chargePath().cells.map((c) => `${c.x},${c.y}`)) : new Set();

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = TILES[map[y][x]];
        const c = el.cells[y][x];
        const key = `${x},${y}`;
        let ch = t.ch;
        let cls = `cell ${t.cls}`;
        delete c.dataset.intent;

        if (band.has(key)) cls += " band";
        if (danger.has(key)) cls += " danger";

        if (same(p, { x, y })) {
          ch = "@";
          cls += hidden() ? " e-player is-hidden" : " e-player";
        } else if (same(o, { x, y })) {
          ch = "B";
          cls += " e-bear";
          if (o.stun) c.dataset.intent = "z";
          else if (o.state === "charge") c.dataset.intent = "!";
          else if (o.state === "alert") c.dataset.intent = "?";
        } else if (!b.gone && same(b, { x, y })) {
          ch = "v";
          cls += b.observed ? " e-bird is-observed" : " e-bird";
        }
        c.textContent = ch;
        c.className = cls;
      }
    }

    const hearts = "♥".repeat(Math.ceil(p.hp / 2)) + "♡".repeat(Math.ceil(MAX_HP / 2) - Math.ceil(p.hp / 2));
    const noise = "●".repeat(s.noise) + "○".repeat(4 - s.noise);
    const bar = "▰".repeat(b.progress) + "▱".repeat(BIRD.need - b.progress);
    const bearState = o.stun ? `stordito (${o.stun})` : { idle: "tranquillo", alert: "in allerta", charge: "sta per caricare!" }[o.state];
    el.status.innerHTML = `
      <div><span>Vita</span><b class="hearts">${hearts}</b></div>
      <div><span>Turno</span><b>${s.turn}</b></div>
      <div><span>Rumore</span><b>${noise}</b></div>
      <div><span>Nascosto</span><b>${hidden() ? "sì" : "no"}</b></div>
      <div><span>Orso</span><b>${bearState}</b></div>
      <div><span>Seed</span><b>${s.seed}</b></div>`;

    const birdState = b.observed ? "✔ osservato" : b.gone ? "✗ volato via" : `${bar} ${b.progress}/${BIRD.need}`;
    el.notebook.innerHTML = `<div class="nb-row"><span>${b.observed ? "v" : "?"} ${BIRD.nome}</span><b>${birdState}</b></div>`;
    el.log.innerHTML = s.log.map((m, i) => `<li${i ? "" : ' class="is-new"'}>${m}</li>`).join("");
  }

  // --- Comandi ---

  const KEYS = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
    " ": [0, 0], ".": [0, 0],
  };

  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("in-game") || !s || s.over) return;
    const k = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (!k) return;
    e.preventDefault();
    e.stopImmediatePropagation(); // le frecce muovono l'esploratore, non il menu
    act(...k);
  });

  document.addEventListener("click", (e) => {
    const action = e.target.closest("[data-game-action]")?.dataset.gameAction;
    if (action === "new-zone") { Suoni.stopAll(); start(); }
    if (action === "stay") stay();

    const cell = e.target.closest("#map > div");
    if (cell && s && !s.over) {
      const dx = cell.dataset.x - s.player.x, dy = cell.dataset.y - s.player.y;
      if (Math.abs(dx) + Math.abs(dy) <= 1) act(dx, dy);
    }
  });

  window.addEventListener("resize", fitMap);

  return { start };
})();
