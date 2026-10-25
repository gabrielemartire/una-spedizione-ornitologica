// Il castello abbandonato: dentro, una battlemap a parte. Un labirinto di cunicoli nella pietra, con stanze
// incastonate e porte nel muro; è tutto buio finché non ci passi. In alcune stanze mostri (pipistrelli e
// fantasmi) che rimbalzano da un muro all'altro senza uscire mai; qua e là monete e cose da vendere; una
// chiave d'ottone apre la sala del trono, e un muro che cede nasconde la stanza del tesoro. Nella sala del
// trono, addobbata a nozze, una dama aspetta lo sposo. L'atrio con le armature, la biblioteca, due mobili in
// ogni stanza; nei cunicoli qualche lastra che cede. Qui anche la festa delle nozze, in pixel art.
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

  // La pianta: le stanze incastonate in un labirinto di cunicoli larghi una casella (caselle dispari), con
  // anelli e vicoli ciechi; nelle stanze si entra da porte nel muro. La sala del trono ha una porta chiusa a
  // chiave, la stanza del tesoro un muro che cede
  function tryGenerate(r) {
    const map = Array.from({ length: H }, () => Array(W).fill("cwall"));
    const pick = (arr) => arr[Math.floor(r() * arr.length)];
    const odd = (n) => n % 2 === 1;
    // le stanze: interni con lati dispari che partono da caselle dispari, così i muri cadono sulla griglia del labirinto
    const rooms = [];
    const room = (x, y, w, h, kind) => {
      const cells = [];
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) cells.push({ x: xx, y: yy });
      const rm = { x, y, w, h, kind, cells, keys: new Set(cells.map(key)), cx: x + (w - 1) / 2, cy: y + (h - 1) / 2 };
      rooms.push(rm);
      return rm;
    };
    const fits = (x, y, w, h) => x >= 1 && y >= 1 && x + w <= W - 1 && y + h <= H - 1
      && rooms.every((o) => x + w + 1 < o.x || o.x + o.w + 1 < x || y + h + 1 < o.y || o.y + o.h + 1 < y);
    const place = (w, h, kind, where = () => [1 + 2 * Math.floor(r() * ((W - w - 1) / 2)), 1 + 2 * Math.floor(r() * ((H - h - 1) / 2))]) => {
      for (let i = 0; i < 300; i++) { const [x, y] = where(); if (odd(x) && odd(y) && fits(x, y, w, h)) return room(x, y, w, h, kind); }
      return null;
    };
    // l'atrio in basso al centro, col portone; la sala del trono in alto; la stanza del tesoro piccola e la
    // biblioteca, ovunque
    const hall = room(15, 17, 9, 5, "hall");
    const exit = { x: 19, y: H - 1 };
    // la sala del trono è una navata: più lunga che larga
    const throne = place(7, 11, "throne", () => [r() < 0.5 ? 1 + 2 * Math.floor(r() * 3) : W - 9 - 2 * Math.floor(r() * 3), 1]);
    const secret = place(3, 3, "secret");
    const library = place(7, 3, "library");
    if (!throne || !secret || !library) return null;
    for (let i = 0; i < 9; i++) place(pick([3, 5, 5, 7]), pick([3, 3, 5]), "room");
    const normal = rooms.filter((rm) => rm.kind === "room" || rm.kind === "hall");
    if (normal.length < 6) return null;
    for (const rm of rooms) for (const c of rm.cells) map[c.y][c.x] = "rfloor";
    // il labirinto: su tutte le caselle dispari fuori dalle stanze e dai loro muri
    const blocked = new Set();
    for (const rm of rooms) for (let y = rm.y - 1; y <= rm.y + rm.h; y++) for (let x = rm.x - 1; x <= rm.x + rm.w; x++) blocked.add(`${x},${y}`);
    const nodes = [];
    for (let y = 1; y < H - 1; y += 2) for (let x = 1; x < W - 1; x += 2) if (!blocked.has(`${x},${y}`)) nodes.push({ x, y });
    const seen = new Set();
    for (const startNode of nodes.slice().sort(() => r() - 0.5)) {
      if (seen.has(key(startNode))) continue;
      const stack = [startNode];
      seen.add(key(startNode));
      map[startNode.y][startNode.x] = "cfloor";
      while (stack.length) {
        const c = stack[stack.length - 1];
        const next = DIRS.map(([dx, dy]) => ({ x: c.x + 2 * dx, y: c.y + 2 * dy, wx: c.x + dx, wy: c.y + dy }))
          .filter((n) => n.x >= 1 && n.y >= 1 && n.x < W - 1 && n.y < H - 1 && !blocked.has(key(n)) && !seen.has(key(n)));
        if (!next.length) { stack.pop(); continue; }
        const n = pick(next);
        map[n.wy][n.wx] = "cfloor";
        map[n.y][n.x] = "cfloor";
        seen.add(key(n));
        stack.push({ x: n.x, y: n.y });
      }
    }
    // anelli: qualche muro in meno tra due cunicoli
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (map[y][x] !== "cwall" || blocked.has(`${x},${y}`) || r() > 0.1) continue;
      const h = map[y][x - 1] === "cfloor" && map[y][x + 1] === "cfloor", v = map[y - 1]?.[x] === "cfloor" && map[y + 1]?.[x] === "cfloor";
      if (h !== v) map[y][x] = "cfloor";
    }
    // le porte: caselle del muro di una stanza che danno su un cunicolo
    const doorsOf = (rm) => {
      const out = [];
      for (const c of rm.cells) for (const [dx, dy] of DIRS) {
        const d = { x: c.x + dx, y: c.y + dy }, o = { x: c.x + 2 * dx, y: c.y + 2 * dy };
        if (!rm.keys.has(key(d)) && map[o.y]?.[o.x] === "cfloor" && map[d.y][d.x] === "cwall") out.push({ ...d, out: o });
      }
      return out.sort(() => r() - 0.5);
    };
    const doors = {};
    // la sala del trono è una chiesa: la porta in fondo, al centro, sotto la navata
    const aisle = throne.x + 3;
    const nave = { x: aisle, y: throne.y + throne.h, out: { x: aisle, y: throne.y + throne.h + 1 } };
    if (map[nave.out.y][nave.out.x] !== "cfloor") return null;
    for (const rm of rooms) {
      if (rm.kind === "hall") continue;
      const cand = rm === throne ? [nave] : doorsOf(rm);
      if (!cand.length) return null;
      const n = rm.kind === "room" ? 1 + (r() < 0.5 ? 1 : 0) : 1;
      doors[rooms.indexOf(rm)] = cand.slice(0, n);
      for (const d of cand.slice(0, n)) map[d.y][d.x] = rm.kind === "throne" ? "ldoor" : rm.kind === "secret" ? "swall" : "door";
    }
    // l'atrio: il portone sotto, e un'apertura verso i cunicoli sopra
    map[exit.y][exit.x] = "exit";
    map[exit.y - 1][exit.x] = "rfloor";
    for (const d of doorsOf(hall).filter((d) => d.y < hall.y).slice(0, 2)) map[d.y][d.x] = "door";
    if (!doorsOf(hall).length && ![...hall.cells].some((c) => map[c.y - 1]?.[c.x] === "door")) return null;

    // tutto deve essere raggiungibile dall'atrio senza passare dalla porta chiusa né dal muro che cede
    const start = { x: exit.x, y: exit.y - 1 };
    const reach = (pass) => {
      const seenR = new Set([key(start)]);
      const q = [start];
      while (q.length) {
        const c = q.shift();
        for (const [dx, dy] of DIRS) {
          const n = { x: c.x + dx, y: c.y + dy };
          if (!inside(n.x, n.y) || seenR.has(key(n)) || !pass(map[n.y][n.x])) continue;
          seenR.add(key(n));
          q.push(n);
        }
      }
      return seenR;
    };
    const walk = ["cfloor", "rfloor", "door", "carpet", "exit"];
    // se un pezzo di labirinto è isolato, si apre un muro verso il resto, finché non è tutto unito
    for (let guard = 0; guard < 200; guard++) {
      const got = reach((t) => walk.includes(t));
      const lost = [];
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (map[y][x] === "cfloor" && !got.has(`${x},${y}`)) lost.push({ x, y });
      if (!lost.length) break;
      const bridge = lost.flatMap((c) => DIRS.map(([dx, dy]) => ({ w: { x: c.x + dx, y: c.y + dy }, o: { x: c.x + 2 * dx, y: c.y + 2 * dy } })))
        .find(({ w, o }) => inside(o.x, o.y) && map[w.y][w.x] === "cwall" && !blocked.has(key(w)) && got.has(key(o)));
      if (!bridge) return null;
      map[bridge.w.y][bridge.w.x] = "cfloor";
    }
    const open = reach((t) => walk.includes(t));
    const lockDoor = doors[rooms.indexOf(throne)][0], crackDoor = doors[rooms.indexOf(secret)][0];
    if (!open.has(key(lockDoor.out)) || !open.has(key(crackDoor.out))) return null;

    // la sala del trono addobbata a nozze, come una chiesa: in fondo il prete, davanti a lui la sposa (a sinistra)
    // e il tuo posto sul tappeto; il pianista nell'angolo; in prima fila il re e la regina; poi file di gente in
    // ginocchio, una fila sì e una no; la navata col tappeto rosso fino alla porta
    //   | *   A   ♪ |   A il prete, ♪ il pianista, * le rose
    //   |    B▮     |   B la sposa, ▮ il tuo posto
    //   |     V     |
    //   | k R V R k |   R il re e la regina, k gente in ginocchio (o una sedia vuota)
    //   |     V     |
    //   | k k V k k |
    const priest = { x: aisle, y: throne.y };
    const lady = { x: aisle - 1, y: throne.y + 1 };
    const seat = priest;
    for (let y = throne.y + 1; y < throne.y + throne.h; y++) map[y][aisle] = "carpet";
    for (const [x, y] of [[throne.x, throne.y], [throne.x + throne.w - 1, throne.y]]) map[y][x] = "rose";
    const guests = [{ x: throne.x + throne.w - 1, y: throne.y + 1, kind: "pianist" }];
    for (let y = throne.y + 3; y < throne.y + throne.h - 1; y += 2) {
      for (let x = throne.x; x < throne.x + throne.w; x++) {
        if (x === aisle) continue;
        if (y === throne.y + 3 && Math.abs(x - aisle) === 1) guests.push({ x, y, kind: x < aisle ? "king" : "queen" });
        else if (r() < 0.65) guests.push({ x, y, kind: "kneeling", look: Math.floor(r() * 4) });
        else map[y][x] = "chair";   // le file di sedie: dove non c'è nessuno, la sedia vuota
      }
    }

    // dentro le stanze: la chiave, le monete, una cosa da vendere, i mostri; il tesoro dietro il muro che cede
    const spots = (rm) => rm.cells.filter((c) => map[c.y][c.x] === "rfloor").sort(() => r() - 0.5);
    // l'arredo: l'atrio e la biblioteca hanno il loro, le altre stanze due mobili a caso contro i muri
    // accanto a una porta: per una casella di stanza, qualunque passaggio verso fuori; per un cunicolo, una porta
    const atDoor = (c) => DIRS.some(([dx, dy]) => { const n = { x: c.x + dx, y: c.y + dy }; return map[n.y][n.x] !== "cwall" && !rooms.some((rm) => rm.keys.has(key(n))); });
    const byDoor = (c) => DIRS.some(([dx, dy]) => ["door", "ldoor", "swall"].includes(map[c.y + dy][c.x + dx]));
    const floor = (t) => t === "rfloor" || t === "carpet";
    // un mobile va dove non chiude il passaggio: dentro la stanza si deve poter andare ovunque dalla porta
    const furnish = (rm, c, kind) => {
      if (map[c.y][c.x] !== "rfloor" || atDoor(c)) return false;
      map[c.y][c.x] = kind;
      const free = rm.cells.filter((q) => floor(map[q.y][q.x]));
      const from = free.filter(atDoor);
      const got = new Set(from.map(key));
      const q = from.slice();
      while (q.length) {
        const a = q.shift();
        for (const [dx, dy] of DIRS) {
          const n = { x: a.x + dx, y: a.y + dy };
          if (rm.keys.has(key(n)) && floor(map[n.y][n.x]) && !got.has(key(n))) { got.add(key(n)); q.push(n); }
        }
      }
      if (from.length && got.size === free.length) return true;
      map[c.y][c.x] = "rfloor";
      return false;
    };
    // l'atrio: il tappeto dal portone, le armature ai lati, gli stendardi negli angoli, il camino e il ritratto del re
    for (let y = hall.y; y < hall.y + hall.h; y++) map[y][exit.x] = "carpet";
    map[exit.y - 1][exit.x] = "carpet";
    const hx = hall.x, hy = hall.y, hr = hall.x + hall.w - 1, hb = hall.y + hall.h - 1;
    for (const [x, y, kind] of [[exit.x - 1, hb, "armor"], [exit.x + 1, hb, "armor"], [hx, hy, "banner"], [hr, hy, "banner"],
      [hx, hy + 2, "hearth"], [hr, hy + 2, "portrait"], [hx, hb, "candles"], [hr, hb, "candles"]]) furnish(hall, { x, y }, kind);
    // la biblioteca: scaffali lungo il muro, il leggio nel mezzo
    for (const c of library.cells.filter((c) => c.y === library.y || ((c.x === library.x || c.x === library.x + library.w - 1) && c.y === library.y + library.h - 1))) furnish(library, c, "shelf");
    furnish(library, { x: library.x + (library.w - 1) / 2, y: library.y + 1 }, "lectern");
    const FURNITURE = ["barrel", "crate", "vasefur", "statuefur", "bedfur", "table", "swords", "cauldron", "candles", "armor"];
    for (const rm of rooms.filter((rm) => rm.kind === "room")) {
      const edge = rm.cells.filter((c) => c.x === rm.x || c.y === rm.y || c.x === rm.x + rm.w - 1 || c.y === rm.y + rm.h - 1).sort(() => r() - 0.5);
      const kinds = FURNITURE.slice().sort(() => r() - 0.5);
      let placed = 0;
      for (const c of edge) { if (placed >= 2) break; if (furnish(rm, c, kinds[placed])) placed++; }
    }

    // le trappole nei cunicoli, lontano dall'atrio: dove il corridoio va dritto (muro ai lati, passaggio davanti e dietro)
    const straight = (c) => {
      const w = (dx, dy) => map[c.y + dy]?.[c.x + dx] === "cfloor";
      return map[c.y][c.x] === "cfloor" && !byDoor(c) && ((w(1, 0) && w(-1, 0) && !w(0, 1) && !w(0, -1)) || (w(0, 1) && w(0, -1) && !w(1, 0) && !w(-1, 0)));
    };
    const far = (c) => Math.abs(c.x - start.x) + Math.abs(c.y - start.y) > 8;
    const corridor = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (straight({ x, y }) && far({ x, y }) && open.has(`${x},${y}`)) corridor.push({ x, y });
    corridor.sort(() => r() - 0.5);
    const near = (a, list) => list.some((b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) < 4);
    // la lastra che cede: solo dove, una volta crollata, si arriva lo stesso dappertutto
    const cracks = [];
    const count = reach((t) => walk.includes(t)).size;
    for (const c of corridor) {
      if (cracks.length >= 2) break;
      if (map[c.y][c.x] !== "cfloor" || near(c, cracks)) continue;
      map[c.y][c.x] = "cwall";
      const rest = reach((t) => walk.includes(t));
      map[c.y][c.x] = "cfloor";
      if (rest.size === count - 1 && rest.has(key(lockDoor.out)) && rest.has(key(crackDoor.out))) { cracks.push(c); map[c.y][c.x] = "crack"; }
    }

    const plain = rooms.filter((rm) => rm.kind === "room" && rm.cells.some((c) => open.has(key(c)))).sort(() => r() - 0.5);
    if (plain.length < 4) return null;
    const loot = [{ ...spots(plain[0])[0], kind: "key" }];
    plain.slice(1, 4).forEach((rm, i) => { const c = spots(rm)[0]; loot.push(i === 2 ? { ...c, kind: "relic" } : { ...c, kind: "coins", amount: 4 + Math.floor(r() * 6) }); });
    loot.push({ ...spots(secret)[0], kind: "coins", amount: 20 + Math.floor(r() * 6) });
    const monsters = [];
    plain.slice(0, 5).forEach((rm, i) => {
      if (i === 0 && r() < 0.5) return;
      const n = rm.w * rm.h > 20 ? 2 : 1;
      for (const c of spots(rm).filter((c) => !loot.some((l) => l.x === c.x && l.y === c.y)).slice(0, n)) {
        monsters.push({ x: c.x, y: c.y, kind: r() < 0.5 ? "bat" : "ghost", dx: r() < 0.5 ? 1 : -1, dy: r() < 0.5 ? 1 : -1, room: rooms.indexOf(rm) });
      }
    });
    return {
      map, exit, start, lady, seat, priest, guests, lock: lockDoor, crack: crackDoor, loot, monsters, cracks,
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
    // in piedi ai lati, chi non ha trovato posto: un suonatore di liuto, l'oste con la brocca
    rect(1, 44, 7, 14, "#6a3a8a"); rect(2, 38, 5, 5, "#f0c8a0"); rect(6, 46, 4, 3, "#c8a050"); px(9, 44, "#c8a050");
    rect(151, 44, 8, 14, "#e8e0d0"); rect(152, 38, 6, 5, "#c8906a"); rect(151, 47, 2, 4, "#8a6a4a");
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
