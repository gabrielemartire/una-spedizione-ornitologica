// Le città sono battlemap senza animali: la banchina con le navi, le strade, le case e la gente
// che va e viene. La città è disegnata in pixel art vista dall'alto (tetti a falde, ciottoli,
// mura); sopra restano solo le cose con cui si interagisce, ben visibili: le porte delle botteghe
// (→) con la loro insegna, i barili, la bacheca dei ricercati, le persone. Davanti a una porta, in
// basso, un cartellino dice cos'è. Il Forte è grande e murato, con il castello, la chiesa, la
// gendarmeria e la Società ornitologica; il porticciolo del fiordo, su un'isola di ghiaccio, è più
// piccolo e sta sull'acqua: due passerelle con le loro case, la taverna su palafitte, il falegname.
// In città il tempo non passa, tranne dormendo in taverna.
// Espone l'oggetto globale `Citta`.
const Citta = (() => {
  const W = 40;
  const H = 24;
  const PX = 8;               // pixel di disegno per casella
  const NPC_MS = 650;         // ogni quanto la gente può fare un passo
  const NPC_MOVE = 0.05;      // e quanto spesso lo fa davvero: qualche passo ogni tanto
  const NPC_RANGE = 2;        // quanto si allontana da dove sta
  const TYPE_MS = 32;         // la velocità con cui compaiono le parole di chi parla
  const EVENT_CHANCE = 0.6;   // a ogni visita, qualcuno col punto esclamativo
  const WANTED_CHANCE = 0.6;  // a ogni visita, un avviso nuovo in bacheca (se non ce n'è uno in corso)
  const SOCIETY_PRIZE = 25;   // il premio della Società per ogni specie completata (tutti i comuni)
  const ROB = [2, 4];         // quanto ti può rubare

  // walk: ci si cammina; i nomi servono a dire cosa c'è nella casella
  const TILES = {
    sea: { name: "Mare" }, boat: { name: "Nave ormeggiata" }, fish: { name: "Peschereccio" }, hull: { name: "La tua nave" },
    ship: { name: "Si sale a bordo", walk: true, icon: "ship" },
    quay: { name: "Banchina", walk: true }, road: { name: "Strada", walk: true }, square: { name: "Piazza", walk: true },
    court: { name: "Cortile del castello", walk: true }, gate: { name: "Porta", walk: true }, snow: { name: "Neve", walk: true },
    house: { name: "Casa" }, yard: { name: "Orto" }, tree: { name: "Albero" }, pine: { name: "Abete" },
    wall: { name: "Mura" }, tower: { name: "Torre" }, keep: { name: "Il castello" },
    church: { name: "La chiesa" }, bell: { name: "Il campanile" }, well: { name: "Pozzo" }, stall: { name: "Bancarella" },
    crate: { name: "Casse" },
    barrel: { name: "Barile", icon: "barrel", talk: true },
    board: { name: "Bacheca dei ricercati", icon: "wanted", talk: true },
    door: { name: "Porta", walk: true, icon: "enter" },
  };

  // Le botteghe e quello che offrono, città per città
  const SHOPS = {
    forte: {
      medico: { cost: 5, extra: 0 },
      taverna: { cost: 5 },
      mercato: { price: 2, refuse: [] },
      emporio: { semi: 5, cibo: 2, tagliola: 3 },
      gendarmeria: {},
      societa: {},
    },
    porto: {
      medico: { cost: 3, extra: 2 }, // tutti i cuori e uno in più, che il Forte non ripristina
      taverna: { cost: 4, name: "Taverna Pesce Sgozzato" },
      mercato: { price: 4, refuse: ["arte"] },
      emporio: { semi: 5, cibo: 2, tagliola: 3 },
    },
  };
  // il nome e l'icona dell'insegna sul tetto (game-icons.net)
  const SHOP_INFO = {
    medico: ["Medico", "medicine"], taverna: ["Taverna", "tankard"], mercato: ["Mercato", "shop"],
    emporio: ["Emporio", "seeds"], gendarmeria: ["Gendarmeria", "manacles"], societa: ["Società ornitologica", "birdhouse"],
  };

  // il nome della bottega: in una città può avere il suo
  // fin dove cura il medico: la vita massima (col cuore rosa, se c'è) più l'eventuale cuore in più
  const healCap = (shop) => Gioco.maxHp() + shop.extra;

  const shopName = (kind) => (c && SHOPS[c.city.id][kind]?.name) || SHOP_INFO[kind][0];

  const GROG = "«Il grog è un miscuglio segreto che contiene una o più di queste sostanze: cherosene, glicol propilene, dolcificanti artificiali, acido solforico, rum, acetone, colorante rosso n.2, detriti, grasso per motore, acido per la batteria e/o peperone. Come puoi ben immaginare è una delle sostanze più caustiche e volatili conosciute dall'uomo.»";

  // Il falegname e il roditore: la conversazione non si salta, si sceglie solo la battuta (che è una)
  const RODITORE = [
    ["lui", "Heilà!"],
    ["io", "Quanto legno potrebbe rodere un roditore, se un roditore potesse rodere il legno?"],
    ["lui", "Un roditore non potrebbe rodere nessun legno, visto che un roditore non può rodere il legno."],
    ["io", "Ma se un roditore potesse rodere e rodesse un po' di legno, quanto legno roderebbe un roditore?"],
    ["lui", "Anche se un roditore potesse rodere il legno, e anche se un roditore rodesse il legno, dovrebbe un roditore rodere il legno?"],
    ["io", "Un roditore dovrebbe rodere se un roditore potesse rodere il legno, e se un roditore volesse rodere."],
    ["lui", "Ah, ecco. Grazie, ora è tutto chiaro. Torna quando vuoi!"],
  ];

  let c = null;   // la città in cui sei: mappa, edifici, gente, botteghe
  let timer = 0;

  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const same = (a, b) => a.x === b.x && a.y === b.y;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const tileAt = (x, y) => TILES[c.map[y][x]];

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

  // --- Le mappe ---

  function blank(fill) {
    const map = Array.from({ length: H }, () => Array(W).fill(fill));
    const bld = Array.from({ length: H }, () => Array(W).fill(-1));
    return { map, bld, buildings: [] };
  }

  // Gli isolati diventano case: rettangoli di varie misure, a volte uniti a L; i ritagli diventano orti
  function fillHouses(m, r, lot, roofs, spare = () => (r() < 0.3 ? "tree" : "yard")) {
    const free = (x, y) => inside(x, y) && m.map[y][x] === lot;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!free(x, y)) continue;
        let w = 2 + Math.floor(r() * 3), h = 2 + Math.floor(r() * 2);
        while (w > 1 && ![...Array(w).keys()].every((i) => free(x + i, y))) w--;
        while (h > 1 && ![...Array(h).keys()].every((j) => [...Array(w).keys()].every((i) => free(x + i, y + j)))) h--;
        const cells = [];
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) cells.push({ x: x + i, y: y + j });
        if (cells.length === 1) { m.map[y][x] = spare(); continue; }
        // a volte un'ala in più: la casa diventa a L
        if (r() < 0.35 && free(x, y + h) && free(x + 1, y + h)) cells.push({ x, y: y + h }, { x: x + 1, y: y + h });
        addBuilding(m, cells, "house", roofs[Math.floor(r() * roofs.length)]);
      }
    }
  }

  function addBuilding(m, cells, kind, roof) {
    const id = m.buildings.length;
    for (const p of cells) { m.map[p.y][p.x] = kind === "house" ? "house" : kind; m.bld[p.y][p.x] = id; }
    const xs = cells.map((p) => p.x), ys = cells.map((p) => p.y);
    const box = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
    m.buildings.push({ id, cells, kind, roof, box, ridge: box.x1 - box.x0 >= box.y1 - box.y0 ? "h" : "v" });
    return id;
  }

  // Una nave in scala: occupa più caselle di mare, disegnata intera in pixel art
  function vessel(m, kind, x, y, w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (inside(x + i, y + j)) m.map[y + j][x + i] = kind;
    m.vessels.push({ kind, x, y, w, h });
  }

  // Una porta di bottega: una casella di casa che dà sulla strada; l'insegna sta sul tetto, dietro la porta
  function placeShop(m, kind, near, roads) {
    const cand = [];
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        if (m.map[y][x] !== "house") continue;
        for (const [dx, dy] of DIRS) {
          const front = { x: x + dx, y: y + dy }, back = { x: x - dx, y: y - dy };
          if (!roads.includes(m.map[front.y][front.x]) || m.bld[back.y]?.[back.x] !== m.bld[y][x]) continue;
          cand.push({ x, y, front, sign: back, d: Math.hypot(x - near.x, y - near.y) });
        }
      }
    }
    cand.sort((a, b) => a.d - b.d);
    const best = cand.find((cd) => !Object.values(m.doors).some((d) => m.bld[d.y][d.x] === m.bld[cd.y][cd.x]));
    if (!best) return;
    m.map[best.y][best.x] = "door";
    m.doors[kind] = { x: best.x, y: best.y, front: best.front, sign: best.sign };
  }

  // Il Forte: mare e banchina a ovest, mura tutt'intorno, la strada principale che serpeggia da
  // una porta all'altra, il quartiere del castello a nord-est, la piazza con la chiesa, vicoli sfalsati
  function buildForte(r) {
    const m = blank("lot");
    m.doors = {};
    m.vessels = [];
    const set = (x, y, t) => { if (inside(x, y)) m.map[y][x] = t; };
    const rect = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t); };
    rect(0, 0, 3, H - 1, "sea");
    rect(4, 0, 6, H - 1, "quay");
    // le mura, con le torri agli angoli e a metà
    rect(7, 0, 7, H - 1, "wall"); rect(7, 0, W - 1, 0, "wall"); rect(7, H - 1, W - 1, H - 1, "wall"); rect(W - 1, 0, W - 1, H - 1, "wall");
    for (const [x, y] of [[7, 0], [W - 1, 0], [7, H - 1], [W - 1, H - 1], [7, 6], [7, 17], [20, H - 1]]) set(x, y, "tower");
    // il quartiere del castello: le sue mura, le torri, il mastio e il cortile
    rect(28, 1, 38, 9, "court");
    rect(28, 1, 38, 1, "wall"); rect(28, 9, 38, 9, "wall"); rect(28, 1, 28, 9, "wall");
    for (const [x, y] of [[28, 1], [28, 9], [38, 9]]) set(x, y, "tower");
    const keep = [];
    for (let y = 3; y <= 6; y++) for (let x = 31; x <= 36; x++) keep.push({ x, y });
    addBuilding(m, keep, "keep", null);
    set(33, 9, "gate");
    // la strada principale: due caselle, con qualche gomito
    let y = 12;
    m.main = [];
    for (let x = 8; x < W - 1; x++) {
      if ((x === 15 || x === 24 || x === 33) && r() < 0.8) y += r() < 0.5 ? -1 : 1;
      y = Math.max(11, Math.min(14, y));
      set(x, y, "road"); set(x, y + 1, "road");
      m.main.push({ x, y });
    }
    set(7, m.main[0].y, "gate"); set(7, m.main[0].y + 1, "gate");
    // la piazza con la chiesa e il pozzo, e la strada che la lega alla principale
    rect(15, 4, 24, 8, "square");
    const nave = [];
    for (let yy = 1; yy <= 3; yy++) for (let x = 15; x <= 21; x++) nave.push({ x, y: yy });
    addBuilding(m, nave, "church", null);
    addBuilding(m, [{ x: 22, y: 2 }, { x: 22, y: 3 }, { x: 23, y: 2 }, { x: 23, y: 3 }], "bell", null);
    set(22, 6, "well");
    for (const [x, yy] of [[16, 7], [18, 7]]) set(x, yy, "stall");
    for (let yy = 9; yy < m.main.find((p) => p.x === 20).y; yy++) set(20, yy, "road");
    for (let yy = 10; yy < m.main.find((p) => p.x === 33).y; yy++) set(33, yy, "road");
    // i vicoli: scendono e salgono dalla principale, facendo un gomito a metà
    for (const [ax, dir, len] of [[11, -1, 10], [12, 1, 9], [26, 1, 9], [17, 1, 8], [35, 1, 8], [25, -1, 4]]) {
      let x = ax, yy = m.main.find((p) => p.x === ax).y + (dir > 0 ? 2 : -1);
      for (let k = 0; k < len && inside(x, yy); k++) {
        if (["wall", "tower", "square", "court", "church", "bell", "keep"].includes(m.map[yy][x])) break;
        set(x, yy, "road");
        if (k === Math.floor(len / 2)) { x += r() < 0.5 ? 1 : -1; set(x, yy, "road"); }
        yy += dir;
      }
    }
    // un vicolo di traverso a sud
    for (let x = 9; x < W - 2; x++) if (m.map[19][x] === "lot") set(x, 19 + (x > 24 ? 1 : 0), "road");
    // sulla banchina barili e casse; in mare le altre navi
    for (const [x, yy] of [[5, 3], [6, 8], [5, 16], [6, 20]]) set(x, yy, "barrel");
    for (const [x, yy] of [[6, 4], [5, 19], [6, 17]]) set(x, yy, "crate");
    for (const yy of [0, 19]) vessel(m, "boat", 1, yy, 2, 5);
    fillHouses(m, r, "lot", ["coppi", "coppi", "ardesia", "paglia", "mattoni"]);
    // un barile in piazza (davanti alla taverna niente: chiudeva la strada)
    const roads = ["road", "square"];
    placeShop(m, "medico", { x: 10, y: 10 }, roads);
    placeShop(m, "taverna", { x: 16, y: 15 }, roads);
    placeShop(m, "mercato", { x: 22, y: 10 }, roads);
    placeShop(m, "emporio", { x: 31, y: 16 }, roads);
    placeShop(m, "gendarmeria", { x: 26, y: 20 }, roads);
    placeShop(m, "societa", { x: 24, y: 8 }, roads);
    set(6, 6, "board"); // la bacheca dei ricercati, sulla banchina
    set(24, 4, "barrel");
    // la tua nave: tre caselle per nove, ormeggiata lungo la banchina; a bordo si sale dalla banchina
    const ship = { x: 4, y: m.main[0].y };
    vessel(m, "hull", 1, ship.y - 4, 3, 9);
    set(ship.x, ship.y, "ship");
    set(ship.x + 1, ship.y, "quay"); // davanti alla nave non ci va mai niente
    return { ...m, ship, start: { x: 5, y: ship.y }, people: 16, walkable: ["road", "square", "quay", "court"] };
  }

  // Il porticciolo: costruito sull'acqua e attaccato alla terraferma in alto (neve e abeti). Due
  // passerelle di legno parallele, ognuna con la sua fila di case, il mare a ovest (con la tua nave) e di
  // nuovo a est, con i pontili e i pescherecci ormeggiati; la taverna su palafitte, sul lato del mare
  function buildPorto(r) {
    const m = blank("sea");
    m.doors = {};
    m.vessels = [];
    m.stilts = [];
    const set = (x, y, t) => { if (inside(x, y)) m.map[y][x] = t; };
    const rect = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t); };
    // la terraferma in alto: la riva innevata, gli abeti; le passerelle partono da lì
    rect(0, 0, W - 1, 2, "snow");
    for (let x = 0; x < W; x++) for (let yy = 0; yy < 2; yy++) if (r() < (yy ? 0.35 : 0.6) && (x < 5 || x > 15)) set(x, yy, "pine");
    rect(6, 3, 8, H - 3, "quay");                 // la prima passerella, sul mare dove ormeggia la tua nave
    rect(9, 3, 11, H - 3, "lot");                 // la prima fila di case
    rect(12, 3, 14, H - 3, "quay");               // la seconda passerella
    rect(15, 3, 17, H - 3, "lot");                // la seconda fila di case, che dà di nuovo sul mare
    for (const yy of [9, 15]) rect(9, yy, 11, yy, "quay");   // i passaggi tra le due passerelle
    // i pontili per le barche: tre sul mare a est (passando tra le case), uno a ovest
    for (const [yy, len] of [[6, 7], [12, 9], [18, 8]]) { rect(15, yy, 17, yy, "quay"); rect(18, yy, 17 + len, yy, "quay"); }
    rect(2, 20, 5, 20, "quay");
    // la taverna del Pesce Sgozzato, su palafitte nel mare, attaccata alla prima passerella
    const tav = [];
    for (let y = 4; y <= 7; y++) for (let x = 2; x <= 5; x++) tav.push({ x, y });
    m.stilts.push(addBuilding(m, tav, "house", "legno"));
    m.map[6][5] = "door";
    m.doors.taverna = { x: 5, y: 6, front: { x: 6, y: 6 }, sign: { x: 4, y: 6 } };
    fillHouses(m, r, "lot", ["legno", "legno", "ardesia", "rosso"], () => "crate");   // sull'acqua niente orti: casse
    for (const [x, yy] of [[6, 8], [6, 13], [7, 20], [12, 5], [14, 17]]) set(x, yy, "crate");
    for (const [x, yy] of [[8, 8], [6, 16], [14, 10]]) set(x, yy, "barrel");
    // i pescherecci ormeggiati ai pontili, uno o due per parte, e qualcuno alla fonda
    for (const [x, yy] of [[3, 21], [0, 11]]) vessel(m, "fish", x, yy, 2, 3);
    for (const [x, yy] of [[19, 7], [23, 7], [20, 13], [24, 13], [19, 19], [23, 19]]) vessel(m, "fish", x, yy, 2, 4);
    for (const [x, yy] of [[31, 4], [33, 15], [36, 9]]) vessel(m, "fish", x, yy, 2, 4);
    const roads = ["quay"];
    placeShop(m, "medico", { x: 10, y: 4 }, roads);
    placeShop(m, "mercato", { x: 16, y: 6 }, roads);
    placeShop(m, "emporio", { x: 16, y: 18 }, roads);
    set(8, 10, "board"); // la bacheca dei ricercati, sulla banchina
    const ship = { x: 6, y: 12 };
    vessel(m, "hull", 3, ship.y - 4, 3, 9);
    set(ship.x, ship.y, "ship");
    set(ship.x + 1, ship.y, "quay"); // davanti alla nave non ci va mai niente
    // il falegname lavora in fondo alla banchina, accanto alle sue casse, vicino a un peschereccio
    const carpenter = { x: 6, y: 20 };
    set(carpenter.x, carpenter.y, "quay");
    return { ...m, ship, carpenter, start: { x: 7, y: 12 }, people: 9, walkable: ["quay"] };
  }

  // --- Il disegno in pixel art ---

  const ROOFS = {
    coppi: ["#c8643c", "#9a4428", "#e08a5a", "#5a2414"],
    ardesia: ["#6a7484", "#4a5262", "#8a94a4", "#2a2e38"],
    paglia: ["#c8a050", "#9a7834", "#e0c070", "#5a4420"],
    mattoni: ["#b04a3a", "#82322a", "#c86a54", "#4a1a14"],
    legno: ["#5a6a80", "#3e4a5e", "#7a8aa0", "#232a36"],
    rosso: ["#9a3a2e", "#6e261e", "#b85444", "#3a120e"],
  };

  function paint() {
    const cv = document.createElement("canvas");
    cv.width = W * PX;
    cv.height = H * PX;
    cv.className = "city-art";
    const g = cv.getContext("2d");
    const img = g.createImageData(cv.width, cv.height);
    const r = rng(Gioco.trip.seed ^ 0xa11);
    const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const put = (x, y, col) => { if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return; img.data.set([...(typeof col === "string" ? hex(col) : col), 255], (y * cv.width + x) * 4); };
    const get = (x, y) => [...img.data.slice((y * cv.width + x) * 4, (y * cv.width + x) * 4 + 3)];
    const darken = (x, y, k) => { if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return; put(x, y, get(x, y).map((v) => Math.round(v * k))); };
    const noise = () => r();
    const ground = { road: ["#7a7266", "#5e584e", "#948a7a"], square: ["#a49a86", "#867c6a", "#b8ae98"], court: ["#8a8274", "#6e6658", "#a09886"],
      gate: ["#6e665a", "#504a40", "#8a8272"], snow: ["#dfe8ee", "#c4d0da", "#f2f6f8"], quay: ["#7a5a3a", "#5a4028", "#94704a"] };

    for (let ty = 0; ty < H; ty++) {
      for (let tx = 0; tx < W; tx++) {
        const t = c.map[ty][tx], ox = tx * PX, oy = ty * PX;
        const cellPx = (fn) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) put(ox + x, oy + y, fn(x, y)); };
        // il fondo sotto ogni cosa: acqua, banchina, strada, neve
        const under = ["sea", "boat", "fish", "hull"].includes(t) ? "sea" : ["barrel", "crate", "ship"].includes(t) ? "quay"
          : t === "door" ? "road" : ["well", "stall"].includes(t) ? "square" : ["yard", "tree"].includes(t) ? "yard" : ["pine"].includes(t) ? "snow" : t;
        if (under === "sea") cellPx((x, y) => ((x + y * 3 + tx * 5 + ty * 2) % 11 === 0 ? "#4a7a9a" : (y + ty) % 4 === 0 && (x + tx * 3) % 6 < 2 ? "#3a6684" : "#2a4e6a"));
        else if (under === "quay") cellPx((x, y) => (c.city.id === "porto" ? (x === 0 || x === 4 ? ground.quay[1] : (y + tx) % 7 === 0 ? ground.quay[2] : ground.quay[0])
          : (y === 0 || y === 4 ? ground.quay[1] : (x + ty * 3) % 9 === 0 ? ground.quay[2] : ground.quay[0])));
        else if (under === "road" || under === "gate") cellPx((x, y) => ((x + (y >> 1) * 2 + tx) % 4 === 0 || y % 3 === 0 ? ground[under][1] : noise() < 0.08 ? ground[under][2] : ground[under][0]));
        else if (under === "square" || under === "court") cellPx((x, y) => (x === 0 || y === 0 ? ground[under][1] : (x + y) % 5 === 0 ? ground[under][2] : ground[under][0]));
        else if (under === "snow") cellPx(() => (noise() < 0.12 ? ground.snow[1] : noise() < 0.05 ? ground.snow[2] : ground.snow[0]));
        else if (under === "yard") cellPx(() => (noise() < 0.2 ? "#4a6a34" : noise() < 0.1 ? "#7a9a4a" : "#5a7a3e"));
        else if (under === "wall" || under === "tower") cellPx((x, y) => ((x + y * 2) % 5 === 0 ? "#7a7060" : "#9a8e7a"));
        else cellPx(() => "#3a3028");

        // quello che ci sta sopra
        if (t === "tree") { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { const d = Math.hypot(x - 3.5, y - 3.5); if (d < 3.6) put(ox + x, oy + y, d < 1.6 && x < 4 && y < 4 ? "#7aa04a" : x + y > 8 ? "#2e4a24" : "#4a7034"); } }
        if (t === "pine") { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { const d = Math.max(Math.abs(x - 3.5), Math.abs(y - 3.5)) + Math.min(Math.abs(x - 3.5), Math.abs(y - 3.5)) * 0.6; if (d < 4) put(ox + x, oy + y, (x + y) % 3 === 0 && d < 2.5 ? "#f2f6f8" : x + y > 8 ? "#1e3a28" : "#2e5a3a"); } }
        if (t === "well") { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { const d = Math.hypot(x - 3.5, y - 3.5); if (d < 3.8) put(ox + x, oy + y, d < 2.2 ? "#1e2a34" : "#b0a690"); } }
        if (t === "stall") { for (let y = 1; y < PX - 1; y++) for (let x = 0; x < PX; x++) put(ox + x, oy + y, (x >> 1) % 2 ? "#e8e0d0" : "#b84a3a"); }
        if (t === "crate") { for (let y = 1; y < 7; y++) for (let x = 1; x < 7; x++) put(ox + x, oy + y, x === 1 || y === 1 || x === 6 || y === 6 || x === y || x === 7 - y ? "#5a4028" : "#a07a4a"); }
        if (t === "wall" || t === "tower") {
          // il camminamento in cima alle mura, con i merli sul bordo verso fuori
          for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) if ((x === 0 || y === 0 || x === 7 || y === 7) && (x + y) % 2 === 0) put(ox + x, oy + y, "#b8ac94");
          if (t === "tower") for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { const d = Math.hypot(x - 3.5, y - 3.5); if (d < 3) put(ox + x, oy + y, x + y < 7 ? "#6a7484" : "#3e4654"); }
        }
      }
    }

    for (const v of c.vessels) drawVessel(v, put, darken);
    // le palafitte: sotto le case sospese sull'acqua, i pali e il loro riflesso
    for (const id of c.stilts || []) {
      const b = c.buildings[id];
      for (let x = b.box.x0 * PX + 2; x < (b.box.x1 + 1) * PX; x += 6) {
        for (let y = 0; y < 7; y++) put(x, (b.box.y1 + 1) * PX + y, y < 4 ? "#3a2614" : "#1e3a50");
        put(x + 1, (b.box.y1 + 1) * PX, "#5a3a20");
      }
      for (let x = b.box.x0 * PX; x < (b.box.x1 + 1) * PX; x++) put(x, (b.box.y1 + 1) * PX + 7, "#4a7a9a");
    }

    // gli edifici: tetti a falde con la luce da nord-ovest, comignoli, e l'ombra che gettano
    for (const b of c.buildings) {
      const own = new Set(b.cells.map((p) => `${p.x},${p.y}`));
      const mine = (tx, ty) => own.has(`${tx},${ty}`);
      const pal = b.kind === "church" ? ["#5a6a8a", "#3e4a66", "#7a8aaa", "#20283a"] : b.kind === "bell" ? ["#4a5470", "#2e3448", "#6a7490", "#181c28"]
        : b.kind === "keep" ? ["#b0a690", "#8a8070", "#c8bea6", "#4a4438"] : ROOFS[b.roof];
      const [lit, shade, ridge, edge] = pal.map(hex);
      const bx0 = b.box.x0 * PX, by0 = b.box.y0 * PX, bx1 = (b.box.x1 + 1) * PX, by1 = (b.box.y1 + 1) * PX;
      const midY = (by0 + by1) / 2, midX = (bx0 + bx1) / 2;
      for (const p of b.cells) {
        for (let y = 0; y < PX; y++) {
          for (let x = 0; x < PX; x++) {
            const X = p.x * PX + x, Y = p.y * PX + y;
            const onEdge = (x === 0 && !mine(p.x - 1, p.y)) || (x === PX - 1 && !mine(p.x + 1, p.y)) || (y === 0 && !mine(p.x, p.y - 1)) || (y === PX - 1 && !mine(p.x, p.y + 1));
            let col;
            if (b.kind === "keep") {
              // il mastio: un tetto piatto di pietra, i merli tutto intorno
              col = onEdge ? ((X + Y) % 2 ? edge : ridge) : (X % 6 === 0 || Y % 6 === 0) ? shade : lit;
            } else if (b.kind === "bell") {
              // il campanile: un tetto a piramide, quattro falde
              const dx = X - midX + 0.5, dy = Y - midY + 0.5;
              col = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? lit : shade) : dy < 0 ? ridge : shade;
              if (Math.abs(dx) < 1 && Math.abs(dy) < 1) col = hex("#f2c230");
              if (onEdge) col = edge;
            } else {
              const before = b.ridge === "h" ? Y < midY : X < midX;
              const onRidge = b.ridge === "h" ? Math.abs(Y - midY + 0.5) < 1 : Math.abs(X - midX + 0.5) < 1;
              col = onRidge ? ridge : before ? lit : shade;
              // file di tegole
              if (!onRidge && (b.ridge === "h" ? X : Y) % 3 === 0) col = col.map((v) => Math.round(v * 0.86));
              if (onEdge) col = edge;
            }
            put(X, Y, col);
          }
        }
        // l'ombra a sud e a est, sul fondo accanto
        if (!mine(p.x, p.y + 1) && inside(p.x, p.y + 1)) for (let x = 0; x < PX; x++) for (let y = 0; y < 2; y++) darken(p.x * PX + x + 1, (p.y + 1) * PX + y, 0.7);
        if (!mine(p.x + 1, p.y) && inside(p.x + 1, p.y)) for (let y = 0; y < PX; y++) for (let x = 0; x < 2; x++) darken((p.x + 1) * PX + x, p.y * PX + y + 1, 0.7);
      }
      // comignoli sulle case, una croce sulla chiesa, la bandiera sul castello
      if (b.kind === "house" && b.cells.length > 3) {
        const p = b.cells[Math.floor(r() * b.cells.length)];
        for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) put(p.x * PX + 2 + x, p.y * PX + 2 + y, y === 0 ? "#8a7a6a" : "#3a2e26");
      }
      if (b.kind === "church") { const x = Math.round(midX), y = by0 + 6; for (let k = -2; k <= 2; k++) { put(x + k, y, "#f2c230"); put(x, y + k, "#f2c230"); } }
      if (b.kind === "keep") {
        for (const [cx, cy] of [[bx0, by0], [bx1 - 1, by0], [bx0, by1 - 1], [bx1 - 1, by1 - 1]]) {
          for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) { const d = Math.hypot(x, y); if (d < 4.5) put(cx + x, cy + y, d < 1.5 ? "#2a2e38" : x + y < 0 ? "#6a7484" : "#3e4654"); }
        }
        for (let y = 0; y < 10; y++) put(Math.round(midX), by0 + 4 + y, "#3a2e26");
        for (let y = 0; y < 3; y++) for (let x = 1; x < 6; x++) put(Math.round(midX) + x, by0 + 4 + y, "#c8302a");
      }
    }
    g.putImageData(img, 0, 0);
    return cv;
  }

  // Le navi viste dall'alto, con la prua a nord: scafo affusolato, ponte di assi, vele sui pennoni.
  // La tua nave ha tre alberi; le navi del Forte due; i pescherecci sono rossi, con la cabina e le reti.
  function drawVessel(v, put, darken) {
    const w = v.w * PX, h = v.h * PX, x0 = v.x * PX, y0 = v.y * PX;
    const fish = v.kind === "fish";
    const hullCol = fish ? ["#a83a2a", "#5a1a12", "#c85a44"] : ["#8a5a30", "#3a2414", "#b88a52"];
    const deck = fish ? ["#c8b090", "#a89070"] : ["#b88a52", "#9a7040"];
    const top = fish ? 2 : 4;                     // il bompresso davanti
    const half = (y) => {                         // mezza larghezza dello scafo alla riga y
      const t = (y - top) / (h - top - 1);
      if (t < 0 || t > 1) return -1;
      const full = w / 2 - 1;
      if (t < 0.3) return full * Math.sqrt(t / 0.3);
      if (t > 0.9) return full * (1 - (t - 0.9) * 2);
      return full;
    };
    const cx = (w - 1) / 2;
    // l'ombra sull'acqua, verso sud-est
    for (let y = 0; y < h; y++) { const hw = half(y); if (hw < 0) continue; for (let x = 0; x < w; x++) if (Math.abs(x - cx) <= hw) darken(x0 + x + 2, y0 + y + 2, 0.65); }
    for (let y = 0; y < h; y++) {
      const hw = half(y), t = (y - top) / (h - top - 1);
      for (let x = 0; x < w; x++) {
        const dx = Math.abs(x - cx);
        if (hw < 0 || dx > hw) continue;
        let col = dx > hw - 1 ? hullCol[1] : dx > hw - 2 ? hullCol[0] : x % 3 === 0 ? deck[1] : deck[0];
        if (fish && dx > hw - 3) col = dx > hw - 1 ? hullCol[1] : dx > hw - 2 ? hullCol[0] : "#e8e8e0"; // fiancata rossa con la fascia bianca
        if (!fish && t > 0.82 && dx <= hw - 2) col = y === Math.round(top + 0.82 * (h - top - 1)) + 1 ? hullCol[1] : hullCol[2]; // il cassero
        put(x0 + x, y0 + y, col);
      }
    }
    // il bompresso
    for (let y = 0; y < top + 2; y++) put(x0 + Math.round(cx), y0 + y, hullCol[1]);
    if (fish) {
      // la cabina, l'albero e le reti a poppa
      for (let y = Math.round(h * 0.5); y < Math.round(h * 0.72); y++) for (let x = 4; x < w - 4; x++) put(x0 + x, y0 + y, x === 4 || x === w - 5 || y === Math.round(h * 0.5) ? "#8a8a80" : "#e8e8e0");
      put(x0 + Math.round(cx), y0 + Math.round(h * 0.3), "#3a2414");
      for (const [x, y] of [[5, h - 6], [7, h - 5], [9, h - 6], [6, h - 4], [8, h - 4]]) put(x0 + x, y0 + y, "#5a7a5a");
      return;
    }
    // le vele: una fascia per albero, più larga dello scafo, gonfia verso prua
    const masts = v.kind === "hull" ? [0.22, 0.45, 0.68] : [0.3, 0.6];
    for (const m of masts) {
      const my = Math.round(top + m * (h - top - 1));
      const sw = w / 2 - (m < 0.3 ? 2 : 0);
      for (let x = 0; x < w; x++) {
        const dx = Math.abs(x - cx);
        if (dx > sw) continue;
        const belly = Math.round((1 - (dx / sw) ** 2) * 2);   // la vela gonfia
        for (let k = 0; k < 4; k++) put(x0 + x, y0 + my - belly + k, k === 3 ? "#a89c80" : k === 0 ? "#fbf6e6" : "#e8dfc4");
        put(x0 + x, y0 + my + 3, "#4a3018");                    // il pennone
      }
      put(x0 + Math.round(cx), y0 + my + 1, "#4a3018");
    }
    // la lanterna a poppa
    put(x0 + Math.round(cx), y0 + h - 3, "#f2c230");
  }

  // --- Entrare e uscire ---

  function enter(city) {
    const trip = Gioco.trip;
    const r = rng(trip.seed ^ (city.id === "forte" ? 0xf0f7e : 0x9077));
    const plan = city.id === "forte" ? buildForte(r) : buildPorto(r);
    c = { city, ...plan, player: { ...plan.start }, npcs: [], open: null, prev: null, near: null };
    // la gente: sulle strade e sulla banchina, mai addosso a te né davanti a porte e nave
    const spots = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (plan.walkable.includes(c.map[y][x]) && !inTheWay({ x, y })) spots.push({ x, y });
    const ra = Math.random;
    for (let i = 0; i < plan.people && spots.length; i++) {
      const at = spots.splice(Math.floor(ra() * spots.length), 1)[0];
      if (!same(at, c.player)) c.npcs.push({ ...at, home: { ...at } });
    }
    // a volte qualcuno col punto esclamativo: ti aspetta fermo, e non si sa mai cosa vuole
    if (ra() < EVENT_CHANCE && c.npcs.length) c.npcs[0].event = true;
    // la bacheca: un avviso nuovo a volte, mai più di uno ogni qualche giorno
    c.poster = ra() < WANTED_CHANCE ? Gioco.wantedPoster() : null;
    // il falegname non si muove dal suo posto
    if (plan.carpenter) c.npcs.push({ ...plan.carpenter, carpenter: true });
    Gioco.showView("city");
    build();
    drawPostcard();
    Suoni.stopAll();
    Suoni.toggleAmbient(city.id === "forte" ? "vento" : "mare");
    clearInterval(timer);
    timer = setInterval(stroll, NPC_MS);
    Gioco.renderStatus();
    Gioco.toast(city.id === "forte" ? "Il Forte: le botteghe hanno l'insegna sul tetto." : "Il porticciolo: le botteghe danno sulla banchina.");
    render();
  }

  function leave() {
    clearInterval(timer);
    hint(null);
    c = null;
  }

  function drawPostcard() {
    Gioco.el.postcard.classList.remove("is-scope");
    Cartolina.render({ seed: Gioco.trip.seed, tags: new Set(), time: Gioco.now(), city: c.city.id }, Gioco.el.postcard);
  }

  // --- Disegno della griglia: sotto l'immagine, sopra solo ciò che si usa ---

  function build() {
    const el = Gioco.el;
    el.map.classList.remove("is-hit");
    el.map.innerHTML = "";
    el.map.style.gridTemplateColumns = `repeat(${W}, var(--cell))`;
    el.map.appendChild(paint());
    el.cells = [];
    for (let y = 0; y < H; y++) {
      el.cells.push([]);
      for (let x = 0; x < W; x++) {
        const d = document.createElement("div");
        d.dataset.x = x;
        d.dataset.y = y;
        const t = tileAt(x, y);
        // l'insegna della bottega sta sul tetto, sopra la porta: l'icona del mestiere
        const sign = Object.entries(c.doors).find(([, dd]) => same(dd.sign, { x, y }))?.[0];
        d.className = `cell cc ${t.walk ? "walk" : "block"}${t.icon ? ` cc-${c.map[y][x]}` : ""}${sign ? " cc-sign" : ""}`;
        if (t.icon || sign) d.innerHTML = Gioco.iconHtml(sign ? SHOP_INFO[sign][1] : t.icon);
        el.map.appendChild(d);
        el.cells[y].push(d);
      }
    }
    const pawn = (cls, icon) => {
      const e = document.createElement("div");
      e.className = `entity ${cls} no-slide`;
      e.innerHTML = Gioco.iconHtml(icon);
      el.map.appendChild(e);
      return e;
    };
    c.playerEl = pawn("e-player", "binoculars");
    for (const n of c.npcs) {
      n.el = pawn(n.event ? "e-npc e-event" : n.carpenter ? "e-npc e-carpenter" : "e-npc", n.carpenter ? "hammer" : "person");
      if (n.event) n.el.dataset.intent = "!";
    }
    Gioco.fitMap();
    requestAnimationFrame(() => el.map.querySelectorAll(".entity").forEach((e) => e.classList.remove("no-slide")));
  }

  const place = (e, p) => { e.style.setProperty("--x", p.x); e.style.setProperty("--y", p.y); };

  function render() {
    place(c.playerEl, c.player);
    for (const n of c.npcs) place(n.el, n);
  }

  // Le caselle dove la gente non si ferma mai: davanti alle porte, alla nave, al falegname
  function inTheWay(p) {
    if (Object.values(c.doors).some((d) => same(d.front, p))) return true;
    if (Math.abs(c.ship.x - p.x) + Math.abs(c.ship.y - p.y) <= 1 || same(c.start, p)) return true;
    return !!c.carpenter && Math.abs(c.carpenter.x - p.x) + Math.abs(c.carpenter.y - p.y) <= 1;
  }

  // La gente fa qualche passo ogni tanto, restando vicino a dove sta; chi ha il punto esclamativo aspetta
  function stroll() {
    if (!c || Gioco.trip.mode !== "city" || !document.body.classList.contains("in-game")) return;
    for (const n of c.npcs) {
      if (n.event || n.carpenter || Math.random() > NPC_MOVE) continue;
      const [dx, dy] = DIRS[Math.floor(Math.random() * 4)];
      const to = { x: n.x + dx, y: n.y + dy };
      if (!inside(to.x, to.y) || !c.walkable.includes(c.map[to.y][to.x]) || inTheWay(to)) continue;
      if (Math.abs(to.x - n.home.x) + Math.abs(to.y - n.home.y) > NPC_RANGE) continue;
      if (same(to, c.player) || c.npcs.some((o) => o !== n && same(o, to))) continue;
      Object.assign(n, to);
      place(n.el, n);
    }
  }

  const doorAt = (p) => Object.entries(c.doors).find(([, d]) => same(d, p))?.[0];

  function tileInfo(p) {
    const shop = doorAt(p) || Object.entries(c.doors).find(([, d]) => same(d.sign, p))?.[0];
    const t = tileAt(p.x, p.y);
    Gioco.el.tileInfo.textContent = shop ? `${shopName(shop)} · entra dalla porta` : t === TILES.ship ? "La tua nave · riparti"
      : c.carpenter && same(c.carpenter, p) ? "Il falegname · parlaci"
      : t === TILES.board ? `${t.name} · leggi gli avvisi`
      : t.talk ? `${t.name} · c'è una nota` : `${t.name} · ${t.walk ? "si passa" : "non si passa"}`;
  }

  // --- Muoversi ---

  function move(dx, dy) {
    const p = c.player, to = { x: p.x + dx, y: p.y + dy };
    if (!inside(to.x, to.y)) return;
    const t = tileAt(to.x, to.y);
    const npc = c.npcs.find((n) => same(n, to));
    if (npc?.event) { meet(npc); return; }
    if (npc?.carpenter) { hint(null); talkCarpenter(); return; }
    // la gente non chiude mai il passaggio: si scansa e prende il tuo posto
    if (npc) {
      if (Math.random() < 0.3) Gioco.toast(["«Permesso!»", "«Attento a dove metti i piedi.»", "«Ehi, marinaio!»"][Math.floor(Math.random() * 3)]);
      if (!c.walkable.includes(c.map[p.y][p.x])) return;
      Object.assign(npc, p);
    }
    if (t.talk) { if (t === TILES.board) readBoard(); else readBarrel(); return; }
    if (!t.walk) return;
    c.prev = { ...p };
    Object.assign(p, to);
    Suoni.play("passoErba");
    tileInfo(to);
    render();
    const shop = doorAt(to);
    if (shop) { hint(null); openShop(shop); return; }
    if (t === TILES.ship) { hint(null); aboard(); return; }
    nearby();
  }

  // --- Il cartellino in basso: davanti a una porta (o accanto al falegname) dice cosa c'è e dove andare ---

  const ARROW = { "1,0": "→", "-1,0": "←", "0,1": "↓", "0,-1": "↑" };
  const way = (from, to) => ARROW[`${to.x - from.x},${to.y - from.y}`];

  function shopLine(kind) {
    const shop = SHOPS[c.city.id][kind];
    if (kind === "medico") return `cura le ferite${shop.extra ? " e dà un cuore in più" : ""} · ${shop.cost} m.o.`;
    if (kind === "emporio") return `semi ${shop.semi} m.o. · pesce in scatola ${shop.cibo} m.o. · tagliole ${shop.tagliola} m.o.`;
    if (kind === "taverna") return `si dorme fino all'alba e si sentono storie · ${shop.cost} m.o.`;
    if (kind === "mercato") return `compra la merce della stiva · ${shop.price} m.o. al pezzo`;
    if (kind === "gendarmeria") return `paga le taglie dei ricercati · ${Gioco.BOUNTY} m.o.`;
    if (kind === "societa") return `premia chi completa una specie · ${SOCIETY_PRIZE} m.o.`;
    return "chiuso";
  }

  function nearby() {
    const p = c.player;
    const front = Object.entries(c.doors).find(([, d]) => same(d.front, p));
    if (front) { const [kind, d] = front; hint(`<b>${shopName(kind)}</b> · ${shopLine(kind)} <kbd>${way(p, d)}</kbd> entra`); return; }
    const board = DIRS.map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy })).find((q) => inside(q.x, q.y) && c.map[q.y][q.x] === "board");
    if (board) { hint(`<b>Bacheca dei ricercati</b> · ${c.poster && !Gioco.trip.wanted ? "c'è un avviso nuovo" : "avvisi vecchi"} <kbd>${way(p, board)}</kbd> leggi`); return; }
    const k = c.carpenter && Math.abs(c.carpenter.x - p.x) + Math.abs(c.carpenter.y - p.y) === 1;
    hint(k ? `<b>Falegname</b> · ripara le barche, ha l'aria di uno che parla volentieri <kbd>${way(p, c.carpenter)}</kbd> parla` : null);
  }

  function hint(html) {
    const el = document.getElementById("city-hint");
    if (!el) return;
    el.hidden = !html;
    if (html) el.innerHTML = html;
  }

  // Si esce dalla bottega tornando in strada, dove eri
  function back() {
    c.open = null;
    c.typing = null;
    Gioco.el.overlay.hidden = true;
    Gioco.el.overlay.classList.remove("is-talk");
    if (c.prev && doorAt(c.player)) Object.assign(c.player, c.prev);
    render();
    nearby();
  }

  // --- Dialoghi: un riquadro con la domanda e le risposte ---

  // Chi parla ha la vocina e le parole compaiono una alla volta; Invio le fa comparire tutte,
  // poi arrivano le risposte. Le descrizioni (barili, porte chiuse, la nave) non hanno voce.
  function dialog(title, text, buttons, { voice = true } = {}) {
    c.open = "dialog";
    const ov = Gioco.el.overlay;
    ov.classList.remove("is-talk");
    ov.innerHTML = `<h3>${title}</h3><p class="talk-text"></p>
      <nav class="menu" hidden>${buttons.filter(Boolean).map(([action, label]) => `<button class="menu-item" data-city-action="${action}">${label}</button>`).join("")}</nav>`;
    ov.hidden = false;
    document.activeElement?.blur();
    const nav = ov.querySelector(".menu");
    type(ov.querySelector(".talk-text"), text, voice, () => {
      nav.hidden = false;
      nav.querySelector(".menu-item").focus();
    });
  }

  // Le parole che compaiono una alla volta; c.typing.finish() le scrive tutte subito
  function type(node, text, voice, done) {
    let i = 0, timer = 0;
    const end = () => { clearTimeout(timer); node.textContent = text; c.typing = null; done(); };
    const tick = () => {
      if (!c || !c.typing) return;
      node.textContent = text.slice(0, ++i);
      if (voice && i % 2 === 0 && text[i - 1] !== " ") Suoni.play("voce");
      if (i < text.length) timer = setTimeout(tick, TYPE_MS);
      else end();
    };
    c.typing = { finish: end, skippable: c.open !== "falegname" };
    tick();
  }

  // L'emporio: un tavolo con la merce sopra (semi, pesce in scatola, tagliole); si sceglie con le frecce.
  // Il pesce in scatola uno alla volta: si porta dietro, ma non deve valere più del medico
  function emporio() {
    const shop = SHOPS[c.city.id].emporio, trip = Gioco.trip, money = trip.money;
    const goods = [["semi", shop.semi], ["cibo", shop.cibo], ["tagliola", shop.tagliola]];
    const full = (kind) => kind === "cibo" && trip.pack.some((it) => it.kind === "cibo");
    dialog("Emporio", "«Guardate pure, è tutto sul tavolo.»", [
      ...goods.map(([kind, price]) => [money >= price && !full(kind) ? `buy:${kind}` : "none",
        `${Gioco.iconHtml(OGGETTI_SPECIALI[kind].icona)} ${OGGETTI_SPECIALI[kind].nome} <small>(${price} m.o.${full(kind) ? ", ne hai già una" : money < price ? ", non ti bastano" : ""})</small>`]),
      ["back", "Esci"],
    ]);
    Gioco.el.overlay.querySelector(".menu").classList.add("shop-table");
  }

  function buy(kind) {
    const trip = Gioco.trip, price = SHOPS[c.city.id].emporio[kind];
    trip.money -= price;
    Gioco.pay(`emporio: ${OGGETTI_SPECIALI[kind].nome.toLowerCase()}`, price);
    trip.pack.push({ kind });
    Suoni.play("monete");
    Gioco.renderStatus();
    const use = { semi: "A terra si spargono con E dove un uccello è volato via.", cibo: "A terra si mangia con M: due cuori.", tagliola: "A terra si posa con T." }[kind];
    Gioco.toast(`${OGGETTI_SPECIALI[kind].nome}: nello zaino. ${use}`);
    emporio();
  }

  // La bacheca dei ricercati: l'avviso in corso, oppure uno nuovo da accettare
  function readBoard() {
    const trip = Gioco.trip, w = trip.wanted;
    const zoneName = (id) => trip.world.zones[id].name;
    if (w && w.state === "caught") {
      dialog("La bacheca", `Il tuo avviso è ancora appeso: ${w.name}. Ce l'hai in stiva: portalo alla gendarmeria del Forte.`, [["back", "Va bene"]], { voice: false });
    } else if (w) {
      const left = Math.max(1, Math.ceil((w.until - trip.third) / 3));
      dialog("La bacheca", `Il tuo avviso: ${w.name}, che ${w.crime}. Si nasconde a ${zoneName(w.zone)} (la W sul globo). Ancora ${left} giorn${left === 1 ? "o" : "i"}.`, [["back", "Va bene"]], { voice: false });
    } else if (c.poster) {
      const pz = c.poster;
      dialog("La bacheca", `RICERCATO: ${pz.name}, che ${pz.crime}. Lo hanno visto a ${zoneName(pz.zone)}: dove sale il fumo del suo fuoco. Taglia di ${Gioco.BOUNTY} m.o., da riscuotere alla gendarmeria del Forte. Avete ${Gioco.WANTED_DAYS} giorni.`, [
        ["wanted", "Stacca l'avviso e accetta"],
        ["back", "Lascia stare"],
      ], { voice: false });
    } else {
      dialog("La bacheca", "Avvisi vecchi e strappati. Niente di nuovo: torna fra qualche giorno.", [["back", "Lascia stare"]], { voice: false });
    }
  }

  function acceptWanted() {
    Gioco.acceptWanted(c.poster);
    c.poster = null;
    Suoni.play("pagina");
    Gioco.toast("L'avviso è nel diario. Sul globo, una W rossa.");
    back();
  }

  // La gendarmeria: chi ha preso il ricercato riscuote la taglia
  function gendarmeria() {
    const trip = Gioco.trip, w = trip.wanted;
    if (w && w.state === "caught") {
      trip.wanted = null;
      const jailed = (trip.captured || []).find((p) => p.name === w.name && !p.delivered);
      if (jailed) jailed.delivered = true;
      Gioco.bountyState(w.name, "delivered");
      Gioco.earn(`taglia: ${w.name}`, Gioco.BOUNTY);
      Suoni.play("monete");
      Gioco.renderStatus();
      dialog("Gendarmeria", `«Ah, ${w.name}! Finalmente. Ecco la taglia: ${Gioco.BOUNTY} m.o.»`, [["back", "Esci"]]);
    } else if (w) {
      dialog("Gendarmeria", `«${w.name} è ancora libero. Si nasconde a ${trip.world.zones[w.zone].name}: sbrigatevi.»`, [["back", "Esci"]]);
    } else {
      dialog("Gendarmeria", "«Nessuno da consegnare? Guardate la bacheca sulla banchina: c'è sempre qualcuno da prendere.»", [["back", "Esci"]]);
    }
  }

  // La Società ornitologica: un premio per ogni specie di cui hai visto tutti gli uccelli comuni
  function societa() {
    const trip = Gioco.trip;
    // la lettera: il taccuino è completo, la Società consegna l'attestato e il viaggio finisce
    if (trip.letter) {
      dialog("Società ornitologica", `«${trip.explorer}! Vi aspettavamo. Il vostro taccuino è completo: ogni uccello dell'arcipelago, disegnato e annotato. La Società vi nomina Ornitologo esperto.» Il presidente ti consegna l'attestato, con il sigillo di ceralacca.`, [["expert", "Ricevi l'attestato"]]);
      return;
    }
    trip.society ||= [];
    const done = Object.keys(SPECIE).filter((sp) => !trip.society.includes(sp)
      && UCCELLI.filter((u) => u.specie === sp && !u.rara && !u.uovo).every((u) => trip.birds[u.id]?.level === "visto"));
    if (done.length) {
      trip.society.push(...done);
      const names = done.map((sp) => SPECIE[sp].nome).join(", ");
      Gioco.earn(`premio Società: ${names}`, done.length * SOCIETY_PRIZE);
      Suoni.play("monete");
      Gioco.renderStatus();
      dialog("Società ornitologica", `«Magnifico! ${names}: tutti nel vostro taccuino. La Società vi riconosce ${done.length * SOCIETY_PRIZE} m.o.»`, [["back", "Esci"]]);
    } else {
      dialog("Società ornitologica", `«Completate una specie, cioè tutti i suoi uccelli comuni, e la Società vi darà ${SOCIETY_PRIZE} m.o. Il taccuino dice dove cercarli.»`, [["back", "Esci"]]);
    }
  }

  function readBarrel() {
    dialog("Un barile", "Sul barile c'è una nota attaccata con un chiodo. Vuoi leggerla?", [["grog", "Leggi la nota"], ["back", "Lascia stare"]], { voice: false });
  }

  // Il punto esclamativo: o ti rapina, o ti mette in mano qualcosa di strano
  function meet(npc) {
    const trip = Gioco.trip;
    npc.event = false;
    npc.el.classList.remove("e-event");
    delete npc.el.dataset.intent;
    // ogni oggetto magico lo regala una volta sola a partita; finiti quelli, resta solo la rapina
    trip.gifts ||= trip.pack.map((it) => it.kind);
    const left = OGGETTI_SPECIALI_IDS.filter((k) => !trip.gifts.includes(k));
    if (!left.length && trip.money <= 0) {
      dialog("Uno sconosciuto", "Ti squadra dalla testa ai piedi, vede le tasche vuote e se ne va.", [["back", "Meglio così"]]);
    } else if (!left.length || (Math.random() < 0.5 && trip.money > 0)) {
      const lost = Math.min(trip.money, ROB[0] + Math.floor(Math.random() * (ROB[1] - ROB[0] + 1)));
      trip.money -= lost;
      Gioco.pay("rapina", lost);
      Gioco.renderStatus();
      dialog("Uno sconosciuto", `Ti si avvicina sorridendo, ti dà una pacca sulla spalla e sparisce tra la folla. Ti manca qualcosa: −${lost} m.o.`, [["back", "Accidenti"]]);
    } else {
      const kind = left[Math.floor(Math.random() * left.length)];
      trip.gifts.push(kind);
      trip.pack.push({ kind, day: Gioco.day() });
      // la lettera ha l'indirizzo: la torre si segna sul globo, con un cuore rosa
      const tower = kind === "lettera" && trip.world.zones.find((z) => z.tags.has("torre"));
      if (tower) {
        trip.towerKnown = true;
        trip.rumors.unshift({ msg: `Sulla lettera sigillata c'è scritto: «Alla dama della torre, ${tower.name}». Segnata sul globo con un cuore rosa.`, day: Gioco.day(), time: Gioco.now() });
      }
      dialog("Uno sconosciuto", `«Tenete, a me non serve più.» Ti mette in mano ${OGGETTI_SPECIALI[kind].nome.toLowerCase()} e se ne va. Finisce nello zaino.${tower ? ` Sopra c'è un indirizzo: la torre di ${tower.name}.` : ""}`, [["back", "Grazie…?"]]);
    }
  }

  function openShop(kind) {
    const trip = Gioco.trip, shop = SHOPS[c.city.id][kind], money = trip.money;
    if (kind === "medico") {
      const healed = trip.hp >= healCap(shop);
      const extra = shop.extra ? " e un cuore in più" : "";
      dialog("Medico", healed ? "«Siete sano come un pesce. Tornate quando sanguinate.»"
        : `«Volete curarvi le ferite${extra}? ${shop.cost} m.o.»`, [
        !healed && money >= shop.cost && ["heal", `Sì, curami (−${shop.cost} m.o.)`],
        !healed && money < shop.cost && ["none", "Non ho abbastanza monete"],
        ["back", "Esci"],
      ]);
    } else if (kind === "taverna") {
      dialog(shopName("taverna"), `«Una notte in locanda? ${shop.cost} m.o. Si dorme fino all'alba, e qualcuno al bancone parla sempre troppo.»`, [
        money >= shop.cost && ["sleep", `Sì, una notte (−${shop.cost} m.o.)`],
        money < shop.cost && ["none", "Non ho abbastanza monete"],
        ["back", "Esci"],
      ]);
    } else if (kind === "mercato") {
      const hold = trip.hold;
      const buys = (it) => !shop.refuse.includes(OGGETTI[it.kind].cat);
      const items = hold.map((it, i) => buys(it)
        ? [`sell:${i}`, `${OGGETTI[it.kind].nome} <small>(+${shop.price} m.o.)</small>`]
        : ["none", `${OGGETTI[it.kind].nome} <small>(non gli interessa)</small>`]);
      const sellable = hold.filter(buys).length;
      dialog("Mercato", hold.length ? `«Volete vendere la vostra merce? ${shop.price} m.o. al pezzo.»${shop.refuse.length ? " «L'arte la lasciamo alla città.»" : ""}`
        : "«Non avete niente da vendere, mi pare.»", [
        sellable > 1 && ["sellall", `Vendi tutto (+${sellable * shop.price} m.o.)`],
        ...items,
        ["back", "Esci"],
      ]);
    } else if (kind === "gendarmeria") {
      gendarmeria();
    } else if (kind === "societa") {
      societa();
    } else {
      emporio();
    }
  }

  // --- Il falegname: una battuta alla volta, e lui risponde con la sua vocina ---

  function talkCarpenter() {
    c.open = "falegname";
    c.talk = { step: 0, typing: false };
    const ov = Gioco.el.overlay;
    ov.innerHTML = `<h3>Falegname</h3><div class="talk-log"></div><nav class="menu talk-choice"></nav>`;
    ov.classList.add("is-talk");
    document.activeElement?.blur();
    ov.hidden = false;
    nextLine();
  }

  function nextLine() {
    const ov = Gioco.el.overlay;
    const choice = ov.querySelector(".talk-choice");
    const line = RODITORE[c.talk.step];
    if (!line) {
      choice.innerHTML = '<button class="menu-item" data-city-action="back">Esci</button>';
      choice.querySelector("button").focus();
      return;
    }
    if (line[0] === "io") {
      // l'unica battuta possibile, da scegliere come in ogni dialogo
      choice.innerHTML = `<button class="menu-item" data-city-action="say">${line[1]}</button>`;
      choice.querySelector("button").focus();
    } else {
      choice.innerHTML = "";
      say("Falegname", line[1], true);
    }
  }

  function say(who, text, typed) {
    const log = Gioco.el.overlay.querySelector(".talk-log");
    const p = document.createElement("p");
    p.innerHTML = `<b>${who}:</b> <span></span>`;
    log.appendChild(p);
    const span = p.querySelector("span");
    c.talk.step++;
    if (!typed) { span.textContent = text; log.scrollTop = log.scrollHeight; nextLine(); return; }
    c.talk.typing = true;
    type(span, text, true, () => { c.talk.typing = false; log.scrollTop = log.scrollHeight; nextLine(); });
  }

  // --- Le azioni delle botteghe ---

  function heal() {
    const trip = Gioco.trip, shop = SHOPS[c.city.id].medico;
    trip.money -= shop.cost;
    trip.hp = Math.max(trip.hp, healCap(shop));
    Gioco.pay("medico", shop.cost);
    Suoni.play("monete");
    Gioco.toast(shop.extra ? "Ferite curate, e ti senti più forte del solito." : "Ferite curate.");
    Gioco.renderStatus();
    back();
  }

  // Dormire in taverna: si arriva all'alba (la ciurma si paga) e forse si sente una voce
  function sleep() {
    const trip = Gioco.trip, shop = SHOPS[c.city.id].taverna;
    trip.money -= shop.cost;
    Gioco.pay("taverna", shop.cost);
    Suoni.play("monete");
    const hours = 3 - (trip.third % 3);
    back();
    if (!Gioco.advance(hours)) return;
    const heard = Gioco.rumor(c.city.id);
    // una volta per viaggio, il marinaio coi quattro occhi
    const odd = !trip.fourEyes && (!heard || Math.random() < 0.4);
    if (odd) {
      trip.fourEyes = true;
      trip.rumors.unshift({ msg: "Un marinaio che sembra avere quattro occhi giura che certi uccelli si spostano appena smetti di guardarli. «Per questo è così difficile osservarli.»", day: Gioco.day(), time: Gioco.now() });
    }
    Gioco.toast(heard ? "Al bancone, una storia che vale oro. È nel diario." : odd ? "Al bancone, un marinaio strano racconta una storia strana. È nel diario." : "Dormi bene. Nessuno ha storie nuove da raccontare.");
    drawPostcard();
    Gioco.renderStatus();
    Gioco.save();
  }

  function sell(indexes) {
    const trip = Gioco.trip, shop = SHOPS[c.city.id].mercato;
    const sold = indexes.sort((a, b) => b - a).map((i) => trip.hold.splice(i, 1)[0]);
    Gioco.earn(`mercato: ${sold.length} oggett${sold.length === 1 ? "o" : "i"}`, sold.length * shop.price);
    Suoni.play("monete");
    Gioco.toast(`Venduto: ${sold.map((it) => OGGETTI[it.kind].nome).join(", ")}. +${sold.length * shop.price} m.o.`);
    Gioco.renderStatus();
    openShop("mercato");
  }

  function aboard() {
    dialog("La tua nave", `Giorno ${Gioco.day()}, ${Gioco.now()} · ${Gioco.trip.money} m.o.`, [
      ["sail", `Riparti <small>(due momenti: sarà ${Gioco.timeOf(Gioco.trip.third + 2)})</small>`],
      ["back", "Resta in città"],
    ], { voice: false });
  }

  // --- Comandi ---

  const MOVES = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  };

  document.addEventListener("keydown", (e) => {
    if (!c || Gioco.trip?.mode !== "city" || c.open || Diario.isOpen() || !document.body.classList.contains("in-game")) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!MOVES[k]) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    move(...MOVES[k]);
  });

  // Mentre qualcuno parla, Invio (o spazio) fa comparire subito tutte le parole; col falegname
  // invece non si scappa: niente Esc, niente diario, e le sue parole non si saltano
  window.addEventListener("keydown", (e) => {
    if (!c || !c.open) return;
    const block = ["Enter", " ", "Escape", "Tab"];
    if (c.typing && block.includes(e.key)) {
      if ((e.key === "Enter" || e.key === " ") && c.typing.skippable) c.typing.finish();
      if (e.key !== "Escape" || c.open === "falegname") { e.preventDefault(); e.stopImmediatePropagation(); }
      return;
    }
    if (c.open === "falegname" && (e.key === "Escape" || e.key === "Tab")) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  document.addEventListener("click", (e) => {
    const action = e.target.closest("[data-city-action]")?.dataset.cityAction;
    if (!action || !c) return;
    if (action === "back") back();
    else if (action === "heal") heal();
    else if (action === "sleep") sleep();
    else if (action === "wanted") acceptWanted();
    else if (action.startsWith("buy:")) buy(action.slice(4));
    else if (action === "grog") dialog("La nota sul barile", GROG, [["back", "Rimetti a posto la nota"]], { voice: false });
    else if (action === "say" && !c.talk.typing) say(Gioco.trip.explorer, RODITORE[c.talk.step][1], false);
    else if (action === "sellall") {
      const refuse = SHOPS[c.city.id].mercato.refuse;
      sell(Gioco.trip.hold.map((it, i) => (refuse.includes(OGGETTI[it.kind].cat) ? -1 : i)).filter((i) => i >= 0));
    } else if (action.startsWith("sell:")) sell([+action.slice(5)]);
    else if (action === "sail") { leave(); Gioco.depart(); }
    else if (action === "expert") { back(); leave(); Gioco.victory(); }
  });

  document.addEventListener("mouseover", (e) => {
    const cell = e.target.closest("#map > div.cell");
    if (cell && c && Gioco.trip?.mode === "city") tileInfo({ x: +cell.dataset.x, y: +cell.dataset.y });
  });

  function statusRows() {
    const hold = Gioco.trip.hold.length + (Gioco.trip.wanted?.state === "caught" ? 1 : 0);
    return `<div>${Gioco.iconHtml("anchor")}<span>In porto</span><b>${c ? c.city.name : ""}</b></div>
      <div>${Gioco.iconHtml("crate")}<span>Stiva</span><b>${hold ? `${hold} oggett${hold === 1 ? "o" : "i"}` : "vuota"}</b></div>`;
  }

  return { enter, leave, statusRows, redraw: () => c && drawPostcard() };
})();
