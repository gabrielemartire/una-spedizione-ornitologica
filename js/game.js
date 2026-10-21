// La battlemap e la spedizione: una zona, il suo uccello, gli animali del momento del giorno.
// Il tempo scorre solo quando ti muovi: ogni tua azione è un battito, e in ogni battito
// gli animali avanzano secondo la loro velocità, scivolando sulla mappa insieme a te.
// La giornata è divisa in tre momenti: ripartire ne costa due, aspettare a bordo uno.
// Espone l'oggetto globale `Gioco`.
const Gioco = (() => {
  const W = 40;
  const H = 24;
  const FLEE = 1.5;           // più vicino di così l'uccello scappa
  const OBSERVE = 3.5;        // portata del binocolo
  const BIRD_LEAVE = 0.35;    // probabilità che, spaventato, lasci la zona invece di spostarsi
  const MAX_HP = 10;
  const HEAL_COST = 5;        // monete per punto vita, in città
  const START_MONEY = 100;
  const CREW_PAY = 8;         // la paga giornaliera della ciurma
  const DEPART_COST = 2;
  const SAVE_KEY = "spedizione-ornitologica:partita";
  let lastSave = 0;      // ripartire costa due momenti: si arriva sempre col momento precedente
  const TIME_ICONS = { alba: "sunrise", pomeriggio: "sun", notte: "moon" };
  const SLIDE_MS = 110;       // durata dello scivolamento di una pedina
  const ACT_INTERVAL = 110;   // ms minimi tra due azioni, anche tenendo premuto

  // noise = raggio del rumore in caselle; hide = chi ci sta dentro si vede solo da vicino
  // icon = icona di game-icons.net (js/icons.js); ch = carattere per le caselle senza icona
  const TILES = {
    sea:    { name: "Mare",             icon: "waves",      cls: "t-sea",    walk: false, sight: true },
    grass:  { name: "Erba",             ch: "·",            cls: "t-grass",  walk: true,  sight: true, noise: 2, sound: "passoErba" },
    tall:   { name: "Erba alta",        icon: "grass",      cls: "t-tall",   walk: true,  sight: true, noise: 1, sound: "passoErba", hide: true },
    bush:   { name: "Cespuglio",        icon: "bush",       cls: "t-bush",   walk: true,  sight: true, noise: 3, sound: "cespuglio", hide: true },
    tree:   { name: "Albero",           icon: "beech",      cls: "t-tree",   walk: false, sight: false },
    rock:   { name: "Roccia",           icon: "rock",       cls: "t-rock",   walk: false, sight: false },
    water:  { name: "Acqua bassa",      icon: "waves",      cls: "t-water",  walk: true,  sight: true, noise: 4, sound: "passoAcqua" },
    deep:   { name: "Acqua profonda",   icon: "waves",      cls: "t-deep",   walk: false, sight: true },
    ice:    { name: "Ghiaccio",         icon: "ice",        cls: "t-ice",    walk: true,  sight: true, noise: 1, sound: "passoErba" },
    ship:   { name: "La nave",          icon: "ship",       cls: "t-ship",   walk: true,  sight: true, noise: 0 },
    fall:   { name: "Cascata",          icon: "waterfall",  cls: "t-fall",   walk: false, sight: true },
    // Le rovine: muri, pavimento coperto dal tetto finché non entri, macerie rumorose
    wall:   { name: "Muro",             icon: "wall",       cls: "t-wall",   walk: false, sight: false },
    floor:  { name: "Pavimento",        ch: "·",            cls: "t-floor",  walk: true,  sight: true, noise: 1, sound: "passoErba" },
    rubble: { name: "Macerie",          icon: "rubble",     cls: "t-rubble", walk: true,  sight: true, noise: 3, sound: "macerie" },
    house:  { name: "Casa",             icon: "house",      cls: "t-house",  walk: false, sight: false },
    // Il vulcano: lava che non si attraversa, rocce nere
    lava:   { name: "Lava",             icon: "waves",      cls: "t-lava",   walk: false, sight: true },
    basalt: { name: "Roccia vulcanica", icon: "rock",       cls: "t-basalt", walk: false, sight: false },
    // Il castello: mura, fossato, un ponte con le bandiere e il ponte levatoio
    castle: { name: "Mura del castello", icon: "castle",    cls: "t-castle", walk: false, sight: false },
    gate:   { name: "Ponte levatoio",   icon: "drawbridge", cls: "t-gate",   walk: false, sight: false, gate: true },
    bridge: { name: "Ponte",            icon: "bridge",     cls: "t-bridge", walk: true,  sight: true, noise: 1, sound: "macerie" },
    flag:   { name: "Bandiera",         icon: "flag",       cls: "t-flag",   walk: false, sight: true },
  };

  // Gli animali: l'orso di giorno, i lupi di notte, il cinghiale all'alba.
  // speed = passi per ogni tuo passo (l'acqua ne costa 2); il cinghiale invece carica in linea retta
  const KINDS = {
    bear: { name: "Orso", icon: "bear", speed: { hunt: 4 / 3, search: 1, wander: 0.5 }, sight: 10, nightSight: 6, smell: 6, hearing: 2, damage: 4, rest: 3, sound: "orso", step: "passoOrso",
      verb: "L'orso ti raggiunge e ti colpisce!", death: "Sbranato", deathText: "L'orso ha avuto la meglio" },
    wolf: { name: "Lupo", icon: "wolf", speed: { hunt: 1, search: 1, wander: 0.5 }, sight: 8, nightSight: 8, smell: 5, hearing: 3, damage: 2, rest: 2, sound: "lupo", step: null,
      verb: "Un lupo ti azzanna!", death: "Azzannato", deathText: "Il branco ha avuto la meglio" },
    boar: { name: "Cinghiale", icon: "boar", charge: 8, chargeSpeed: 2, sight: 8, nightSight: 6, hearing: 2, damage: 3, rest: 2, sound: "orso", step: "passoOrso",
      verb: "Il cinghiale ti travolge!", death: "Travolto", deathText: "Il cinghiale non ha curvato, tu nemmeno" },
  };
  const STATES = { wander: "gira", search: "ti cerca", hunt: "ti insegue!", charge: "carica!" };

  const TIMES = ["alba", "pomeriggio", "notte"];

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
  const unkey = (k) => { const [x, y] = k.split(",").map(Number); return { x, y }; };
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

  // I tag della zona decidono sia la cartolina sia la battlemap.
  // Castello e vulcano sono rari: li assegna la spedizione, al massimo uno per globo (vedi start)
  function zoneTags(seed, biome) {
    const r = rng(seed ^ 0x9e3779b9);
    const tags = new Set([biome]);
    const water = r();
    if (water < 0.5) tags.add("fiume");
    else if (water < 0.75) tags.add("lago");
    if (r() < 0.45 && tags.has("fiume") && biome !== "deserto") tags.add("cascata");
    if (r() < 0.3) tags.add("rovine");
    if (r() < 0.7) tags.add("colline");
    if (r() < (biome === "ghiaccio" || biome === "taiga" ? 0.8 : 0.5)) tags.add("montagne");
    if (biome !== "ghiaccio" && r() < 0.3) tags.add("villaggio");
    return { tags, place: BIOMI[biome].luoghi[Math.floor(r() * BIOMI[biome].luoghi.length)] };
  }

  function zoneName(tags, place) {
    if (tags.has("vulcano")) return `${place} sotto il vulcano`;
    if (tags.has("castello")) return `${place} del castello`;
    if (tags.has("cascata")) return `${place} della cascata`;
    if (tags.has("lago")) return `${place} sul lago`;
    if (tags.has("rovine")) return `${place} con le rovine`;
    if (tags.has("villaggio")) return `${place} presso il villaggio`;
    return place;
  }

  const biomeOf = (tags) => Object.keys(BIOMI).find((b) => tags.has(b)) || "foresta";

  function generate(seed, tags, bird) {
    for (let attempt = 0; ; attempt++) {
      const zone = tryGenerate(rng(seed + attempt * 7919), tags, bird, attempt > 40);
      if (zone) return zone;
    }
  }

  function tryGenerate(r, tags, birdInfo, relaxed) {
    const map = Array.from({ length: H }, () => Array(W).fill("grass"));
    const pick = (arr) => arr[Math.floor(r() * arr.length)];
    const shipY = 4 + Math.floor(r() * (H - 8));
    const look = BIOMI[biomeOf(tags)].mappa;
    const hot = tags.has("vulcano"); // il calore del vulcano scioglie il ghiaccio
    const frozen = look.water === "ice" && !hot;
    const feature = []; // le caselle della caratteristica che l'uccello cerca

    // Il mare a ovest, la nave ormeggiata sulla costa
    let shore = 2;
    for (let y = 0; y < H; y++) {
      shore = Math.abs(y - shipY) <= 1 ? 1 : Math.max(1, Math.min(4, shore + (r() < 0.3 ? -1 : r() < 0.45 ? 1 : 0)));
      for (let x = 0; x < shore; x++) map[y][x] = "sea";
    }
    map[shipY][0] = "ship";
    const start = { x: 1, y: shipY };

    // Un ruscello che scende da nord a sud, con qualche pozza profonda
    const streamX = [];
    if (tags.has("fiume")) {
      let sx = 16 + Math.floor(r() * 12);
      for (let y = 0; y < H; y++) {
        sx = Math.max(10, Math.min(W - 4, sx + (r() < 0.3 ? -1 : r() < 0.45 ? 1 : 0)));
        streamX.push(sx);
        map[y][sx] = "water";
        if (r() < 0.5) map[y][sx + 1] = "water";
        else if (r() < 0.12) map[y][sx] = "deep";
      }
      if (frozen) streamX.forEach((x, y) => {
        for (let dx = 0; dx <= 1; dx++) if (["water", "deep"].includes(map[y][x + dx])) map[y][x + dx] = "ice";
      });
    }
    // Un lago tondo, profondo nel mezzo; al nord è ghiacciato e ci si cammina sopra
    if (tags.has("lago")) {
      const cx = 14 + Math.floor(r() * (W - 22)), cy = 5 + Math.floor(r() * (H - 10));
      const rad = 3 + r() * 1.6;
      for (let y = cy - 5; y <= cy + 5; y++) {
        for (let x = cx - 6; x <= cx + 6; x++) {
          if (!inside(x, y)) continue;
          const d = Math.hypot((x - cx) / 1.3, y - cy) + (r() - 0.5) * 0.6;
          if (d > rad) continue;
          map[y][x] = frozen ? (d < rad * 0.45 ? "deep" : "ice") : d < rad * 0.55 ? "deep" : "water";
          feature.push({ x, y });
        }
      }
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
    if (tags.has("cascata") && streamX.length) {
      const fallX = streamX[2];
      for (let y = 0; y <= 1; y++) {
        for (let x = fallX - 3; x <= fallX + 4; x++) if (inside(x, y)) map[y][x] = "rock";
        map[y][fallX] = "fall";
        map[y][fallX + 1] = "fall";
      }
      map[2][fallX] = "deep";
      for (let y = 0; y < 5; y++) feature.push({ x: fallX, y });
    }
    // Il vulcano: una colata di lava che scende da nord-est, rocce nere intorno
    if (hot) {
      let lx = W - 6 - Math.floor(r() * 8);
      const len = 7 + Math.floor(r() * 5);
      for (let y = 0; y < len; y++) {
        lx = Math.max(12, Math.min(W - 2, lx + (r() < 0.35 ? -1 : r() < 0.5 ? 1 : 0)));
        map[y][lx] = "lava";
        if (y < 3 || r() < 0.4) map[y][lx + 1 < W ? lx + 1 : lx - 1] = "lava";
        feature.push({ x: lx, y });
      }
    }
    const ruin = tags.has("rovine") ? placeRuin(map, r) : null;
    if (tags.has("villaggio")) placeHamlet(map, r);
    const castle = tags.has("castello") ? placeCastle(map, r) : null;
    if (castle) feature.push(...castle.cells);
    if (ruin) feature.push(...[...ruin.interior].map(unkey));
    // Le pozze della palude, poi la vegetazione del bioma
    blob("water", look.pools, 1, 0.75);
    blob("deep", Math.floor(look.pools / 3), 0, 1);
    blob("tree", hot ? Math.floor(look.trees / 2) : look.trees, 2, 0.6);
    if (look.tall) blob("tall", look.talls, 2, 0.7);
    blob("bush", look.bushes, 0, 1);
    blob(hot ? "basalt" : "rock", look.rocks, 0, 1);

    // Spazio libero allo sbarco
    for (let y = shipY - 1; y <= shipY + 1; y++) {
      for (let x = 1; x <= 3; x++) if (inside(x, y) && map[y][x] !== "sea") map[y][x] = "grass";
    }

    const reach = bfs(map, start).depth;
    if (ruin && ![...ruin.interior].some((k) => reach.has(k))) return null;
    const free = [...reach.keys()].map(unkey).filter((c) => map[c.y][c.x] === "grass" || map[c.y][c.x] === "tall");

    // L'uccello ama stare vicino all'acqua o agli alberi; chi cerca una caratteristica le sta vicino
    const wet = ["water", "ice", "tree", "deep", "lava"];
    const nearWater = (c) => DIRS.some(([dx, dy]) => inside(c.x + dx, c.y + dy) && wet.includes(map[c.y + dy][c.x + dx]));
    const observable = (c) => bandCells(map, c).filter((b) => reach.has(key(b))).length >= 3;
    const nearFeature = (c) => feature.some((f) => dist(f, c) <= 6);
    const wantsFeature = birdInfo && birdInfo.tratto && feature.length;
    // Nelle rovine, a volte, l'uccello nidifica dentro: lo scopri solo entrando
    const insideSpots = ruin && r() < 0.5
      ? [...ruin.interior].map(unkey).filter((c) => map[c.y][c.x] === "floor" && reach.has(key(c)) && observable(c))
      : [];
    let birdSpots = insideSpots.length ? insideSpots
      : free.filter((c) => dist(c, start) >= 14 && (nearWater(c) || relaxed) && observable(c) && (!wantsFeature || nearFeature(c) || relaxed));
    if (!birdSpots.length) return null;
    const bird = pick(birdSpots);

    // Gli animali fanno la guardia al territorio dell'uccello
    let lair = free.filter((c) => dist(c, start) >= 12 && dist(c, bird) >= 5 && dist(c, bird) <= 9);
    if (!lair.length) lair = free.filter((c) => dist(c, start) >= 12);
    if (!lair.length) return null;
    lair.sort(() => r() - 0.5);

    return { map, start, bird, lair, free, ruin };
  }

  // Il villaggio della cartolina: qualche casa al margine orientale della zona
  function placeHamlet(map, r) {
    const y0 = 2 + Math.floor(r() * (H - 12));
    for (const [dx, dy] of [[1, 0], [3, 1], [0, 3], [2, 4], [3, 5]]) {
      const x = W - 5 + dx, y = y0 + dy;
      if (map[y][x] === "grass") map[y][x] = "house";
    }
  }

  // Il castello al margine sud: mura, un fossato, il ponte tra due bandiere fino al ponte levatoio
  //   ▓▓▓▓▓▓▓ ▓ ▓▓▓▓▓▓▓    mura
  //   ~~~~~~~ ═ ~~~~~~~    fossato e ponte
  //          ⚑ ⚑           bandiere
  function placeCastle(map, r) {
    const cx = 10 + Math.floor(r() * (W - 20));
    const cells = [];
    for (let x = cx - 7; x <= cx + 7; x++) {
      map[H - 1][x] = "castle";
      map[H - 2][x] = "castle";
      map[H - 3][x] = "deep";
      cells.push({ x, y: H - 2 });
    }
    map[H - 2][cx] = "gate";
    map[H - 3][cx] = "bridge";
    map[H - 4][cx - 1] = "flag";
    map[H - 4][cx + 1] = "flag";
    map[H - 4][cx] = "grass";
    return { cells };
  }

  // Un edificio diroccato: muri spessi, un paio di varchi, macerie intorno
  function placeRuin(map, r) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const bw = 7 + Math.floor(r() * 3), bh = 5 + Math.floor(r() * 3);
      const x0 = 5 + Math.floor(r() * (W - bw - 7)), y0 = 1 + Math.floor(r() * (H - bh - 6));
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

  // Chi c'è in questo momento: di giorno l'orso (più spesso vicino al fiume), di notte i lupi, all'alba il cinghiale
  function spawnBeasts(gen, zone, time) {
    const r = rng(zone.seed ^ Math.imul(trip.third + 1, 0x9e3779b1));
    const river = zone.tags.has("fiume");
    const spots = gen.lair.slice();
    const out = [];
    const add = (kind) => {
      const at = spots.shift();
      if (at) out.push({ kind, ...at, mode: "wander", last: null, searchLeft: 0, rest: 0, energy: 0, next: null, dir: null, run: 0 });
    };
    if (time === "pomeriggio" && r() < (river ? 0.85 : 0.4)) add("bear");
    if (time === "notte" && r() < 0.75) {
      const pack = ["taiga", "ghiaccio"].includes(zone.biome) ? 3 : 2;
      // il branco sta unito: gli altri lupi accanto al primo
      const first = spots[0];
      if (first) spots.sort((a, b) => dist(a, first) - dist(b, first));
      for (let i = 0; i < pack; i++) add("wolf");
    }
    if (time === "alba") {
      if (river && r() < 0.3) add("bear");
      else if (r() < 0.65) add("boar");
    }
    return out;
  }

  // --- Spedizione ---

  // La spedizione: il mondo, la nave, il tempo, i soldi, il diario. Dura finché giochi.
  // trip.third conta i momenti passati: 0 = alba del primo giorno, 1 = pomeriggio, 2 = notte, 3 = alba del secondo…
  let trip = null;
  let explorer = "";

  const timeOf = (third) => TIMES[((third % 3) + 3) % 3];
  const now = () => timeOf(trip.third);
  const day = () => Math.floor(trip.third / 3) + 1;
  const timeLabel = (t) => ({ alba: "all'alba", pomeriggio: "nel pomeriggio", notte: "di notte" })[t];

  // Il globo nasce tutto dal seed: per questo il salvataggio può tenere solo il seed e ricostruirlo
  function makeWorld(seed) {
    const world = Globo.createWorld(seed, (zSeed, biome) => {
      const { tags, place } = zoneTags(zSeed, biome);
      return { tags, place, name: zoneName(tags, place) };
    });
    // Castello e vulcano: al massimo uno per globo, e non sempre
    const r = rng(seed ^ 0x51ed27);
    const wild = world.zones.filter((z) => !world.cities.some((c) => c.zone === z.id));
    const pickZone = (ok) => { const pool = wild.filter(ok); return pool.length ? pool[Math.floor(r() * pool.length)] : null; };
    if (r() < 0.8) pickZone((z) => z.biome !== "ghiaccio")?.tags.add("castello");
    if (r() < 0.6) pickZone((z) => !z.tags.has("castello"))?.tags.add("vulcano");
    for (const z of world.zones) z.name = zoneName(z.tags, z.place);
    return world;
  }

  function start(name) {
    explorer = (name || explorer || "").trim() || "Senza nome";
    const seed = Math.floor(Math.random() * 1e9);
    const world = makeWorld(seed);
    trip = {
      seed, world, third: 0, money: START_MONEY, hp: MAX_HP, explorer, mode: "sea",
      zones: {}, birds: {}, notes: [], payments: [], departures: 0, seaDist: 0, over: false,
      stats: { steps: 0, landings: 0, waits: 0, hits: 0, escapes: 0, islands: new Set() },
      ship: { ...world.start, sails: 0 },
    };
    s = null;
    initUi();
    note("Salpi dal Forte.", "ship");
    Mare.enter();
  }

  // --- Salvataggio: la spedizione in corso resta nel browser, un refresh non la cancella ---

  function save() {
    if (!trip || trip.over) return;
    const { world, ...rest } = trip;
    const data = { ...rest, hp: s ? s.player.hp : trip.hp, stats: { ...trip.stats, islands: [...trip.stats.islands] } };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* senza memoria si gioca lo stesso */ }
  }

  function loadSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; }
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* niente da cancellare */ }
  }

  // Si riparte da dove eri: in mare nello stesso punto, a terra di nuovo sulla nave della stessa zona, in città in porto
  function resume() {
    const data = loadSave();
    if (!data) return false;
    try {
      const world = makeWorld(data.seed);
      explorer = data.explorer;
      trip = { ...data, world, stats: { ...data.stats, islands: new Set(data.stats.islands) } };
      s = null;
      initUi();
      const zone = world.zones.find((z) => z.id === trip.landZone);
      const city = world.cities.find((c) => c.id === trip.city);
      if (trip.mode === "land" && zone) landAt(zone, { waited: true });
      else {
        Mare.enter();
        if (data.mode === "city" && city) { Mare.stop(); visitCity(city); }
      }
      return true;
    } catch (e) {
      clearSave(); // un salvataggio di una versione troppo diversa: meglio ricominciare
      return false;
    }
  }

  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

  // Far passare uno o più momenti. A ogni nuova alba si paga la ciurma: se non si può, finisce tutto.
  function advance(thirds) {
    for (let i = 0; i < thirds; i++) {
      trip.third++;
      if (trip.third % 3 === 0 && !passDay()) return false;
    }
    return true;
  }

  // Ripartire (da terra o dalla città) costa due momenti: si arriva al momento che precede quello di partenza
  function depart() {
    if (s) trip.hp = s.player.hp;
    el.overlay.hidden = true;
    s = null;
    trip.departures++;
    if (!advance(DEPART_COST)) return;
    Mare.enter();
  }

  function landAt(zone, { waited = false } = {}) {
    trip.mode = "land";
    trip.landZone = zone.id;
    const time = now();
    const memory = (trip.zones[zone.id] ||= { visited: false, done: false, gone: false });
    // L'uccello della zona si decide al primo attracco, tra quelli adatti, e poi resta quello.
    // I rari no: li porterà in una zona solo una voce di taverna (al massimo due per spedizione)
    if (memory.bird === undefined) memory.bird = uccelloPerZona(zone.tags, zone.biome, Math.random)?.id ?? null;
    const bird = memory.bird != null ? UCCELLI[memory.bird] : null;
    const gen = generate(zone.seed, zone.tags, bird);
    if (!memory.visited) {
      memory.visited = true;
      trip.stats.islands.add(zone.island);
    }
    if (!waited) trip.stats.landings++;
    const present = !!bird && !memory.done && !memory.gone && bird.ore.includes(time);
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
      bird: { ...gen.bird, info: bird, present, observed: false, gone: false },
      beasts: spawnBeasts(gen, zone, time),
      ticks: 0,
      noise: 0,
      heard: [],
      lastAct: 0,
      lastMove: [0, 0],
      over: false,
    };
    showView("land");
    const screen = document.getElementById("screen-game");
    screen.dataset.time = time;
    for (const [k, v] of Object.entries(BIOMI[zone.biome].mappa.colors)) screen.style.setProperty(`--f-${k}`, v);
    buildDom();
    drawPostcard();
    Suoni.stopAll();
    Suoni.toggleAmbient(time === "notte" ? "notte" : "vento");

    // All'ora sbagliata l'uccello non c'è, ma a volte lascia tracce (i rari no: di quelli si sa solo dalle voci)
    if (bird && !present && !memory.done && !memory.gone) {
      if (!bird.rara && learn(bird, "traccia")) note(`${zone.name}, ${time}: tracce di un uccello. «${bird.indizio}» Forse non è la sua ora.`, "bird");
      toast("Nessun canto. Forse non è l'ora giusta.");
    } else if (present) {
      toast(birdInRuin() ? "Il canto sembra venire da dentro le rovine…" : "Da qualche parte, qui intorno, canta un uccello.");
    } else if (memory.done) {
      toast("L'uccello di questa zona è già nel taccuino.");
    }
    const beasts = describeBeasts();
    if (beasts) setTimeout(() => s && s.zone === zone && toast(beasts), 1600);
    render();
  }

  function describeBeasts() {
    const kinds = new Set(s.beasts.map((b) => b.kind));
    if (kinds.has("wolf")) return "Ululati, non lontano.";
    if (kinds.has("bear")) return "Impronte d'orso nel fango.";
    if (kinds.has("boar")) return "Terra smossa: un cinghiale.";
    return null;
  }

  // Le città: per ora ci si cura e basta. Mercato, taverna e bottega arriveranno.
  function visitCity(city) {
    trip.mode = "city";
    trip.city = city.id;
    Suoni.play("campana");
    cityOverlay(city);
  }

  function cityOverlay(city) {
    const missing = MAX_HP - trip.hp, cost = missing * HEAL_COST;
    const canHeal = missing > 0 && trip.money >= HEAL_COST;
    showOverlay(city.name,
      `Giorno ${day()}, ${now()} · ${trip.money} monete · Vita ${trip.hp}/${MAX_HP}<br>Mercato, taverna e bottega apriranno presto.`,
      [
        canHeal && ["heal", `Curati (${HEAL_COST} monete per punto vita, −${Math.min(cost, Math.floor(trip.money / HEAL_COST) * HEAL_COST)})`],
        ["sail", `Riparti <small>(due momenti: sarà ${timeOf(trip.third + DEPART_COST)})</small>`],
      ]);
    el.overlay.dataset.city = city.id;
  }

  function heal() {
    const city = trip.world.cities.find((c) => c.id === el.overlay.dataset.city);
    const points = Math.min(MAX_HP - trip.hp, Math.floor(trip.money / HEAL_COST));
    trip.hp += points;
    trip.money -= points * HEAL_COST;
    pay("guaritore", points * HEAL_COST);
    Suoni.play("monete");
    cityOverlay(city);
    renderStatus();
  }

  function drawPostcard() {
    el.postcard.classList.remove("is-scope");
    Cartolina.render({ seed: s.seed, tags: s.tags, time: s.time, bird: s.bird.present && !s.bird.gone && !s.bird.observed }, el.postcard);
  }

  // Il diario annota solo le cose utili; il resto è un avviso che sparisce
  function note(msg, icon = null) {
    trip.notes.unshift({ msg, icon, day: day(), time: now() });
    Diario.renderStrip();
  }

  function toast(msg) {
    if (!el) return;
    el.toast.textContent = msg;
    el.toast.hidden = false;
    el.toast.classList.remove("is-in");
    void el.toast.offsetWidth;
    el.toast.classList.add("is-in");
    clearTimeout(el.toastTimer);
    el.toastTimer = setTimeout(() => { el.toast.hidden = true; }, 2600);
  }

  function pay(what, amount) {
    trip.payments.unshift({ day: day(), time: now(), what, amount });
  }

  // Quanto sai di un uccello: niente, una traccia, oppure l'hai visto. Torna true se è una novità.
  function learn(bird, level) {
    const order = { traccia: 1, visto: 2 };
    const before = trip.birds[bird.id];
    if (before && order[before.level] >= order[level]) return false;
    trip.birds[bird.id] = { level, zone: s.zone.name, day: day(), time: now() };
    return true;
  }

  function birdInRuin() {
    return !!s && !!s.ruin && s.bird.present && !s.bird.gone && s.ruin.interior.has(key(s.bird));
  }

  function insideRuin() {
    return !!s && !!s.ruin && s.ruin.interior.has(key(s.player));
  }

  function hidden() {
    return !!tile(s.map, s.player.x, s.player.y).hide;
  }

  const birdActive = () => s.bird.present && !s.bird.gone && !s.bird.observed;

  function canAct() {
    return s && !s.over && !Diario.isOpen();
  }

  // --- Azioni del giocatore ---

  // Ogni azione (muoversi, osservare, aspettare) è un battito del mondo
  function act(kind, dx = 0, dy = 0) {
    if (!canAct()) return;
    const t = performance.now();
    if (t - s.lastAct < ACT_INTERVAL) return;

    s.noise = 0;
    s.heard = [];
    if (kind === "move" && !move(dx, dy)) return;
    if (kind === "observe") observe();
    s.lastAct = t;
    if (!s.over) tick();
  }

  function occupied(c) {
    return s.beasts.some((o) => same(o, c)) || (birdActive() && same(s.bird, c));
  }

  function move(dx, dy) {
    const p = s.player;
    const n = { x: p.x + dx, y: p.y + dy };
    if (!inside(n.x, n.y)) return false;
    const t = tile(s.map, n.x, n.y);
    if (t.gate) { toast("Il ponte levatoio è alzato. Entrare nel castello? Un'altra volta."); return false; }
    if (!t.walk || occupied(n)) return false;

    Object.assign(p, n);
    s.lastMove = [dx, dy];
    trip.stats.steps++;
    showTileInfo(n);
    if (t === TILES.ship) { backAboard(); return true; }
    Suoni.play(t.sound);
    // Di notte ogni passo fa un po' più rumore: l'uccello scappa prima
    s.noise = t.noise ? t.noise + (s.time === "notte" ? 1 : 0) : 0;
    s.heard.push({ ...n, r: s.noise });

    // L'uccello reagisce subito: troppo vicino o troppo rumore
    const b = s.bird;
    if (birdActive()) {
      const d = dist(p, b);
      if (d <= FLEE) scare("Troppo vicino");
      else if (d <= s.noise) scare("Troppo rumore");
    }
    return true;
  }

  function observe() {
    const b = s.bird, p = s.player;
    if (!birdActive()) {
      toast(b.observed ? "L'hai già annotato. Torna alla nave." : "Non c'è niente da osservare, per ora.");
      return;
    }
    const d = dist(p, b);
    if (d <= OBSERVE && los(s.map, p, b)) {
      b.observed = true;
      learn(b.info, "visto");
      trip.zones[s.zone.id].done = true;
      Suoni.play("osservato");
      note(`${s.zone.name}, ${s.time}: osservato il ${b.info.nome}!`, "quill");
      toast(`${b.info.nome} annotato nel taccuino! Torna alla nave.`);
      drawPostcard();
    } else if (d <= OBSERVE) {
      toast("Qualcosa ti copre la vista.");
    } else {
      toast("Troppo lontano: il binocolo non basta.");
    }
  }

  // Il mondo avanza di un battito: l'uccello, gli animali
  function tick() {
    s.ticks++;
    birdTick();
    for (const o of s.beasts) {
      if (s.over) return;
      if (o.kind === "boar") boarTick(o);
      else beastTick(o);
    }
    if (s.over) return;
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
    pay("ciurma", CREW_PAY);
    showDayBanner();
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
    if (!birdActive()) return;

    // Ogni tanto saltella su una casella vicina
    if (Math.random() < 0.08) {
      const hops = DIRS.map(([dx, dy]) => ({ x: b.x + dx, y: b.y + dy }))
        .filter((c) => inside(c.x, c.y) && ["grass", "tall"].includes(s.map[c.y][c.x])
          && !s.beasts.some((o) => same(o, c)) && dist(c, s.player) > FLEE);
      if (hops.length) Object.assign(b, pickRandom(hops));
    }
    if (dist(s.player, b) <= 12 && s.ticks % 6 === 0) Suoni.play("cinguettio", b.info.id); // lo senti prima di vederlo
  }

  function scare(reason) {
    const b = s.bird;
    Suoni.play("cinguettio", b.info.id);
    const spots = s.free.filter((c) => dist(c, s.player) >= 8 && s.beasts.every((o) => dist(c, o) >= 4) && bandCells(s.map, c).length >= 3);
    if (!spots.length || Math.random() < BIRD_LEAVE) {
      b.gone = true;
      trip.zones[s.zone.id].gone = true;
      drawPostcard();
      if (!b.info.rara && learn(b.info, "traccia")) note(`${s.zone.name}: un uccello ti è volato via sotto il naso. «${b.info.indizio}»`, "bird");
      else note(`${s.zone.name}: l'uccello è volato via per sempre.`, "bird");
      toast(`${reason}: l'uccello vola via dalla zona.`);
      return;
    }
    Object.assign(b, pickRandom(spots));
    toast(`${reason}: l'uccello vola in un altro punto.`);
  }

  // --- Animali che inseguono: orso e lupi ---

  // Quanti passi costa a un animale entrare in una casella
  function beastCost(c) {
    const t = tile(s.map, c.x, c.y);
    if (!t.walk || t === TILES.ship) return Infinity;
    return t === TILES.water ? 2 : 1;
  }

  // Dijkstra a secchi: costo per raggiungere ogni casella, e da dove ci si arriva
  function beastPaths(o, maxCost = Infinity) {
    const from = { x: o.x, y: o.y };
    const cost = new Map([[key(from), 0]]);
    const prev = new Map();
    const buckets = [[from]];
    for (let d = 0; d < buckets.length; d++) {
      for (const c of buckets[d] || []) {
        if (cost.get(key(c)) !== d) continue;
        for (const [dx, dy] of DIRS) {
          const n = { x: c.x + dx, y: c.y + dy };
          if (!inside(n.x, n.y)) continue;
          const nd = d + beastCost(n);
          if (nd > maxCost || nd === Infinity || (cost.has(key(n)) && cost.get(key(n)) <= nd)) continue;
          cost.set(key(n), nd);
          prev.set(key(n), c);
          (buckets[nd] ||= []).push(n);
        }
      }
    }
    return { cost, prev };
  }

  function sees(o) {
    const k = KINDS[o.kind], p = s.player, d = dist(o, p);
    if (hidden()) return d < 1.5;
    const sight = s.time === "notte" ? k.nightSight : k.sight;
    return d <= (k.smell || 0) || (d <= sight && los(s.map, o, p));
  }

  function hears(o) {
    return s.heard.some((n) => n.r > 0 && dist(o, n) <= n.r + KINDS[o.kind].hearing);
  }

  // Le caselle che un animale può raggiungere al prossimo battito, se si mette a inseguirti
  function reachOf(o) {
    if (o.rest) return new Map();
    if (o.kind === "boar") return boarLines(o);
    return beastPaths(o, Math.floor(o.energy + KINDS[o.kind].speed.hunt)).cost;
  }

  function beastTick(o) {
    const k = KINDS[o.kind], p = s.player;
    if (o.rest) { o.rest--; o.next = null; return; }

    if (sees(o) || hears(o)) {
      if (o.mode !== "hunt") { Suoni.play(k.sound); toast(`${o.kind === "wolf" ? "Un lupo" : "L'orso"} ti ha fiutato e ti insegue!`); }
      o.mode = "hunt";
      o.last = { x: p.x, y: p.y };
    } else if (o.mode === "hunt") {
      o.mode = "search";
      o.searchLeft = 6;
      trip.stats.escapes++;
      toast(`${o.kind === "wolf" ? "Il lupo" : "L'orso"} ti ha perso: va a cercarti dove ti ha visto.`);
    }

    o.energy += k.speed[o.mode];
    const { prev } = beastPaths(o);
    let target = o.mode === "hunt" ? p : o.mode === "search" ? o.last : null;
    // Vagando, tende comunque a fiutare la tua direzione
    if (!target) {
      const around = DIRS.map(([dx, dy]) => ({ x: o.x + dx, y: o.y + dy }))
        .filter((c) => inside(c.x, c.y) && beastCost(c) < Infinity && !same(c, p));
      target = Math.random() < 0.6 ? p : pickRandom(around);
    }
    const path = (target && pathFrom(prev, o, target)) || [];

    const steps = [];
    for (const c of path) {
      if (same(c, p)) {
        if (o.mode === "hunt" && o.energy >= 1) { slide(o, steps); return attack(o); }
        break;
      }
      if (o.energy < beastCost(c) || s.beasts.some((other) => other !== o && same(other, c))) break;
      o.energy -= beastCost(c);
      o.x = c.x;
      o.y = c.y;
      steps.push(c);
      if (birdActive() && dist(o, s.bird) <= 2) scare(`${k.name === "Orso" ? "L'orso" : "Un lupo"} è passato troppo vicino`);
    }
    if (!steps.length) o.energy = Math.min(o.energy, 1); // fermo non accumula slancio
    slide(o, steps);
    if (steps.length && k.step && dist(o, p) < 14) Suoni.play(k.step);

    if (o.mode === "search" && same(o, o.last) && --o.searchLeft <= 0) o.mode = "wander";
    o.next = o.mode === "wander" ? null : (pathFrom(beastPaths(o).prev, o, o.mode === "hunt" ? p : o.last) || [])[0] || null;
  }

  // --- Il cinghiale: non sa curvare ---

  // Le linee su cui carica: la sua riga e la sua colonna, finché non c'è un ostacolo
  function boarLines(o) {
    const cells = new Map();
    const dirs = o.mode === "charge" ? [o.dir] : DIRS;
    const len = o.mode === "charge" ? KINDS.boar.chargeSpeed * 2 : KINDS.boar.charge;
    for (const [dx, dy] of dirs) {
      for (let i = 1; i <= len; i++) {
        const c = { x: o.x + dx * i, y: o.y + dy * i };
        if (!inside(c.x, c.y) || beastCost(c) === Infinity) break;
        cells.set(key(c), i);
      }
    }
    return cells;
  }

  function boarTick(o) {
    const k = KINDS.boar, p = s.player;
    if (o.rest) { o.rest--; if (!o.rest) o.mode = "wander"; return; }

    if (o.mode !== "charge") {
      const aligned = (o.x === p.x || o.y === p.y) && dist(o, p) <= k.charge && boarLines(o).has(key(p));
      if (aligned && (!hidden() || dist(o, p) < 1.5)) {
        o.mode = "charge";
        o.dir = [Math.sign(p.x - o.x), Math.sign(p.y - o.y)];
        o.run = 0;
        Suoni.play(k.sound);
        toast("Il cinghiale abbassa la testa e carica!");
      }
    }

    const steps = [];
    if (o.mode === "charge") {
      for (let i = 0; i < k.chargeSpeed; i++) {
        const c = { x: o.x + o.dir[0], y: o.y + o.dir[1] };
        if (inside(c.x, c.y) && same(c, p)) { slide(o, steps); return attack(o); }
        if (!inside(c.x, c.y) || beastCost(c) === Infinity || s.beasts.some((b) => b !== o && same(b, c))) {
          // Contro un ostacolo si pianta e resta stordito
          o.rest = k.rest;
          o.mode = "stunned";
          toast("Il cinghiale si pianta e resta stordito.");
          break;
        }
        o.x = c.x;
        o.y = c.y;
        steps.push(c);
        if (birdActive() && dist(o, s.bird) <= 2) scare("Il cinghiale è passato troppo vicino");
        if (++o.run >= k.charge) { o.mode = "wander"; break; }
      }
    } else if (Math.random() < (hears(o) ? 0.9 : 0.4)) {
      // Grufola in giro, verso il rumore se ne sente
      const noise = s.heard.find((n) => n.r > 0 && dist(o, n) <= n.r + k.hearing);
      const around = DIRS.map(([dx, dy]) => ({ x: o.x + dx, y: o.y + dy }))
        .filter((c) => inside(c.x, c.y) && beastCost(c) < Infinity && !same(c, p) && !s.beasts.some((b) => same(b, c)));
      if (around.length) {
        const c = noise ? around.sort((a, b) => dist(a, noise) - dist(b, noise))[0] : pickRandom(around);
        o.x = c.x;
        o.y = c.y;
        steps.push(c);
      }
    }
    slide(o, steps);
    if (steps.length && dist(o, p) < 10) Suoni.play(k.step);
  }

  function attack(o) {
    const k = KINDS[o.kind], p = s.player;
    o.rest = k.rest;
    o.energy = 0;
    o.next = null;
    if (o.kind === "boar") o.mode = "stunned";
    p.hp = Math.max(0, p.hp - k.damage);
    trip.stats.hits++;
    Suoni.play("tonfo");
    el.map.classList.remove("is-hit");
    void el.map.offsetWidth; // fa ripartire l'animazione
    el.map.classList.add("is-hit");
    toast(`${k.verb} −${k.damage} vita.`);
    if (!p.hp) die(o.kind);
    else render();
  }

  // --- Fine zona e fine spedizione ---

  function backAboard() {
    s.over = true;
    trip.hp = s.player.hp;
    const b = s.bird;
    const esito = b.observed ? `Il <strong>${b.info.nome}</strong> è nel taccuino.`
      : b.gone ? "L'uccello è volato via. Andrà meglio altrove."
      : trip.zones[s.zone.id].done ? "Questa zona non ha altro da mostrarti."
      : b.present ? "Torni a bordo senza averlo osservato."
      : "Nessun uccello, a quest'ora. Forse più tardi?";
    showOverlay("Di nuovo a bordo", `${esito}<br>Giorno ${day()}, ${now()} · ${trip.money} monete · Vita ${s.player.hp}/${MAX_HP}`, [
      ["sail", `Riparti <small>(due momenti: sarà ${timeOf(trip.third + DEPART_COST)})</small>`],
      ["wait", `Aspetta a bordo <small>(un momento: sarà ${timeOf(trip.third + 1)})</small>`],
      ["stay", "Resta a terra"],
    ]);
    Suoni.play("campana");
  }

  // Aspettare un momento a bordo: la zona resta la stessa, cambiano luce, animali e forse l'uccello
  function waitAboard() {
    const zone = s.zone;
    trip.hp = s.player.hp;
    trip.stats.waits++;
    el.overlay.hidden = true;
    if (!advance(1)) return;
    landAt(zone, { waited: true });
  }

  function endTrip(cause) {
    trip.over = true;
    trip.cause = cause;
    clearSave();
    Mare.stop();
    if (s) s.over = true;
    Diario.close();
    setTimeout(() => show("screen-end"), cause.kind === "death" ? 900 : 300);
  }

  function die(kind) {
    const k = KINDS[kind];
    endTrip({ kind: "death", title: k.death, text: `${k.deathText}, al giorno ${day()}, ${now()}.` });
  }

  function bankrupt() {
    trip.money = 0;
    Suoni.play("campana");
    endTrip({ kind: "bankrupt", title: "Abbandonato", text: `Giorno ${day()}: non hai più monete per la paga. La ciurma ti lascia a terra e salpa senza di te.` });
  }

  // buttons: [[azione, etichetta], …]; i falsi vengono saltati
  function showOverlay(title, html, buttons) {
    el.banner.hidden = true;
    if (s && trip.mode === "land") render();
    el.overlay.innerHTML = `
      <h3>${title}</h3>
      <p>${html}</p>
      <nav class="menu">
        ${buttons.filter(Boolean).map(([action, label]) => `<button class="menu-item" data-game-action="${action}">${label}</button>`).join("")}
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
      status: $("status"), keys: $("keys"), toast: $("toast"), tileInfo: $("tile-info"),
      postcard: $("postcard"), explorer: $("mb-explorer"),
    };
    el.overlay.hidden = true;
    el.banner.hidden = true;
    el.toast.hidden = true;
    el.explorer.textContent = trip.explorer;
    document.getElementById("screen-game").dataset.time = now();
    Diario.close();
    Diario.renderStrip();
  }

  const KEYS_HELP = {
    land: "frecce/WASD muovi · spazio osserva · Invio aspetta · ⚓ torna a bordo · Tab diario · Esc menu",
    sea: "← → rotta · ↑ ↓ vele · T binocolo · Invio sbarca o attracca · Tab diario · Esc menu",
  };

  // A terra il riquadro A è la battlemap, in mare è il globo
  function showView(mode) {
    const land = mode === "land";
    el.mapWrap.hidden = !land;
    el.sea.hidden = land;
    el.keys.textContent = KEYS_HELP[land ? "land" : "sea"];
    el.tileInfo.textContent = "";
    el.overlay.hidden = true;
    document.getElementById("screen-game").dataset.time = now();
    Diario.renderStrip();
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
    const pawn = (cls, icon) => {
      const e = document.createElement("div");
      e.className = `entity ${cls} no-slide`;
      e.innerHTML = iconHtml(icon);
      el.map.appendChild(e);
      return e;
    };
    el.ents = { bird: pawn("e-bird", s.bird.info ? iconaUccello(s.bird.info) : "bird"), player: pawn("e-player", "binoculars") };
    el.ents.bird.style.setProperty("--bird-color", s.bird.info?.colore || "#f2c230");
    for (const o of s.beasts) {
      o.el = pawn(`e-beast e-${o.kind}`, KINDS[o.kind].icon);
      o.slideEnd = 0;
    }
    fitMap();
    requestAnimationFrame(() => el.map.querySelectorAll(".entity").forEach((e) => e.classList.remove("no-slide")));
  }

  function place(e, c) {
    e.style.setProperty("--x", c.x);
    e.style.setProperty("--y", c.y);
  }

  // Un animale percorre i suoi passi uno dopo l'altro, anche quando in un battito ne fa due
  function slide(o, steps) {
    if (!steps.length) return;
    o.slideEnd = performance.now() + steps.length * SLIDE_MS;
    steps.forEach((c, i) => setTimeout(() => place(o.el, c), i * SLIDE_MS));
  }

  // La battlemap riempie il riquadro A senza far scorrere la pagina
  function fitMap() {
    if (!el || el.mapWrap.hidden) return;
    const box = el.mapWrap.getBoundingClientRect();
    const cell = Math.max(10, Math.min(30, Math.floor(Math.min(box.width / W, box.height / H))));
    el.map.style.setProperty("--cell", `${cell}px`);
  }

  // Che cosa c'è in una casella: si passa o no, ci si nasconde o no (il rumore resta da scoprire)
  function showTileInfo(c) {
    if (!s || !el) return;
    const roofed = s.ruin && !insideRuin() && s.ruin.interior.has(key(c));
    const t = tile(s.map, c.x, c.y);
    if (roofed) { el.tileInfo.textContent = "Rovine · il tetto nasconde l'interno"; return; }
    const parts = [t.name];
    if (t === TILES.ship) parts.push("torni a bordo");
    else if (t.gate) parts.push("chiuso");
    else parts.push(t.walk ? "si passa" : t.sight ? "non si passa" : "blocca passo e vista");
    if (t.hide) parts.push("ti nasconde");
    el.tileInfo.textContent = parts.join(" · ");
  }

  function render() {
    const { map, player: p, bird: b } = s;
    const band = birdActive() ? new Set(bandCells(map, b).map(key)) : new Set();
    const reach = new Map(), danger = new Set(), next = new Set();
    for (const o of s.beasts) {
      const hunting = o.mode === "hunt" || o.mode === "charge";
      for (const [k, v] of reachOf(o)) if (v > 0) { reach.set(k, true); if (hunting) danger.add(k); }
      if (o.next) next.add(key(o.next));
    }
    const roofed = s.ruin && !insideRuin() ? s.ruin.interior : new Set(); // il tetto si apre solo se entri

    const look = BIOMI[biomeOf(s.tags)].mappa;
    const roofCenter = s.ruin ? [...s.ruin.interior][Math.floor(s.ruin.interior.size / 2)] : null;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = TILES[map[y][x]];
        const c = el.cells[y][x];
        const k = `${x},${y}`;
        // Alberi ed erbe alte del bioma; dove ce n'è più d'uno si alternano, sempre uguali nella stessa casella
        let icon = t === TILES.tree ? look.tree[(x * 7 + y * 13) % 3 === 0 ? look.tree.length - 1 : 0]
          : t === TILES.tall ? look.tall : t.icon;
        let ch = t.ch || "";
        // Dove si passa le icone sono più trasparenti; quello che blocca è pieno
        let cls = `cell ${t.cls} ${t.walk ? "walk" : "block"}`;

        if (roofed.has(k)) {
          icon = k === roofCenter ? "ruins" : null;
          ch = "";
          cls = "cell t-roof block";
        } else if (band.has(k)) cls += " band";
        if (reach.has(k)) cls += danger.has(k) ? " danger" : " reach";
        if (next.has(k)) cls += " bear-next";

        // Si tocca il DOM solo se la casella è cambiata
        const html = icon ? iconHtml(icon) : ch;
        if (c._html !== html) { c.innerHTML = html; c._html = html; }
        if (c.className !== cls) c.className = cls;
      }
    }

    // Le pedine
    place(el.ents.player, p);
    el.ents.player.classList.toggle("is-hidden", hidden());
    for (const o of s.beasts) {
      if (performance.now() >= o.slideEnd) place(o.el, o);
      const intent = o.rest ? "z" : o.mode === "hunt" || o.mode === "charge" ? "!" : o.mode === "search" ? "?" : null;
      if (intent) o.el.dataset.intent = intent;
      else delete o.el.dataset.intent;
    }
    el.ents.bird.hidden = !b.present || b.gone || roofed.has(key(b));
    el.ents.bird.classList.toggle("is-observed", b.observed);
    place(el.ents.bird, b);

    renderStatus();
    Diario.renderStrip();
  }

  // Il riquadro B: il momento del giorno, soldi, vita e, a terra, rumore e animali
  function renderStatus() {
    // ogni tanto si salva, così anche un refresh improvviso perde al massimo un paio di secondi
    if (performance.now() - lastSave > 2000) { lastSave = performance.now(); save(); }
    const land = trip.mode === "land" && s;
    const time = land ? s.time : now();
    const hp = land ? s.player.hp : trip.hp;
    const hearts = "♥".repeat(Math.ceil(hp / 2)) + "♡".repeat(Math.ceil(MAX_HP / 2) - Math.ceil(hp / 2));
    const thirds = TIMES.map((t) => `<i class="${t === time ? "is-now" : ""}" title="${t}">${iconHtml(TIME_ICONS[t])}</i>`).join("");
    let html = `
      <div class="status-day"><b>Giorno ${day()}</b><span class="thirds">${thirds}</span></div>
      <div class="status-time"><span>${time}</span></div>
      <div title="La ciurma costa ${CREW_PAY} monete al giorno, pagate all'alba">${iconHtml("coins")}<span>Monete</span><b>${trip.money} <small>(−${CREW_PAY}/g)</small></b></div>
      <div><span>Vita</span><b class="hearts">${hearts}</b></div>
      <hr>`;
    if (land) {
      const noiseMax = 5;
      const noise = "●".repeat(Math.min(noiseMax, s.noise)) + "○".repeat(Math.max(0, noiseMax - s.noise));
      html += `
      <div><span>Rumore</span><b>${noise}</b></div>
      <div><span>Nascosto</span><b>${hidden() ? "sì" : "no"}</b></div>`;
      for (const o of s.beasts) {
        const state = o.rest ? (o.kind === "boar" ? "stordito" : "si riposa") : STATES[o.mode] || "gira";
        html += `<div>${iconHtml(KINDS[o.kind].icon)}<span>${KINDS[o.kind].name}</span><b>${state}</b></div>`;
      }
      if (!s.beasts.length) html += "<div><span>Animali</span><b>nessuno in vista</b></div>";
    } else {
      html += Mare.statusRows();
    }
    el.status.innerHTML = html;
  }

  // --- Comandi ---

  const MOVES = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  };

  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("in-game") || !trip || trip.mode !== "land" || !s || s.over || Diario.isOpen()) return;
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
    if (action === "sail") depart();
    if (action === "wait") waitAboard();
    if (action === "stay") stay();
    if (action === "heal") heal();

    const cell = e.target.closest("#map > div");
    if (cell && canAct()) {
      const x = +cell.dataset.x, y = +cell.dataset.y;
      const dx = x - s.player.x, dy = y - s.player.y;
      if (birdActive() && same(s.bird, { x, y })) act("observe");
      else if (!dx && !dy) act("wait");
      else if (Math.abs(dx) + Math.abs(dy) === 1) act("move", dx, dy);
    }
  });

  document.addEventListener("mouseover", (e) => {
    const cell = e.target.closest("#map > div");
    if (cell && s) showTileInfo({ x: +cell.dataset.x, y: +cell.dataset.y });
  });

  window.addEventListener("resize", () => {
    if (!trip || !el) return;
    fitMap();
    Cartolina.redraw();
  });

  // Quello che serve alla navigazione (js/sea.js) e al diario (js/diario.js)
  return {
    start, resume, save, hasSave: () => !!loadSave(), clearSave, depart, landAt, visitCity, advance, renderStatus, note, toast, timeOf, now, day, showView, iconHtml, fitMap,
    get trip() { return trip; },
    get el() { return el; },
    get explorer() { return explorer; },
    MAX_HP, CREW_PAY, TIME_ICONS, TIMES,
  };
})();
