// Il castello abbandonato: dentro, una battlemap a parte. Stanze sparse nella pietra, legate da corridoi
// con qualche vicolo cieco; le stanze sono buie finché non ci entri. In alcune stanze mostri (pipistrelli e
// fantasmi) che rimbalzano da un muro all'altro senza uscire mai; qua e là monete e cose da vendere; una
// chiave d'ottone apre la sala del trono, e un muro che cede nasconde la stanza del tesoro. Nella sala del
// trono, addobbata a nozze, una dama aspetta lo sposo. Qui anche la festa delle nozze, in pixel art.
// Espone l'oggetto globale `Castello`.
const Castello = (() => {
  const W = 40;
  const H = 24;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const key = (c) => `${c.x},${c.y}`;
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

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

  // Il castello è sempre lo stesso nello stesso viaggio: nasce dal seed della zona
  function generate(seed) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const plan = tryGenerate(rng(seed ^ 0xca57e1 ^ (attempt * 7919)));
      if (plan) return plan;
    }
    return null;
  }

  function tryGenerate(r) {
    const map = Array.from({ length: H }, () => Array(W).fill("cwall"));
    const pick = (arr) => arr[Math.floor(r() * arr.length)];
    // le stanze: rettangoli di pavimento con almeno un muro intorno e fra l'una e l'altra
    const rooms = [];
    const room = (x, y, w, h, kind) => {
      const cells = [];
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) cells.push({ x: xx, y: yy });
      const rm = { x, y, w, h, kind, cells, keys: new Set(cells.map(key)), cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) };
      rooms.push(rm);
      return rm;
    };
    const free = (x, y, w, h) => x >= 1 && y >= 1 && x + w <= W - 1 && y + h <= H - 1
      && rooms.every((o) => x + w + 1 < o.x || o.x + o.w + 1 < x || y + h + 1 < o.y || o.y + o.h + 1 < y);
    // l'atrio, in basso al centro, con la porta per uscire
    const hall = room(16, 18, 7, 4, "hall");
    const exit = { x: 19, y: H - 1 };
    // la sala del trono, grande, il più lontano possibile dall'atrio: in alto, a un lato
    const tw = 10, th = 6, tx = r() < 0.5 ? 2 + Math.floor(r() * 4) : W - tw - 2 - Math.floor(r() * 4);
    const throne = room(tx, 1, tw, th, "throne");
    // la stanza del tesoro, piccola, nascosta dietro un muro che cede
    let secret = null;
    for (let i = 0; i < 200 && !secret; i++) {
      const w = 4, h = 3, x = 1 + Math.floor(r() * (W - w - 2)), y = 1 + Math.floor(r() * (H - h - 2));
      if (free(x, y, w, h)) secret = room(x, y, w, h, "secret");
    }
    if (!secret) return null;
    for (let i = 0; i < 600 && rooms.length < 12; i++) {
      const w = 4 + Math.floor(r() * 5), h = 3 + Math.floor(r() * 3);
      const x = 1 + Math.floor(r() * (W - w - 2)), y = 1 + Math.floor(r() * (H - h - 2));
      if (free(x, y, w, h)) room(x, y, w, h, "room");
    }
    const normal = rooms.filter((rm) => rm.kind === "room" || rm.kind === "hall");
    if (normal.length < 7) return null;
    for (const rm of rooms) for (const c of rm.cells) map[c.y][c.x] = rm.kind === "throne" ? "carpet" : "rfloor";
    map[exit.y][exit.x] = "exit";
    map[exit.y - 1][exit.x] = "cfloor";

    // i corridoi: la via più corta nella pietra, senza toccare la sala del trono e la stanza del tesoro
    const ring = (rm) => { const s = new Set(); for (let y = rm.y - 1; y <= rm.y + rm.h; y++) for (let x = rm.x - 1; x <= rm.x + rm.w; x++) s.add(`${x},${y}`); return s; };
    const closed = new Set([...ring(throne), ...ring(secret)]);
    const dig = (from, to, allowed) => {
      const prev = new Map([[key(from), null]]);
      const queue = [from];
      while (queue.length) {
        const c = queue.shift();
        if (c.x === to.x && c.y === to.y) break;
        for (const [dx, dy] of DIRS.slice().sort(() => r() - 0.5)) {
          const n = { x: c.x + dx, y: c.y + dy };
          if (n.x < 1 || n.y < 1 || n.x > W - 2 || n.y > H - 2 || prev.has(key(n)) || !allowed(n)) continue;
          prev.set(key(n), c);
          queue.push(n);
        }
      }
      if (!prev.has(key(to))) return null;
      const path = [];
      for (let c = to; c; c = prev.get(key(c))) path.unshift(c);
      return path;
    };
    // un albero di corridoi fra le stanze normali, dall'atrio verso le più vicine, più un paio di anelli
    const linked = [hall];
    const rest = normal.filter((rm) => rm !== hall);
    while (rest.length) {
      let best = null;
      for (const a of linked) for (const b of rest) {
        const d = Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);
        if (!best || d < best.d) best = { a, b, d };
      }
      const path = dig({ x: best.a.cx, y: best.a.cy }, { x: best.b.cx, y: best.b.cy }, (n) => !closed.has(key(n)));
      if (!path) return null;
      for (const c of path) if (map[c.y][c.x] === "cwall") map[c.y][c.x] = "cfloor";
      linked.push(best.b);
      rest.splice(rest.indexOf(best.b), 1);
    }
    for (let i = 0; i < 2; i++) {
      const a = pick(normal), b = pick(normal);
      const path = a !== b && dig({ x: a.cx, y: a.cy }, { x: b.cx, y: b.cy }, (n) => !closed.has(key(n)));
      if (path) for (const c of path) if (map[c.y][c.x] === "cwall") map[c.y][c.x] = "cfloor";
    }
    // i vicoli ciechi: un po' di labirinto
    const corridor = () => { const cs = []; for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (map[y][x] === "cfloor") cs.push({ x, y }); return cs; };
    for (let i = 0; i < 7; i++) {
      let c = pick(corridor());
      const [dx, dy] = pick(DIRS);
      for (let k = 0, len = 3 + Math.floor(r() * 6); k < len; k++) {
        const n = { x: c.x + dx, y: c.y + dy };
        if (n.x < 1 || n.y < 1 || n.x > W - 2 || n.y > H - 2 || map[n.y][n.x] !== "cwall" || closed.has(key(n))) break;
        // un vicolo non deve aprire un'altra stanza o toccare un altro corridoio di fianco
        if (DIRS.some(([ax, ay]) => (ax !== -dx || ay !== -dy) && inside(n.x + ax, n.y + ay) && map[n.y + ay][n.x + ax] !== "cwall")) break;
        map[n.y][n.x] = "cfloor";
        c = n;
      }
    }
    // la sala del trono: un corridoio dalla stanza più vicina, chiuso da una porta a chiave
    const toDoor = (target, tile) => {
      const near = normal.slice().sort((a, b) => (Math.abs(a.cx - target.cx) + Math.abs(a.cy - target.cy)) - (Math.abs(b.cx - target.cx) + Math.abs(b.cy - target.cy)))[0];
      const mine = ring(target);
      const others = new Set([...closed].filter((k) => !mine.has(k)));
      const path = dig({ x: near.cx, y: near.cy }, { x: target.cx, y: target.cy }, (n) => !others.has(key(n)));
      if (!path) return null;
      const door = path.find((c) => mine.has(key(c)) && !target.keys.has(key(c)));
      for (const c of path) if (map[c.y][c.x] === "cwall" && !mine.has(key(c))) map[c.y][c.x] = "cfloor";
      map[door.y][door.x] = tile;
      return door;
    };
    const lock = toDoor(throne, "ldoor");
    const crack = toDoor(secret, "swall");
    if (!lock || !crack) return null;

    // la sala del trono addobbata a nozze: il tappeto rosso, le rose lungo i muri, il trono in fondo, lei accanto
    const seat = { x: throne.cx, y: throne.y };
    map[seat.y][seat.x] = "throne";
    const lady = { x: seat.x + 1, y: seat.y };
    for (const c of throne.cells) {
      const edge = c.x === throne.x || c.x === throne.x + throne.w - 1 || c.y === throne.y + throne.h - 1;
      if (edge && (c.x + c.y) % 2 === 0 && Math.abs(c.x - lock.x) + Math.abs(c.y - lock.y) > 2) map[c.y][c.x] = "rose";
    }
    for (let y = seat.y + 1; y < throne.y + throne.h; y++) if (map[y][seat.x] === "carpet") map[y][seat.x] = "carpet";

    // dentro le stanze: mostri, monete, una cosa da vendere, la chiave; il tesoro dietro il muro che cede
    const spots = (rm) => rm.cells.filter((c) => map[c.y][c.x] === "rfloor").sort(() => r() - 0.5);
    const loot = [];
    const monsters = [];
    const plain = normal.filter((rm) => rm !== hall).sort(() => r() - 0.5);
    const keyRoom = plain[0];
    const brass = spots(keyRoom)[0];
    loot.push({ ...brass, kind: "key" });
    plain.slice(1, 4).forEach((rm, i) => { const c = spots(rm)[0]; loot.push(i === 2 ? { ...c, kind: "relic" } : { ...c, kind: "coins", amount: 4 + Math.floor(r() * 6) }); });
    const treasure = spots(secret)[0];
    loot.push({ ...treasure, kind: "coins", amount: 20 + Math.floor(r() * 6) });
    // i mostri: in quattro stanze, mai nell'atrio; uno o due, in diagonale
    plain.slice(0, 5).forEach((rm, i) => {
      if (i === 0 && r() < 0.5) return;
      const n = rm.w * rm.h > 20 ? 2 : 1;
      for (const c of spots(rm).filter((c) => !loot.some((l) => l.x === c.x && l.y === c.y)).slice(0, n)) {
        monsters.push({ x: c.x, y: c.y, kind: r() < 0.5 ? "bat" : "ghost", dx: r() < 0.5 ? 1 : -1, dy: r() < 0.5 ? 1 : -1, room: rooms.indexOf(rm) });
      }
    });
    return {
      map, exit, start: { x: exit.x, y: exit.y - 1 }, lady, seat, lock, crack, loot, monsters,
      rooms: rooms.map((rm) => ({ kind: rm.kind, keys: rm.keys })),
    };
  }

  // --- La festa delle nozze: una tavolata in pixel art, gli invitati, i boccali, i coriandoli ---

  function banquet(canvas, beat) {
    const w = 160, h = 90;
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext("2d");
    const r = rng(77 + beat * 13);
    const px = (x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
    const rect = (x, y, rw, rh, col) => { g.fillStyle = col; g.fillRect(x, y, rw, rh); };
    // la sala: muri di pietra, le finestre, gli stendardi, il pavimento
    rect(0, 0, w, h, "#2a2430");
    for (let y = 0; y < 52; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < w; x += 8) rect(x, y, 7, 3, "#363040");
    for (const x of [20, 70, 120]) { rect(x, 8, 14, 20, "#1a2a48"); rect(x + 6, 8, 2, 20, "#2a2430"); rect(x, 17, 14, 2, "#2a2430"); px(x + 3, 11, "#f2f0d8"); }
    for (const x of [45, 95, 145]) { rect(x, 4, 8, 18, "#9a1e24"); px(x + 3, 9, "#f2c230"); px(x + 4, 9, "#f2c230"); px(x + 3, 10, "#f2c230"); px(x + 4, 10, "#f2c230"); }
    rect(0, 52, w, h - 52, "#4a3626");
    for (let x = 0; x < w; x += 6) rect(x, 52, 1, h - 52, "#3a2a1c");
    // la tavolata, con la tovaglia bianca
    rect(10, 56, 140, 6, "#f0ead8");
    rect(10, 62, 140, 3, "#c8c0a8");
    rect(12, 65, 3, 14, "#3a2614"); rect(145, 65, 3, 14, "#3a2614");
    // gli invitati dietro la tavola: teste, cappelli, vestiti di tutti i colori
    const coats = ["#c84a3a", "#3a6ac8", "#4a9a4a", "#c8a03a", "#8a4ac8", "#e8e0d0", "#3a3a3a"];
    for (let i = 0; i < 12; i++) {
      const x = 16 + i * 11 + Math.floor(r() * 3), sway = (beat + i) % 2;
      rect(x, 46 + sway, 7, 10, coats[i % coats.length]);
      rect(x + 1, 40 + sway, 5, 5, ["#f0c8a0", "#c8906a", "#8a5a3a"][i % 3]);
      if (i % 3 === 0) rect(x, 38 + sway, 7, 2, "#2a1a10");
      if ((i + beat) % 3 === 0) { rect(x + 6, 36 + sway, 2, 4, "#f2c230"); px(x + 6, 35 + sway, "#fff6d0"); }   // il boccale alzato: cin cin!
    }
    // in fondo alla tavola, gli invitati del labirinto: l'unicorno (col corno d'oro) e il mostro gentile (con le corna)
    rect(2, 44, 9, 12, "#f4f0ff"); rect(3, 37, 7, 7, "#f4f0ff"); rect(9, 33, 1, 4, "#f2c230"); rect(3, 37, 2, 6, "#c8a0f0");
    rect(148, 42, 10, 14, "#8a5a3a"); rect(149, 35, 8, 7, "#8a5a3a"); px(148, 34, "#e8e0c8"); px(147, 33, "#e8e0c8"); px(157, 34, "#e8e0c8"); px(158, 33, "#e8e0c8");
    rect(150, 38, 1, 1, "#000"); rect(155, 38, 1, 1, "#000");
    // gli sposi al centro, lei in bianco col velo, tu col cappello da esploratore
    rect(74, 44, 8, 12, "#f4f0e8"); rect(75, 38, 6, 6, "#f0c8a0"); rect(73, 36, 10, 3, "#e8e8f0");
    rect(84, 44, 8, 12, "#2a3a5a"); rect(85, 38, 6, 6, "#f0c8a0"); rect(83, 36, 10, 2, "#6a4a2a");
    // sulla tavola: boccali di birra, calici di vino, la torta, un cosciotto
    for (let x = 18; x < 146; x += 9) {
      if ((x + beat) % 2) { rect(x, 52, 3, 4, "#f2c230"); rect(x, 51, 3, 1, "#fff6d0"); } else { rect(x, 52, 2, 3, "#8a1e2a"); px(x, 55, "#c8c0b0"); }
    }
    rect(76, 48, 12, 8, "#f8f0e0"); rect(78, 44, 8, 4, "#f8f0e0"); px(82, 43, "#c8302a");
    // i coriandoli
    for (let i = 0; i < 60; i++) px(r() * w, r() * 50, ["#f2c230", "#e85a8a", "#5ac8e8", "#8ae85a", "#fff"][i % 5]);
  }

  return { generate, banquet, W, H };
})();
