// La navigazione: la nave si guida in tempo reale sul globo.
// ← → cambiano la rotta, ↑ ↓ le vele. In mare l'orologio è fermo: ripartire fa passare due terzi di giornata,
// e una traversata lunga ne aggiunge uno ogni SEA_LEG gradi percorsi.
// Vicino a una costa si può guardare col binocolo o sbarcare, gratis.
// Espone l'oggetto globale `Mare`.
const Mare = (() => {
  const SEA_LEG = 120;        // gradi di traversata che fanno passare un terzo di giornata
  const MAX_SAILS = 4;
  const SAIL_SPEED = 1.8;     // gradi al secondo per ogni livello di vela
  const TURN_RATE = 100;      // gradi di rotta al secondo
  const LAND_RANGE = 3;       // gradi: abbastanza vicino per sbarcare
  const SCOPE_RANGE = 12;     // gradi: abbastanza vicino per il binocolo
  const CITY_RANGE = 4;
  const BIG_RES = 200;
  // La nebbia, di notte: dentro c'è una lucina, l'esca del pesce gatto. Chi le va incontro con più di una vela
  // la fa muovere: ti viene incontro finché non ammaini, e se ti raggiunge è finita. Nella nebbia il tempo non passa
  const FOG_SAILS = 1;
  const LURE_CONE = 30;       // gradi: quanto la prua deve puntare verso la lucina
  const LURE_SPEED = 4;       // gradi al secondo, quando ti viene incontro
  const LURE_BITE = 0.8;      // gradi: ti ha raggiunto
  // Il Kraken: andando al largo (fuori dalla portata del binocolo) una volta su 8 arriva, poco dopo
  const KRAKEN_CHANCE = 1 / 8;
  const KRAKEN_DELAY = [3, 7]; // secondi
  const KRAKEN_RAD = 3.5;      // gradi
  const KRAKEN_DRAG = 0.35;    // nell'acqua nera la nave va a un terzo della velocità

  let running = false;
  let loop = 0;               // ogni ingresso in mare avvia un solo ciclo di disegno
  let lastFrame = 0;
  let lastStatus = 0;
  let turning = 0;
  let wake = [];
  let near = null;            // la costa più vicina, se c'è
  let city = null;            // la città vicina, se c'è
  let scoping = false;        // il binocolo è in mano: segue la costa finché non ti allontani
  let scope = null;           // la zona che si sta guardando
  let seaTime = null;         // quello che è disegnato nella cartolina del mare (momento, nebbia, kraken)
  let inFog = false;
  let lures = [];             // le lucine delle nebbie, dove sono ora: { lat, lon, home, hunting }
  let wasNear = true;
  let kraken = null;          // { lat, lon, rad, spin } quando c'è; krakenIn: tra quanto arriva
  let el = null;

  const COMPASS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const compass = (h) => COMPASS[Math.round(h / 45) % 8];

  function enter() {
    const g = Gioco.el;
    el = {
      canvas: document.getElementById("globe-big"),
      hud: document.getElementById("sea-hud"),
      prompt: document.getElementById("sea-prompt"),
      scopeBadge: document.getElementById("sea-scope"),
      letterBadge: document.getElementById("sea-letter"),
      letter: document.getElementById("letter"),
      postcard: g.postcard,
    };
    const trip = Gioco.trip;
    trip.mode = "sea";
    trip.ship.sails = 0;
    // una nave rimasta nel lago o tra le terre (prima della 0.8 poteva succedere) torna al mare aperto
    Object.assign(trip.ship, Globo.nearestSea(trip.world, trip.ship.lat, trip.ship.lon));
    turning = 0;
    scoping = false;
    scope = null;
    seaTime = null;
    inFog = false;
    lures = trip.world.fogs.map((f) => ({ ...f.lure, home: f, hunting: false }));
    wasNear = true;
    kraken = null;
    el.scopeBadge.className = "";
    Gioco.showView("sea");
    fitCanvas();
    Suoni.stopAll();
    Suoni.toggleAmbient("mare");
    running = true;
    lastFrame = performance.now();
    const id = ++loop;
    requestAnimationFrame((t) => frame(t, id));
    Gioco.renderStatus();
  }

  function stop() {
    running = false;
    if (letterOpen) closeLetter();
  }

  // Il globo grande riempie il riquadro A, lasciando posto alla rotta e al messaggio
  function fitCanvas() {
    const wrap = el.canvas.parentElement.parentElement.getBoundingClientRect();
    const spare = el.hud.offsetHeight + el.prompt.offsetHeight + 16;
    const size = Math.max(200, Math.min(wrap.width, wrap.height - spare));
    const dpr = window.devicePixelRatio || 1;
    el.canvas.style.width = `${size}px`;
    el.canvas.style.height = `${size}px`;
    el.canvas.width = Math.round(size * dpr);
    el.canvas.height = Math.round(size * dpr);
  }

  function frame(now, id) {
    if (!running || id !== loop) return;
    const trip = Gioco.trip;
    if (!document.body.classList.contains("in-game") || trip.mode !== "sea" || trip.over) {
      running = false;
      return;
    }
    const dt = Math.max(0, Math.min(0.1, (now - lastFrame) / 1000));
    lastFrame = now;
    const ship = trip.ship;

    ship.heading = (ship.heading + turning * TURN_RATE * dt + 360) % 360;
    if (ship.sails > 0) {
      const step = ship.sails * SAIL_SPEED * dt * (kraken ? KRAKEN_DRAG : 1);
      const next = Globo.advance(ship.lat, ship.lon, ship.heading, step);
      if (Globo.canSail(trip.world, ship, next)) {
        Object.assign(ship, next);
        if (!wake.length || Math.hypot(wake[0].lat - ship.lat, wake[0].lon - ship.lon) > 0.6) {
          wake.unshift({ lat: ship.lat, lon: ship.lon });
          wake.length = Math.min(wake.length, 24);
        }
        // Le traversate lunghe costano tempo, ma non nella nebbia
        if (!inFog) trip.seaDist += step;
        if (trip.seaDist >= SEA_LEG) {
          trip.seaDist -= SEA_LEG;
          if (!Gioco.advance(1)) return;
          Gioco.toast(`La traversata è lunga: si fa ${Gioco.now()}.`);
          document.getElementById("screen-game").dataset.time = Gioco.now();
        }
      } else {
        ship.sails = 0;
        Suoni.play("legno");
        Gioco.toast("Ammaini le vele: la costa è a un passo.");
      }
      if (Math.random() < dt * 0.05) Suoni.play(Math.random() < 0.5 ? "gabbiano" : "legno");
    }

    near = Globo.nearestCoast(trip.world, ship.lat, ship.lon, SCOPE_RANGE);
    // la città ha tutta la sua zona: dovunque si attracchi lì, si entra in porto
    city = Globo.nearestCity(trip.world, ship.lat, ship.lon, CITY_RANGE)
      || (near && near.distance <= LAND_RANGE ? cityOf(near.zone) : null);
    // Il binocolo segue la costa: girando attorno all'isola mostra la zona successiva
    if (scoping) {
      if (!near) closeScope();
      else if (!scope || near.zone.id !== scope.id) showScope(near.zone);
    }

    const time = Gioco.now();
    const canLand = near && near.distance <= LAND_RANGE;
    Globo.draw(el.canvas, trip.world, ship, {
      res: BIG_RES, time, wake, ship: true, markers: true, marks: trip.zones,
      wanted: trip.wanted && trip.wanted.state === "free" ? islandCenter(trip.world, trip.wanted.zone) : null,
      tower: trip.towerKnown ? towerZone(trip) : null,
      highlight: scope ? scope.id : canLand ? near.zone.id : null,
      fogs: time === "notte" ? trip.world.fogs : null,
      lures: time === "notte" ? lures : null,
      ink: kraken,
    });
    // La nebbia del pesce gatto, solo di notte
    const fog = time === "notte" ? trip.world.fogs.find((f) => Globo.distance(f, ship) < f.rad) : null;
    if (fog && !inFog) Gioco.toast("Nebbia fitta. Laggiù brilla una lucina: meglio non andarle incontro a vele spiegate.");
    inFog = !!fog;
    for (const l of lures) {
      if (l.home !== fog) {   // fuori dalla sua nebbia la lucina torna al suo posto
        if (l.hunting) Object.assign(l, l.home.lure, { hunting: false });
        continue;
      }
      const ahead = Math.abs(((Globo.bearing(ship, l) - ship.heading + 540) % 360) - 180) < LURE_CONE;
      if (ship.sails <= FOG_SAILS) l.hunting = false;
      else if (ahead && !l.hunting) { l.hunting = true; Suoni.play("campana"); Gioco.toast("La lucina si muove. Ti viene incontro."); }
      if (!l.hunting) continue;
      Object.assign(l, Globo.advance(l.lat, l.lon, Globo.bearing(l, ship), LURE_SPEED * dt));
      if (Globo.distance(l, ship) < LURE_BITE) {
        running = false;
        Cartolina.render({ seed: trip.seed, sea: true, time, tags: new Set(), fog: true, catfish: true }, el.postcard);
        Suoni.play("tonfo");
        Gioco.swallowed();
        return;
      }
    }
    const hunted = lures.some((l) => l.hunting);

    // Il Kraken: si tira il dado una volta ogni volta che si va al largo; arriva poco dopo, una volta per viaggio
    const far = !near;
    if (far && wasNear && !trip.krakenDone && trip.krakenIn == null && Math.random() < KRAKEN_CHANCE) {
      trip.krakenIn = KRAKEN_DELAY[0] + Math.random() * (KRAKEN_DELAY[1] - KRAKEN_DELAY[0]);
    }
    wasNear = !far;
    if (trip.krakenIn != null && !kraken) {
      trip.krakenIn -= dt;
      if (trip.krakenIn <= 0) {
        kraken = { lat: ship.lat, lon: ship.lon, rad: KRAKEN_RAD, spin: Math.random() * 6 };
        ship.sails = 0;   // la nave si ferma di colpo
        Suoni.play("legno");
        Gioco.note("Acqua nera a babordo. Nessuno vuole parlarne.");
        Gioco.toast("Acqua nera a babordo. Nessuno vuole parlarne.");
      }
    }
    if (kraken) {
      kraken.spin += dt * 0.6;
      if (ship.sails > 1) ship.sails = 1;   // nell'acqua nera al massimo una vela, e lenta (KRAKEN_DRAG)
      if (Globo.distance(kraken, ship) > kraken.rad) {
        kraken = null;
        trip.krakenIn = null;
        trip.krakenDone = true;
        if (!Gioco.advance(1)) return;
        Gioco.toast(`Fuori dall'acqua nera. Si è fatto ${Gioco.now()}, e nessuno sa come.`);
        document.getElementById("screen-game").dataset.time = Gioco.now();
      }
    }

    const look = `${time}|${inFog}|${hunted}|${!!kraken}`;
    if (!scoping && seaTime !== look) drawSeaPostcard(time, look);
    renderHud(canLand);
    if (now - lastStatus > 250) { lastStatus = now; Gioco.renderStatus(); }
    requestAnimationFrame((t) => frame(t, id));
  }

  function renderHud(canLand) {
    const ship = Gioco.trip.ship;
    const sails = "▰".repeat(ship.sails) + "▱".repeat(MAX_SAILS - ship.sails);
    el.hud.innerHTML = `${Gioco.iconHtml("ship")}<span>Rotta <b>${Math.round(ship.heading)}° ${compass(ship.heading)}</b></span>
      <span>Vele <b>${sails}</b></span>`;
    let msg = "Mare aperto. Cerca una costa.";
    if (city) msg = `<b>${city.name}</b> · Invio per attraccare in città`;
    else if (canLand) msg = `<b>${near.zone.name}</b> · Invio sbarca`;
    else if (near) msg = scoping ? `Col binocolo: <b>${cityOf(near.zone)?.name || near.zone.name}</b>` : "Una costa all'orizzonte";
    el.prompt.innerHTML = msg;
    // Il binocolo in alto a sinistra: si accende quando c'è una costa da guardare
    const state = scoping ? "is-on" : near ? "is-ready" : "";
    if (el.scopeBadge.className !== `sea-scope ${state}`) {
      el.scopeBadge.className = `sea-scope ${state}`;
      el.scopeBadge.innerHTML = `${Gioco.iconHtml("binoculars")}<span>${scoping ? "binocolo in mano" : "usa binocolo (T)"}</span>`;
    }
    // La lettera della Società, a destra del globo: c'è solo quando è arrivata
    const letter = Gioco.trip.letter;
    el.letterBadge.hidden = !letter;
    if (letter && el.letterBadge.dataset.state !== letter) {
      el.letterBadge.dataset.state = letter;
      el.letterBadge.className = `sea-letter${letter === "new" ? " is-new" : ""}`;
      el.letterBadge.innerHTML = `${Gioco.iconHtml("envelope")}<span>${letter === "new" ? "una lettera! (L)" : "rileggi (L)"}</span>`;
    }
  }

  // Righe del riquadro B in navigazione
  function statusRows() {
    const trip = Gioco.trip, ship = trip.ship;
    const leg = Math.min(5, Math.floor((trip.seaDist / SEA_LEG) * 5));
    return `
      <div>${Gioco.iconHtml("ship")}<span>Rotta</span><b>${Math.round(ship.heading)}° ${compass(ship.heading)}</b></div>
      <div><span>Vele</span><b>${"▰".repeat(ship.sails)}${"▱".repeat(MAX_SAILS - ship.sails)}</b></div>
      <div title="Ogni ${SEA_LEG}° di traversata il cielo cambia: dall'alba al pomeriggio, dal pomeriggio alla notte">${Gioco.iconHtml("hourglass")}<span>Traversata</span><b>${"▰".repeat(leg)}${"▱".repeat(5 - leg)}</b></div>`;
  }

  // --- Cartolina: il mare dal ponte, oppure la costa vista col binocolo ---

  function drawSeaPostcard(time, look = time) {
    const trip = Gioco.trip;
    seaTime = look;
    el.postcard.classList.remove("is-scope");
    // ogni traversata ha il suo mare: a volte il sole, uno scoglio, dei gabbiani
    Cartolina.render({ seed: trip.seed + trip.departures * 977 + trip.third * 31, sea: true, time, tags: new Set(), fog: inFog, lure: inFog, ink: !!kraken }, el.postcard);
  }

  // La W del ricercato sta al centro della sua isola, non sulla zona: la zona la dice il fuoco, di notte
  const centers = new Map();
  function islandCenter(world, zoneId) {
    const island = world.zones[zoneId].island;
    const k = `${world.seed}:${island}`;
    if (!centers.has(k)) {
      const ps = world.zones.filter((z) => z.island === island).map((z) => z.p);
      const v = [0, 1, 2].map((i) => ps.reduce((a, p) => a + p[i], 0));
      const n = Math.hypot(...v);
      centers.set(k, { lat: Math.asin(v[2] / n) * 180 / Math.PI, lon: Math.atan2(v[1], v[0]) * 180 / Math.PI });
    }
    return centers.get(k);
  }

  // La torre della donna, finché non le hai portato la lettera
  function towerZone(trip) {
    const z = trip.world.zones.find((zz) => zz.tags.has("torre"));
    return z && !trip.zones[z.id]?.ladyHappy ? z.id : null;
  }

  const cityOf = (zone) => Gioco.trip.world.cities.find((c) => c.zone === zone.id) || null;

  function showScope(zone) {
    scope = zone;
    const trip = Gioco.trip;
    el.postcard.classList.add("is-scope");
    // la zona della città: col binocolo si vede la città dal mare
    const town = cityOf(zone);
    if (town) {
      Cartolina.render({ seed: trip.seed, tags: new Set(), time: Gioco.now(), cityView: town.id }, el.postcard);
      Suoni.play("pagina");
      return;
    }
    const memory = trip.zones[zone.id];
    const bird = memory && memory.bird != null ? UCCELLI[memory.bird] : null;
    const flying = !!bird && !memory.done && !memory.gone && bird.ore.includes(Gioco.now());
    // col binocolo: il fuoco del ricercato, solo di notte; il fumo grasso dei bucanieri, sempre
    const campfire = !!trip.wanted && trip.wanted.state === "free" && trip.wanted.zone === zone.id && Gioco.now() === "notte";
    const smoke = zone.tags.has("bucanieri");
    if (smoke && !(trip.zones[zone.id] ||= { visited: false, done: false, gone: false }).smokeSeen) {
      trip.zones[zone.id].smokeSeen = true;
      Gioco.note("Fumo grasso dalla costa. Odore di carne.");
    }
    Cartolina.render({ seed: zone.seed, tags: zone.tags, time: Gioco.now(), bird: flying, smoke, campfire }, el.postcard);
    Suoni.play("pagina");
  }

  // T prende il binocolo; per riporlo basta allontanarsi dalla costa
  function openScope() {
    if (scoping) return;
    if (!near) {
      Gioco.toast("Col binocolo vedi solo mare.");
      return;
    }
    scoping = true;
    showScope(near.zone);
  }

  function closeScope() {
    scoping = false;
    scope = null;
    seaTime = null;
  }

  // --- La lettera della Società: una busta col sigillo; la si apre e dentro c'è l'invito ---

  let letterOpen = false;

  function openLetter() {
    const trip = Gioco.trip;
    if (!trip.letter || letterOpen) return;
    letterOpen = true;
    turning = 0;
    el.letter.innerHTML = `<div class="envelope">
        <div class="env-flap"></div>
        <div class="env-seal">${Gioco.iconHtml("seal")}</div>
        <div class="env-paper">
          <p class="env-from">Società Ornitologica · il Forte</p>
          <p>Egregio ${escape(trip.explorer)},</p>
          <p>ci giunge voce che il vostro taccuino sia completo: ogni uccello dell'arcipelago, disegnato e annotato. Nessuno, prima di voi.</p>
          <p>Vi preghiamo di passare dalla nostra sede, al Forte, per ricevere l'attestato di <b>Ornitologo esperto</b>.</p>
          <p class="env-sign">Il presidente della Società</p>
        </div>
      </div>
      <p class="env-keys">Invio apre la busta, e la richiude · Esc chiude</p>`;
    el.letter.hidden = false;
    Suoni.play("pagina");
  }

  function closeLetter() {
    letterOpen = false;
    el.letter.hidden = true;
    el.letter.classList.remove("is-open");
    if (Gioco.trip.letter === "new") Gioco.trip.letter = "read";
  }

  const escape = (str) => String(str).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

  // A lettera aperta la tastiera è sua: Invio apre la busta (o la chiude, se è già aperta), Esc la chiude
  window.addEventListener("keydown", (e) => {
    if (!letterOpen) return;
    if (e.key === "Enter" || e.key === " ") {
      if (el.letter.classList.contains("is-open")) closeLetter();
      else { el.letter.classList.add("is-open"); Suoni.play("pagina"); }
    } else if (e.key === "Escape" || e.key === "l" || e.key === "L") closeLetter();
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);

  // --- Comandi ---

  document.addEventListener("keydown", (e) => {
    const trip = Gioco.trip;
    if (!running || !trip || trip.mode !== "sea" || !document.body.classList.contains("in-game") || Diario.isOpen()) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const ship = trip.ship;
    if (k === "ArrowLeft" || k === "a") turning = -1;
    else if (k === "ArrowRight" || k === "d") turning = 1;
    else if ((k === "ArrowUp" || k === "w") && !e.repeat) { ship.sails = Math.min(MAX_SAILS, ship.sails + 1); Suoni.play("legno"); }
    else if ((k === "ArrowDown" || k === "s") && !e.repeat) { ship.sails = Math.max(0, ship.sails - 1); Suoni.play("legno"); }
    else if (k === "t" && !e.repeat) openScope();
    else if (k === "l" && !e.repeat) openLetter();
    else if (k === "Enter") {
      if (city) { stop(); Gioco.visitCity(city); }
      else if (near && near.distance <= LAND_RANGE) { stop(); Gioco.landAt(near.zone); }
      else return;
    } else return;
    e.preventDefault();
    e.stopImmediatePropagation();
  });

  document.addEventListener("keyup", (e) => {
    if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(e.key)) turning = 0;
  });

  window.addEventListener("resize", () => { if (running) fitCanvas(); });

  document.addEventListener("click", (e) => {
    if (running && e.target.closest("#sea-scope")) openScope();
    if (running && e.target.closest("#sea-letter")) openLetter();
    else if (letterOpen && e.target.closest("#letter")) {
      if (el.letter.classList.contains("is-open")) closeLetter();
      else { el.letter.classList.add("is-open"); Suoni.play("pagina"); }
    }
  });

  return { enter, stop, statusRows };
})();
