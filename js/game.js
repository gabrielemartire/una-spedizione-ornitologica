// Prototipo della battlemap: una zona, un uccello da osservare, un orso da evitare.
// Il tempo scorre solo quando ti muovi: ogni tua azione è un battito, e in ogni battito
// gli animali avanzano secondo la loro velocità, scivolando sulla mappa insieme a te.
// Espone l'oggetto globale `Gioco`.
const Gioco = (() => {
  const W = 40;
  const H = 24;
  const FLEE = 1.5;           // più vicino di così l'uccello scappa
  const OBSERVE = 3.5;        // portata del binocolo
  const BIRD_LEAVE = 0.35;    // probabilità che, spaventato, lasci la zona invece di spostarsi
  const BEAR_SPEED = { hunt: 4 / 3, search: 1, wander: 0.5 }; // passi per ogni tuo passo; l'acqua ne costa 2
  const BEAR_SIGHT = 10;
  const BEAR_SMELL = 6;       // ti fiuta entro questa distanza, se non sei nascosto
  const BEAR_HEARING = 2;     // l'orso sente un po' più lontano del rumore stesso
  const BEAR_DAMAGE = 4;
  const MAX_HP = 10;
  const HEAL_COST = 5;        // monete per punto vita, in città
  const TICKS_PER_DAY = 45;   // a terra, dopo tante azioni passa un giorno
  const START_MONEY = 100;
  const CREW_PAY = 8;         // la paga giornaliera della ciurma
  const TIME_ICONS = { alba: "sunrise", pomeriggio: "sun", notte: "moon" };
  const SLIDE_MS = 110;       // durata dello scivolamento di una pedina
  const ACT_INTERVAL = 110;   // ms minimi tra due azioni, anche tenendo premuto

  // noise = raggio del rumore in caselle; hide = chi ci sta dentro si vede solo da vicino
  // icon = icona di game-icons.net (js/icons.js); ch = carattere per le caselle senza icona
  const TILES = {
    sea:    { icon: "waves",     cls: "t-sea",    walk: false, sight: true },
    grass:  { ch: "·",           cls: "t-grass",  walk: true,  sight: true, noise: 2, sound: "passoErba" },
    tall:   { icon: "grass",     cls: "t-tall",   walk: true,  sight: true, noise: 1, sound: "passoErba", hide: true },
    bush:   { icon: "bush",      cls: "t-bush",   walk: true,  sight: true, noise: 3, sound: "cespuglio", hide: true },
    tree:   { icon: "beech",     cls: "t-tree",   walk: false, sight: false },
    rock:   { icon: "rock",      cls: "t-rock",   walk: false, sight: false },
    water:  { icon: "waves",     cls: "t-water",  walk: true,  sight: true, noise: 4, sound: "passoAcqua" },
    deep:   { icon: "waves",     cls: "t-deep",   walk: false, sight: true },
    ship:   { icon: "ship",      cls: "t-ship",   walk: true,  sight: true, noise: 0 },
    fall:   { icon: "waterfall", cls: "t-fall",   walk: false, sight: true },
    // Le rovine: muri, pavimento coperto dal tetto finché non entri, macerie rumorose
    wall:   { icon: "wall",      cls: "t-wall",   walk: false, sight: false },
    floor:  { ch: "·",           cls: "t-floor",  walk: true,  sight: true, noise: 1, sound: "passoErba" },
    rubble: { icon: "rubble",    cls: "t-rubble", walk: true,  sight: true, noise: 3, sound: "macerie" },
    house:  { icon: "house",     cls: "t-house",  walk: false, sight: false },
  };

  const BIRD = { id: 17, nome: "Becco Blu" };
  const TIMES = ["alba", "pomeriggio", "notte"];
  const NIGHT_SIGHT = 6; // di notte l'orso vede meno lontano

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

  // I tag della zona decidono sia la cartolina sia la battlemap
  function zoneTags(seed) {
    const r = rng(seed ^ 0x9e3779b9);
    const tags = new Set(["foresta", "fiume"]);
    if (r() < 0.45) tags.add("cascata");
    if (r() < 0.35) tags.add("rovine");
    if (r() < 0.7) tags.add("colline");
    if (r() < 0.55) tags.add("montagne");
    if (r() < 0.25) tags.add("castello");
    if (r() < 0.3) tags.add("villaggio");
    return { tags, time: TIMES[Math.floor(r() * TIMES.length)] };
  }

  function zoneName(tags) {
    if (tags.has("cascata")) return "Radura della cascata";
    if (tags.has("rovine")) return "Rovine nel bosco";
    if (tags.has("villaggio")) return "Radura presso il villaggio";
    return "Radura sul ruscello";
  }

  function generate(seed, tags) {
    for (let attempt = 0; ; attempt++) {
      const zone = tryGenerate(rng(seed + attempt * 7919), tags);
      if (zone) return zone;
    }
  }

  function tryGenerate(r, tags) {
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
    const streamX = [];
    for (let y = 0; y < H; y++) {
      sx = Math.max(10, Math.min(W - 4, sx + (r() < 0.3 ? -1 : r() < 0.45 ? 1 : 0)));
      streamX.push(sx);
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
    // La cascata scende da una parete di roccia a nord
    if (tags.has("cascata")) {
      const fallX = streamX[2];
      for (let y = 0; y <= 1; y++) {
        for (let x = fallX - 3; x <= fallX + 4; x++) if (inside(x, y)) map[y][x] = "rock";
        map[y][fallX] = "fall";
        map[y][fallX + 1] = "fall";
      }
      map[2][fallX] = "deep";
    }
    const ruin = tags.has("rovine") ? placeRuin(map, r) : null;
    if (tags.has("villaggio")) placeHamlet(map, r);
    blob("tree", 16, 2, 0.6);
    blob("tall", 12, 2, 0.7);
    blob("bush", 40, 0, 1);
    blob("rock", 20, 0, 1);

    // Spazio libero allo sbarco
    for (let y = shipY - 1; y <= shipY + 1; y++) {
      for (let x = 1; x <= 3; x++) if (inside(x, y) && map[y][x] !== "sea") map[y][x] = "grass";
    }

    const reach = bfs(map, start).depth;
    if (ruin && ![...ruin.interior].some((k) => reach.has(k))) return null;
    const free = [...reach.keys()].map((k) => { const [x, y] = k.split(",").map(Number); return { x, y }; })
      .filter((c) => map[c.y][c.x] === "grass" || map[c.y][c.x] === "tall");

    // L'uccello ama stare vicino all'acqua o agli alberi
    const nearWater = (c) => DIRS.some(([dx, dy]) => inside(c.x + dx, c.y + dy) && ["water", "tree"].includes(map[c.y + dy][c.x + dx]));
    const observable = (c) => bandCells(map, c).filter((b) => reach.has(key(b))).length >= 3;
    // Nelle rovine, a volte, l'uccello nidifica dentro: lo scopri solo entrando
    const insideSpots = ruin && r() < 0.5
      ? [...ruin.interior].map((k) => { const [x, y] = k.split(",").map(Number); return { x, y }; })
        .filter((c) => map[c.y][c.x] === "floor" && reach.has(key(c)) && observable(c))
      : [];
    const birdSpots = insideSpots.length ? insideSpots
      : free.filter((c) => dist(c, start) >= 14 && nearWater(c) && observable(c));
    if (!birdSpots.length) return null;
    const bird = pick(birdSpots);

    // L'orso fa la guardia al territorio dell'uccello
    const bearSpots = free.filter((c) => dist(c, start) >= 12 && dist(c, bird) >= 5 && dist(c, bird) <= 9);
    if (!bearSpots.length) return null;
    const bear = pick(bearSpots);

    return { map, start, bird, bear, free, ruin };
  }

  // Il villaggio della cartolina: qualche casa al margine orientale della zona
  function placeHamlet(map, r) {
    const y0 = 2 + Math.floor(r() * (H - 9));
    for (const [dx, dy] of [[1, 0], [3, 1], [0, 3], [2, 4], [3, 5]]) {
      const x = W - 5 + dx, y = y0 + dy;
      if (map[y][x] === "grass") map[y][x] = "house";
    }
  }

  // Un edificio diroccato: muri spessi, un paio di varchi, macerie intorno
  function placeRuin(map, r) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const bw = 7 + Math.floor(r() * 3), bh = 5 + Math.floor(r() * 3);
      const x0 = 5 + Math.floor(r() * (W - bw - 7)), y0 = 1 + Math.floor(r() * (H - bh - 2));
      let clear = true;
      for (let y = y0 - 1; y <= y0 + bh && clear; y++) {
        for (let x = x0 - 1; x <= x0 + bw && clear; x++) clear = inside(x, y) && map[y][x] === "grass";
      }
      if (!clear) continue;

      const interior = new Set();
      const perimeter = [];
      for (let y = y0; y < y0 + bh; y++) {
        for (let x = x0; x < x0 + bw; x++) {
          const edge = x === x0 || y === y0 || x === x0 + bw - 1 || y === y0 + bh - 1;
          map[y][x] = edge ? "wall" : "floor";
          if (!edge) interior.add(`${x},${y}`);
          const corner = (x === x0 || x === x0 + bw - 1) && (y === y0 || y === y0 + bh - 1);
          if (edge && !corner) perimeter.push({ x, y });
        }
      }
      // Un varco pulito e un crollo pieno di macerie
      const door = perimeter[Math.floor(r() * perimeter.length)];
      map[door.y][door.x] = "floor";
      const breach = perimeter[Math.floor(r() * perimeter.length)];
      if (map[breach.y][breach.x] === "wall") map[breach.y][breach.x] = "rubble";
      // Un pilastro rimasto in piedi
      if (bw >= 8 && bh >= 6) map[y0 + 2][x0 + 3] = "wall";
      // Pietre cadute intorno
      for (let i = 0; i < 7; i++) {
        const x = x0 - 1 + Math.floor(r() * (bw + 2)), y = y0 - 1 + Math.floor(r() * (bh + 2));
        if (inside(x, y) && map[y][x] === "grass") map[y][x] = "rubble";
      }
      return { interior };
    }
    return null;
  }

  // --- Spedizione ---

  // La spedizione: il mondo, la nave, il tempo, i soldi, il diario. Dura finché giochi.
  // trip.clock conta i giorni passati (0 = alba del primo giorno); i decimali sono il momento.
  let trip = null;

  const timeOf = (clock) => TIMES[Math.min(2, Math.floor((((clock % 1) + 1) % 1) * 3 + 1e-9))];

  function start() {
    const seed = Math.floor(Math.random() * 1e9);
    const world = Globo.createWorld(seed, (zSeed) => {
      const { tags } = zoneTags(zSeed);
      return { tags, name: zoneName(tags) };
    });
    trip = {
      seed, world, clock: 0, money: START_MONEY, hp: MAX_HP, log: [], zones: {}, mode: "sea",
      ship: { ...world.start, sails: 0 },
    };
    s = null;
    initUi();
    log("Giorno 1: il Forte è alle tue spalle. Il taccuino è quasi vuoto.", "ship");
    Mare.enter();
  }

  // Far passare il tempo. Ogni nuovo giorno si paga la ciurma: se non si può, finisce tutto.
  function advanceClock(days) {
    const before = Math.floor(trip.clock);
    trip.clock += days;
    for (let d = before + 1; d <= Math.floor(trip.clock); d++) if (!passDay()) return false;
    return true;
  }

  const day = () => Math.floor(trip.clock) + 1;

  function landAt(zone) {
    // Calare la scialuppa e organizzare lo sbarco richiede un momento della giornata
    if (!advanceClock(1 / 3)) return;
    trip.mode = "land";
    const time = timeOf(trip.clock);
    const gen = generate(zone.seed, zone.tags);
    const memory = trip.zones[zone.id] || { observed: false, gone: false };
    s = {
      zone,
      seed: zone.seed,
      tags: zone.tags,
      time,
      map: gen.map,
      free: gen.free,
      ruin: gen.ruin,
      startPos: gen.start,
      player: { ...gen.start, hp: trip.hp },
      bird: { ...gen.bird, observed: memory.observed, gone: memory.gone },
      bear: { ...gen.bear, mode: "wander", last: null, searchLeft: 0, rest: 0, energy: 0, next: null },
      ticks: 0,
      noise: 0,
      heard: [],
      lastAct: 0,
      over: false,
    };
    showView("land");
    buildDom();
    el.zoneTitle.textContent = `${zone.name} · ${time}`;
    drawPostcard();
    const bird = s.bird.observed ? `Il ${BIRD.nome} di questa zona è già nel taccuino.`
      : s.bird.gone ? `Il ${BIRD.nome} se n'è andato da qui.` : "Da qualche parte, vicino all'acqua, canta un uccello.";
    log(`Giorno ${day()}: sbarchi ${time === "notte" ? "di notte" : time === "alba" ? "all'alba" : "nel pomeriggio"}. ${bird}`, TIME_ICONS[time]);
    if (birdInRuin()) log("Il canto sembra venire da dentro le rovine…", "bird");
    Suoni.stopAll();
    Suoni.toggleAmbient("vento");
    render();
  }

  // Le città: per ora ci si cura e basta. Mercato, taverna e bottega arriveranno.
  function visitCity(city) {
    trip.mode = "city";
    Suoni.play("campana");
    log(`Attracchi a ${city.name}.`, "house");
    cityOverlay(city);
  }

  function cityOverlay(city) {
    const missing = MAX_HP - trip.hp, cost = missing * HEAL_COST;
    const canHeal = missing > 0 && trip.money >= HEAL_COST;
    showOverlay(city.name,
      `Giorno ${day()} · ${trip.money} monete · Vita ${trip.hp}/${MAX_HP}<br>Mercato, taverna e bottega apriranno presto.`,
      "city", canHeal ? `Curati (${HEAL_COST} monete per punto vita, −${Math.min(cost, Math.floor(trip.money / HEAL_COST) * HEAL_COST)})` : null);
    el.overlay.dataset.city = city.id;
  }

  function heal() {
    const city = trip.world.cities.find((c) => c.id === el.overlay.dataset.city);
    const points = Math.min(MAX_HP - trip.hp, Math.floor(trip.money / HEAL_COST));
    trip.hp += points;
    trip.money -= points * HEAL_COST;
    Suoni.play("monete");
    log(`Il guaritore ti rimette in sesto: +${points} vita, −${points * HEAL_COST} monete.`, "coins");
    cityOverlay(city);
    renderStatus();
  }

  function drawPostcard() {
    el.postcardTitle.textContent = `Cartolina · ${s.time}`;
    Cartolina.render({ seed: s.seed, tags: s.tags, time: s.time, bird: !s.bird.gone }, el.postcard);
  }

  function log(msg, icon = null) {
    trip.log.unshift({ msg, icon });
    trip.log.length = Math.min(trip.log.length, 7);
    renderLog();
  }

  function birdInRuin() {
    return !!s && !!s.ruin && !s.bird.gone && s.ruin.interior.has(key(s.bird));
  }

  function insideRuin() {
    return !!s && !!s.ruin && s.ruin.interior.has(key(s.player));
  }

  function hidden() {
    return !!tile(s.map, s.player.x, s.player.y).hide;
  }

  function canAct() {
    return s && !s.over;
  }

  // --- Azioni del giocatore ---

  // Ogni azione (muoversi, osservare, aspettare) è un battito del mondo
  function act(kind, dx = 0, dy = 0) {
    if (!canAct()) return;
    const now = performance.now();
    if (now - s.lastAct < ACT_INTERVAL) return;

    s.noise = 0;
    s.heard = [];
    if (kind === "move" && !move(dx, dy)) return;
    if (kind === "observe") observe();
    s.lastAct = now;
    if (!s.over) tick();
  }

  function move(dx, dy) {
    const p = s.player;
    const n = { x: p.x + dx, y: p.y + dy };
    if (!inside(n.x, n.y) || !tile(s.map, n.x, n.y).walk || same(s.bear, n) || (!s.bird.gone && same(s.bird, n))) return false;

    Object.assign(p, n);
    const t = tile(s.map, n.x, n.y);
    if (t === TILES.ship) { endZone(); return true; }
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
    return true;
  }

  function observe() {
    const b = s.bird, p = s.player;
    if (b.gone || b.observed) {
      log("Non c'è più niente da osservare qui. Torna alla nave.");
      return;
    }
    const d = dist(p, b);
    if (d <= OBSERVE && los(s.map, p, b)) {
      b.observed = true;
      Suoni.play("osservato");
      log(`${BIRD.nome} osservato e annotato nel taccuino! Torna alla nave.`, "quill");
    } else if (d <= OBSERVE) {
      log("Qualcosa ti copre la vista.");
    } else {
      log("Troppo lontano: il binocolo non basta.");
    }
  }

  // Il mondo avanza di un battito: l'uccello, l'orso, l'orologio
  function tick() {
    s.ticks++;
    birdTick();
    bearTick();
    if (s.over) return;
    if (!advanceClock(1 / TICKS_PER_DAY)) return;
    render();
  }

  // Passa un giorno: si paga la ciurma. Se non si può, la spedizione finisce
  function passDay() {
    if (trip.money < CREW_PAY) {
      trip.money = 0;
      bankrupt();
      return false;
    }
    trip.money -= CREW_PAY;
    showDayBanner();
    log(`Giorno ${day()}. Paghi la ciurma: −${CREW_PAY} monete.`, "pay");
    Suoni.play("monete");
    return true;
  }

  // Il nuovo giorno si annuncia, senza fermare il gioco
  function showDayBanner() {
    el.banner.textContent = `Giorno ${day()}`;
    el.banner.className = "phase-banner is-day";
    el.banner.hidden = false;
    Suoni.play("campana");
    clearTimeout(el.bannerTimer);
    el.bannerTimer = setTimeout(() => { el.banner.hidden = true; }, 1300);
  }

  // --- Uccello ---

  function birdTick() {
    const b = s.bird;
    if (b.gone || b.observed) return;

    // Ogni tanto saltella su una casella vicina
    if (Math.random() < 0.08) {
      const hops = DIRS.map(([dx, dy]) => ({ x: b.x + dx, y: b.y + dy }))
        .filter((c) => inside(c.x, c.y) && ["grass", "tall"].includes(s.map[c.y][c.x])
          && !same(c, s.bear) && dist(c, s.player) > FLEE);
      if (hops.length) Object.assign(b, pickRandom(hops));
    }
    if (dist(s.player, b) <= 12 && s.ticks % 6 === 0) Suoni.play("cinguettio", BIRD.id); // lo senti prima di vederlo
  }

  function scare(reason) {
    const b = s.bird;
    Suoni.play("cinguettio", BIRD.id);
    const spots = s.free.filter((c) => dist(c, s.player) >= 8 && dist(c, s.bear) >= 4 && bandCells(s.map, c).length >= 3);
    if (!spots.length || Math.random() < BIRD_LEAVE) {
      b.gone = true;
      drawPostcard();
      log(`${reason}: il ${BIRD.nome} vola via dalla zona. :(`, "bird");
      return;
    }
    Object.assign(b, pickRandom(spots));
    log(`${reason}: il ${BIRD.nome} vola in un altro punto della radura.`, "bird");
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
    const sight = s.time === "notte" ? NIGHT_SIGHT : BEAR_SIGHT;
    return d <= BEAR_SMELL || (d <= sight && los(s.map, o, p));
  }

  function bearHears() {
    return s.heard.some((n) => n.r > 0 && dist(s.bear, n) <= n.r + BEAR_HEARING);
  }

  // Le caselle che l'orso può raggiungere al prossimo battito, se si mette a inseguirti
  function bearReach() {
    if (s.bear.rest) return new Map();
    return bearPaths(Math.floor(s.bear.energy + BEAR_SPEED.hunt)).cost;
  }

  function bearTick() {
    const o = s.bear, p = s.player;
    if (o.rest) { o.rest--; o.next = null; return; }

    if (bearSees() || bearHears()) {
      if (o.mode !== "hunt") { Suoni.play("orso"); log("L'orso ti ha fiutato e ti insegue!", "bear"); }
      o.mode = "hunt";
      o.last = { x: p.x, y: p.y };
    } else if (o.mode === "hunt") {
      o.mode = "search";
      o.searchLeft = 6;
      log("L'orso ti ha perso e va a cercarti dove ti ha visto.", "bear");
    }

    o.energy += BEAR_SPEED[o.mode];
    const { prev } = bearPaths();
    let target = o.mode === "hunt" ? p : o.mode === "search" ? o.last : null;
    // Vagando, tende comunque a fiutare la tua direzione
    if (!target) {
      const around = DIRS.map(([dx, dy]) => ({ x: o.x + dx, y: o.y + dy }))
        .filter((c) => inside(c.x, c.y) && bearCost(c) < Infinity && !same(c, p));
      target = Math.random() < 0.6 ? p : pickRandom(around);
    }
    const path = (target && pathFrom(prev, o, target)) || [];

    const steps = [];
    for (const c of path) {
      if (same(c, p)) {
        if (o.mode === "hunt" && o.energy >= 1) { slideBear(steps); return attack(); }
        break;
      }
      if (o.energy < bearCost(c)) break;
      o.energy -= bearCost(c);
      o.x = c.x;
      o.y = c.y;
      steps.push(c);
      if (!s.bird.gone && !s.bird.observed && dist(o, s.bird) <= 2) scare("L'orso è passato troppo vicino");
    }
    if (!steps.length) o.energy = Math.min(o.energy, 1); // fermo non accumula slancio
    slideBear(steps);
    if (steps.length && dist(o, p) < 14) Suoni.play("passoOrso");

    if (o.mode === "search" && same(o, o.last) && --o.searchLeft <= 0) o.mode = "wander";
    o.next = o.mode === "wander" ? null : (pathFrom(bearPaths().prev, o, o.mode === "hunt" ? p : o.last) || [])[0] || null;
  }

  function attack() {
    const p = s.player;
    s.bear.rest = 3;
    s.bear.energy = 0;
    s.bear.next = null;
    p.hp = Math.max(0, p.hp - BEAR_DAMAGE);
    Suoni.play("tonfo");
    el.map.classList.remove("is-hit");
    void el.map.offsetWidth; // fa ripartire l'animazione
    el.map.classList.add("is-hit");
    log(`L'orso ti raggiunge e ti colpisce! −${BEAR_DAMAGE} vita.`, "bear");
    if (!p.hp) die();
  }

  // --- Fine zona e fine spedizione ---

  function endZone() {
    s.over = true;
    trip.hp = s.player.hp;
    trip.zones[s.zone.id] = { observed: s.bird.observed, gone: s.bird.gone };
    const b = s.bird;
    const esito = b.observed ? `Il <strong>${BIRD.nome}</strong> è nel taccuino.`
      : b.gone ? `Il ${BIRD.nome} è volato via. Andrà meglio altrove.`
      : `Torni a bordo senza aver osservato il ${BIRD.nome}.`;
    showOverlay("Di nuovo a bordo", `${esito}<br>Giorno ${day()} · ${trip.money} monete · Vita ${s.player.hp}/${MAX_HP}`, "zone");
    Suoni.play("campana");
  }

  function endTrip(title, html) {
    trip.over = true;
    Mare.stop();
    if (s) s.over = true;
    showOverlay(title, html, "end");
  }

  function die() {
    endTrip("Sbranato", `L'orso ha avuto la meglio, al giorno ${day()}.<br>La spedizione finisce qui.`);
  }

  function bankrupt() {
    trip.money = 0;
    Suoni.play("campana");
    endTrip("Abbandonato", `Giorno ${day()}: non hai più monete per la paga.<br>La ciurma ti lascia a terra e salpa senza di te.`);
  }

  // kind: "zone" = riprendi il mare o resta; "city" = in porto; "end" = la spedizione è finita
  function showOverlay(title, html, kind, healLabel = null) {
    el.banner.hidden = true;
    if (s && trip.mode === "land") render();
    const buttons = {
      zone: `<button class="menu-item" data-game-action="sail">Riprendi il mare</button>
             <button class="menu-item" data-game-action="stay">Resta a terra</button>`,
      city: `${healLabel ? `<button class="menu-item" data-game-action="heal">${healLabel}</button>` : ""}
             <button class="menu-item" data-game-action="sail">Riprendi il mare</button>`,
      end: '<button class="menu-item" data-game-action="new-trip">Nuova spedizione</button>',
    }[kind];
    el.overlay.innerHTML = `
      <h3>${title}</h3>
      <p>${html}</p>
      <nav class="menu">
        ${buttons}
        <button class="menu-item" data-goto="screen-menu">Torna al menu</button>
      </nav>`;
    el.overlay.hidden = false;
    el.overlay.querySelector(".menu-item").focus();
  }

  function sail() {
    el.overlay.hidden = true;
    s = null;
    Mare.enter();
  }

  function stay() {
    s.over = false;
    Object.assign(s.player, s.startPos);
    el.overlay.hidden = true;
    render();
  }

  // --- Disegno ---

  // Le icone diventano simboli SVG riusabili: ogni casella li richiama con <use>
  function iconSprite() {
    if (document.getElementById("icon-sprite")) return;
    const symbols = Object.entries(ICONS)
      .map(([name, d]) => `<symbol id="i-${name}" viewBox="0 0 512 512"><path d="${d}"/></symbol>`).join("");
    document.body.insertAdjacentHTML("afterbegin", `<svg id="icon-sprite" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">${symbols}</svg>`);
  }

  const iconHtml = (name) => `<svg class="ic" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  // I riferimenti agli elementi della schermata di gioco, una volta per spedizione
  function initUi() {
    iconSprite();
    const $ = (id) => document.getElementById(id);
    el = {
      map: $("map"), mapWrap: $("map-wrap"), sea: $("sea-view"), overlay: $("map-overlay"), banner: $("phase-banner"),
      status: $("status"), notebook: $("notebook"), log: $("log"), keys: $("keys"),
      zoneTitle: $("zone-title"), postcard: $("postcard"), postcardTitle: $("postcard-title"),
      miniGlobe: $("globe-mini"), bTitle: $("b-title"),
    };
    el.overlay.hidden = true;
    el.banner.hidden = true;
  }

  const KEYS_HELP = {
    land: "il tempo scorre solo quando agisci · frecce/WASD muovi · spazio/O osserva · Invio aspetta · ⚓ torna a bordo · Esc menu",
    sea: "← → rotta · ↑ ↓ vele · T cannocchiale · Invio sbarca o attracca in città · Esc menu",
  };

  // A terra il riquadro A è la battlemap, in mare è il globo
  function showView(mode) {
    const land = mode === "land";
    el.mapWrap.hidden = !land;
    el.sea.hidden = land;
    el.miniGlobe.hidden = !land;
    el.bTitle.textContent = land ? "Globo" : "Navigazione";
    el.keys.textContent = KEYS_HELP[land ? "land" : "sea"];
    el.overlay.hidden = true;
    renderLog();
    renderNotebook();
  }

  function buildDom() {
    el.map.classList.remove("is-hit");
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
    // Le pedine stanno su un livello sopra le caselle e scivolano da una all'altra
    el.ents = {};
    for (const [name, icon] of [["bird", "bird"], ["bear", "bear"], ["player", "binoculars"]]) {
      const e = document.createElement("div");
      e.className = `entity e-${name} no-slide`;
      e.innerHTML = iconHtml(icon);
      el.map.appendChild(e);
      el.ents[name] = e;
    }
    s.bearSlideEnd = 0;
    fitMap();
    requestAnimationFrame(() => Object.values(el.ents).forEach((e) => e.classList.remove("no-slide")));
  }

  function place(e, c) {
    e.style.setProperty("--x", c.x);
    e.style.setProperty("--y", c.y);
  }

  // L'orso percorre i suoi passi uno dopo l'altro, anche quando in un battito ne fa due
  function slideBear(steps) {
    if (!steps.length) return;
    s.bearSlideEnd = performance.now() + steps.length * SLIDE_MS;
    steps.forEach((c, i) => setTimeout(() => place(el.ents.bear, c), i * SLIDE_MS));
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
    const roofed = s.ruin && !insideRuin() ? s.ruin.interior : new Set(); // il tetto si apre solo se entri

    const roofCenter = s.ruin ? [...s.ruin.interior][Math.floor(s.ruin.interior.size / 2)] : null;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = TILES[map[y][x]];
        const c = el.cells[y][x];
        const k = `${x},${y}`;
        // Gli alberi alternano faggi e pini, sempre uguali nella stessa casella
        let icon = t === TILES.tree && (x * 7 + y * 13) % 3 === 0 ? "pine" : t.icon;
        let ch = t.ch || "";
        let cls = `cell ${t.cls}`;

        if (roofed.has(k)) {
          icon = k === roofCenter ? "ruins" : null;
          ch = "";
          cls = "cell t-roof";
        } else if (band.has(k)) cls += " band";
        if (reach.get(k) > 0) cls += hunting ? " danger" : " reach";

        if (o.next && same(o.next, { x, y })) cls += " bear-next";

        // Si tocca il DOM solo se la casella è cambiata
        const html = icon ? iconHtml(icon) : ch;
        if (c._html !== html) { c.innerHTML = html; c._html = html; }
        if (c.className !== cls) c.className = cls;
      }
    }

    // Le pedine
    place(el.ents.player, p);
    el.ents.player.classList.toggle("is-hidden", hidden());
    if (performance.now() >= s.bearSlideEnd) place(el.ents.bear, o);
    const intent = o.rest ? "z" : o.mode === "hunt" ? "!" : o.mode === "search" ? "?" : null;
    if (intent) el.ents.bear.dataset.intent = intent;
    else delete el.ents.bear.dataset.intent;
    el.ents.bird.hidden = b.gone || roofed.has(key(b));
    el.ents.bird.classList.toggle("is-observed", b.observed);
    place(el.ents.bird, b);

    renderStatus();
    renderNotebook();
    renderLog();
    if (el.miniGlobe && !el.miniGlobe.hidden) Mare.drawMini(el.miniGlobe);
  }

  // Il riquadro B: tempo, soldi, vita e, a terra, i dettagli del round
  function renderStatus() {
    const land = trip.mode === "land" && s;
    const time = land ? s.time : timeOf(trip.clock);
    const hp = land ? s.player.hp : trip.hp;
    const frac = trip.clock % 1;
    const left = Math.ceil((1 - frac) * TICKS_PER_DAY - 1e-9);
    const sand = "▰".repeat(Math.ceil((1 - frac) * 5)) + "▱".repeat(5 - Math.ceil((1 - frac) * 5));
    const hearts = "♥".repeat(Math.ceil(hp / 2)) + "♡".repeat(Math.ceil(MAX_HP / 2) - Math.ceil(hp / 2));
    let html = `
      <div class="status-day">${iconHtml(TIME_ICONS[time])}<b>Giorno ${day()}</b><span>${time}</span></div>
      <div title="Quante azioni mancano al prossimo giorno">${iconHtml("hourglass")}<span>Clessidra</span><b>${sand}${land ? ` ${left}` : ""}</b></div>
      <div title="La ciurma costa ${CREW_PAY} monete al giorno">${iconHtml("coins")}<span>Monete</span><b>${trip.money} <small>(−${CREW_PAY}/g)</small></b></div>
      <hr>
      <div><span>Vita</span><b class="hearts">${hearts}</b></div>`;
    if (land) {
      const o = s.bear;
      const noise = "●".repeat(s.noise) + "○".repeat(4 - s.noise);
      const bearState = o.rest ? "si riposa" : { wander: "fiuta in giro", search: "ti cerca", hunt: "ti insegue!" }[o.mode];
      html += `
      <div><span>Rumore</span><b>${noise}</b></div>
      <div><span>Nascosto</span><b>${hidden() ? "sì" : "no"}</b></div>
      <div><span>Orso</span><b>${bearState}</b></div>`;
    } else {
      html += Mare.statusRows();
    }
    el.status.innerHTML = html;
  }

  // Il taccuino: per ora un solo uccello, osservato in quante zone
  function renderNotebook() {
    const seen = Object.values(trip.zones).filter((z) => z.observed).length + (s && s.bird.observed && !trip.zones[s.zone.id]?.observed ? 1 : 0);
    let state = seen ? `✔ visto ${seen > 1 ? `in ${seen} zone` : ""}` : "da osservare";
    if (s && trip.mode === "land") {
      const b = s.bird;
      state = b.observed ? "✔ osservato qui" : b.gone ? "✗ volato via"
        : birdInRuin() && !insideRuin() ? "canta dentro le rovine" : state;
    }
    el.notebook.innerHTML = `<div class="nb-row"><span>${seen ? "v" : "?"} ${BIRD.nome}</span><b>${state}</b></div>`;
  }

  function renderLog() {
    if (!el) return;
    el.log.innerHTML = trip.log.map((e, i) =>
      `<li${i ? "" : ' class="is-new"'}>${e.icon ? iconHtml(e.icon) : "<i></i>"}<span>${e.msg}</span></li>`).join("");
  }

  // --- Comandi ---

  const MOVES = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  };

  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("in-game") || !trip || trip.mode !== "land" || !s || s.over) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!MOVES[k] && k !== " " && k !== "o" && k !== "Enter" && k !== ".") return;
    e.preventDefault();
    e.stopImmediatePropagation(); // le frecce muovono l'esploratore, non il menu
    if (MOVES[k]) act("move", ...MOVES[k]);
    else if (k === "Enter" || k === ".") act("wait");
    else act("observe");
  });

  document.addEventListener("click", (e) => {
    const action = e.target.closest("[data-game-action]")?.dataset.gameAction;
    if (action === "new-trip") { Suoni.stopAll(); start(); }
    if (action === "sail") sail();
    if (action === "stay") stay();
    if (action === "heal") heal();

    const cell = e.target.closest("#map > div");
    if (cell && canAct()) {
      const x = +cell.dataset.x, y = +cell.dataset.y;
      const dx = x - s.player.x, dy = y - s.player.y;
      if (!s.bird.gone && same(s.bird, { x, y })) act("observe");
      else if (!dx && !dy) act("wait");
      else if (Math.abs(dx) + Math.abs(dy) === 1) act("move", dx, dy);
    }
  });

  window.addEventListener("resize", () => {
    if (!trip) return;
    fitMap();
    if (s) drawPostcard();
  });

  // Quello che serve alla navigazione (js/sea.js)
  return {
    start, landAt, visitCity, advanceClock, renderStatus, log, timeOf, day,
    get trip() { return trip; },
    get el() { return el; },
    showView,
    iconHtml: (name) => iconHtml(name),
  };
})();
