// La battlemap e la spedizione: una zona, il suo uccello, gli animali del momento del giorno.
// Il tempo scorre solo quando ti muovi: ogni tua azione è un battito, e in ogni battito
// gli animali avanzano secondo la loro velocità, scivolando sulla mappa insieme a te.
// La giornata è divisa in tre (alba, pomeriggio, notte): ripartire ne fa passare due, aspettare a bordo una.
// Espone l'oggetto globale `Gioco`.
const Gioco = (() => {
  // La battlemap: 40 per 24. Durante la generazione di una zona col mare a nord o a sud diventa per un
  // momento 24 per 40 (vedi generate)
  let W = 40;
  let H = 24;
  const FLEE = 1.5;           // più vicino di così l'uccello scappa
  const OBSERVE = 3.5;        // portata del binocolo
  const BIRD_LEAVE = 0.35;    // probabilità che, spaventato, lasci la zona invece di spostarsi
  const MAX_HP = 10;
  const START_MONEY = 100;
  const CREW_PAY = 8;         // la paga giornaliera della ciurma
  const DEPART_COST = 2;
  const SAVE_KEY = "spedizione-ornitologica:partita";
  const NOTEBOOK_KEY = "spedizione-ornitologica:taccuino";
  const REFRESH_COST = 3;
  const MERCHANTS = 2;        // mercanti per globo
  const MAX_RUMORS = 2;       // voci di taverna per spedizione (più quelle dei mercanti)
  const RARE_RUMOR = { forte: 1, porto: 0.84, mercante: 1 }; // al porticciolo a volte la voce è su un uccello qualunque
  const ITEM_CHANCE = 1 / 3;  // un oggetto nella zona; nelle rovine c'è sempre
  // I ricercati: un avviso in bacheca al massimo ogni WANTED_EVERY giorni, da prendere entro WANTED_DAYS
  const WANTED_EVERY = 6;
  const WANTED_DAYS = 3;
  const BOUNTY = 15;
  // Gli oggetti magici: l'uovo si schiude dopo EGG_DAYS giorni; un forziere ogni CHEST_EVERY zone
  const EGG_DAYS = 13;
  const CHEST_EVERY = 8;
  const CHEST_COINS = [5, 10];
  const PULCINO = 57;         // l'uccello che nasce dall'uovo
  // Il cibo: il pesce in scatola cura due cuori; il marshmallow tutta la vita e dà un cuore viola in più
  const FISH_HEAL = 4;
  const VIOLET = 2;
  // La tagliola: il lupo ci muore (a volte la schiva), orso e cinghiale restano fermi per 15 tuoi passi
  const TRAP_HOLD = 15;
  const TRAP_DODGE = 0.3;
  // La bottiglia col messaggio: in una zona caraibica sul mare su tre; il tesoro sepolto
  const BOTTLE_CHANCE = 1 / 3;
  const BURIED_COINS = 9;
  // I timbri del taccuino, in ordine: il bit nel codice è la posizione
  const STAMPS = ["campfire", "engagement", "death", "tarotsun", "tarotmoon", "kraken"];
  // Il labirinto di siepi: uscirne costa un giorno intero; le trappole tra le foglie un cuore
  const MAZE_DAY = 3;
  const MAZE_TRAPS = 16;
  const SPIKE = 2;
  // Il castello: i mostri che rimbalzano tolgono un cuore
  const CASTLE = { damage: 2, death: "Perso nel castello", deathText: "I mostri del castello abbandonato non perdonano" };
  // Il fuggitivo: ti vede come un animale, spara da vicino ogni `reload` battiti, scappa dal bordo
  // della mappa solo se sei lontano; damage = mezzi cuori
  const OUTLAW = { sight: 8, nightSight: 5, hearing: 2, range: 6, reload: 4, damage: 2, escape: 10,
    death: "Impallinato", deathText: "Il ricercato aveva la mira migliore" };
  // I bucanieri: due col fucile (un cuore ogni 6 battiti), due con la spada (colpiscono a contatto come i lupi).
  // Al tuo passo, vedono meno lontano degli animali; di notte, finché il tesoro c'è, dormono
  const PIRATE = { sight: 6, nightSight: 4, hearing: 1, range: 6, reload: 6, gun: 2, sword: 2, rest: 2, roam: 4,
    death: "Infilzato", deathText: "I bucanieri non perdonano chi tocca il loro bottino" };
  const PIRATE_TREASURE = 30;
  const PIRATE_WAKE = 0.8;    // quanto spesso una casella rumorosa li sveglia
  const OUTLAWS = [
    ["Bartolo il Guercio", "ha svuotato la cassa del dazio"], ["Gegia Tre Dita", "ha venduto la stessa nave a tre capitani"],
    ["Mastro Ruggine", "ha rubato la campana del Forte"], ["Nando Senzapane", "ha incendiato il granaio"],
    ["La Vedova Sale", "ha avvelenato il grog della taverna"], ["Zeno lo Storto", "ha falsificato le mappe del porto"],
  ];
  let lastSave = 0;
  let mapObserver = null;
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
    // Il passaggio a piedi verso una zona vicina della stessa isola: si arriva all'ora del giorno dopo
    pass:   { name: "Passaggio",        icon: "signpost",   cls: "t-pass",   walk: true,  sight: true, noise: 1, sound: "macerie", pass: true },
    // La torre della donna che aspetta una lettera
    tower:  { name: "Torre",            icon: "tower",      cls: "t-castle", walk: false, sight: false, tower: true },
    // La sabbia delle coste caraibiche
    sand:   { name: "Sabbia",           ch: "·",            cls: "t-sand",   walk: true,  sight: true, noise: 1, sound: "passoErba" },
    // Il falò della radura: ci si cuoce il marshmallow
    fire:   { name: "Falò",             icon: "campfire",   cls: "t-fire",   walk: false, sight: true, fire: true },
    // Il campo dei bucanieri: la carne che affumica, e intorno roba che fa rumore se la calpesti
    boucan: { name: "Carne affumicata", icon: "boucan",     cls: "t-boucan", walk: false, sight: true },
    glass:  { name: "Vetri rotti",      icon: "glass",      cls: "t-junk",   walk: true,  sight: true, noise: 4, sound: "macerie", junk: true },
    pot:    { name: "Padelle",          icon: "pot",        cls: "t-junk",   walk: true,  sight: true, noise: 4, sound: "macerie", junk: true },
    shards: { name: "Cocci",            icon: "shards",     cls: "t-junk",   walk: true,  sight: true, noise: 4, sound: "macerie", junk: true },
    // Il labirinto di siepi: le siepi, e le trappole tra le foglie (si vedono, appena)
    hedge:  { name: "Siepe",            cls: "t-hedge",  walk: false, sight: false },
    spike:  { name: "Foglie smosse",    icon: "trap",       cls: "t-spike",  walk: true,  sight: true, noise: 1, sound: "cespuglio", spike: true },
    // Il castello abbandonato, dentro
    cwall:  { name: "Muro del castello", cls: "t-cwall", walk: false, sight: false },
    swall:  { name: "Muro del castello", cls: "t-cwall t-swall", walk: false, sight: false, secret: true },
    cfloor: { name: "Corridoio",        ch: "·",            cls: "t-cfloor", walk: true,  sight: true, noise: 1, sound: "macerie" },
    rfloor: { name: "Pavimento",        ch: "·",            cls: "t-cfloor", walk: true,  sight: true, noise: 1, sound: "passoErba" },
    carpet: { name: "Tappeto rosso",    cls: "t-carpet", walk: true,  sight: true, noise: 0, sound: "passoErba" },
    ldoor:  { name: "Porta chiusa a chiave", icon: "lockeddoor", cls: "t-door", walk: false, sight: false, locked: true },
    door:   { name: "Porta",            icon: "door",       cls: "t-door",   walk: true,  sight: false, noise: 1, sound: "macerie" },
    exit:   { name: "Il portone",       icon: "drawbridge", cls: "t-door",   walk: true,  sight: true, noise: 0, exit: true },
    throne: { name: "Il trono",         icon: "throne",     cls: "t-throne", walk: false, sight: true },
    chair:  { name: "Sedia vuota",      icon: "chair",      cls: "t-chair",  walk: false, sight: true },
    rose:   { name: "Rose bianche",     icon: "rose",       cls: "t-rose",   walk: false, sight: true },
  };

  // Gli animali: l'orso di giorno, i lupi di notte, il cinghiale all'alba. L'orso colpisce forte (quattro
  // cuori) ma poi è sazio: dopo il fermo torna a vagare e ti riattacca solo se lo provochi da vicino.
  // L'orso è appena più veloce di te (in campo aperto ti prende in 6–7 passi) e ha il fiuto corto: rompendo la
  // vista, nascondendoti o passando dall'acqua lo puoi seminare. Finché non ti vede, sente o fiuta, vaga intorno
  // alla sua tana (wanderGoal) e non sa dove sei.
  // speed = passi per ogni tuo passo (l'acqua ne costa 2); il cinghiale invece carica in linea retta
  const KINDS = {
    bear: { name: "Orso", icon: "bear", speed: { hunt: 1.15, search: 1, wander: 0.5 }, sight: 9, nightSight: 6, smell: 3, hearing: 2, damage: 8, rest: 3, sated: true, sound: "orso", step: "passoOrso",
      verb: "L'orso ti raggiunge e ti colpisce!", death: "Sbranato", deathText: "L'orso ha avuto la meglio" },
    wolf: { name: "Lupo", icon: "wolf", speed: { hunt: 1, search: 1, wander: 0.5 }, sight: 8, nightSight: 8, smell: 5, hearing: 3, damage: 2, rest: 2, sound: "lupo", step: null,
      verb: "Un lupo ti azzanna!", death: "Azzannato", deathText: "Il branco ha avuto la meglio" },
    boar: { name: "Cinghiale", icon: "boar", charge: 8, chargeSpeed: 2, sight: 8, nightSight: 6, hearing: 2, damage: 3, rest: 2, sound: "orso", step: "passoOrso",
      verb: "Il cinghiale ti travolge!", death: "Travolto", deathText: "Il cinghiale non ha curvato, tu nemmeno" },
  };

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
    if (tags.has("torre")) return `${place} della torre`;
    if (tags.has("falo")) return `${place} del falò`;
    if (tags.has("labirinto")) return `${place} del labirinto`;
    if (tags.has("cascata")) return `${place} della cascata`;
    if (tags.has("lago")) return `${place} sul lago`;
    if (tags.has("rovine")) return `${place} con le rovine`;
    if (tags.has("villaggio")) return `${place} presso il villaggio`;
    return place;
  }

  const biomeOf = (tags) => Object.keys(BIOMI).find((b) => tags.has(b)) || "foresta";

  // Da che parte sta il mare: la zona si genera sempre col mare a ovest, poi si gira o si specchia perché il
  // mare stia dove sta sul globo, col nord in alto. Col mare a nord o a sud si genera su una mappa in piedi
  // (24 per 40) e poi la si gira. to: dalla mappa generata a quella vera; back: il contrario
  const SEA_SIDES = {
    ovest: { dims: [40, 24], to: (c) => ({ x: c.x, y: c.y }), back: (c) => ({ x: c.x, y: c.y }) },
    est: { dims: [40, 24], to: (c) => ({ x: 39 - c.x, y: c.y }), back: (c) => ({ x: 39 - c.x, y: c.y }) },
    nord: { dims: [24, 40], to: (c) => ({ x: c.y, y: c.x }), back: (c) => ({ x: c.y, y: c.x }) },
    sud: { dims: [24, 40], to: (c) => ({ x: c.y, y: 23 - c.x }), back: (c) => ({ x: 23 - c.y, y: c.x }) },
  };

  // shape = { coastal, sea, passes: [{ x, y, to }] }: la zona tocca il mare (dal lato sea, con l'ormeggio) o è
  // interna; i passaggi a piedi verso le zone vicine stanno sui bordi. La mappa è sempre la stessa, comunque ci arrivi
  function generate(seed, tags, bird, shape = { coastal: true, passes: [] }) {
    const side = SEA_SIDES[shape.coastal && shape.sea ? shape.sea : "ovest"];
    const inner = { ...shape, passes: shape.passes.map((ps) => ({ ...ps, ...side.back(ps) })) };
    const final = [W, H];
    [W, H] = side.dims;
    let zone = null;
    try {
      for (let attempt = 0; !zone; attempt++) zone = tryGenerate(rng(seed + attempt * 7919), tags, bird, attempt > 40, inner, attempt > 60);
    } finally {
      [W, H] = final;
    }
    return turn(zone, side.to, side.dims);
  }

  // La zona generata, girata: la mappa e tutte le caselle che ricorda
  function turn(g, to, [w, h]) {
    const map = Array.from({ length: H }, () => Array(W).fill("grass"));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = to({ x, y }); map[c.y][c.x] = g.map[y][x]; }
    const pt = (c) => (c ? { ...c, ...to(c) } : c);
    return {
      ...g, map, start: pt(g.start), bird: pt(g.bird), ship: pt(g.ship),
      lair: g.lair.map(pt), free: g.free.map(pt), tower: g.tower && g.tower.map(pt),
      ruin: g.ruin && { interior: new Set([...g.ruin.interior].map((k) => key(to(unkey(k))))) },
      camp: g.camp && { fire: pt(g.camp.fire), marsh: pt(g.camp.marsh) },
      pirates: g.pirates && { treasure: pt(g.pirates.treasure), boucan: pt(g.pirates.boucan), men: g.pirates.men.map(pt) },
      maze: g.maze && { ...g.maze, center: pt(g.maze.center), room: g.maze.room.map(pt) },
    };
  }

  function tryGenerate(r, tags, birdInfo, relaxed, shape, force = false) {
    const map = Array.from({ length: H }, () => Array(W).fill("grass"));
    const pick = (arr) => arr[Math.floor(r() * arr.length)];
    const shipY = 4 + Math.floor(r() * (H - 8));
    const look = BIOMI[biomeOf(tags)].mappa;
    const hot = tags.has("vulcano"); // il calore del vulcano scioglie il ghiaccio
    const frozen = look.water === "ice" && !hot;
    const feature = []; // le caselle della caratteristica che l'uccello cerca

    // Il mare a ovest, la nave ormeggiata sulla costa; le zone interne sono tutta terra, e si entra dal passaggio
    let start = null;
    if (shape.coastal) {
      let shore = 2;
      for (let y = 0; y < H; y++) {
        shore = Math.abs(y - shipY) <= 1 ? 1 : Math.max(1, Math.min(4, shore + (r() < 0.3 ? -1 : r() < 0.45 ? 1 : 0)));
        for (let x = 0; x < shore; x++) map[y][x] = "sea";
      }
      map[shipY][0] = "ship";
      start = { x: 1, y: shipY };
    }

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
    // La radura del falò: un cerchio d'alberi con due varchi, il fuoco nel mezzo, il marshmallow accanto
    const camp = tags.has("falo") ? placeCampfire(map, r) : null;
    const ruin = tags.has("rovine") ? placeRuin(map, r) : null;
    if (tags.has("villaggio")) placeHamlet(map, r);
    const castle = tags.has("castello") ? placeCastle(map, r) : null;
    if (castle) feature.push(...castle.cells);
    const tower = tags.has("torre") ? placeTower(map, r) : null;
    if (ruin) feature.push(...[...ruin.interior].map(unkey));
    // Il labirinto di siepi prende tutta la zona: niente vegetazione
    const maze = tags.has("labirinto") ? placeMaze(map, r, shape.coastal ? 5 : 1) : null;
    // Le pozze della palude, poi la vegetazione del bioma
    if (!maze) {
      blob("water", look.pools, 1, 0.75);
      blob("deep", Math.floor(look.pools / 3), 0, 1);
      blob("tree", hot ? Math.floor(look.trees / 2) : look.trees, 2, 0.6);
      if (look.tall) blob("tall", look.talls, 2, 0.7);
      blob("bush", look.bushes, 0, 1);
      blob(hot ? "basalt" : "rock", look.rocks, 0, 1);
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (map[y][x] === "glade") map[y][x] = "grass";
    // Le coste caraibiche: sabbia per cinque file dal mare, poi sabbia ed erba, poi erba con chiazze di sabbia
    const beach = shape.coastal && biomeOf(tags) === "tropicale";
    if (beach) {
      for (let y = 0; y < H; y++) {
        const x0 = map[y].findIndex((t) => t !== "sea" && t !== "ship");
        for (let x = x0; x < x0 + 9 && x < W; x++) {
          if (["water", "deep", "rock", "pass"].includes(map[y][x])) continue;
          if (x < x0 + 5 || (x < x0 + 9 && r() < 0.7 - (x - x0 - 5) * 0.15)) map[y][x] = "sand";
        }
      }
      blob("sand", 9, 1, 0.6);
    }

    // Spazio libero allo sbarco
    if (shape.coastal) for (let y = shipY - 1; y <= shipY + 1; y++) {
      for (let x = 1; x <= 3; x++) if (inside(x, y) && map[y][x] !== "sea") map[y][x] = beach ? "sand" : "grass";
    }
    // I passaggi verso le zone vicine, sul bordo, con un po' di spazio libero davanti
    for (const ps of shape.passes) {
      for (let y = ps.y - 1; y <= ps.y + 1; y++) for (let x = ps.x - 1; x <= ps.x + 1; x++) {
        if (inside(x, y) && !["sea", "ship", "castle", "gate", "tower"].includes(map[y][x])) map[y][x] = "grass";
      }
      map[ps.y][ps.x] = "pass";
    }
    // nelle zone interne si entra dal primo passaggio: è il punto di riferimento della mappa
    if (!start) start = inward(shape.passes[0]);
    // dopo tanti tentativi andati male, un sentiero d'erba dritto da ogni passaggio all'entrata
    if (force) for (const ps of shape.passes) {
      let { x, y } = inward(ps);
      while (x !== start.x || y !== start.y) {
        if (!tile(map, x, y).walk && !["sea", "ship"].includes(map[y][x])) map[y][x] = "grass";
        if (x !== start.x) x += Math.sign(start.x - x); else y += Math.sign(start.y - y);
      }
    }

    // il labirinto si apre verso ogni entrata, e tra le foglie ci sono le trappole
    if (maze) mazeDoors(map, r, maze, [start, ...shape.passes.map(inward)]);
    const reach = bfs(map, start).depth;
    if (ruin && ![...ruin.interior].some((k) => reach.has(k))) return null;
    if (tower && !tower.some((c) => DIRS.some(([dx, dy]) => reach.has(key({ x: c.x + dx, y: c.y + dy }))))) return null;
    if (castle && !reach.has(key(castle.bridge))) return null;   // al ponte del castello si arriva sempre
    if (shape.passes.some((ps) => !reach.has(key(ps)))) return null;
    if (camp && !DIRS.some(([dx, dy]) => reach.has(key({ x: camp.fire.x + dx, y: camp.fire.y + dy })))) return null;
    const free = [...reach.keys()].map(unkey).filter((c) => ["grass", "tall", "sand"].includes(map[c.y][c.x]) && !(camp && same(c, camp.marsh)));

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
    let birdSpots = maze ? maze.room.filter((c) => reach.has(key(c)) && observable(c) && !same(c, maze.center))
      : insideSpots.length ? insideSpots
      : free.filter((c) => dist(c, start) >= 14 && (nearWater(c) || relaxed) && observable(c) && (!wantsFeature || nearFeature(c) || relaxed));
    if (!birdSpots.length) return null;
    const bird = pick(birdSpots);

    // Gli animali fanno la guardia al territorio dell'uccello
    let lair = free.filter((c) => dist(c, start) >= 12 && dist(c, bird) >= 5 && dist(c, bird) <= 9);
    if (!lair.length) lair = free.filter((c) => dist(c, start) >= 12);
    if (!lair.length) return null;
    lair.sort(() => r() - 0.5);

    // Il campo dei bucanieri: lontano da dove si arriva, col tesoro, la carne, quattro uomini e l'immondizia
    const pirates = tags.has("bucanieri") ? placePirates(map, r, free, [start, ...shape.passes.map(inward)], bird) : null;
    if (tags.has("bucanieri") && !pirates) return null;

    // il campo non è posto per oggetti, mercanti e forzieri
    const open = pirates ? free.filter((c) => ["grass", "tall", "sand"].includes(map[c.y][c.x]) && dist(c, pirates.treasure) > 7) : free;
    return { map, start, bird, lair, free: open, ruin, tower, camp, pirates, maze, ship: shape.coastal ? { x: 0, y: shipY } : null };
  }

  // Il labirinto di siepi: un labirinto perfetto (un solo modo per andare da un punto all'altro) su una griglia
  // di caselle dispari, con qualche varco in più perché non sia una sola strada; in mezzo uno slargo
  function placeMaze(map, r, x0) {
    for (let y = 0; y < H; y++) for (let x = x0 - 1; x < W; x++) if (map[y][x] !== "sea" && map[y][x] !== "ship") map[y][x] = "hedge";
    const cells = [];
    for (let y = 1; y <= H - 2; y += 2) for (let x = x0; x <= W - 2; x += 2) cells.push({ x, y });
    const seen = new Set();
    const stack = [cells[Math.floor(r() * cells.length)]];
    seen.add(key(stack[0]));
    map[stack[0].y][stack[0].x] = "grass";
    while (stack.length) {
      const c = stack[stack.length - 1];
      const next = DIRS.map(([dx, dy]) => ({ x: c.x + dx * 2, y: c.y + dy * 2, wx: c.x + dx, wy: c.y + dy }))
        .filter((n) => n.x >= x0 && n.y >= 1 && n.x <= W - 2 && n.y <= H - 2 && !seen.has(key(n)));
      if (!next.length) { stack.pop(); continue; }
      const n = next[Math.floor(r() * next.length)];
      map[n.wy][n.wx] = "grass";
      map[n.y][n.x] = "grass";
      seen.add(key(n));
      stack.push({ x: n.x, y: n.y });
    }
    // qualche muro in meno: anelli e scorciatoie
    for (let y = 1; y <= H - 2; y++) for (let x = x0; x <= W - 2; x++) {
      if (map[y][x] !== "hedge" || (x - x0) % 2 === (y - 1) % 2 || r() > 0.07) continue;
      map[y][x] = "grass";
    }
    // lo slargo in mezzo, con la coppa
    const center = cells.slice().sort((a, b) => Math.hypot(a.x - (x0 + W) / 2, a.y - H / 2) - Math.hypot(b.x - (x0 + W) / 2, b.y - H / 2))[0];
    const room = [];
    for (let y = center.y - 2; y <= center.y + 2; y++) for (let x = center.x - 2; x <= center.x + 2; x++) {
      if (x >= x0 && y >= 1 && x <= W - 2 && y <= H - 2) { map[y][x] = "grass"; room.push({ x, y }); }
    }
    return { x0, center, room };
  }

  // Dalle entrate (la nave, i passaggi) fino al corridoio più vicino; poi le trappole, lontano dalle entrate
  function mazeDoors(map, r, maze, entries) {
    for (const e of entries) {
      const { prev, depth } = bfs(map, e, Infinity, () => true);
      const target = [...depth.keys()].map(unkey).filter((c) => c.x >= maze.x0 && map[c.y][c.x] === "grass")
        .sort((a, b) => depth.get(key(a)) - depth.get(key(b)))[0];
      for (const c of pathFrom(prev, e, target) || []) if (map[c.y][c.x] === "hedge") map[c.y][c.x] = "grass";
    }
    const corridors = [];
    for (let y = 1; y < H - 1; y++) for (let x = maze.x0; x < W - 1; x++) {
      const c = { x, y };
      if (map[y][x] === "grass" && !maze.room.some((q) => same(q, c)) && entries.every((e) => dist(e, c) > 4)) corridors.push(c);
    }
    corridors.sort(() => r() - 0.5).slice(0, MAZE_TRAPS).forEach((c) => { map[c.y][c.x] = "spike"; });
  }

  // Il tesoro in mezzo, la carne accanto, quattro uomini intorno, e caselle rumorose sparse. Da ogni entrata
  // al tesoro c'è sempre un sentiero senza caselle rumorose e senza bucanieri
  function placePirates(map, r, free, entries, bird) {
    const far = free.filter((c) => entries.every((e) => dist(c, e) >= 14) && dist(c, bird) >= 6 && c.x > 2 && c.x < W - 3 && c.y > 2 && c.y < H - 3);
    if (!far.length) return null;
    const treasure = far[Math.floor(r() * far.length)];
    const near = (lo, hi) => free.filter((c) => { const d = dist(c, treasure); return d >= lo && d <= hi; }).sort(() => r() - 0.5);
    const boucan = DIRS.map(([dx, dy]) => ({ x: treasure.x + dx, y: treasure.y + dy })).find((c) => map[c.y][c.x] === "grass" || map[c.y][c.x] === "tall");
    if (!boucan) return null;
    map[boucan.y][boucan.x] = "boucan";
    const men = near(2, 4).filter((c) => !same(c, boucan)).slice(0, 4);
    if (men.length < 4) return null;
    const taken = (c) => same(c, treasure) || same(c, boucan) || men.some((m) => same(m, c));
    const junk = ["glass", "pot", "shards"];
    for (const c of near(1, 7)) if (!taken(c) && r() < 0.3) map[c.y][c.x] = junk[Math.floor(r() * 3)];
    // il sentiero silenzioso: da ogni entrata, evitando i bucanieri e la carne; l'immondizia sul sentiero si toglie
    const menKeys = new Set(men.map(key));
    for (const e of entries) {
      const { prev } = bfs(map, e, Infinity, (c) => tile(map, c.x, c.y).walk && !menKeys.has(key(c)));
      const path = pathFrom(prev, e, treasure);
      if (!path) return null;
      for (const c of path) if (tile(map, c.x, c.y).junk) map[c.y][c.x] = "grass";
    }
    return { treasure, boucan, men };
  }

  // La radura del falò: dentro tutto libero (glade, che la vegetazione non tocca), intorno un anello d'alberi
  // con due varchi, il fuoco nel mezzo e il marshmallow appoggiato lì accanto
  function placeCampfire(map, r) {
    const cx = 16 + Math.floor(r() * (W - 26)), cy = 7 + Math.floor(r() * (H - 14));
    const gaps = [r() * Math.PI * 2];
    gaps.push(gaps[0] + Math.PI * (0.7 + r() * 0.6));
    const inGap = (a) => gaps.some((g) => Math.abs(((a - g + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.26);
    // fuori dall'anello una fascia libera, così il cerchio si legge e non si confonde col bosco
    for (let y = cy - 7; y <= cy + 7; y++) {
      for (let x = cx - 9; x <= cx + 9; x++) {
        if (!inside(x, y)) continue;
        const d = Math.hypot((x - cx) / 1.25, y - cy);
        if (d > 6.6) continue;
        if (d <= 4.2 || (d > 5.4 && map[y][x] === "grass") || (d <= 5.4 && inGap(Math.atan2(y - cy, (x - cx) / 1.25)))) map[y][x] = "glade";
        else if (d <= 5.4) map[y][x] = "tree";
      }
    }
    map[cy][cx] = "fire";
    return { fire: { x: cx, y: cy }, marsh: { x: cx + 2, y: cy } };
  }

  // La casella appena dentro la mappa, davanti a un passaggio sul bordo
  const inward = (ps) => ({ x: ps.x === 0 ? 1 : ps.x === W - 1 ? W - 2 : ps.x, y: ps.y === 0 ? 1 : ps.y === H - 1 ? H - 2 : ps.y });

  // La torre: due caselle per due, di pietra, con un anello d'erba intorno per arrivarci
  function placeTower(map, r) {
    const x0 = 20 + Math.floor(r() * (W - 26)), y0 = 3 + Math.floor(r() * (H - 9));
    for (let y = y0 - 1; y <= y0 + 2; y++) for (let x = x0 - 1; x <= x0 + 2; x++) if (inside(x, y)) map[y][x] = "grass";
    const cells = [];
    for (let y = y0; y <= y0 + 1; y++) for (let x = x0; x <= x0 + 1; x++) { map[y][x] = "tower"; cells.push({ x, y }); }
    return cells;
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
    return { cells, bridge: { x: cx, y: H - 3 } };
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

  // Chi c'è in questo momento: di giorno l'orso, di notte i lupi, all'alba il cinghiale (o l'orso, vicino al
  // fiume). Una zona senza animali non c'è mai
  function spawnBeasts(gen, zone, time) {
    if (zone.tags.has("bucanieri") || zone.tags.has("labirinto")) return [];
    const r = rng(zone.seed ^ Math.imul(trip.third + 1, 0x9e3779b1));
    const river = zone.tags.has("fiume");
    const spots = gen.lair.slice();
    const out = [];
    const add = (kind) => {
      const at = spots.shift();
      if (at) out.push({ kind, ...at, home: { ...at }, mode: "wander", last: null, searchLeft: 0, rest: 0, energy: 0, next: null, dir: null, run: 0 });
    };
    if (time === "pomeriggio") add("bear");
    if (time === "notte") {
      const pack = ["taiga", "ghiaccio"].includes(zone.biome) ? 3 : 2;
      // il branco sta unito: gli altri lupi accanto al primo
      const first = spots[0];
      if (first) spots.sort((a, b) => dist(a, first) - dist(b, first));
      for (let i = 0; i < pack; i++) add("wolf");
    }
    if (time === "alba") {
      if (river && r() < 0.3) add("bear");
      else add("boar");
    }
    return out;
  }

  // --- Spedizione ---

  // La spedizione: il mondo, la nave, il tempo, i soldi, il diario. Dura finché giochi.
  // trip.third conta i terzi di giornata passati: 0 = alba del primo giorno, 1 = pomeriggio, 2 = notte, 3 = alba del secondo…
  let trip = null;
  let explorer = "";
  let notebook = null;   // il taccuino ripreso ({ birds, voyages, stamps }), per la prossima spedizione

  // la vita massima: cinque cuori, più quello rosa della donna della torre
  const maxHp = () => MAX_HP + (trip && trip.pink ? 2 : 0);

  const timeOf = (third) => TIMES[((third % 3) + 3) % 3];
  const now = () => timeOf(trip.third);
  const day = () => Math.floor(trip.third / 3) + 1;
  const timeLabel = (t) => ({ alba: "all'alba", pomeriggio: "nel pomeriggio", notte: "di notte" })[t];
  // Il tempo detto a parole, senza contarlo: cosa succede al cielo aspettando, e quando si arriva
  const comingTime = (n) => ({ alba: "arriverà l'alba", pomeriggio: "si farà pomeriggio", notte: "calerà la notte" })[timeOf(trip.third + n)];
  function arrivalTime(n) {
    const t = timeOf(trip.third + n);
    const sameDay = Math.floor((trip.third + n) / 3) === Math.floor(trip.third / 3);
    if (t === "alba") return "arriverai all'alba";
    if (t === "pomeriggio") return sameDay ? "arriverai nel pomeriggio" : "arriverai domani pomeriggio";
    return sameDay ? "arriverai stanotte" : "arriverai domani notte";
  }

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
    // la torre della donna: sempre una, in una zona qualunque senza castello né vulcano
    pickZone((z) => !z.tags.has("castello") && !z.tags.has("vulcano"))?.tags.add("torre");
    // la radura del falò: una, in una zona interna (se non ce ne sono, in una qualunque)
    const inner = (z) => !world.coastal[z.id] && !["castello", "vulcano", "torre"].some((t) => z.tags.has(t));
    (pickZone(inner) || pickZone((z) => !["castello", "vulcano", "torre"].some((t) => z.tags.has(t))))?.tags.add("falo");
    // il labirinto di siepi: uno, in una zona di foresta; dentro solo il labirinto (niente fiume, lago, rovine…)
    const rl = rng(seed ^ 0x1ab1);
    const forest = wild.filter((z) => z.biome === "foresta" && !["castello", "vulcano", "torre", "falo"].some((t) => z.tags.has(t)));
    const mazeZone = forest.length ? forest[Math.floor(rl() * forest.length)] : null;
    if (mazeZone) {
      for (const t of ["fiume", "lago", "cascata", "rovine", "villaggio"]) mazeZone.tags.delete(t);
      mazeZone.tags.add("labirinto");
    }
    // i campi dei bucanieri: rari, uno o due per arcipelago, mai dove c'è già qualcosa di speciale
    const rb = rng(seed ^ 0xb0ca4);
    const plain = (z) => !["castello", "vulcano", "torre", "falo", "labirinto"].some((t) => z.tags.has(t));
    wild.filter(plain).sort(() => rb() - 0.5).slice(0, rb() < 0.4 ? 2 : 1).forEach((z) => z.tags.add("bucanieri"));
    // i forzieri chiusi: uno ogni CHEST_EVERY zone, almeno uno
    const rc = rng(seed ^ 0x7c4e57);
    world.chests = wild.filter((z) => !z.tags.has("bucanieri") && !z.tags.has("labirinto")).slice().sort(() => rc() - 0.5).slice(0, Math.max(1, Math.round(wild.length / CHEST_EVERY))).map((z) => z.id);
    for (const z of world.zones) z.name = zoneName(z.tags, z.place);
    // Due mercanti girano per il globo, ognuno in una zona, e cercano un oggetto preciso
    const rm = rng(seed ^ 0x3e7c11);
    const kinds = Object.keys(OGGETTI);
    world.merchants = wild.filter((z) => !z.tags.has("bucanieri") && !z.tags.has("labirinto")).sort(() => rm() - 0.5).slice(0, MERCHANTS)
      .map((z) => ({ zone: z.id, wants: kinds[Math.floor(rm() * kinds.length)] }));
    world.seaSide = seaSides(world);
    world.paths = makePaths(world, seed);
    // le nebbie del pesce gatto: due o tre, in mare aperto, lontano dalle coste e dalla partenza
    const rf = rng(seed ^ 0xf06f15);
    world.fogs = [];
    for (const clear of [14, 11, 9]) {
      for (let tries = 0; world.fogs.length < 3 && tries < 600; tries++) {
        const at = { lat: -62 + rf() * 124, lon: -180 + rf() * 360, rad: 9 + rf() * 3 };
        if (!Globo.isWater(world, at.lat, at.lon) || Globo.nearestCoast(world, at.lat, at.lon, clear)) continue;
        if (Globo.distance(at, world.start) < at.rad + 8 || world.fogs.some((f) => Globo.distance(f, at) < f.rad + at.rad + 12)) continue;
        world.fogs.push(at);
      }
      if (world.fogs.length >= 2) break;
    }
    // in ogni nebbia una lucina: l'esca del pesce gatto
    for (const f of world.fogs) f.lure = Globo.advance(f.lat, f.lon, rf() * 360, rf() * f.rad * 0.5);
    return world;
  }

  // Da che parte guarda il mare ogni zona sulla costa: la media delle sue rive, viste dal suo centro
  function seaSides(world) {
    const sum = {};
    for (const c of world.coast) {
      const z = world.zones[c.zone];
      const lat = Math.asin(c.p[2]) * 180 / Math.PI, lon = Math.atan2(c.p[1], c.p[0]) * 180 / Math.PI;
      const v = (sum[c.zone] ||= [0, 0]);
      v[0] += (((lon - z.lon + 540) % 360) - 180) * Math.cos(z.lat * Math.PI / 180);
      v[1] += lat - z.lat;
    }
    const sides = {};
    for (const [id, [east, north]] of Object.entries(sum)) sides[id] = Math.abs(east) > Math.abs(north) ? (east > 0 ? "est" : "ovest") : north > 0 ? "nord" : "sud";
    return sides;
  }

  // I passaggi a piedi tra le zone confinanti della stessa isola (mai la zona di una città).
  // Ogni zona interna è collegata, passaggio dopo passaggio, a una zona sul mare; poi ogni zona ne ha
  // uno o due. Un passaggio sta sul bordo che guarda la zona vicina: a nord, a sud, a est (a ovest,
  // dove c'è il mare, solo nelle zone interne)
  function makePaths(world, seed) {
    const r = rng(seed ^ 0x9a55e5);
    const cityZones = new Set(world.cities.map((c) => c.zone));
    const ok = (id) => !cityZones.has(id);
    const near = (id) => world.adjacent[id].filter(ok);
    const edges = new Set();
    const link = (a, b) => edges.add(a < b ? `${a}-${b}` : `${b}-${a}`);
    const count = (id) => [...edges].filter((e) => e.split("-").map(Number).includes(id)).length;
    // dalle zone sul mare verso l'interno: ogni zona interna prende il passaggio da chi la scopre per primo
    const seen = new Set(world.zones.filter((z) => ok(z.id) && world.coastal[z.id]).map((z) => z.id));
    const queue = [...seen].sort(() => r() - 0.5);
    while (queue.length) {
      const id = queue.shift();
      for (const n of near(id).sort(() => r() - 0.5)) {
        if (seen.has(n)) continue;
        seen.add(n);
        link(id, n);
        queue.push(n);
      }
    }
    // chi non ha ancora un passaggio ne prende uno, verso un vicino che ne ha meno di due
    for (const z of world.zones) {
      if (!ok(z.id) || count(z.id) >= 1) continue;
      const n = near(z.id).filter((m) => count(m) < 2).sort(() => r() - 0.5)[0];
      if (n != null) link(z.id, n);
    }
    // da che parte della mappa sta ogni passaggio
    const paths = {};
    for (const e of edges) {
      const [a, b] = e.split("-").map(Number);
      for (const [from, to] of [[a, b], [b, a]]) {
        const A = world.zones[from], B = world.zones[to];
        const dLat = B.lat - A.lat, dLon = ((B.lon - A.lon + 540) % 360) - 180;
        const east = dLon * Math.cos(A.lat * Math.PI / 180);
        let side = Math.abs(east) > Math.abs(dLat) ? (east > 0 ? "est" : "ovest") : dLat > 0 ? "nord" : "sud";
        // dove c'è il mare o il castello non c'è un passaggio: si prende il lato più vicino che è libero
        const blocked = [world.coastal[from] && world.seaSide[from], A.tags.has("castello") && castleSide(world.seaSide[from], world.coastal[from])];
        if (blocked.includes(side)) {
          const order = [[east, "est"], [-east, "ovest"], [dLat, "nord"], [-dLat, "sud"]].sort((a, b) => b[0] - a[0]).map(([, sd]) => sd);
          side = order.find((sd) => !blocked.includes(sd)) || side;
        }
        (paths[from] ||= []).push({ to, side, pos: rng(A.seed ^ B.seed)() });
      }
    }
    return paths;
  }

  // Il castello sta sul bordo sud della mappa generata (vedi placeCastle): girata, dove finisce
  const castleSide = (sea, coastal) => (coastal && (sea === "nord" || sea === "sud") ? "est" : "sud");

  // La forma della mappa di una zona: sul mare o interna, e dove stanno i passaggi
  function zoneShape(zone) {
    const list = trip.world.paths[zone.id] || [];
    const used = {};
    const passes = list.map(({ to, side, pos }) => {
      // due passaggi sullo stesso lato non si toccano
      const p = used[side] != null ? (used[side] + 0.5) % 1 : pos;
      used[side] = p;
      const x = Math.round(10 + p * (W - 14)), y = Math.round(3 + p * (H - 7));
      const cell = side === "nord" ? { x, y: 0 } : side === "sud" ? { x, y: H - 1 } : side === "est" ? { x: W - 1, y } : { x: 0, y };
      return { ...cell, to };
    });
    return { coastal: !!trip.world.coastal[zone.id], sea: trip.world.seaSide[zone.id], passes };
  }

  function start(name) {
    explorer = (name || explorer || "").trim() || "Senza nome";
    const seed = Math.floor(Math.random() * 1e9);
    const world = makeWorld(seed);
    trip = {
      seed, world, third: 0, money: START_MONEY, hp: MAX_HP, explorer, mode: "sea",
      zones: {}, birds: {}, notes: [], payments: [], departures: 0, seaDist: 0, over: false,
      hold: [], pack: [], rumors: [], heard: { taverna: 0, mercante: 0 },
      stats: { steps: 0, landings: 0, waits: 0, hits: 0, escapes: 0, islands: new Set() },
      ship: { ...world.start, sails: 0 },
      voyage: notebook ? (notebook.voyages || 1) + 1 : 1, stamps: notebook ? [...(notebook.stamps || [])] : [], bounties: [],
    };
    s = null;
    // il taccuino ripreso: i suoi uccelli sono già osservati
    if (notebook) {
      for (const id of notebook.birds) if (UCCELLI[id]) trip.birds[id] = { level: "visto", zone: "taccuino precedente", day: 0, time: "" };
      notebook = null;
      // le specie già complete nel vecchio taccuino la Società le ha già premiate: non si ripagano
      trip.society = Object.keys(SPECIE).filter((sp) => UCCELLI.filter((u) => u.specie === sp && !u.rara && !u.uovo).every((u) => trip.birds[u.id]));
    }
    initUi();
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

  // A fine spedizione il taccuino resta nel browser: "Riprendi un taccuino" lo userà senza dover scrivere il codice
  function saveNotebook() {
    const data = { explorer: trip.explorer, ...notebookData(), code: code(), day: day(), date: new Date().toISOString().slice(0, 10) };
    try { localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(data)); } catch (e) { /* senza memoria resterà il codice */ }
  }

  // Quello che il codice del taccuino si porta dietro: gli uccelli osservati, i viaggi, i timbri
  function notebookData() {
    return { birds: UCCELLI.filter((u) => trip.birds[u.id]?.level === "visto").map((u) => u.id), voyages: trip.voyage || 1, stamps: trip.stamps || [] };
  }

  const code = () => Taccuino.encode(notebookData());

  function loadNotebook() {
    try { return JSON.parse(localStorage.getItem(NOTEBOOK_KEY)); } catch (e) { return null; }
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* niente da cancellare */ }
  }

  // Si riparte da dove eri: in mare nello stesso punto, in città in porto, a terra di nuovo sulla nave
  // della stessa zona ma un giorno dopo
  function resume() {
    const data = loadSave();
    if (!data) return false;
    try {
      const world = makeWorld(data.seed);
      explorer = data.explorer;
      trip = { hold: [], pack: [], rumors: [], heard: { taverna: 0, mercante: 0 }, voyage: 1, stamps: [], ...data, world, stats: { ...data.stats, islands: new Set(data.stats.islands) } };
      // le taglie accettate prima della 0.8: dai prigionieri e dall'avviso in corso
      if (!trip.bounties) {
        trip.bounties = (trip.captured || []).map((p) => ({ name: p.name, crime: "", day: p.day, state: p.delivered ? "delivered" : "caught" }));
        if (trip.wanted?.state === "free") trip.bounties.push({ name: trip.wanted.name, crime: trip.wanted.crime, day: trip.wantedDay || day(), state: "free" });
      }
      if (trip.pack.some((it) => it.kind === "lettera")) trip.towerKnown = true;
      // gli oggetti delle versioni vecchie (spade, piume…) non esistono più: diventano idoli
      trip.hold = trip.hold.map((it) => (OGGETTI[it.kind] ? it : { kind: "idolo" }));
      trip.pack = trip.pack.filter((it) => OGGETTI_SPECIALI[it.kind]);   // la bussola non c'è più
      if (trip.wanted?.state === "caught" && !trip.captured) trip.captured = [{ name: trip.wanted.name, day: day(), delivered: false }];
      for (const m of Object.values(trip.zones)) if (m.item && !OGGETTI[m.item.kind]) m.item.kind = "idolo";
      s = null;
      initUi();
      // ci si risveglia sulla nave, cioè nella zona dove è ormeggiata (non in quella dove si era a piedi)
      const zone = world.zones.find((z) => z.id === (trip.shipZone ?? trip.landZone));
      const city = world.cities.find((c) => c.id === trip.city);
      if (trip.mode === "land" && zone) {
        // Ricaricare a terra costa un giorno intero: niente fughe dagli orsi col refresh
        if (!advance(REFRESH_COST)) return true;
        landAt(zone, { waited: true });
        log("Hai perso un giorno: ti risvegli sulla nave.");
      } else {
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

  // Far passare uno o più terzi di giornata. A ogni nuova alba si paga la ciurma: se non si può, finisce tutto.
  function advance(thirds) {
    for (let i = 0; i < thirds; i++) {
      trip.third++;
      if (trip.third % 3 === 0 && !passDay()) return false;
      wantedExpired();
    }
    return true;
  }

  // Ripartire (da terra o dalla città) fa passare due terzi di giornata: si arriva all'ora che precede quella di partenza
  function depart() {
    if (s) trip.hp = s.player.hp;
    el.overlay.hidden = true;
    s = null;
    trip.departures++;
    if (!advance(DEPART_COST)) return;
    Mare.enter();
  }

  // Sbarcare dalla nave (la nave resta ormeggiata in questa zona), oppure arrivare a piedi da una zona
  // vicina (via: da dove vieni), entrando dal passaggio che porta là
  function landAt(zone, { waited = false, via = null, at = null, quiet = false, bush = false } = {}) {
    trip.mode = "land";
    trip.landZone = zone.id;
    if (via == null && !waited) trip.shipZone = zone.id;
    if (trip.shipZone == null) trip.shipZone = zone.id;
    const time = now();
    const memory = (trip.zones[zone.id] ||= { visited: false, done: false, gone: false });
    // L'uccello della zona si decide al primo attracco, tra quelli adatti, e poi resta quello.
    // I rari no: li porterà in una zona solo una voce di taverna (al massimo due per spedizione)
    if (memory.bird === undefined) memory.bird = uccelloPerZona(zone.tags, zone.biome, Math.random)?.id ?? null;
    const bird = memory.bird != null ? UCCELLI[memory.bird] : null;
    const shape = zoneShape(zone);
    const gen = generate(zone.seed, zone.tags, bird, shape);
    // la nave c'è solo dove l'hai ormeggiata: altrove, sulla costa, il mare e basta
    if (gen.ship && zone.id !== trip.shipZone) gen.map[gen.ship.y][gen.ship.x] = "sea";
    const arrival = via != null ? shape.passes.find((ps) => ps.to === via) : null;
    let entry = at || (arrival ? inward(arrival) : gen.start);
    // ti risvegli in un cespuglio vicino alla nave
    if (bush) {
      const near = gen.free.filter((c) => dist(c, gen.start) >= 2 && dist(c, gen.start) <= 5).sort((a, b) => dist(a, gen.start) - dist(b, gen.start));
      if (near.length) { entry = near[0]; gen.map[entry.y][entry.x] = "bush"; }
    }
    if (!memory.visited) {
      memory.visited = true;
      trip.stats.islands.add(zone.island);
    }
    if (!waited) trip.stats.landings++;
    // i semi sparsi: cambiata almeno una volta l'ora del giorno, l'uccello volato via torna nella zona (non dove sono i semi)
    let back = false;
    if (memory.gone && memory.seededAt != null && trip.third > memory.seededAt) {
      memory.gone = false;
      memory.seededAt = null;
      back = true;
    }
    if (back) {
      const spots = gen.free.filter((c) => dist(c, gen.start) >= 10 && bandCells(gen.map, c).length >= 3);
      if (spots.length) Object.assign(gen.bird, pickRandom(spots));
    }
    const present = !!bird && !memory.done && !memory.gone && bird.ore.includes(time);
    // il diario segna solo gli sbarchi: dove, a che ora (lo dice la data della nota) e se l'uccello c'era
    const from = via != null ? ` <small>(a piedi da ${trip.world.zones[via].name})</small>` : "";
    if (!quiet) note(`${zone.name}${from}: ${present ? "sembra un cinguettio." : memory.done ? "uccello già nel taccuino." : memory.gone ? "l'uccello è volato via." : bird ? "nessun uccello, ora sbagliata." : "nessun uccello."}`, "bird");
    // L'oggetto della zona si decide al primo sbarco, e resta lì finché non lo prendi
    const ri = rng(zone.seed ^ 0x17e3);
    if (memory.item === undefined) memory.item = gen.ruin || ri() < ITEM_CHANCE ? { kind: oggettoACaso(ri, !!gen.ruin), taken: false } : null;
    // il posto ha un suo generatore: aspettare a bordo non sposta l'oggetto né il mercante
    const rp = rng(zone.seed ^ 0x2b51);
    const itemSpots = gen.ruin ? [...gen.ruin.interior].map(unkey).filter((c) => gen.map[c.y][c.x] === "floor")
      : gen.free.filter((c) => dist(c, gen.start) >= 8 && DIRS.some(([dx, dy]) => inside(c.x + dx, c.y + dy) && gen.map[c.y + dy][c.x + dx] === "tree"));
    const itemAt = itemSpots.length ? itemSpots[Math.floor(rp() * itemSpots.length)] : null;
    const merchant = trip.world.merchants.find((m) => m.zone === zone.id && !memory.traded);
    // il mercante e, accanto a lui (a est), il suo carretto: servono due caselle libere
    const isFree = (c) => gen.free.some((f) => same(f, c)) && (!itemAt || !same(c, itemAt));
    const merchantSpots = gen.free.filter((c) => dist(c, gen.start) >= 4 && dist(c, gen.start) <= 9 && isFree(c) && isFree({ x: c.x + 1, y: c.y }));
    const merchantAt = merchant && merchantSpots.length ? merchantSpots[Math.floor(rp() * merchantSpots.length)] : null;
    s = {
      zone,
      seed: zone.seed,
      tags: zone.tags,
      time,
      map: gen.map,
      free: gen.free,
      ruin: gen.ruin,
      startPos: entry,
      player: { ...entry, hp: trip.hp },
      passes: shape.passes,
      bird: { ...gen.bird, info: bird, present, observed: false, gone: false },
      beasts: spawnBeasts(gen, zone, time),
      item: memory.item && !memory.item.taken && itemAt ? { ...itemAt, kind: memory.item.kind } : null,
      merchant: merchantAt ? { ...merchantAt, wants: merchant.wants, cart: { x: merchantAt.x + 1, y: merchantAt.y } } : null,
      fugitive: hideout(gen, zone, itemAt, merchantAt, rp),
      chest: chestSpot(gen, zone, memory, itemAt, merchantAt, rp),
      tower: gen.tower,
      towerMet: false,
      fire: gen.camp ? gen.camp.fire : null,
      marsh: gen.camp && !trip.marshTaken ? gen.camp.marsh : null,
      traps: new Set((memory.traps || []).filter((k) => { const c = unkey(k); return tile(gen.map, c.x, c.y).walk; })),
      bottle: bottleOf(zone, gen, memory),
      holes: new Set(),
      // il labirinto: la coppa nello slargo, l'unicorno e il mostro gentili che girano per i corridoi
      cup: gen.maze && !memory.cupTaken ? gen.maze.center : null,
      npcs: gen.maze ? mazeFolk(gen, rp) : [],
      // il castello: dove si torna uscendo dal portone (sul ponte, davanti al ponte levatoio)
      gateAt: castleGate(gen),
      pirates: gen.pirates ? gen.pirates.men.map((c, i) => ({ ...c, home: { ...c }, gun: i < 2, reload: 0, energy: 0, rest: 0,
        mode: memory.looted ? "hunt" : time === "notte" ? "sleep" : "guard" })) : [],
      loot: gen.pirates && !memory.looted ? gen.pirates.treasure : null,
      run: 0,
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
    if (bird && !present && !memory.done && !memory.gone && !bird.rara) learn(bird, "traccia");
    if (s.merchant) log("Qualcuno col cappuccio aspetta vicino alla riva.");
    if (s.pirates.length) note("Nessuna traccia di animali.");
    render();
  }

  // L'unicorno e il mostro del labirinto: in due corridoi lontani dall'entrata
  function mazeFolk(gen, r) {
    const spots = gen.free.filter((c) => dist(c, gen.start) >= 10 && gen.map[c.y][c.x] === "grass" && !gen.maze.room.some((q) => same(q, c)));
    return ["unicorn", "minotaur"].map((kind) => ({ kind, ...spots.splice(Math.floor(r() * spots.length), 1)[0] })).filter((n) => n.x != null);
  }

  // La casella del ponte davanti al ponte levatoio: lì si esce dal castello
  function castleGate(gen) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (gen.map[y][x] !== "gate") continue;
      const front = DIRS.map(([dx, dy]) => ({ x: x + dx, y: y + dy })).find((c) => inside(c.x, c.y) && gen.map[c.y][c.x] === "bridge");
      if (front) return front;
    }
    return null;
  }

  // La bottiglia col messaggio: in una zona caraibica sul mare su tre, sulla prima fila di terra. Il messaggio
  // porta a una casella dove scavare: si sceglie prima l'arrivo (calpestabile, non acqua), poi da due a quattro
  // tratti dritti dalla bottiglia fin lì. Conta dove arrivi, non da dove passi: l'indovinello è sempre giusto
  function bottleOf(zone, gen, memory) {
    // una bottiglia di prima della 0.11.4, quando il mare stava sempre a ovest, può essere finita in mare
    const b0 = memory.bottle;
    if (b0 && !b0.taken && (!tile(gen.map, b0.x, b0.y).walk || !tile(gen.map, b0.dest.x, b0.dest.y).walk)) memory.bottle = undefined;
    if (memory.bottle === undefined) {
      memory.bottle = null;
      const r = rng(zone.seed ^ 0xb0771e);
      if (zone.biome === "tropicale" && trip.world.coastal[zone.id] && r() < BOTTLE_CHANCE) {
        const firstRow = [];
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
          const c = { x, y };
          if (tile(gen.map, x, y).walk && gen.map[y][x] !== "ship" && dist(c, gen.start) > 2
            && DIRS.some(([dx, dy]) => gen.map[y + dy][x + dx] === "sea")) firstRow.push(c);
        }
        const ok = (c) => tile(gen.map, c.x, c.y).walk && !["water", "deep", "ice", "pass", "ship"].includes(gen.map[c.y][c.x]);
        const at = firstRow.length ? firstRow[Math.floor(r() * firstRow.length)] : null;
        const dests = at ? gen.free.filter((c) => ok(c) && Math.abs(c.x - at.x) >= 2 && Math.abs(c.y - at.y) >= 2 && dist(c, at) >= 7 && dist(c, at) <= 18) : [];
        if (dests.length) {
          const dest = dests[Math.floor(r() * dests.length)];
          memory.bottle = { x: at.x, y: at.y, dest, text: treasureSteps(at, dest, r), taken: false, dug: false };
        }
      }
    }
    return memory.bottle && !memory.bottle.taken ? memory.bottle : null;
  }

  const NUMBERS = ["zero", "un", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci", "undici", "dodici", "tredici",
    "quattordici", "quindici", "sedici", "diciassette", "diciotto", "diciannove", "venti", "ventuno", "ventidue", "ventitré", "ventiquattro",
    "venticinque", "ventisei", "ventisette", "ventotto", "ventinove", "trenta", "trentuno", "trentadue", "trentatré", "trentaquattro",
    "trentacinque", "trentasei", "trentasette", "trentotto", "trentanove"];

  // I tratti dalla bottiglia al tesoro: in verticale e in orizzontale, alternati; un asse può dividersi in due
  function treasureSteps(from, to, r) {
    const dy = to.y - from.y, dx = to.x - from.x;
    const split = (n) => { const a = 1 + Math.floor(r() * (Math.abs(n) - 1)); return [Math.sign(n) * a, n - Math.sign(n) * a]; };
    const parts = 2 + Math.floor(r() * 3);   // 2, 3 o 4 tratti
    const vs = parts >= 3 && Math.abs(dy) >= 2 ? split(dy) : [dy];
    const hs = (parts === 4 || (parts === 3 && vs.length === 1)) && Math.abs(dx) >= 2 ? split(dx) : [dx];
    const legs = [];
    const order = vs.length >= hs.length ? ["y", "x"] : ["x", "y"];
    for (let i = 0; vs.length || hs.length; i++) {
      const axis = order[i % 2], list = axis === "y" ? vs : hs;
      if (list.length) legs.push({ n: list.shift(), axis });
    }
    const word = ({ n, axis }) => `${NUMBERS[Math.abs(n)]} pass${Math.abs(n) === 1 ? "o" : "i"} verso ${axis === "y" ? (n < 0 ? "nord" : "sud") : n > 0 ? "est" : "ovest"}`;
    return `Dalla bottiglia, ${legs.map(word).join(", ")}. Scava.`;
  }

  // Il forziere chiuso, nelle zone che ne hanno uno e finché non lo apri: vicino agli alberi, lontano dalla nave
  function chestSpot(gen, zone, memory, itemAt, merchantAt, r) {
    if (!trip.world.chests.includes(zone.id) || memory.chestOpen) return null;
    const ok = (c) => dist(c, gen.start) >= 8 && (!itemAt || !same(c, itemAt)) && (!merchantAt || (!same(c, merchantAt) && !same(c, { x: merchantAt.x + 1, y: merchantAt.y }))) && !same(c, gen.bird);
    const spots = gen.free.filter((c) => ok(c) && DIRS.some(([dx, dy]) => inside(c.x + dx, c.y + dy) && ["tree", "rock"].includes(gen.map[c.y + dy][c.x + dx])));
    const pool = spots.length ? spots : gen.free.filter(ok);
    return pool.length ? pool[Math.floor(r() * pool.length)] : null;
  }

  // Il nascondiglio del ricercato: lontano dalla nave, vicino agli alberi, dove l'avviso lo dà
  function hideout(gen, zone, itemAt, merchantAt, r) {
    const w = trip.wanted;
    if (!w || w.state !== "free" || w.zone !== zone.id) return null;
    const ok = (c) => dist(c, gen.start) >= 14 && dist(c, gen.bird) >= 4 && (!itemAt || !same(c, itemAt)) && (!merchantAt || (!same(c, merchantAt) && !same(c, { x: merchantAt.x + 1, y: merchantAt.y })))
      && c.x < W - 2 && c.y > 1 && c.y < H - 2;
    const woods = gen.free.filter((c) => ok(c) && DIRS.some(([dx, dy]) => inside(c.x + dx, c.y + dy) && gen.map[c.y + dy][c.x + dx] === "tree"));
    const spots = woods.length ? woods : gen.free.filter(ok);
    if (!spots.length) return null;
    return { ...spots[Math.floor(r() * spots.length)], mode: "camp", reload: 0, energy: 0 };
  }

  // --- I ricercati: l'avviso in bacheca, la cattura, la taglia ---

  // L'avviso che si troverebbe ora in bacheca, se non ce n'è già uno in corso o appena preso
  function wantedPoster() {
    if (trip.wanted || (trip.wantedDay != null && day() - trip.wantedDay < WANTED_EVERY)) return null;
    const cities = new Set(trip.world.cities.map((c) => c.zone));
    const zones = trip.world.zones.filter((z) => !cities.has(z.id) && !z.tags.has("bucanieri") && !z.tags.has("labirinto"));
    if (!zones.length) return null;
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const [name, crime] = OUTLAWS[Math.floor(Math.random() * OUTLAWS.length)];
    return { zone: zone.id, name, crime };
  }

  function acceptWanted(poster) {
    const zone = trip.world.zones[poster.zone];
    trip.wanted = { ...poster, until: trip.third + WANTED_DAYS * 3, state: "free" };
    trip.wantedDay = day();
    // nel taccuino, una pagina per ogni avviso accettato
    trip.bounties.push({ name: poster.name, crime: poster.crime, day: day(), state: "free" });
  }

  // Come è finita una taglia: presa (caught), consegnata (delivered), sfuggita (escaped)
  function bountyState(name, state) {
    const b = [...(trip.bounties || [])].reverse().find((x) => x.name === name && x.state !== "delivered" && x.state !== "escaped");
    if (b) b.state = state;
  }

  // Passato il tempo, il ricercato ancora libero lascia l'arcipelago
  function wantedExpired() {
    const w = trip.wanted;
    if (!w || w.state !== "free" || trip.third < w.until) return;
    bountyState(w.name, "escaped");
    trip.wanted = null;
    if (s && s.fugitive) { s.fugitive = null; el.ents.fugitive.hidden = true; }
  }

  // Le città sono battlemap a parte (js/citta.js), con le botteghe lungo la strada
  function visitCity(city) {
    trip.mode = "city";
    trip.city = city.id;
    s = null;
    Suoni.play("campana");
    Citta.enter(city);
  }

  // --- Le voci: un uccello (quasi sempre raro) legato a una zona precisa, segnata sul globo ---
  // Ritorna true se si è sentita una voce. Dalle taverne al massimo MAX_RUMORS, dai mercanti una a testa.
  function rumor(source) {
    const from = source === "mercante" ? "mercante" : "taverna";
    if (from === "taverna" && trip.heard.taverna >= MAX_RUMORS) return false;
    const r = Math.random;
    const cities = new Set(trip.world.cities.map((c) => c.zone));
    const free = (z) => {
      const m = trip.zones[z.id];
      return !cities.has(z.id) && (!m || (!m.done && !m.gone && !m.rumor));
    };
    const known = (u) => trip.birds[u.id]?.level === "visto" || Object.values(trip.zones).some((m) => m.rumor && m.bird === u.id);
    const rare = r() < RARE_RUMOR[source];
    const birds = UCCELLI.filter((u) => !!u.rara === rare && !u.uovo && !known(u)).sort(() => r() - 0.5);
    for (const u of birds) {
      // la zona: una che gli vada bene, meglio se mai visitata; altrimenti una del suo bioma
      const zones = trip.world.zones.filter(free);
      const fit = zones.filter((z) => zonaAdatta(u, z.tags, z.biome)).sort((a, b) => !!trip.zones[a.id] - !!trip.zones[b.id]);
      const zone = fit[0] || zones.find((z) => !u.bioma || z.biome === u.bioma);
      if (!zone) continue;
      const memory = (trip.zones[zone.id] ||= { visited: false, done: false, gone: false });
      memory.bird = u.id;
      memory.rumor = true;
      trip.heard[from]++;
      const who = { forte: "Un vecchio marinaio, al bancone del Forte", porto: "Un pescatore, al porticciolo", mercante: "Il mercante" }[source];
      const msg = `${who}: «A ${zone.name} c'è un ${SPECIE[u.specie].nome.split(" ")[0].toLowerCase()} che nessuno ha mai disegnato.» Segnato sul globo con una X.`;
      trip.rumors.unshift({ msg, day: day(), time: now(), bird: u.id });
      return true;
    }
    return false;
  }

  function drawPostcard() {
    if (!s) return;
    el.postcard.classList.remove("is-scope");
    Cartolina.render({ seed: s.seed, tags: s.tags, time: s.time, bird: s.bird.present && !s.bird.gone && !s.bird.observed,
      smoke: s.tags.has("bucanieri"), campfire: !!s.fugitive && s.time === "notte" }, el.postcard);
  }

  // Il diario annota gli sbarchi (vedi landAt) e i fatti importanti; due note uguali di fila non si ripetono
  function note(msg, icon = null) {
    const last = trip.notes[0];
    if (last && last.msg === msg && last.day === day() && last.time === now()) return;
    trip.notes.unshift({ msg, icon, day: day(), time: now() });
    Diario.renderStrip();
  }

  // Un fatto importante: a terra va nel diario, altrove è un avviso
  function log(msg) {
    if (trip && trip.mode === "land" && s) note(msg);
    else toast(msg);
  }

  // Un avviso che sparisce. Sopra la battlemap niente avvisi: i suggerimenti piccoli lì tacciono
  function toast(msg, html = false) {
    if (!el) return;
    if (trip && trip.mode === "land" && s) return;
    if (html) el.toast.innerHTML = msg;
    else el.toast.textContent = msg;
    el.toast.hidden = false;
    el.toast.classList.remove("is-in");
    void el.toast.offsetWidth;
    el.toast.classList.add("is-in");
    clearTimeout(el.toastTimer);
    el.toastTimer = setTimeout(() => { el.toast.hidden = true; }, 2600);
  }

  // Le finanze: ogni moneta che esce (ciurma, botteghe, rapine) e ogni moneta che entra (vendite, premi, taglie)
  function pay(what, amount) {
    trip.payments.unshift({ day: day(), time: now(), what, amount });
  }

  function earn(what, amount) {
    trip.money += amount;
    trip.payments.unshift({ day: day(), time: now(), what, amount, in: true });
  }

  // Quanto sai di un uccello: niente, una traccia, oppure l'hai visto. Torna true se è una novità.
  function learn(bird, level) {
    const order = { traccia: 1, visto: 2 };
    const before = trip.birds[bird.id];
    if (before && order[before.level] >= order[level]) return false;
    trip.birds[bird.id] = { level, zone: s.zone.name, day: day(), time: now() };
    return true;
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
  function act(kind, dx = 0, dy = 0, held = false) {
    if (!canAct()) return;
    const t = performance.now();
    if (t - s.lastAct < ACT_INTERVAL) return;

    s.noise = 0;
    s.heard = [];
    if (kind === "move" && !move(dx, dy, held)) return;
    if (kind === "observe") observe();
    if (kind === "trap" && !setTrap()) return;
    if (kind === "dig") dig();
    s.lastAct = t;
    if (!s.over) tick();
  }

  function occupied(c) {
    return (!!s.guests && s.guests.some((o) => same(o, c))) || (!!s.priest && same(s.priest, c)) || s.npcs.some((o) => same(o, c)) || (!!s.bouncers && s.bouncers.some((o) => same(o, c))) || (!!s.lady && same(s.lady, c)) || s.pirates.some((o) => same(o, c)) || (!!s.chest && same(s.chest, c)) || s.beasts.some((o) => same(o, c)) || (birdActive() && same(s.bird, c)) || (!!s.merchant && (same(s.merchant, c) || same(s.merchant.cart, c))) || (!!s.fugitive && same(s.fugitive, c));
  }

  // Tenere premuto è correre: ogni tre passi di fila il rumore sale di uno, fino a tre
  const RUN_STEP = 3, RUN_MAX = 3;
  const runNoise = () => Math.min(RUN_MAX, Math.floor(s.run / RUN_STEP));

  function move(dx, dy, held) {
    const p = s.player;
    const n = { x: p.x + dx, y: p.y + dy };
    if (!inside(n.x, n.y)) return false;
    const t = tile(s.map, n.x, n.y);
    if (t.gate) { enterCastle(); return false; }
    if (t.locked) { openLock(n); return false; }
    if (t.secret) { crackWall(n); return false; }
    if (s.lady && same(s.lady, n)) { meetBride(); return false; }
    if (s.priest && same(s.priest, n)) { log("Il prete sfoglia il messale: «Siamo qui riuniti… manca solo lo sposo.»"); return false; }
    const guest = s.guests && s.guests.find((o) => same(o, n));
    if (guest) {
      log(guest.kind === "king" ? "Il re annuisce, solenne: «Bella cerimonia. Manca solo lo sposo.»"
        : guest.kind === "queen" ? "La regina si sventola: «Che caldo. Speriamo che lo sposo arrivi presto.»"
        : guest.kind === "pianist" ? "Il pianista attacca le prime note della marcia nuziale, poi si ferma: «Non ancora?»"
        : pickRandom(["«Che bella sposa!»", "«Shh, sta per cominciare.»", "«Io porto il riso.»", "Prega a bassa voce, e non ti guarda."]));
      return false;
    }
    const monster = s.bouncers && s.bouncers.find((o) => same(o, n));
    if (monster) { bitten(monster); return true; }
    const folk = s.npcs.find((o) => same(o, n));
    if (folk) { greet(folk, true); showTileInfo(s.player); return true; }
    if (s.merchant && (same(s.merchant, n) || same(s.merchant.cart, n))) { meetMerchant(); return false; }
    if (s.fugitive && same(s.fugitive, n)) { capture(); return true; }
    const pirate = s.pirates.find((o) => same(o, n));
    if (pirate) { if (pirate.mode === "sleep") wakePirates("Inciampi in un bucaniere che dorme: si svegliano tutti!"); return false; }
    if (s.chest && same(s.chest, n)) { openChest(); return false; }
    if (t.tower) { meetLady(); return false; }
    if (t.fire) { campfire(); return false; }
    if (!t.walk || occupied(n)) return false;
    s.run = held ? s.run + 1 : 0;
    if (s.run === RUN_STEP && !trip.ranOnce) { trip.ranOnce = true; toast("Stai correndo: fai più rumore."); }

    Object.assign(p, n);
    s.lastMove = [dx, dy];
    trip.stats.steps++;
    showTileInfo(n);
    if (t === TILES.ship) { backAboard(); return true; }
    if (t.pass) { offerPass(n); return true; }
    Suoni.play(t.sound);
    // Di notte ogni passo fa un po' più rumore: l'uccello scappa prima
    s.noise = t.noise ? t.noise + (s.time === "notte" ? 1 : 0) + runNoise() : 0;
    if (s.item && same(s.item, n)) pickUp();
    if (s.marsh && same(s.marsh, n)) takeMarshmallow();
    if (s.loot && same(s.loot, n)) takeLoot();
    if (s.cup && same(s.cup, n)) takeCup();
    if (t.spike) springSpike(n);
    if (t.exit) { leaveCastle(); return true; }
    if (s.castle) castleStep(n);
    if (t.junk && s.pirates.some((o) => o.mode === "sleep") && Math.random() < PIRATE_WAKE) wakePirates(`${t.name} sotto i piedi: un rumore tremendo. I bucanieri si svegliano!`);
    if (s.bottle && same(s.bottle, n)) takeBottle();
    s.heard.push({ ...n, r: s.noise });
    // accanto alla torre, la donna si affaccia
    if (s.tower && !s.towerMet && s.tower.some((c) => Math.abs(c.x - n.x) + Math.abs(c.y - n.y) === 1)) { s.towerMet = true; meetLady(); }
    if (s.fugitive && Math.abs(s.fugitive.x - n.x) + Math.abs(s.fugitive.y - n.y) <= 1) { capture(); return true; }
    if (s.over) return true;

    // L'uccello reagisce subito: troppo vicino o troppo rumore
    const b = s.bird;
    if (birdActive()) {
      const d = dist(p, b);
      if (d <= FLEE) scare("Troppo vicino");
      else if (d <= s.noise) scare("Troppo rumore");
    }
    return true;
  }

  function pickUp() {
    const it = OGGETTI[s.item.kind];
    trip.hold.push({ kind: s.item.kind });
    trip.zones[s.zone.id].item.taken = true;
    s.item = null;
    Suoni.play("monete");
    log(`Hai trovato: ${it.nome}. Finisce in stiva.`);
  }

  // Il passaggio: si va a piedi nella zona vicina, e si arriva all'ora del giorno dopo. La nave resta dov'è
  function offerPass(c) {
    const ps = s.passes.find((q) => same(q, c));
    if (!ps) return;
    const dest = trip.world.zones[ps.to];
    s.over = true;
    s.pendingPass = ps.to;
    showOverlay("Un passaggio", `Il sentiero porta a <b>${dest.name}</b>. Il cammino è lungo: ${arrivalTime(1)}. La nave resta dove l'hai ormeggiata.`, [
      ["go-pass", "Prendi il sentiero"],
      ["leave-merchant", "Resta qui"],
    ]);
  }

  function goPass() {
    const from = s.zone.id, to = s.pendingPass;
    trip.hp = s.player.hp;
    el.overlay.hidden = true;
    if (!mazeDay()) return;
    if (!advance(1)) return;
    landAt(trip.world.zones[to], { via: from });
  }

  const hasPack = (kind) => trip.pack.some((it) => it.kind === kind);

  // --- La radura del falò: il marshmallow si prende, si cuoce (bianco, ancora bianco, dorato, bruciato), si mangia ---

  const MARSH_LOOK = ["bianco", "ancora bianco", "dorato", "bruciato"];
  const marshOf = () => trip.pack.find((it) => it.kind === "marshmallow");

  function takeMarshmallow() {
    trip.marshTaken = true;
    trip.pack.push({ kind: "marshmallow", cook: 0 });
    s.marsh = null;
    Suoni.play("cespuglio");
    log("Un marshmallow, bianco bianco, accanto al fuoco. Nello zaino.");
  }

  function campfire() {
    const m = marshOf();
    s.over = true;
    showOverlay("Il falò", m ? `Il fuoco scoppietta. Il tuo marshmallow è ${MARSH_LOOK[m.cook]}.` : "Il fuoco scoppietta. Qualcuno l'ha acceso e se n'è andato.", [
      m && m.cook < 3 && ["cook", "Infilzalo e cuocilo"],
      m && ["eat-marsh", "Mangialo"],
      ["leave-merchant", "Scaldati e vai"],
    ]);
  }

  function cook() {
    const m = marshOf();
    m.cook = Math.min(3, m.cook + 1);
    Suoni.play("legno");
    if (m.cook === 3) { log("Il marshmallow prende fuoco: bruciato."); earnStamp("campfire"); }
    campfire();
  }

  // Mangiare: il marshmallow (come che sia cotto) rimette tutta la vita e dà un cuore viola in più, finché non
  // ti colpiscono; il pesce in scatola cura due cuori
  function eat(kind) {
    const i = trip.pack.findIndex((it) => it.kind === kind);
    if (i < 0) return;
    const m = trip.pack[i];
    trip.pack.splice(i, 1);
    const p = s.player;
    if (kind === "marshmallow") {
      p.hp = Math.max(p.hp, maxHp());
      trip.violet = VIOLET;
      log(`Mangi il marshmallow ${MARSH_LOOK[m.cook]}. Ti senti benissimo: un cuore viola in più.`);
    } else {
      p.hp = Math.min(Math.max(p.hp, maxHp()), p.hp + FISH_HEAL);
      log("Apri la scatola e mangi il pesce. Due cuori.");
    }
    Suoni.play("osservato");
    leaveMerchant();
  }

  // Dallo zaino (il taccuino, capitolo Zaino): mangiare, posare una tagliola, spargere i semi. Solo a terra
  function useItem(kind) {
    if (trip.mode !== "land" || !s || s.over) { toast("Lo zaino si apre a terra."); return; }
    if (kind === "cibo" || kind === "marshmallow") eat(kind);
    else if (kind === "tagliola") act("trap");
    else if (kind === "semi") sowSeeds();
  }

  // M: si mangia quello che c'è nello zaino; se c'è più di una cosa, si sceglie
  function food() {
    const foods = ["cibo", "marshmallow"].filter(hasPack);
    if (!foods.length) return;
    if (foods.length === 1) { eat(foods[0]); return; }
    s.over = true;
    showOverlay("Mangiare", "Hai fame. Cosa mangi?", [
      ["eat-fish", "Il pesce in scatola <small>(due cuori)</small>"],
      ["eat-marsh", `Il marshmallow ${MARSH_LOOK[marshOf().cook]} <small>(tutta la vita e un cuore viola)</small>`],
      ["leave-merchant", "Niente, per ora"],
    ]);
  }

  // --- Le tagliole: T la posa dove sei; restano nella zona finché non scattano ---

  function setTrap() {
    const i = trip.pack.findIndex((it) => it.kind === "tagliola");
    const t = tile(s.map, s.player.x, s.player.y);
    if (i < 0 || t.pass || t === TILES.ship || s.traps.has(key(s.player))) return false;
    trip.pack.splice(i, 1);
    s.traps.add(key(s.player));
    trip.zones[s.zone.id].traps = [...s.traps];
    Suoni.play("tagliola");
    log("Posi una tagliola, ben nascosta.");
    return true;
  }

  // Un animale che entra in una casella con la tagliola: il lupo ci muore (se non la schiva), orso e cinghiale restano presi
  function springTrap(o) {
    const k = key(o);
    if (!s.traps.has(k)) return false;
    s.traps.delete(k);
    trip.zones[s.zone.id].traps = [...s.traps];
    Suoni.play("tagliola");
    if (o.kind === "wolf") {
      if (Math.random() < TRAP_DODGE) { log("La tagliola scatta a vuoto: il lupo l'ha schivata."); return false; }
      o.dead = true;
      o.el.remove();
      log("Un guaito: un lupo è finito nella tagliola.");
      return true;
    }
    o.rest = TRAP_HOLD;
    o.mode = o.kind === "boar" ? "stunned" : "wander";
    o.next = null;
    log(`${o.kind === "bear" ? "L'orso" : "Il cinghiale"} è preso nella tagliola: per un po' non si muove.`);
    return true;
  }

  // --- La bottiglia col messaggio e la pala: X scava ---

  function takeBottle() {
    const b = s.bottle;
    b.taken = true;
    s.bottle = null;
    Suoni.play("pagina");
    trip.rumors.unshift({ msg: `Il messaggio nella bottiglia, a ${s.zone.name}: «${b.text}»`, day: day(), time: now() });
    log(`Una bottiglia sulla riva, con un messaggio: «${b.text}» È nelle voci.`);
  }

  function dig() {
    const memory = trip.zones[s.zone.id];
    const b = memory.bottle;
    const k = key(s.player);
    const t = tile(s.map, s.player.x, s.player.y);
    if (!t.walk || t.pass || t === TILES.ship || ["water", "deep", "ice"].includes(s.map[s.player.y][s.player.x])) return;
    Suoni.play("macerie");
    if (b && b.taken && !b.dug && same(b.dest, s.player)) {
      b.dug = true;
      const coins = Math.floor(Math.random() * (BURIED_COINS + 1));
      if (coins) earn("tesoro sepolto", coins);
      const kind = coins < 4 ? oggettoACaso(Math.random, false) : null;
      if (kind) trip.hold.push({ kind });
      Suoni.play("monete");
      log(`La pala batte su qualcosa: un tesoro sepolto! ${coins ? `${coins} ${coins === 1 ? "moneta" : "monete"}` : "Niente monete"}${kind ? ` e ${OGGETTI[kind].nome.toLowerCase()}, in stiva` : ""}.`);
    } else if (!s.holes.has(k)) {
      note("Una buca vuota.");
    }
    s.holes.add(k);
  }

  // --- I timbri del taccuino ---

  function earnStamp(id) {
    const n = STAMPS.indexOf(id);
    if (n < 0 || trip.stamps.includes(n)) return;
    trip.stamps.push(n);
    log("Un timbro nuovo nel taccuino.");
  }

  // --- La lettera della Società: arriva quando il taccuino è completo, tutti gli uccelli ---

  function checkComplete() {
    if (trip.letter || !UCCELLI.every((u) => trip.birds[u.id]?.level === "visto")) return;
    trip.letter = "new";
    Suoni.play("campana");
  }

  // Il forziere: con la chiave si apre (la chiave resta), dentro un oggetto rituale e qualche moneta
  function openChest() {
    if (!hasPack("chiave")) { log("Un forziere chiuso. Serve una chiave."); return; }
    const kind = oggettoACaso(Math.random, true);
    const coins = CHEST_COINS[0] + Math.floor(Math.random() * (CHEST_COINS[1] - CHEST_COINS[0] + 1));
    trip.hold.push({ kind });
    earn("forziere", coins);
    trip.zones[s.zone.id].chestOpen = true;
    s.chest = null;
    Suoni.play("monete");
    log(`Il forziere si apre: ${OGGETTI[kind].nome} e ${coins} m.o.`);
    render();
  }

  // La donna nella torre: senza la lettera piange; con la lettera ringrazia e ti dà un bacio, un cuore rosa per sempre
  function meetLady() {
    const memory = trip.zones[s.zone.id];
    s.over = true;
    if (memory.ladyHappy) {
      showOverlay("La donna della torre", "«Ogni sera rileggo la sua lettera. Grazie ancora, viaggiatore.»", [["leave-lady", "Saluta"]]);
    } else if (hasPack("lettera")) {
      showOverlay("La donna della torre", "Una donna si affaccia alla finestra della torre, gli occhi rossi di pianto. «Avete… avete una lettera per me?»", [
        ["give-letter", "Dalle la lettera sigillata"],
        ["leave-lady", "Non ora"],
      ]);
    } else {
      showOverlay("La donna della torre", "Dalla finestra della torre una donna piange, e guarda il mare. «Nessuna lettera… nemmeno oggi.»", [["leave-lady", "Lasciala"]]);
    }
  }

  function giveLetter() {
    trip.pack.splice(trip.pack.findIndex((it) => it.kind === "lettera"), 1);
    trip.zones[s.zone.id].ladyHappy = true;
    trip.pink = true;
    s.player.hp += 2;
    Suoni.play("osservato");
    showOverlay("La donna della torre", "Legge la lettera in silenzio, poi ride e piange insieme. Scende di corsa, ti abbraccia e ti dà un bacio. «Grazie!» <br>Hai un cuore in più, rosa, per sempre.", [["leave-lady", "Arrossisci e riparti"]]);
  }

  // I semi: si spargono dove l'uccello è volato via per sempre; quando cambia la luce, torna nella zona
  function sowSeeds() {
    const memory = trip.zones[s.zone.id];
    if (!hasPack("semi")) { log("Non hai semi. Li vende l'emporio."); return; }
    if (!memory.gone) { log(memory.done ? "L'uccello di qui è già nel taccuino: i semi non servono." : "I semi servono a far tornare un uccello volato via: qui non ce n'è bisogno."); return; }
    if (memory.seededAt != null) { log("I semi sono già sparsi. Bisogna aspettare che cambi la luce."); return; }
    trip.pack.splice(trip.pack.findIndex((it) => it.kind === "semi"), 1);
    memory.seededAt = trip.third;
    Suoni.play("cespuglio");
    log("Spargi i semi. Ora bisogna aspettare che cambi la luce.");
  }

  // L'uovo: passati EGG_DAYS giorni da quando l'hai avuto, si schiude e nel taccuino arriva il Pulcino
  function hatchEggs() {
    const i = trip.pack.findIndex((it) => it.kind === "uovo" && day() - (it.day || 1) >= EGG_DAYS);
    if (i < 0) return;
    trip.pack.splice(i, 1);
    trip.birds[PULCINO] = { level: "visto", zone: "nato dall'uovo", day: day(), time: now() };
    checkComplete();
    log("Crac! L'uovo si è schiuso: un Pulcino nel taccuino.");
  }

  // Il mercante vuole un oggetto preciso: se ce l'hai, in cambio ti racconta una voce
  function meetMerchant() {
    const want = OGGETTI[s.merchant.wants];
    const has = trip.hold.some((it) => it.kind === s.merchant.wants);
    s.over = true;
    showOverlay("Un mercante", `«Ehi, viaggiatore. Per caso avete ${want.nome.toLowerCase()}? Vi darei in cambio una storia che vale oro.»`, [
      has && ["trade", `Dagli ${want.nome.toLowerCase()}`],
      ["leave-merchant", has ? "Non ora" : "Non ce l'ho"],
    ]);
  }

  function trade() {
    const i = trip.hold.findIndex((it) => it.kind === s.merchant.wants);
    trip.hold.splice(i, 1);
    trip.zones[s.zone.id].traded = true;
    s.merchant = null;
    el.ents.merchant.hidden = el.ents.cart.hidden = true;
    const heard = rumor("mercante");
    log(heard ? "Il mercante si avvicina e sussurra. È nel diario." : "Il mercante prende l'oggetto, ma non sa niente di nuovo.");
    leaveMerchant();
  }

  function leaveMerchant() {
    s.over = false;
    el.overlay.hidden = true;
    render();
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
      checkComplete();
      Suoni.play("osservato");
      log(`${b.info.nome} annotato nel taccuino! Torna alla nave.`);
      drawPostcard();
    } else if (d <= OBSERVE) {
      toast("Qualcosa ti copre la vista.");
    } else {
      toast("Troppo lontano: il binocolo non basta.");
    }
  }

  // Il mondo avanza di un battito: l'uccello, il ricercato, gli animali
  function tick() {
    s.ticks++;
    birdTick();
    fugitiveTick();
    if (s.over) return;
    for (const o of s.pirates) {
      if (s.over) return;
      pirateTick(o);
    }
    for (const o of s.npcs) folkTick(o);
    for (const o of s.bouncers || []) {
      if (s.over) return;
      bounce(o);
    }
    if (s.over) return;
    for (const o of s.beasts) {
      if (s.over) return;
      if (o.kind === "boar") boarTick(o);
      else beastTick(o);
    }
    s.beasts = s.beasts.filter((o) => !o.dead);
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
    hatchEggs();
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
      if (!b.info.rara) learn(b.info, "traccia");
      log(`${reason}: l'uccello vola via dalla zona.`);
      return;
    }
    Object.assign(b, pickRandom(spots));
    log(`${reason}: l'uccello vola in un altro punto.`);
  }

  // --- Il ricercato: sta al suo fuoco finché non ti vede o ti sente, poi scappa e ti spara ---

  function fugitiveSees(f) {
    const p = s.player, d = dist(f, p);
    if (hidden()) return d < 1.5;
    return d <= (s.time === "notte" ? OUTLAW.nightSight : OUTLAW.sight) && los(s.map, f, p);
  }

  function fugitiveTick() {
    const f = s.fugitive;
    if (!f) return;
    const p = s.player;
    const seen = fugitiveSees(f);
    if (f.mode === "camp") {
      if (!seen && !s.heard.some((n) => n.r > 0 && dist(f, n) <= n.r + OUTLAW.hearing)) return;
      f.mode = "flee";
      f.reload = 1;
      log("Il ricercato ti ha visto: scappa!");
    }
    if (f.reload) f.reload--;
    // da vicino, se ti vede, spara invece di correre: alberi e rocce fermano il colpo, i cespugli ti nascondono
    if (seen && !f.reload && dist(f, p) <= OUTLAW.range) {
      f.reload = OUTLAW.reload;
      hurt(OUTLAW.damage);
      trip.stats.hits++;
      Suoni.play("petardo");
      el.map.classList.remove("is-hit");
      void el.map.offsetWidth;
      el.map.classList.add("is-hit");
      log(`Il ricercato ti spara! ${lostHearts(OUTLAW.damage)}.`);
      if (!p.hp) die("fugitive");
      return;
    }
    // scappa un passo per battito; se corri tu, due ogni tre
    f.energy += s.run >= RUN_STEP ? 2 / 3 : 1;
    const steps = [];
    while (f.energy >= 1) {
      f.energy -= 1;
      const around = DIRS.map(([dx, dy]) => ({ x: f.x + dx, y: f.y + dy }))
        .filter((c) => inside(c.x, c.y) && beastCost(c) === 1 && !s.beasts.some((o) => same(o, c)) && !same(c, p));
      const best = around.sort((a, b) => dist(b, p) - dist(a, p))[0];
      if (!best || dist(best, p) < dist(f, p)) break;
      Object.assign(f, best);
      steps.push(best);
      if (birdActive() && dist(f, s.bird) <= 2) scare("Il ricercato è passato troppo vicino");
    }
    f.energy = Math.min(f.energy, 1);
    slide(f, steps);
    // sul bordo della mappa, se sei lontano, sparisce tra gli alberi
    const edge = f.x === W - 1 || f.y === 0 || f.y === H - 1;
    if (edge && dist(f, p) > OUTLAW.escape) {
      s.fugitive = null;
      el.ents.fugitive.hidden = true;
      bountyState(trip.wanted.name, "escaped");
      trip.wanted = null;
      log("Il ricercato è sparito oltre il bosco. Addio taglia.");
    }
  }

  // Preso: legato e portato in stiva, da consegnare alla gendarmeria del Forte
  function capture() {
    s.fugitive = null;
    el.ents.fugitive.hidden = true;
    trip.wanted.state = "caught";
    (trip.captured ||= []).push({ name: trip.wanted.name, day: day(), delivered: false });   // nel taccuino, dietro le sbarre
    bountyState(trip.wanted.name, "caught");
    Suoni.play("tonfo");
    log(`Preso! ${trip.wanted.name} finisce in stiva.`);
  }

  // --- Il labirinto di siepi: trappole tra le foglie, la coppa nello slargo, un unicorno e un mostro gentili ---

  function springSpike(c) {
    hurt(SPIKE);
    trip.stats.hits++;
    Suoni.play("tagliola");
    el.map.classList.remove("is-hit");
    void el.map.offsetWidth;
    el.map.classList.add("is-hit");
    log(`Le foglie nascondevano una trappola! ${lostHearts(SPIKE)}.`);
    if (!s.player.hp) die("spike");
  }

  function takeCup() {
    s.cup = null;
    trip.zones[s.zone.id].cupTaken = true;
    trip.hold.push({ kind: "coppa" });
    Suoni.play("osservato");
    log("Nello slargo, su un piedistallo di pietra: la Coppa dei Tre Maghi. In stiva.");
  }

  // Uscire dal labirinto (a bordo o da un passaggio) costa un giorno intero: una volta per visita
  function mazeDay() {
    if (!s.tags.has("labirinto") || s.mazePaid) return true;
    s.mazePaid = true;
    trip.hp = s.player.hp;
    note("Uscire dal labirinto ha preso un giorno intero.");
    if (!advance(MAZE_DAY)) return false;
    s.time = now();
    return true;
  }

  const FOLK = {
    unicorn: { name: "L'unicorno", hello: "L'unicorno china il capo, la criniera che luccica: «Buongiorno, viaggiatore! Che splendida giornata per perdersi.»",
      lines: ["«Con permesso, passo io e poi lei.»", "«Le auguro un'ottima uscita.»", "«Attento alle foglie smosse, mi raccomando.»"] },
    minotaur: { name: "Il mostro del labirinto", hello: "Un mostro enorme, con le corna, si toglie un cappello che non ha: «Oh, mi perdoni. Prego, prego, si accomodi.»",
      lines: ["«Dopo di lei, insisto.»", "«Mi scusi, sono un po' ingombrante.»", "«Che bel tempo, vero? Si cammina che è un piacere.»"] },
  };

  // Passandoci accanto si scambiano di posto con te, gentili come la gente in città; la prima volta salutano
  function greet(o, bump) {
    const f = FOLK[o.kind];
    if (!o.met) { o.met = true; log(f.hello); }
    else if (bump) log(`${f.name}: ${f.lines[Math.floor(Math.random() * f.lines.length)]}`);
    if (!bump) return;
    const p = s.player, back = { x: p.x, y: p.y };
    p.x = o.x; p.y = o.y;
    o.x = back.x; o.y = back.y;
    place(o.el, o);
  }

  function folkTick(o) {
    if (!o.met && dist(o, s.player) <= 3) greet(o, false);
    if (Math.random() > 0.5) return;
    const around = DIRS.map(([dx, dy]) => ({ x: o.x + dx, y: o.y + dy }))
      .filter((c) => inside(c.x, c.y) && s.map[c.y][c.x] === "grass" && !same(c, s.player) && !occupied(c));
    if (!around.length) return;
    Object.assign(o, pickRandom(around));
    slide(o, [{ x: o.x, y: o.y }]);
  }

  // --- Il castello abbandonato: stanze buie finché non ci entri, mostri che rimbalzano, la chiave, il muro che
  // cede, e nella sala del trono la dama che aspetta lo sposo ---

  function enterCastle() {
    const zone = s.zone;
    const memory = trip.zones[zone.id];
    const cm = (memory.castle ||= { seen: [], taken: [], unlocked: false, cracked: false, married: false });
    // dopo le nozze il castello è chiuso
    if (cm.married) { log("Il portone è sbarrato. Sopra c'è un cartello: «Chiuso per nozze»."); return; }
    const plan = Castello.generate(zone.seed);
    if (!plan) return;
    trip.hp = s.player.hp;
    const map = plan.map.map((row) => row.slice());
    cm.lit ||= [];
    if (cm.unlocked) map[plan.lock.y][plan.lock.x] = "cfloor";
    if (cm.cracked) map[plan.crack.y][plan.crack.x] = "cfloor";
    const outside = { zone, at: s.gateAt };
    s = {
      zone, seed: zone.seed, tags: zone.tags, time: s.time, map, free: [], ruin: null,
      castle: plan, cm, outside,
      rooms: plan.rooms.map((rm, i) => ({ ...rm, seen: cm.seen.includes(i) })),
      lit: new Set(cm.lit),
      startPos: plan.start, player: { ...plan.start, hp: trip.hp }, passes: [],
      bird: { x: -9, y: -9, info: null, present: false, observed: false, gone: false },
      beasts: [], pirates: [], npcs: [], item: null, merchant: null, fugitive: null, chest: null, tower: null, towerMet: false,
      fire: null, marsh: null, traps: new Set(), bottle: null, holes: new Set(), loot: null, cup: null,
      // quello che hai preso si ricorda per cosa è (la chiave, le monete della prima stanza…), non per dov'era
      treasures: plan.loot.map((l, i) => ({ ...l, id: `#${i}` })).filter((l) => !cm.taken.includes(l.id)),
      priest: plan.priest,
      guests: plan.guests,
      bouncers: plan.monsters.map((m) => ({ ...m })),
      lady: cm.married ? null : plan.lady,
      run: 0, ticks: 0, noise: 0, heard: [], lastAct: 0, lastMove: [0, 0], over: false,
    };
    Suoni.play("legno");
    castleStep(s.player);
    buildDom();
    render();
    log("Il ponte levatoio cigola: sei dentro il castello. Fa freddo, e c'è odore di cera.");
  }

  function leaveCastle() {
    trip.hp = s.player.hp;
    const { zone, at } = s.outside;
    landAt(zone, { waited: true, quiet: true, at });
    log("Fuori dal castello, di nuovo all'aria aperta.");
  }

  // Il buio del castello: si accende quello che hai intorno (due caselle, non dietro i muri), e tutta la stanza
  // quando ci entri, muri compresi. Quello che hai visto resta acceso
  const LIGHT = 2;
  function light(c) {
    const add = (q) => { if (!s.lit.has(key(q))) { s.lit.add(key(q)); s.cm.lit.push(key(q)); } };
    for (let y = c.y - LIGHT; y <= c.y + LIGHT; y++) for (let x = c.x - LIGHT; x <= c.x + LIGHT; x++) {
      if (inside(x, y) && los(s.map, c, { x, y })) add({ x, y });
    }
    s.rooms.forEach((rm, i) => {
      // entrando si accende tutta la stanza, anche se il gioco crede di averla già vista (una pianta di prima)
      if (!rm.keys.has(key(c)) || [...rm.keys].every((k) => s.lit.has(k))) return;
      const first = !rm.seen;
      rm.seen = true;
      if (first) s.cm.seen.push(i);
      for (const k of rm.keys) { const q = unkey(k); for (let y = q.y - 1; y <= q.y + 1; y++) for (let x = q.x - 1; x <= q.x + 1; x++) if (inside(x, y)) add({ x, y }); }
      if (first && rm.kind === "throne") log("La sala del trono è addobbata a nozze, come una chiesa: gli invitati ai lati, il tappeto rosso, il prete in fondo.");
    });
  }

  // Ogni passo dentro: si accende il buio intorno, e quello che c'è per terra si raccoglie
  function castleStep(c) {
    light(c);
    const i = s.treasures.findIndex((l) => same(l, c));
    if (i < 0) return;
    const l = s.treasures.splice(i, 1)[0];
    s.cm.taken.push(l.id);
    Suoni.play("monete");
    if (l.kind === "coins") { earn("castello", l.amount); log(`Per terra, monete dimenticate: ${l.amount} m.o.`); }
    else if (l.kind === "key") { trip.pack.push({ kind: "ottone" }); log("La chiave della sala del trono, grande e lavorata: nello zaino."); }
    else { const kind = oggettoACaso(Math.random, true); trip.hold.push({ kind }); log(`${OGGETTI[kind].nome}: in stiva.`); }
  }

  function openLock(c) {
    if (!hasPack("ottone")) { log("Una porta pesante, chiusa a chiave: la sala del trono."); return; }
    s.map[c.y][c.x] = "cfloor";
    s.cm.unlocked = true;
    trip.pack.splice(trip.pack.findIndex((it) => it.kind === "ottone"), 1);   // la chiave resta nella porta
    Suoni.play("legno");
    log("La chiave gira e resta nella toppa. La porta della sala del trono si apre.");
    render();
  }

  function crackWall(c) {
    s.map[c.y][c.x] = "cfloor";
    s.cm.cracked = true;
    Suoni.play("macerie");
    log("Un mattone suona vuoto. Spingi: il muro cede, c'è un passaggio segreto!");
    render();
  }

  // I mostri del castello vanno in diagonale e rimbalzano sui muri della loro stanza; i fantasmi ogni due battiti
  function bounce(o) {
    if (o.kind === "ghost" && s.ticks % 2) return;
    const room = s.rooms[o.room];
    const ok = (c) => room.keys.has(key(c)) && tile(s.map, c.x, c.y).walk && !s.bouncers.some((b) => b !== o && same(b, c));
    for (const [dx, dy] of [[o.dx, o.dy], [-o.dx, o.dy], [o.dx, -o.dy], [-o.dx, -o.dy]]) {
      const n = { x: o.x + dx, y: o.y + dy };
      if (!ok(n)) continue;
      o.dx = dx; o.dy = dy;
      if (same(n, s.player)) { bitten(o); return; }
      o.x = n.x; o.y = n.y;
      slide(o, [n]);
      return;
    }
  }

  function bitten(o) {
    o.dx = -o.dx; o.dy = -o.dy;
    hurt(CASTLE.damage);
    trip.stats.hits++;
    Suoni.play("tonfo");
    el.map.classList.remove("is-hit");
    void el.map.offsetWidth;
    el.map.classList.add("is-hit");
    log(`${o.kind === "bat" ? "Un pipistrello ti morde" : "Un fantasma ti passa attraverso, gelido"}! ${lostHearts(CASTLE.damage)}.`);
    if (!s.player.hp) die("castle");
  }

  // --- Le nozze: la dama in bianco accanto al trono ---

  function meetBride() {
    s.over = true;
    showOverlay("La dama del castello", "Davanti al prete, una dama in abito bianco col velo. Gli invitati si girano tutti. Tutto è pronto per le nozze: mancava solo lo sposo. Ti guarda, sorride. «Volete sposarmi?»", [
      ["marry", "Sì, lo voglio"],
      ["leave-merchant", "No"],
    ]);
  }

  // Sì: gli auguri, poi il buio, la festa, di nuovo il buio; ci si risveglia in un cespuglio accanto alla nave
  const PARTY = [
    ["dark", "Le campane del castello suonano a festa."],
    ["party", "«Viva gli sposi!» Cin cin!"],
    ["party", "Birra per la ciurma, vino per gli invitati, grog per chi ha perso una scommessa."],
    ["party", "Lo zio della sposa racconta la stessa storia per la terza volta. Il suonatore di liuto conosce solo due canzoni."],
    ["party", "Qualcuno canta. Poi cantano tutti. Poi qualcuno cade sotto la tavola."],
    ["dark", "…"],
  ];
  let party = null;

  function marry() {
    s.cm.married = true;
    s.lady = null;
    showOverlay("Auguri!", "Vi siete sposati! Le dame piangono, i cavalieri tossiscono, il prete starnutisce. Auguri e figli maschi, ma anche femmine.", [["party", "Alla festa!"]]);
    Suoni.play("campana");
  }

  function partyStep() {
    const box = document.getElementById("scene");
    if (party == null) { party = 0; el.overlay.hidden = true; } else party++;
    if (party >= PARTY.length) { box.hidden = true; party = null; wake(); return; }
    const [kind, text] = PARTY[party];
    box.className = `scene is-${kind}`;
    box.hidden = false;
    if (kind === "party") Castello.banquet(box.querySelector("canvas"), party);
    box.querySelector("p").textContent = text;
    Suoni.play(kind === "party" ? "monete" : "campana");
  }

  function wake() {
    trip.hp = s.player.hp;
    trip.married = true;
    trip.pack.push({ kind: "fede" });
    earnStamp("engagement");
    if (!advance(3 - (trip.third % 3))) return;
    const ship = trip.world.zones[trip.shipZone ?? s.zone.id];
    landAt(ship, { waited: true, quiet: true, bush: true });
    log("Ti risvegli in un cespuglio, accanto alla nave. Hai mal di testa, e al dito una fede nuziale.");
  }

  // A festa in corso la tastiera è sua: Invio (o un clic) va avanti
  window.addEventListener("keydown", (e) => {
    if (party == null) return;
    if (e.key === "Enter" || e.key === " ") partyStep();
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
  document.addEventListener("click", (e) => { if (party != null && e.target.closest("#scene")) partyStep(); });

  // --- I bucanieri: dormono di notte finché il tesoro c'è; svegli fanno la guardia; derubati, ti trovano sempre ---

  function wakePirates(msg) {
    for (const o of s.pirates) if (o.mode === "sleep") { o.mode = "hunt"; o.reload = 1; }
    Suoni.play("petardo");
    log(msg);
  }

  function takeLoot() {
    s.loot = null;
    trip.zones[s.zone.id].looted = true;
    earn("tesoro dei bucanieri", PIRATE_TREASURE);
    Suoni.play("monete");
    // da ora sono in allarme per sempre: non dormono più e sanno sempre dove sei
    for (const o of s.pirates) { o.mode = "hunt"; o.reload = Math.max(o.reload, 1); }
    log(`Il tesoro dei bucanieri: ${PIRATE_TREASURE} m.o.! Adesso lo sanno.`);
  }

  function pirateSees(o) {
    const p = s.player, d = dist(o, p);
    if (hidden()) return d < 1.5;
    return d <= (s.time === "notte" ? PIRATE.nightSight : PIRATE.sight) && los(s.map, o, p);
  }

  function pirateTick(o) {
    const p = s.player;
    if (o.mode === "sleep") return;
    if (o.rest) { o.rest--; return; }
    const looted = trip.zones[s.zone.id].looted;
    if (looted || pirateSees(o) || s.heard.some((n) => n.r > 0 && dist(o, n) <= n.r + PIRATE.hearing)) {
      if (o.mode !== "hunt") log(o.gun ? "Un bucaniere col fucile ti ha visto!" : "Un bucaniere sguaina la spada e ti corre incontro!");
      o.mode = "hunt";
    } else if (o.mode === "hunt") o.mode = "guard";
    if (o.reload) o.reload--;
    // il fucile: da vicino, se ti vede, spara invece di correre
    if (o.mode === "hunt" && o.gun && !o.reload && dist(o, p) <= PIRATE.range && los(s.map, o, p) && !hidden()) {
      o.reload = PIRATE.reload;
      hurt(PIRATE.gun);
      trip.stats.hits++;
      Suoni.play("petardo");
      el.map.classList.remove("is-hit");
      void el.map.offsetWidth;
      el.map.classList.add("is-hit");
      log(`Un bucaniere ti spara! ${lostHearts(PIRATE.gun)}.`);
      if (!p.hp) die("pirate");
      return;
    }
    // un passo per ogni tuo passo: verso di te se ti cacciano, altrimenti in giro vicino al fuoco
    const { prev } = beastPaths(o);
    let target = p;
    if (o.mode !== "hunt") {
      const around = DIRS.map(([dx, dy]) => ({ x: o.x + dx, y: o.y + dy }))
        .filter((c) => inside(c.x, c.y) && beastCost(c) === 1 && dist(c, o.home) <= PIRATE.roam && !same(c, p));
      if (Math.random() > 0.4 || !around.length) return;
      target = pickRandom(around);
    }
    const next = (pathFrom(prev, o, target) || [])[0];
    if (!next) return;
    if (same(next, p)) {
      if (o.gun) return;   // il fucile non si usa da così vicino: aspetta di poter sparare
      o.rest = PIRATE.rest;
      hurt(PIRATE.sword);
      trip.stats.hits++;
      Suoni.play("tonfo");
      el.map.classList.remove("is-hit");
      void el.map.offsetWidth;
      el.map.classList.add("is-hit");
      log(`Un bucaniere ti colpisce con la spada! ${lostHearts(PIRATE.sword)}.`);
      if (!p.hp) die("pirate");
      return;
    }
    if (beastCost(next) > 1 || occupied(next)) return;
    o.x = next.x;
    o.y = next.y;
    slide(o, [next]);
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

    // sazio, ti nota solo se gli vai addosso o se fai molto rumore vicino a lui
    const provoked = o.sated ? dist(o, p) <= 1 || s.heard.some((n) => n.r >= 3 && dist(o, n) <= 2) : sees(o) || hears(o);
    if (provoked) {
      if (o.mode !== "hunt") { Suoni.play(k.sound); log(`${o.kind === "wolf" ? "Un lupo" : "L'orso"} ti ha fiutato e ti insegue!`); }
      o.mode = "hunt";
      o.last = { x: p.x, y: p.y };
    } else if (o.mode === "hunt") {
      o.mode = "search";
      o.searchLeft = 6;
      trip.stats.escapes++;
      log(`${o.kind === "wolf" ? "Il lupo" : "L'orso"} ti ha perso: va a cercarti dove ti ha visto.`);
    }

    o.energy += k.speed[o.mode];
    const { prev } = beastPaths(o);
    let target = o.mode === "hunt" ? p : o.mode === "search" ? o.last : null;
    // Vagando non sa dove sei: gira intorno alla sua tana, da una meta all'altra
    if (!target) {
      const around = DIRS.map(([dx, dy]) => ({ x: o.x + dx, y: o.y + dy }))
        .filter((c) => inside(c.x, c.y) && beastCost(c) < Infinity && !same(c, p));
      // sazio e ancora vicino a te, se ne va dall'altra parte
      if (o.sated && dist(o, p) < 8) target = around.sort((a, b) => dist(b, p) - dist(a, p))[0];
      else target = wanderGoal(o);
    }
    const path = stagger(o, (target && pathFrom(prev, o, target)) || []);

    const steps = [];
    for (const c of path) {
      if (same(c, p)) {
        if (o.mode === "hunt" && o.energy >= 1) { slide(o, steps); return attack(o); }
        break;
      }
      if (o.energy < beastCost(c) || s.beasts.some((other) => other !== o && same(other, c)) || (s.fugitive && same(s.fugitive, c)) || (s.merchant && (same(s.merchant, c) || same(s.merchant.cart, c)))) break;
      o.energy -= beastCost(c);
      o.x = c.x;
      o.y = c.y;
      steps.push(c);
      if (springTrap(o)) { slide(o, steps); return; }
      if (birdActive() && dist(o, s.bird) <= 2) scare(`${k.name === "Orso" ? "L'orso" : "Un lupo"} è passato troppo vicino`);
    }
    if (!steps.length) o.energy = Math.min(o.energy, 1); // fermo non accumula slancio
    slide(o, steps);
    if (steps.length && k.step && dist(o, p) < 14) Suoni.play(k.step);

    if (o.mode === "search" && same(o, o.last) && --o.searchLeft <= 0) o.mode = "wander";
    o.next = o.mode === "wander" ? null : (pathFrom(beastPaths(o).prev, o, o.mode === "hunt" ? p : o.last) || [])[0] || null;
  }

  // La meta di un animale che vaga: un posto lontano almeno qualche casella, entro WANDER dalla sua tana. Ci va
  // barcollando (vedi stagger), arrivato si ferma un po' ad annusare, poi ne sceglie un'altra. Il branco di lupi
  // ha una meta sola, così resta insieme
  const WANDER = 12, SNIFF = [2, 5];
  function wanderGoal(o) {
    const g = o.kind === "wolf" ? (s.pack ||= {}) : o;
    g.goalLeft = (g.goalLeft ?? 0) - 1;
    const there = g.goal && dist(o, g.goal) <= (o.kind === "wolf" ? 2 : 0.5);
    if (there && !g.sniff) g.sniff = SNIFF[0] + Math.floor(Math.random() * (SNIFF[1] - SNIFF[0] + 1));
    if (g.sniff) { if (--g.sniff > 0) return null; g.goal = null; }
    if (!g.goal || g.goalLeft <= 0) {
      const home = o.home || o;
      const spots = s.free.filter((c) => dist(c, home) <= WANDER && dist(c, o) >= 5 && !same(c, s.player));
      g.goal = spots.length ? pickRandom(spots) : null;
      g.goalLeft = 40;
    }
    return g.goal;
  }

  // Vagando non va dritto: tre volte su dieci un passo di lato, una su dieci un passo indietro
  function stagger(o, path) {
    if (o.mode !== "wander" || !path.length || Math.random() > 0.4) return path;
    const ahead = path[0], fwd = [ahead.x - o.x, ahead.y - o.y];
    const back = Math.random() < 0.25;
    const opts = DIRS.filter(([dx, dy]) => (back ? dx === -fwd[0] && dy === -fwd[1] : dx * fwd[0] + dy * fwd[1] === 0))
      .map(([dx, dy]) => ({ x: o.x + dx, y: o.y + dy }))
      .filter((c) => inside(c.x, c.y) && beastCost(c) < Infinity && !same(c, s.player));
    return opts.length ? [pickRandom(opts)] : path;
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
        log("Il cinghiale abbassa la testa e carica!");
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
          log("Il cinghiale si pianta e resta stordito.");
          break;
        }
        o.x = c.x;
        o.y = c.y;
        steps.push(c);
        if (springTrap(o)) break;
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
        springTrap(o);
      }
    }
    slide(o, steps);
    if (steps.length && dist(o, p) < 10) Suoni.play(k.step);
  }

  // Un colpo: il cuore viola, se c'è, se ne va per primo
  function hurt(d) {
    const p = s.player;
    const absorbed = Math.min(trip.violet || 0, d);
    trip.violet = (trip.violet || 0) - absorbed;
    p.hp = Math.max(0, p.hp - (d - absorbed));
  }

  // il danno detto in cuori: ogni cuore vale due punti di vita
  function lostHearts(d) {
    const whole = Math.floor(d / 2), half = d % 2;
    if (!whole) return "−mezzo cuore";
    return `−${whole} ${whole === 1 ? "cuore" : "cuori"}${half ? " e mezzo" : ""}`;
  }

  function attack(o) {
    const k = KINDS[o.kind], p = s.player;
    o.rest = k.rest;
    o.energy = 0;
    o.next = null;
    if (o.kind === "boar") o.mode = "stunned";
    // l'orso, dopo il colpo, è sazio: finito il fermo se ne va per conto suo
    if (k.sated) { o.sated = true; o.mode = "wander"; o.last = null; }
    hurt(k.damage);
    trip.stats.hits++;
    Suoni.play("tonfo");
    el.map.classList.remove("is-hit");
    void el.map.offsetWidth; // fa ripartire l'animazione
    el.map.classList.add("is-hit");
    log(`${k.verb} ${lostHearts(k.damage)}.${k.sated && p.hp ? " Poi si siede, sazio." : ""}`);
    if (!p.hp) die(o.kind);
    else render();
  }

  // --- Fine zona e fine spedizione ---

  function backAboard() {
    if (!mazeDay()) return;
    s.over = true;
    trip.hp = s.player.hp;
    const b = s.bird;
    // l'hai incrociato senza osservarlo: nel taccuino il nome e dove vive, ma non il disegno
    if (birdActive() && !b.info.rara) learn(b.info, "traccia");
    const esito = b.observed ? `Il <strong>${b.info.nome}</strong> è nel taccuino.`
      : b.gone ? "L'uccello è volato via. Andrà meglio altrove."
      : trip.zones[s.zone.id].done ? "Questa zona non ha altro da mostrarti."
      : b.present ? "Torni a bordo senza averlo osservato."
      : "Nessun uccello, a quest'ora. Forse più tardi?";
    showOverlay("Di nuovo a bordo", `${esito}<br>Giorno ${day()}, ${now()} · ${trip.money} monete · Vita ${s.player.hp}/${maxHp()}`, [
      ["sail", `Riparti <small>(${arrivalTime(DEPART_COST)})</small>`],
      ["wait", `Aspetta a bordo <small>(${comingTime(1)})</small>`],
      ["stay", "Resta a terra"],
    ]);
    Suoni.play("campana");
  }

  // Aspettare a bordo l'ora del giorno dopo: la zona resta la stessa, cambiano luce, animali e forse l'uccello
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
    saveNotebook();
    Mare.stop();
    if (s) s.over = true;
    Diario.close();
    setTimeout(() => show("screen-end"), cause.kind === "death" ? 900 : 300);
  }

  function die(kind) {
    const SPIKES = { death: "Trafitto", deathText: "Le foglie del labirinto nascondevano troppe trappole" };
    const k = KINDS[kind] || { pirate: PIRATE, castle: CASTLE, spike: SPIKES }[kind] || OUTLAW;
    endTrip({ kind: "death", title: k.death, text: `${k.deathText}, al giorno ${day()}, ${now()}.` });
  }

  // La Società consegna l'attestato di Ornitologo esperto: il gioco è finito, e vinto
  function victory() {
    trip.expert = true;
    Suoni.play("osservato");
    endTrip({ kind: "victory", title: "Ornitologo esperto", text: `Giorno ${day()}: la Società ornitologica ti consegna l'attestato di Ornitologo esperto. Il taccuino è completo.` });
  }

  // Il pesce gatto della nebbia: la sua lucina è un'esca, e chi le va incontro a vele spiegate viene inghiottito.
  // Prima della fine la cartolina resta lì, con due righe per capire cos'è successo
  function swallowed() {
    trip.over = true;   // niente salvataggio: ricaricando non si torna indietro
    clearSave();
    showOverlay("Il pesce gatto", "La lucina nella nebbia era la sua esca. Hai puntato la prua dritto su di lei a vele spiegate, e lui ti ha sentito arrivare.", [["sunk", "Continua"]]);
  }

  function sunk() {
    endTrip({ kind: "death", title: "Inghiottito", text: `Nella nebbia, al giorno ${day()}, ${now()}, hai puntato la prua su una lucina a vele spiegate. Era l'esca del pesce gatto.` });
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
    // la mappa si rifà le misure ogni volta che il suo spazio cambia, non solo quando la finestra cambia
    if (!mapObserver) {
      mapObserver = new ResizeObserver(() => fitMap());
      mapObserver.observe(el.mapWrap);
    }
    el.overlay.hidden = true;
    el.banner.hidden = true;
    el.toast.hidden = true;
    el.explorer.textContent = trip.explorer;
    document.getElementById("screen-game").dataset.time = now();
    Diario.close();
    Diario.renderStrip();
  }

  // I tasti sotto la mappa: il tasto disegnato come un tasto, poi cosa fa
  const KEYS_HELP = {
    land: [["spazio", "osserva"], ["Z", "attendi"], ["X", "scava"], ["Tab", "diario"]],
    city: [["Tab", "diario"], [null, "nelle botteghe si entra dalla porta"]],
    sea: [["← →", "rotta"], ["↑ ↓", "vele"], ["T", "binocolo"], ["Invio", "sbarca"], ["Tab", "diario"]],
  };
  const keysHtml = (list) => list.map(([k, what]) => (k ? `<kbd>${k}</kbd> ${what}` : what)).join('<span class="keys-sep">·</span>');

  // A terra il riquadro A è la battlemap, in mare è il globo
  function showView(mode) {
    const land = mode === "land" || mode === "city";
    el.mapWrap.hidden = !land;
    el.sea.hidden = land;
    el.keys.innerHTML = keysHtml(KEYS_HELP[mode]);
    document.getElementById("screen-game").classList.toggle("in-city", mode === "city");
    if (mode !== "city") Citta.leave();
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
    el.ents.merchant = pawn("e-merchant", "merchant");
    el.ents.cart = pawn("e-cart", "cart");
    el.ents.merchant.hidden = el.ents.cart.hidden = !s.merchant;
    if (s.merchant) { place(el.ents.merchant, s.merchant); place(el.ents.cart, s.merchant.cart); }
    el.ents.fugitive = pawn("e-fugitive", "bandit");
    el.ents.fugitive.hidden = !s.fugitive;
    if (s.fugitive) { place(el.ents.fugitive, s.fugitive); s.fugitive.el = el.ents.fugitive; s.fugitive.slideEnd = 0; }
    for (const o of s.beasts) {
      o.el = pawn(`e-beast e-${o.kind}`, KINDS[o.kind].icon);
      o.slideEnd = 0;
    }
    for (const o of s.pirates) {
      o.el = pawn(`e-pirate${o.gun ? " is-gun" : ""}`, o.gun ? "gunner" : "buccaneer");
      o.slideEnd = 0;
      place(o.el, o);
    }
    for (const o of s.npcs) { o.el = pawn(`e-folk e-${o.kind}`, o.kind); o.slideEnd = 0; place(o.el, o); }
    for (const o of s.bouncers || []) { o.el = pawn(`e-beast e-${o.kind}`, o.kind); o.slideEnd = 0; place(o.el, o); }
    if (s.lady) { el.ents.lady = pawn("e-bride", "woman"); place(el.ents.lady, s.lady); }
    if (s.priest) { el.ents.priest = pawn("e-priest", "priest"); place(el.ents.priest, s.priest); }
    for (const o of s.guests || []) { o.el = pawn(`e-guest e-${o.kind || "kneeling"} is-${o.look ?? 0}`, o.kind === "queen" ? "king" : o.kind || "kneeling"); place(o.el, o); }
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
    const FRAME = 40;   // lo spazio per la cornice intorno, che non deve coprire le caselle del bordo
    const cell = Math.max(10, Math.min(30, Math.floor(Math.min((box.width - FRAME) / W, (box.height - FRAME) / H))));
    el.map.style.setProperty("--cell", `${cell}px`);
  }

  // Che cosa c'è in una casella: si passa o no, ci si nasconde o no (il rumore resta da scoprire)
  function showTileInfo(c) {
    if (!s || !el) return;
    const roofed = s.ruin && !insideRuin() && s.ruin.interior.has(key(c));
    const t = tile(s.map, c.x, c.y);
    if (roofed) { el.tileInfo.textContent = "Rovine · il tetto nasconde l'interno"; return; }
    if (s.lit && !s.lit.has(key(c))) { el.tileInfo.textContent = "Buio"; return; }
    const parts = [t.name];
    if (t === TILES.ship) parts.push("torni a bordo");
    else if (t.pass) { const ps = s.passes.find((q) => same(q, c)); if (ps) parts[0] = `Passaggio verso ${trip.world.zones[ps.to].name}`; parts.push(`a piedi, ${arrivalTime(1)}`); }
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
    // nel castello è buio dove non sei ancora passato; nelle rovine il tetto si apre solo se entri
    const dark = !!s.lit;
    const roofed = dark ? null : s.ruin && !insideRuin() ? s.ruin.interior : new Set();

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
        if (t === TILES.sea) cls += ` wave${(x * 2 + y * 3) % 5}`;

        if (dark && !s.lit.has(k)) {
          icon = null;
          ch = "";
          cls = "cell t-dark block";
        } else if (!dark && roofed.has(k)) {
          icon = k === roofCenter ? "ruins" : null;
          ch = "";
          cls = "cell t-roof block";
        } else if (band.has(k)) cls += " band";
        if (reach.has(k)) cls += danger.has(k) ? " danger" : " reach";
        if (s.item && s.item.x === x && s.item.y === y && !(roofed && roofed.has(k))) { icon = OGGETTI[s.item.kind].icona; cls += " item"; }
        if (s.chest && s.chest.x === x && s.chest.y === y) { icon = "chest"; cls += " chest"; }
        if (s.marsh && s.marsh.x === x && s.marsh.y === y) { icon = "marshmallow"; cls += " marsh"; }
        if (s.loot && s.loot.x === x && s.loot.y === y) { icon = "coins"; cls += " item"; }
        if (s.cup && s.cup.x === x && s.cup.y === y) { icon = "cup"; cls += " item"; }
        if (s.treasures && s.lit && s.lit.has(k)) { const l = s.treasures.find((q) => q.x === x && q.y === y); if (l) { icon = l.kind === "key" ? "brasskey" : l.kind === "coins" ? "coins" : "chalice"; cls += " item"; } }
        if (s.bottle && s.bottle.x === x && s.bottle.y === y) { icon = "bottle"; cls += " bottle"; }
        if (s.holes.has(k) && t.walk) { icon = "hole"; cls += " hole"; }
        if (s.traps.has(k)) { icon = "trap"; cls += " trap"; }
        if (t.tower && s.tower && x === s.tower[0].x + 1 && y === s.tower[0].y) { icon = "woman"; cls += " lady"; }   // alla finestra, lei
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
    const unseen = (c) => (dark ? !s.lit.has(key(c)) : roofed.has(key(c)));
    for (const o of [...s.npcs, ...(s.bouncers || [])]) {
      if (performance.now() >= o.slideEnd) place(o.el, o);
      o.el.hidden = unseen(o);
    }
    if (el.ents.lady) el.ents.lady.hidden = !s.lady || unseen(s.lady);
    if (el.ents.priest) el.ents.priest.hidden = unseen(s.priest);
    for (const o of s.guests || []) o.el.hidden = unseen(o);
    for (const o of s.pirates) {
      if (performance.now() >= o.slideEnd) place(o.el, o);
      const intent = o.mode === "sleep" ? "z" : o.mode === "hunt" ? "!" : null;
      if (intent) o.el.dataset.intent = intent;
      else delete o.el.dataset.intent;
    }
    const f = s.fugitive;
    if (f) {
      if (performance.now() >= f.slideEnd) place(f.el, f);
      if (f.mode === "flee") f.el.dataset.intent = "!";
    }
    el.ents.bird.hidden = !b.present || b.gone || unseen(b);
    el.ents.bird.classList.toggle("is-observed", b.observed);
    place(el.ents.bird, b);

    renderStatus();
    Diario.renderStrip();
  }

  // Il riquadro B: il momento del giorno, soldi, vita e, a terra, rumore e se sei nascosto
  function renderStatus() {
    // ogni tanto si salva, così anche un refresh improvviso perde al massimo un paio di secondi
    if (performance.now() - lastSave > 2000) { lastSave = performance.now(); save(); }
    const land = trip.mode === "land" && s;
    const time = land ? s.time : now();
    const hp = land ? s.player.hp : trip.hp;
    // i cuori: cinque rossi, poi quello rosa (se c'è), poi quelli in più del medico del porticciolo
    const slots = Math.max(Math.ceil(maxHp() / 2), Math.ceil(hp / 2));
    const hearts = Array.from({ length: slots }, (_, i) => {
      const pink = trip.pink && i === MAX_HP / 2;
      return `<span${pink ? ' class="pink"' : ""}>${i < Math.ceil(hp / 2) ? "♥" : "♡"}</span>`;
    }).join("") + (trip.violet ? '<span class="violet">♥</span>' : "");
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
      <div><span>Nascosto</span><b>${hidden() ? "sì" : s.run >= RUN_STEP ? "no, corri" : "no"}</b></div>`;
    } else {
      html += trip.mode === "city" ? Citta.statusRows() : Mare.statusRows();
    }
    el.status.innerHTML = html;
    drawCompass();
  }

  // --- La bussola: in pixel art, l'ago verso la città più vicina (in città, verso l'altra) ---

  let compassAngle = null;

  // La rotta iniziale da un punto all'altro del globo, in gradi da nord in senso orario
  function bearing(a, b) {
    const R = Math.PI / 180, f1 = a.lat * R, f2 = b.lat * R, dl = (b.lon - a.lon) * R;
    return (Math.atan2(Math.sin(dl) * Math.cos(f2), Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl)) / R + 360) % 360;
  }

  function drawCompass() {
    const cv = document.getElementById("compass");
    if (!cv || !trip) return;
    const here = trip.mode === "sea" ? trip.ship : trip.mode === "land" && s ? s.zone : trip.world.cities.find((c) => c.id === trip.city);
    const at = here.p ? { lat: Math.asin(here.p[2]) * 180 / Math.PI, lon: Math.atan2(here.p[1], here.p[0]) * 180 / Math.PI } : here;
    const cities = trip.world.cities.filter((c) => trip.mode !== "city" || c.id !== trip.city)
      .map((c) => ({ c, ll: { lat: Math.asin(c.p[2]) * 180 / Math.PI, lon: Math.atan2(c.p[1], c.p[0]) * 180 / Math.PI } }))
      .sort((a, b) => Globo.distance(a.ll, at) - Globo.distance(b.ll, at));
    if (!cities.length) return;
    cv.title = `La bussola: punta verso ${cities[0].c.name}`;
    // sedici direzioni: l'ago resta netto, in pixel
    const angle = Math.round(bearing(at, cities[0].ll) / 22.5) % 16 * 22.5;
    if (angle === compassAngle) return;
    compassAngle = angle;
    const g = cv.getContext("2d");
    const N = cv.width, c = (N - 1) / 2;
    g.clearRect(0, 0, N, N);
    const dot = (x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d > 10.6) continue;
      dot(x, y, d > 9.6 ? "#3a2412" : d > 8.4 ? ((x + y) % 3 ? "#c8902e" : "#f0c050") : d > 7.6 ? "#6a4418" : "#efe2bc");
    }
    // i punti cardinali: il nord in rosso, gli altri a trattini
    for (const [dx, dy, col] of [[0, -1, "#b3262a"], [1, 0, "#8a7050"], [0, 1, "#8a7050"], [-1, 0, "#8a7050"]]) {
      dot(c + dx * 7, c + dy * 7, col);
      dot(c + dx * 6 + (dy ? 0 : 0), c + dy * 6, col);
    }
    // l'ago: la punta rossa verso la città, la coda chiara dall'altra parte
    const rad = angle * Math.PI / 180, sx = Math.sin(rad), sy = -Math.cos(rad);
    // a losanga: largo vicino al perno, appuntito in cima
    const px = -sy, py = sx;
    for (let k = 0; k <= 7; k += 0.25) {
      const w = k < 3 ? 1 : k < 5 ? 0.5 : 0;
      for (let q = -w; q <= w; q += 0.5) dot(c + sx * k + px * q, c + sy * k + py * q, "#b3262a");
    }
    for (let k = 0.5; k <= 5; k += 0.25) {
      const w = k < 2.5 ? 1 : k < 4 ? 0.5 : 0;
      for (let q = -w; q <= w; q += 0.5) dot(c - sx * k + px * q, c - sy * k + py * q, "#4a5a68");
    }
    dot(c, c, "#f0c050");
    dot(c + 0.5, c + 0.5, "#3a2412");
  }

  // --- Comandi ---

  const MOVES = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  };

  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("in-game") || !trip || trip.mode !== "land" || !s || s.over || Diario.isOpen()) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!MOVES[k] && ![" ", "o", "Enter", ".", "z", "e", "x", "t", "m"].includes(k)) return;
    e.preventDefault();
    e.stopImmediatePropagation(); // le frecce muovono l'esploratore, non il menu
    if (MOVES[k]) act("move", ...MOVES[k], e.repeat);
    else if (k === "z" || k === "Enter" || k === ".") act("wait");
    else if (k === "e") sowSeeds();
    else if (k === "x") act("dig");
    else if (k === "t") act("trap");
    else if (k === "m") food();
    else act("observe");
  });

  document.addEventListener("click", (e) => {
    const action = e.target.closest("[data-game-action]")?.dataset.gameAction;
    if (action === "sail") depart();
    if (action === "sunk") sunk();
    if (action === "wait") waitAboard();
    if (action === "stay") stay();
    if (action === "trade") trade();
    if (action === "leave-merchant") leaveMerchant();
    if (action === "give-letter") giveLetter();
    if (action === "go-pass") goPass();
    if (action === "leave-lady") leaveMerchant();
    if (action === "cook") cook();
    if (action === "eat-marsh") eat("marshmallow");
    if (action === "eat-fish") eat("cibo");
    if (action === "marry") marry();
    if (action === "party") partyStep();

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
    start, resume, save, setNotebook: (data) => { notebook = data; }, code, hasSave: () => !!loadSave(), clearSave, loadNotebook, depart, landAt, rumor, pay, earn, visitCity, maxHp, EGG_DAYS,
    useItem, wantedPoster, acceptWanted, bountyState, earnStamp, victory, swallowed, STAMPS, advance, renderStatus, note, log, toast, timeOf, arrivalTime, now, day, showView, iconHtml, fitMap,
    get trip() { return trip; },
    get zoneState() { return s; },   // la battlemap in corso: per le prove automatiche
    get el() { return el; },
    get explorer() { return explorer; },
    MAX_HP, CREW_PAY, TIME_ICONS, TIMES, BOUNTY, WANTED_DAYS,
  };
})();
