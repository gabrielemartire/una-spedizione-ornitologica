// Prototipo della battlemap: una zona, un uccello da osservare, un orso da evitare.
// Si gioca "a scacchi": il giocatore fa i suoi passi, poi si muovono gli animali.
// Espone l'oggetto globale `Gioco`.
const Gioco = (() => {
  const W = 40;
  const H = 24;
  const STEPS = 3;            // passi del giocatore per round
  const FLEE = 1.5;           // più vicino di così l'uccello scappa
  const OBSERVE = 3.5;        // portata del binocolo
  const BIRD_LEAVE = 0.35;    // probabilità che, spaventato, lasci la zona invece di spostarsi
  const BEAR_SPEED = { hunt: 4, search: 3, wander: 1 }; // passi a round; l'acqua ne costa 2
  const BEAR_SIGHT = 10;
  const BEAR_SMELL = 6;       // ti fiuta entro questa distanza, se non sei nascosto
  const BEAR_HEARING = 2;     // l'orso sente un po' più lontano del rumore stesso
  const BEAR_DAMAGE = 4;
  const MAX_HP = 10;
  const PHASE_PAUSE = 550;    // ms: annuncio del turno degli animali
  const STEP_DELAY = 170;     // ms: ogni passo di un animale

  // noise = raggio del rumore in caselle; hide = chi ci sta dentro si vede solo da vicino
  const TILES = {
    sea:   { ch: "≈", cls: "t-sea",   walk: false, sight: true },
    grass: { ch: ".", cls: "t-grass", walk: true,  sight: true, noise: 2, sound: "passoErba" },
    tall:  { ch: '"', cls: "t-tall",  walk: true,  sight: true, noise: 1, sound: "passoErba", hide: true },
    bush:  { ch: "♠", cls: "t-bush",  walk: true,  sight: true, noise: 3, sound: "cespuglio", hide: true },
    tree:  { ch: "♣", cls: "t-tree",  walk: false, sight: false },
    rock:  { ch: "▲", cls: "t-rock",  walk: false, sight: false },
    water: { ch: "≈", cls: "t-water", walk: true,  sight: true, noise: 4, sound: "passoAcqua" },
    deep:  { ch: "≈", cls: "t-deep",  walk: false, sight: true },
    ship:  { ch: "⚓", cls: "t-ship",  walk: true,  sight: true, noise: 0 },
  };

  const BIRD = { id: 17, nome: "Becco Blu" };

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
  const key = (c) => `${c.x},${c.y}`;
  const tile = (map, x, y) => TILES[map[y][x]];
  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

  // Ricerca in ampiezza: la distanza in passi di ogni casella raggiungibile, e da dove ci si arriva
  function bfs(map, from, maxDepth = Infinity, passable = (c) => tile(map, c.x, c.y).walk) {
    const depth = new Map([[key(from), 0]]);
    const prev = new Map();
    const queue = [from];
    while (queue.length) {
      const c = queue.shift();
      const d = depth.get(key(c));
      if (d >= maxDepth) continue;
      for (const [dx, dy] of DIRS) {
        const n = { x: c.x + dx, y: c.y + dy };
        if (inside(n.x, n.y) && !depth.has(key(n)) && passable(n)) {
          depth.set(key(n), d + 1);
          prev.set(key(n), c);
          queue.push(n);
        }
      }
    }
    return { depth, prev };
  }

  function pathFrom(prev, from, to) {
    const path = [];
    for (let c = to; c && !same(c, from); c = prev.get(key(c))) path.unshift(c);
    return path.length && prev.has(key(to)) ? path : null;
  }

  // Le caselle da cui si può osservare l'uccello: fuori dall'anello di fuga, dentro la portata, in vista
  function bandCells(map, bird) {
    const cells = [];
    for (let y = Math.floor(bird.y - OBSERVE); y <= bird.y + OBSERVE; y++) {
      for (let x = Math.floor(bird.x - OBSERVE); x <= bird.x + OBSERVE; x++) {
        if (!inside(x, y)) continue;
        const d = dist({ x, y }, bird);
        if (d > FLEE && d <= OBSERVE && tile(map, x, y).walk && los(map, { x, y }, bird)) cells.push({ x, y });
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
    const shipY = 4 + Math.floor(r() * (H - 8));

    // Il mare a ovest, la nave ormeggiata sulla costa
    let shore = 2;
    for (let y = 0; y < H; y++) {
      shore = Math.abs(y - shipY) <= 1 ? 1 : Math.max(1, Math.min(4, shore + (r() < 0.3 ? -1 : r() < 0.45 ? 1 : 0)));
      for (let x = 0; x < shore; x++) map[y][x] = "sea";
    }
    map[shipY][0] = "ship";
    const start = { x: 1, y: shipY };

    // Un ruscello che scende da nord a sud, con qualche pozza profonda
    let sx = 16 + Math.floor(r() * 12);
    for (let y = 0; y < H; y++) {
      sx = Math.max(10, Math.min(W - 4, sx + (r() < 0.3 ? -1 : r() < 0.45 ? 1 : 0)));
      map[y][sx] = "water";
      if (r() < 0.5) map[y][sx + 1] = "water";
      else if (r() < 0.12) map[y][sx] = "deep";
    }

    const blob = (type, count, radius, density) => {
      for (let i = 0; i < count; i++) {
        const cx = 3 + Math.floor(r() * (W - 3)), cy = Math.floor(r() * H);
        for (let y = cy - radius; y <= cy + radius; y++) {
          for (let x = cx - radius; x <= cx + radius; x++) {
            if (inside(x, y) && map[y][x] === "grass" && Math.hypot(x - cx, y - cy) <= radius + 0.3 && r() < density) {
              map[y][x] = type;
            }
          }
        }
      }
    };
    blob("tree", 16, 2, 0.6);
    blob("tall", 12, 2, 0.7);
    blob("bush", 40, 0, 1);
    blob("rock", 20, 0, 1);

    // Spazio libero allo sbarco
    for (let y = shipY - 1; y <= shipY + 1; y++) {
      for (let x = 1; x <= 3; x++) if (inside(x, y) && map[y][x] !== "sea") map[y][x] = "grass";
    }

    const reach = bfs(map, start).depth;
    const free = [...reach.keys()].map((k) => { const [x, y] = k.split(",").map(Number); return { x, y }; })
      .filter((c) => map[c.y][c.x] === "grass" || map[c.y][c.x] === "tall");

    // L'uccello ama stare vicino all'acqua o agli alberi
    const nearWater = (c) => DIRS.some(([dx, dy]) => inside(c.x + dx, c.y + dy) && ["water", "tree"].includes(map[c.y + dy][c.x + dx]));
    const birdSpots = free.filter((c) => dist(c, start) >= 14 && nearWater(c)
      && bandCells(map, c).filter((b) => reach.has(key(b))).length >= 3);
    if (!birdSpots.length) return null;
    const bird = pick(birdSpots);

    // L'orso fa la guardia al territorio dell'uccello
    const bearSpots = free.filter((c) => dist(c, start) >= 12 && dist(c, bird) >= 5 && dist(c, bird) <= 9);
    if (!bearSpots.length) return null;
    const bear = pick(bearSpots);

    return { map, start, bird, bear, free };
  }

  // --- Partita ---

  function start() {
    const seed = Math.floor(Math.random() * 1e9);
    const zone = generate(seed);
    s = {
      seed,
      map: zone.map,
      free: zone.free,
      startPos: zone.start,
      player: { ...zone.start, hp: MAX_HP },
      bird: { ...zone.bird, observed: false, gone: false },
      bear: { ...zone.bear, mode: "wander", last: null, searchLeft: 0, rest: 0 },
      round: 1,
      steps: STEPS,
      noise: 0,
      heard: [],
      log: [],
      busy: false,
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

  function canAct() {
    return s && !s.over && !s.busy;
  }

  // --- Azioni del giocatore ---

  function move(dx, dy) {
    if (!canAct()) return;
    const p = s.player;
    const n = { x: p.x + dx, y: p.y + dy };
    if (!inside(n.x, n.y) || !tile(s.map, n.x, n.y).walk || same(s.bear, n) || (!s.bird.gone && same(s.bird, n))) return;

    Object.assign(p, n);
    const t = tile(s.map, n.x, n.y);
    if (t === TILES.ship) return endZone();
    Suoni.play(t.sound);
    s.noise = t.noise;
    s.heard.push({ ...n, r: t.noise });

    // L'uccello reagisce subito: troppo vicino o troppo rumore
    const b = s.bird;
    if (!b.gone && !b.observed) {
      const d = dist(p, b);
      if (d <= FLEE) scare("Troppo vicino");
      else if (d <= t.noise) scare("Troppo rumore");
    }
    spendStep();
  }

  function observe() {
    if (!canAct()) return;
    const b = s.bird, p = s.player;
    s.noise = 0;
    if (b.gone || b.observed) {
      log("Non c'è più niente da osservare qui. Torna alla nave.");
      return render();
    }
    const d = dist(p, b);
    if (d <= OBSERVE && los(s.map, p, b)) {
      b.observed = true;
      Suoni.play("osservato");
      log(`✎ ${BIRD.nome} osservato e annotato nel taccuino! Torna alla nave.`);
    } else if (d <= OBSERVE) {
      log("Qualcosa ti copre la vista.");
    } else {
      log("Troppo lontano: il binocolo non basta.");
    }
    spendStep();
  }

  function spendStep() {
    s.steps--;
    if (s.steps <= 0) endRound();
    else render();
  }

  async function endRound() {
    if (!canAct()) return;
    const run = s; // se nel frattempo si torna al menu, l'animazione si ferma
    s.busy = true;
    phase("animals");
    render();
    await sleep(PHASE_PAUSE);
    if (s !== run) return;

    birdTurn();
    render();
    await sleep(STEP_DELAY);
    if (s !== run) return;

    await bearTurn();
    if (s !== run || s.over) return;

    s.round++;
    s.steps = STEPS;
    s.noise = 0;
    s.heard = [];
    s.busy = false;
    phase("player");
    render();
  }

  function phase(kind) {
    const animals = kind === "animals";
    el.banner.textContent = animals ? "Turno degli animali" : "Tocca a te";
    el.banner.className = `phase-banner ${animals ? "is-animals" : "is-player"}`;
    el.banner.hidden = false;
    el.map.classList.toggle("is-animals", animals);
    Suoni.play(animals ? "turnoAnimali" : "tuoTurno");
    clearTimeout(el.bannerTimer);
    if (!animals) el.bannerTimer = setTimeout(() => { el.banner.hidden = true; }, 700);
  }

  // --- Uccello ---

  function birdTurn() {
    const b = s.bird;
    if (b.gone || b.observed) return;
    if (dist(s.bear, b) <= 2) return scare("L'orso è passato troppo vicino");

    // Ogni tanto saltella su una casella vicina
    if (Math.random() < 0.25) {
      const hops = DIRS.map(([dx, dy]) => ({ x: b.x + dx, y: b.y + dy }))
        .filter((c) => inside(c.x, c.y) && ["grass", "tall"].includes(s.map[c.y][c.x])
          && !same(c, s.bear) && dist(c, s.player) > FLEE);
      if (hops.length) Object.assign(b, pickRandom(hops));
    }
    if (dist(s.player, b) <= 12 && s.round % 2 === 0) Suoni.play("cinguettio", BIRD.id); // lo senti prima di vederlo
  }

  function scare(reason) {
    const b = s.bird;
    Suoni.play("cinguettio", BIRD.id);
    const spots = s.free.filter((c) => dist(c, s.player) >= 8 && dist(c, s.bear) >= 4 && bandCells(s.map, c).length >= 3);
    if (!spots.length || Math.random() < BIRD_LEAVE) {
      b.gone = true;
      log(`${reason}: il ${BIRD.nome} vola via dalla zona. :(`);
      return;
    }
    Object.assign(b, pickRandom(spots));
    log(`${reason}: il ${BIRD.nome} vola in un altro punto della radura.`);
  }

  // --- Orso ---

  // Quanti passi costa all'orso entrare in una casella
  function bearCost(c) {
    const t = tile(s.map, c.x, c.y);
    if (!t.walk || t === TILES.ship) return Infinity;
    return t === TILES.water ? 2 : 1;
  }

  // Dijkstra a secchi: costo per raggiungere ogni casella, e da dove ci si arriva
  function bearPaths(maxCost = Infinity) {
    const from = { x: s.bear.x, y: s.bear.y };
    const cost = new Map([[key(from), 0]]);
    const prev = new Map();
    const buckets = [[from]];
    for (let d = 0; d < buckets.length; d++) {
      for (const c of buckets[d] || []) {
        if (cost.get(key(c)) !== d) continue;
        for (const [dx, dy] of DIRS) {
          const n = { x: c.x + dx, y: c.y + dy };
          if (!inside(n.x, n.y)) continue;
          const nd = d + bearCost(n);
          if (nd > maxCost || nd === Infinity || (cost.has(key(n)) && cost.get(key(n)) <= nd)) continue;
          cost.set(key(n), nd);
          prev.set(key(n), c);
          (buckets[nd] ||= []).push(n);
        }
      }
    }
    return { cost, prev };
  }

  function bearSees() {
    const o = s.bear, p = s.player, d = dist(o, p);
    if (hidden()) return d < 1.5;
    return d <= BEAR_SMELL || (d <= BEAR_SIGHT && los(s.map, o, p));
  }

  function bearHears() {
    return s.heard.some((n) => n.r > 0 && dist(s.bear, n) <= n.r + BEAR_HEARING);
  }

  // Le caselle che l'orso raggiunge se si mette a inseguirti
  function bearReach() {
    if (s.bear.rest) return new Map();
    return bearPaths(BEAR_SPEED.hunt).cost;
  }

  async function bearTurn() {
    const run = s, o = s.bear, p = s.player;
    if (o.rest) { o.rest--; return; }

    if (bearSees() || bearHears()) {
      if (o.mode !== "hunt") { Suoni.play("orso"); log("L'orso ti ha fiutato e ti insegue!"); }
      o.mode = "hunt";
      o.last = { x: p.x, y: p.y };
    } else if (o.mode === "hunt") {
      o.mode = "search";
      o.searchLeft = 3;
      log("L'orso ti ha perso e va a cercarti dove ti ha visto.");
    }

    const speed = BEAR_SPEED[o.mode];
    const { cost, prev } = bearPaths();
    let target = o.mode === "hunt" ? p : o.mode === "search" ? o.last : null;
    // Vagando, tende comunque a fiutare la tua direzione
    if (!target) {
      const around = DIRS.map(([dx, dy]) => ({ x: o.x + dx, y: o.y + dy }))
        .filter((c) => inside(c.x, c.y) && bearCost(c) < Infinity && !same(c, p));
      target = Math.random() < 0.6 ? p : pickRandom(around);
    }
    const path = target ? pathFrom(prev, o, target) || [] : [];

    let spent = 0;
    for (const c of path) {
      if (same(c, p)) break;
      spent += bearCost(c);
      if (spent > speed) break;
      o.x = c.x;
      o.y = c.y;
      Suoni.play("passoOrso");
      render();
      await sleep(STEP_DELAY);
      if (s !== run) return;
    }

    if (o.mode === "hunt" && cost.get(key(p)) <= speed) return attack();
    if (o.mode === "search" && same(o, o.last) && --o.searchLeft <= 0) o.mode = "wander";
  }

  function attack() {
    const p = s.player;
    s.bear.rest = 1;
    p.hp = Math.max(0, p.hp - BEAR_DAMAGE);
    Suoni.play("tonfo");
    el.map.classList.remove("is-hit");
    void el.map.offsetWidth; // fa ripartire l'animazione
    el.map.classList.add("is-hit");
    log(`L'orso ti raggiunge e ti colpisce! −${BEAR_DAMAGE} vita.`);
    if (!p.hp) die();
  }

  // --- Fine zona ---

  function endZone() {
    s.over = true;
    const b = s.bird;
    const esito = b.observed ? `Hai annotato il <strong>${BIRD.nome}</strong> nel taccuino.`
      : b.gone ? `Il ${BIRD.nome} è volato via. Andrà meglio la prossima volta.`
      : `Torni a bordo senza aver osservato il ${BIRD.nome}.`;
    showOverlay("Di nuovo a bordo", `${esito}<br>Round a terra: ${s.round} · Vita: ${s.player.hp}/${MAX_HP}`, true);
    Suoni.play("campana");
  }

  function die() {
    s.over = true;
    showOverlay("Sbranato", "L'orso ha avuto la meglio.<br>Nel gioco completo qui finirebbe la spedizione.", false);
  }

  function showOverlay(title, html, canStay) {
    el.banner.hidden = true;
    el.map.classList.remove("is-animals");
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
      banner: document.getElementById("phase-banner"),
      status: document.getElementById("status"),
      notebook: document.getElementById("notebook"),
      log: document.getElementById("log"),
    };
    el.overlay.hidden = true;
    el.banner.hidden = true;
    el.map.classList.remove("is-animals", "is-hit");
    el.map.innerHTML = "";
    el.map.style.gridTemplateColumns = `repeat(${W}, var(--cell))`;
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
    const cell = Math.max(10, Math.min(24, Math.floor(Math.min(box.width / W, (window.innerHeight * 0.62) / H))));
    el.map.style.setProperty("--cell", `${cell}px`);
  }

  function render() {
    const { map, player: p, bird: b, bear: o } = s;
    const band = !b.observed && !b.gone ? new Set(bandCells(map, b).map(key)) : new Set();
    const reach = bearReach();
    const hunting = o.mode === "hunt";

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = TILES[map[y][x]];
        const c = el.cells[y][x];
        const k = `${x},${y}`;
        let ch = t.ch;
        let cls = `cell ${t.cls}`;
        delete c.dataset.intent;

        if (band.has(k)) cls += " band";
        if (reach.get(k) > 0) cls += hunting ? " danger" : " reach";

        if (same(p, { x, y })) {
          ch = "@";
          cls += hidden() ? " e-player is-hidden" : " e-player";
        } else if (same(o, { x, y })) {
          ch = "B";
          cls += " e-bear";
          if (o.rest) c.dataset.intent = "z";
          else if (o.mode === "hunt") c.dataset.intent = "!";
          else if (o.mode === "search") c.dataset.intent = "?";
        } else if (!b.gone && same(b, { x, y })) {
          ch = "v";
          cls += b.observed ? " e-bird is-observed" : " e-bird";
        }
        c.textContent = ch;
        c.className = cls;
      }
    }

    const hearts = "♥".repeat(Math.ceil(p.hp / 2)) + "♡".repeat(Math.ceil(MAX_HP / 2) - Math.ceil(p.hp / 2));
    const steps = s.busy ? "aspetta…" : "●".repeat(s.steps) + "○".repeat(STEPS - s.steps);
    const noise = "●".repeat(s.noise) + "○".repeat(4 - s.noise);
    const bearState = o.rest ? "si riposa" : { wander: "fiuta in giro", search: "ti cerca", hunt: "ti insegue!" }[o.mode];
    el.status.innerHTML = `
      <div><span>Vita</span><b class="hearts">${hearts}</b></div>
      <div><span>Round</span><b>${s.round}</b></div>
      <div><span>Passi</span><b>${steps}</b></div>
      <div><span>Rumore</span><b>${noise}</b></div>
      <div><span>Nascosto</span><b>${hidden() ? "sì" : "no"}</b></div>
      <div><span>Orso</span><b>${bearState}</b></div>
      <div><span>Seed</span><b>${s.seed}</b></div>`;

    const birdState = b.observed ? "✔ osservato" : b.gone ? "✗ volato via" : "da osservare";
    el.notebook.innerHTML = `<div class="nb-row"><span>${b.observed ? "v" : "?"} ${BIRD.nome}</span><b>${birdState}</b></div>`;
    el.log.innerHTML = s.log.map((m, i) => `<li${i ? "" : ' class="is-new"'}>${m}</li>`).join("");
  }

  // --- Comandi ---

  const MOVES = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  };

  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("in-game") || !s || s.over) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!MOVES[k] && k !== " " && k !== "o" && k !== "Enter") return;
    e.preventDefault();
    e.stopImmediatePropagation(); // le frecce muovono l'esploratore, non il menu
    if (MOVES[k]) move(...MOVES[k]);
    else if (k === "Enter") endRound();
    else observe();
  });

  document.addEventListener("click", (e) => {
    const action = e.target.closest("[data-game-action]")?.dataset.gameAction;
    if (action === "new-zone") { Suoni.stopAll(); start(); }
    if (action === "stay") stay();

    const cell = e.target.closest("#map > div");
    if (cell && canAct()) {
      const x = +cell.dataset.x, y = +cell.dataset.y;
      const dx = x - s.player.x, dy = y - s.player.y;
      if (!s.bird.gone && same(s.bird, { x, y })) observe();
      else if (!dx && !dy) endRound();
      else if (Math.abs(dx) + Math.abs(dy) === 1) move(dx, dy);
    }
  });

  window.addEventListener("resize", fitMap);

  return { start };
})();
