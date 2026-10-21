// Le città sono battlemap senza animali: la banchina con le navi, le strade, le case e la gente
// che va e viene. Lungo la strada principale le botteghe: entri dalla porta (→) e il padrone ti parla.
// Il Forte è grande e murato; il porticciolo del fiordo, su un'isola di ghiaccio, è più piccolo
// e fa prezzi diversi. In città il tempo non passa, tranne dormendo in taverna.
// Espone l'oggetto globale `Citta`.
const Citta = (() => {
  const W = 40;
  const H = 24;
  const NPC_MS = 650;         // ogni quanto la gente fa un passo

  const TILES = {
    sea:    { name: "Mare",               icon: "waves",    cls: "t-sea",      walk: false },
    ship:   { name: "La tua nave",        icon: "ship",     cls: "t-ship",     walk: true },
    boat:   { name: "Nave ormeggiata",    icon: "sailboat", cls: "c-boat",     walk: false },
    fish:   { name: "Peschereccio",       icon: "fishboat", cls: "c-boat",     walk: false },
    quay:   { name: "Banchina",           ch: "=",          cls: "c-quay",     walk: true },
    road:   { name: "Strada",             ch: "·",          cls: "c-road",     walk: true },
    square: { name: "Piazza",             ch: "·",          cls: "c-square",   walk: true },
    snow:   { name: "Neve",               ch: "·",          cls: "c-snow",     walk: true },
    house:  { name: "Casa",               icon: "house",    cls: "c-house",    walk: false },
    yard:   { name: "Cortile",            ch: "\"",        cls: "c-yard",     walk: false },
    tree:   { name: "Albero del cortile", icon: "beech",    cls: "c-yard",     walk: false },
    wall:   { name: "Mura",               icon: "castle",   cls: "t-castle",   walk: false },
    gate:   { name: "Porta della città",  ch: "·",          cls: "c-gate",     walk: true },
    well:   { name: "Pozzo",              icon: "well",     cls: "c-decor",    walk: false },
    barrel: { name: "Barili",             icon: "barrel",   cls: "c-decor",    walk: false },
    crate:  { name: "Casse",              icon: "crate",    cls: "c-decor",    walk: false },
    buoy:   { name: "Boe",                icon: "barrel",   cls: "c-buoy",     walk: false },
    stall:  { name: "Bancarella",         icon: "shop",     cls: "c-decor",    walk: false },
    pine:   { name: "Abete",              icon: "pine",     cls: "c-pine",     walk: false },
    door:   { name: "Porta",              icon: "enter",    cls: "c-door",     walk: true },
  };

  // Le botteghe e quello che offrono, città per città
  const SHOPS = {
    forte: {
      medico: { cost: 5, cap: Gioco.MAX_HP },
      taverna: { cost: 11 },
      mercato: { price: 2, refuse: [] },
      emporio: {},
    },
    porto: {
      medico: { cost: 3, cap: Gioco.MAX_HP + 2 }, // cinque cuori e uno in più, che il Forte non ripristina
      taverna: { cost: 7 },
      mercato: { price: 4, refuse: ["arte"] },
      emporio: {},
    },
  };
  const SHOP_NAMES = { medico: "Medico", taverna: "Taverna", mercato: "Mercato", emporio: "Emporio" };

  let c = null;   // la città in cui sei: mappa, gente, botteghe
  let timer = 0;

  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const same = (a, b) => a.x === b.x && a.y === b.y;
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

  // Il Forte: il mare e la banchina a ovest, le mura tutt'intorno, la strada principale da est a ovest
  // con le botteghe, qualche vicolo e una piazza col pozzo
  function buildForte(r) {
    const map = Array.from({ length: H }, () => Array(W).fill("house"));
    const set = (x, y, t) => { if (inside(x, y)) map[y][x] = t; };
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < 4; x++) set(x, y, "sea");
      for (let x = 4; x < 7; x++) set(x, y, "quay");
      set(7, y, "wall");
    }
    for (let x = 7; x < W; x++) { set(x, 0, "wall"); set(x, H - 1, "wall"); }
    for (let y = 0; y < H; y++) set(W - 1, y, "wall");
    // la strada principale, due caselle, e la porta sul mare
    const mainY = 11;
    for (let x = 7; x < W - 1; x++) { set(x, mainY, "road"); set(x, mainY + 1, "road"); }
    set(7, mainY, "gate"); set(7, mainY + 1, "gate");
    // i vicoli
    for (const vx of [13, 22, 31]) for (let y = 1; y < H - 1; y++) set(vx, y, "road");
    for (const vy of [4, 19]) for (let x = 8; x < W - 1; x++) set(x, vy, "road");
    // dentro gli isolati, dietro le case, cortili e orti
    for (let y = 1; y < H - 1; y++) for (let x = 8; x < W - 1; x++) {
      if (map[y][x] !== "house") continue;
      const nearStreet = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inside(x + dx, y + dy) && ["road", "wall", "gate"].includes(map[y + dy][x + dx]));
      if (!nearStreet) map[y][x] = r() < 0.2 ? "tree" : "yard";
    }
    // la piazza col pozzo
    for (let y = 5; y <= 9; y++) for (let x = 24; x <= 30; x++) set(x, y, "square");
    set(27, 7, "well");
    // le bancarelle lungo la strada, vicino al mercato
    for (const [x, y] of [[18, mainY - 1], [20, mainY - 1], [25, mainY + 2], [27, mainY + 2]]) set(x, y, "stall");
    // sulla banchina barili e casse; in mare le altre navi
    for (const [x, y] of [[5, 3], [6, 4], [5, 17], [6, 18], [6, 7], [5, 20]]) set(x, y, r() < 0.5 ? "barrel" : "crate");
    for (const y of [2, 6, 16, 20]) set(1 + Math.floor(r() * 2), y, "boat");
    // le botteghe: la porta dà sulla strada principale
    const doors = { medico: { x: 10, y: mainY - 1 }, taverna: { x: 16, y: mainY + 2 }, mercato: { x: 19, y: mainY - 1 }, emporio: { x: 34, y: mainY + 2 } };
    for (const d of Object.values(doors)) set(d.x, d.y, "door");
    const ship = { x: 3, y: mainY };
    set(ship.x, ship.y, "ship");
    return { map, doors, ship, start: { x: 4, y: mainY }, people: 14, walkable: ["road", "square", "quay"] };
  }

  // Il porticciolo: una lunga banchina di legno sul fiordo, le case colorate affacciate, i pescherecci
  // e le boe rosse; dietro, la neve e gli abeti
  function buildPorto(r) {
    const map = Array.from({ length: H }, () => Array(W).fill("snow"));
    const set = (x, y, t) => { if (inside(x, y)) map[y][x] = t; };
    for (let y = 0; y < H; y++) for (let x = 0; x < 6; x++) set(x, y, "sea");
    for (let y = 3; y < H - 3; y++) for (let x = 6; x < 9; x++) set(x, y, "quay");
    // le case in fila lungo la banchina, con le porte delle botteghe
    for (let y = 3; y < H - 3; y++) { set(9, y, "house"); set(10, y, "house"); }
    for (const y of [7, 15]) { set(9, y, "quay"); set(10, y, "quay"); for (let x = 11; x < 18; x++) set(x, y, "road"); }
    const doors = { medico: { x: 9, y: 5 }, taverna: { x: 9, y: 10 }, mercato: { x: 9, y: 13 }, emporio: { x: 9, y: 18 } };
    for (const d of Object.values(doors)) set(d.x, d.y, "door");
    // qualche casa sparsa più in là, e gli abeti
    for (const [x, y] of [[13, 5], [14, 5], [16, 10], [16, 11], [13, 17], [14, 17]]) set(x, y, "house");
    for (let i = 0; i < 70; i++) {
      const x = 18 + Math.floor(r() * (W - 18)), y = Math.floor(r() * H);
      if (map[y][x] === "snow") set(x, y, "pine");
    }
    // boe, gabbie e pescherecci
    for (const [x, y] of [[8, 4], [8, 9], [8, 16], [8, 19]]) set(x, y, "buoy");
    for (const [x, y] of [[6, 6], [6, 12], [6, 17]]) set(x, y, "crate");
    for (const y of [4, 9, 15, 19]) set(4 + Math.floor(r() * 2), y, "fish");
    const ship = { x: 5, y: 12 };
    set(ship.x, ship.y, "ship");
    return { map, doors, ship, start: { x: 6, y: 13 }, people: 5, walkable: ["quay", "road"] };
  }

  // --- Entrare e uscire ---

  function enter(city) {
    const trip = Gioco.trip;
    const r = rng(trip.seed ^ (city.id === "forte" ? 0xf0f7e : 0x9077))
    const plan = city.id === "forte" ? buildForte(r) : buildPorto(r);
    c = { city, ...plan, player: { ...plan.start }, npcs: [], open: null, prev: null };
    // la gente: sulle strade e sulla banchina, mai addosso a te
    const spots = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (plan.walkable.includes(c.map[y][x])) spots.push({ x, y });
    for (let i = 0; i < plan.people && spots.length; i++) {
      const at = spots.splice(Math.floor(r() * spots.length), 1)[0];
      if (!same(at, c.player)) c.npcs.push({ ...at });
    }
    Gioco.showView("city");
    build();
    drawPostcard();
    Suoni.stopAll();
    Suoni.toggleAmbient(city.id === "forte" ? "vento" : "mare");
    clearInterval(timer);
    timer = setInterval(stroll, NPC_MS);
    Gioco.renderStatus();
    Gioco.toast(city.id === "forte" ? "Il Forte: le botteghe sono lungo la strada principale." : "Il porticciolo: le botteghe danno sulla banchina.");
    render();
  }

  function leave() {
    clearInterval(timer);
    c = null;
  }

  function drawPostcard() {
    Gioco.el.postcard.classList.remove("is-scope");
    Cartolina.render({ seed: Gioco.trip.seed, tags: new Set(), time: Gioco.now(), city: c.city.id }, Gioco.el.postcard);
  }

  // --- Disegno ---

  function build() {
    const el = Gioco.el;
    el.map.classList.remove("is-hit");
    el.map.innerHTML = "";
    el.map.style.gridTemplateColumns = `repeat(${W}, var(--cell))`;
    el.cells = [];
    for (let y = 0; y < H; y++) {
      el.cells.push([]);
      for (let x = 0; x < W; x++) {
        const d = document.createElement("div");
        d.dataset.x = x;
        d.dataset.y = y;
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
    for (const n of c.npcs) n.el = pawn("e-npc", "person");
    Gioco.fitMap();
    requestAnimationFrame(() => el.map.querySelectorAll(".entity").forEach((e) => e.classList.remove("no-slide")));
  }

  const place = (e, p) => { e.style.setProperty("--x", p.x); e.style.setProperty("--y", p.y); };

  function render() {
    const el = Gioco.el;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = tileAt(x, y);
        const cell = el.cells[y][x];
        const html = t.icon ? Gioco.iconHtml(t.icon) : t.ch || "";
        const cls = `cell ${t.cls} ${t.walk ? "walk" : "block"}`;
        if (cell._html !== html) { cell.innerHTML = html; cell._html = html; }
        if (cell.className !== cls) cell.className = cls;
      }
    }
    place(c.playerEl, c.player);
    for (const n of c.npcs) place(n.el, n);
  }

  // La gente cammina per conto suo, anche se tu stai fermo
  function stroll() {
    if (!c || Gioco.trip.mode !== "city" || !document.body.classList.contains("in-game")) return;
    for (const n of c.npcs) {
      if (Math.random() < 0.35) continue;
      const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
      const to = { x: n.x + dx, y: n.y + dy };
      if (!inside(to.x, to.y) || !c.walkable.includes(c.map[to.y][to.x])) continue;
      if (same(to, c.player) || c.npcs.some((o) => o !== n && same(o, to))) continue;
      Object.assign(n, to);
      place(n.el, n);
    }
  }

  function tileInfo(p) {
    const t = tileAt(p.x, p.y);
    const shop = Object.entries(c.doors).find(([, d]) => same(d, p));
    Gioco.el.tileInfo.textContent = shop ? `${SHOP_NAMES[shop[0]]} · entra` : t === TILES.ship ? "La tua nave · riparti" : `${t.name} · ${t.walk ? "si passa" : "non si passa"}`;
  }

  // --- Muoversi ---

  function move(dx, dy) {
    const p = c.player, to = { x: p.x + dx, y: p.y + dy };
    if (!inside(to.x, to.y)) return;
    const t = tileAt(to.x, to.y);
    if (!t.walk) return;
    if (c.npcs.some((n) => same(n, to))) { if (Math.random() < 0.3) Gioco.toast(["«Permesso!»", "«Attento a dove metti i piedi.»", "«Ehi, marinaio!»"][Math.floor(Math.random() * 3)]); return; }
    c.prev = { ...p };
    Object.assign(p, to);
    Suoni.play("passoErba");
    tileInfo(to);
    render();
    const shop = Object.entries(c.doors).find(([, d]) => same(d, to));
    if (shop) openShop(shop[0]);
    else if (t === TILES.ship) aboard();
  }

  // Si esce dalla bottega tornando in strada, dove eri
  function back() {
    c.open = null;
    Gioco.el.overlay.hidden = true;
    if (c.prev) Object.assign(c.player, c.prev);
    render();
  }

  // --- Le botteghe: un riquadro con la domanda del padrone ---

  function dialog(title, text, buttons) {
    const ov = Gioco.el.overlay;
    ov.innerHTML = `<h3>${title}</h3><p>${text}</p>
      <nav class="menu">${buttons.filter(Boolean).map(([action, label]) => `<button class="menu-item" data-city-action="${action}">${label}</button>`).join("")}</nav>`;
    ov.hidden = false;
    ov.querySelector(".menu-item").focus();
  }

  function openShop(kind) {
    c.open = kind;
    const trip = Gioco.trip, shop = SHOPS[c.city.id][kind], money = trip.money;
    if (kind === "medico") {
      const healed = trip.hp >= shop.cap;
      const extra = shop.cap > Gioco.MAX_HP ? " e un cuore in più" : "";
      dialog("Medico", healed ? "«Siete sano come un pesce. Tornate quando sanguinate.»"
        : `«Volete curarvi le ferite${extra}? ${shop.cost} m.o.»`, [
        !healed && money >= shop.cost && ["heal", `Sì, curami (−${shop.cost} m.o.)`],
        !healed && money < shop.cost && ["none", "Non ho abbastanza monete"],
        ["back", "Esci"],
      ]);
    } else if (kind === "taverna") {
      dialog("Taverna", `«Una notte in locanda? ${shop.cost} m.o. Si dorme fino all'alba, e qualcuno al bancone parla sempre troppo.»`, [
        money >= shop.cost && ["sleep", `Sì, una notte (−${shop.cost} m.o.)`],
        money < shop.cost && ["none", "Non ho abbastanza monete"],
        ["back", "Esci"],
      ]);
    } else if (kind === "mercato") {
      const hold = trip.hold;
      const buys = (it) => !shop.refuse.includes(OGGETTI[it.kind].cat);
      const items = hold.map((it, i) => buys(it)
        ? [`sell:${i}`, `${OGGETTI[it.kind].nome} <small>(+${shop.price} m.o.)</small>`]
        : [`none`, `${OGGETTI[it.kind].nome} <small>(non gli interessa)</small>`]);
      const sellable = hold.filter(buys).length;
      dialog("Mercato", hold.length ? `«Volete vendere la vostra merce? ${shop.price} m.o. al pezzo.»${shop.refuse.length ? " «L'arte la lasciamo alla città.»" : ""}`
        : "«Non avete niente da vendere, mi pare.»", [
        sellable > 1 && ["sellall", `Vendi tutto (+${sellable * shop.price} m.o.)`],
        ...items,
        ["back", "Esci"],
      ]);
    } else {
      dialog("Emporio", "La porta è chiusa. Un cartello: «Torno presto».", [["back", "Esci"]]);
    }
  }

  function heal() {
    const trip = Gioco.trip, shop = SHOPS[c.city.id].medico;
    trip.money -= shop.cost;
    trip.hp = Math.max(trip.hp, shop.cap);
    Gioco.pay("medico", shop.cost);
    Suoni.play("monete");
    Gioco.toast(shop.cap > Gioco.MAX_HP ? "Ferite curate, e ti senti più forte del solito." : "Ferite curate.");
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
    Gioco.toast(heard ? "Al bancone, una storia che vale oro. È nel diario." : "Dormi bene. Nessuno ha storie nuove da raccontare.");
    drawPostcard();
    Gioco.renderStatus();
    Gioco.save();
  }

  function sell(indexes) {
    const trip = Gioco.trip, shop = SHOPS[c.city.id].mercato;
    const sold = indexes.sort((a, b) => b - a).map((i) => trip.hold.splice(i, 1)[0]);
    trip.money += sold.length * shop.price;
    Suoni.play("monete");
    Gioco.toast(`Venduto: ${sold.map((it) => OGGETTI[it.kind].nome).join(", ")}. +${sold.length * shop.price} m.o.`);
    Gioco.renderStatus();
    openShop("mercato");
  }

  function aboard() {
    c.open = "nave";
    dialog("La tua nave", `Giorno ${Gioco.day()}, ${Gioco.now()} · ${Gioco.trip.money} m.o.`, [
      ["sail", `Riparti <small>(due momenti: sarà ${Gioco.timeOf(Gioco.trip.third + 2)})</small>`],
      ["back", "Resta in città"],
    ]);
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

  document.addEventListener("click", (e) => {
    const action = e.target.closest("[data-city-action]")?.dataset.cityAction;
    if (!action || !c) return;
    if (action === "back") back();
    else if (action === "heal") heal();
    else if (action === "sleep") sleep();
    else if (action === "sellall") {
      const refuse = SHOPS[c.city.id].mercato.refuse;
      sell(Gioco.trip.hold.map((it, i) => (refuse.includes(OGGETTI[it.kind].cat) ? -1 : i)).filter((i) => i >= 0));
    } else if (action.startsWith("sell:")) sell([+action.slice(5)]);
    else if (action === "sail") { leave(); Gioco.depart(); }
  });

  document.addEventListener("mouseover", (e) => {
    const cell = e.target.closest("#map > div");
    if (cell && c && Gioco.trip?.mode === "city") tileInfo({ x: +cell.dataset.x, y: +cell.dataset.y });
  });

  function statusRows() {
    const hold = Gioco.trip.hold.length;
    return `<div>${Gioco.iconHtml("anchor")}<span>In porto</span><b>${c ? c.city.name : ""}</b></div>
      <div>${Gioco.iconHtml("crate")}<span>Stiva</span><b>${hold ? `${hold} oggett${hold === 1 ? "o" : "i"}` : "vuota"}</b></div>`;
  }

  return { enter, leave, statusRows, redraw: () => c && drawPostcard() };
})();
