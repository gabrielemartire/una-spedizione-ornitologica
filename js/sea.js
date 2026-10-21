// La navigazione: la nave si guida in tempo reale sul globo.
// ← → cambiano la rotta, ↑ ↓ le vele. In mare l'orologio è fermo: costa ripartire (due momenti),
// e una traversata lunga aggiunge un momento ogni SEA_LEG gradi percorsi.
// Vicino a una costa si può guardare col cannocchiale o sbarcare, gratis.
// Espone l'oggetto globale `Mare`.
const Mare = (() => {
  const SEA_LEG = 60;         // gradi di traversata che costano un momento del giorno
  const MAX_SAILS = 4;
  const SAIL_SPEED = 1.8;     // gradi al secondo per ogni livello di vela
  const TURN_RATE = 100;      // gradi di rotta al secondo
  const LAND_RANGE = 3;       // gradi: abbastanza vicino per sbarcare
  const SCOPE_RANGE = 12;     // gradi: abbastanza vicino per il cannocchiale
  const CITY_RANGE = 4;
  const BIG_RES = 200;
  const MINI_RES = 90;

  let running = false;
  let loop = 0;               // ogni ingresso in mare avvia un solo ciclo di disegno
  let lastFrame = 0;
  let lastStatus = 0;
  let turning = 0;
  let wake = [];
  let near = null;            // la costa più vicina, se c'è
  let city = null;            // la città vicina, se c'è
  let scoping = false;        // il cannocchiale è in mano: segue la costa finché non ti allontani
  let scope = null;           // la zona che si sta guardando
  let seaTime = null;         // il momento disegnato nella cartolina del mare
  let el = null;

  const COMPASS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const compass = (h) => COMPASS[Math.round(h / 45) % 8];

  function enter() {
    const g = Gioco.el;
    el = {
      canvas: document.getElementById("globe-big"),
      hud: document.getElementById("sea-hud"),
      prompt: document.getElementById("sea-prompt"),
      postcard: g.postcard,
    };
    const trip = Gioco.trip;
    trip.mode = "sea";
    trip.ship.sails = 0;
    turning = 0;
    scoping = false;
    scope = null;
    seaTime = null;
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
      const step = ship.sails * SAIL_SPEED * dt;
      const next = Globo.advance(ship.lat, ship.lon, ship.heading, step);
      if (Globo.isWater(trip.world, next.lat, next.lon)) {
        Object.assign(ship, next);
        if (!wake.length || Math.hypot(wake[0].lat - ship.lat, wake[0].lon - ship.lon) > 0.6) {
          wake.unshift({ lat: ship.lat, lon: ship.lon });
          wake.length = Math.min(wake.length, 24);
        }
        // Le traversate lunghe costano tempo
        trip.seaDist += step;
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
    city = Globo.nearestCity(trip.world, ship.lat, ship.lon, CITY_RANGE);
    // Il cannocchiale segue la costa: girando attorno all'isola mostra la zona successiva
    if (scoping) {
      if (!near) closeScope();
      else if (!scope || near.zone.id !== scope.id) showScope(near.zone);
    }

    const time = Gioco.now();
    const canLand = near && near.distance <= LAND_RANGE;
    Globo.draw(el.canvas, trip.world, ship, {
      res: BIG_RES, time, wake, ship: true, markers: true, marks: trip.zones,
      highlight: scope ? scope.id : canLand ? near.zone.id : null,
    });
    if (!scoping && seaTime !== time) drawSeaPostcard(time);
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
    else if (canLand) msg = `<b>${near.zone.name}</b> · Invio sbarca · ${scoping ? "col cannocchiale" : "T cannocchiale"}`;
    else if (near) msg = scoping ? `Col cannocchiale: <b>${near.zone.name}</b>` : "Una costa all'orizzonte · T cannocchiale";
    el.prompt.innerHTML = msg;
  }

  // Righe del riquadro B in navigazione
  function statusRows() {
    const trip = Gioco.trip, ship = trip.ship;
    const leg = Math.min(5, Math.floor((trip.seaDist / SEA_LEG) * 5));
    return `
      <div>${Gioco.iconHtml("ship")}<span>Rotta</span><b>${Math.round(ship.heading)}° ${compass(ship.heading)}</b></div>
      <div><span>Vele</span><b>${"▰".repeat(ship.sails)}${"▱".repeat(MAX_SAILS - ship.sails)}</b></div>
      <div title="Ogni ${SEA_LEG}° di traversata passa un momento del giorno">${Gioco.iconHtml("hourglass")}<span>Traversata</span><b>${"▰".repeat(leg)}${"▱".repeat(5 - leg)}</b></div>`;
  }

  // --- Cartolina: il mare dal ponte, oppure la costa vista col cannocchiale ---

  function drawSeaPostcard(time) {
    const trip = Gioco.trip;
    seaTime = time;
    el.postcard.classList.remove("is-scope");
    // ogni traversata ha il suo mare: a volte il sole, uno scoglio, dei gabbiani
    Cartolina.render({ seed: trip.seed + trip.departures * 977 + trip.third * 31, sea: true, time, tags: new Set() }, el.postcard);
  }

  function showScope(zone) {
    scope = zone;
    const trip = Gioco.trip;
    const memory = trip.zones[zone.id];
    const bird = memory && memory.bird != null ? UCCELLI[memory.bird] : null;
    const flying = !!bird && !memory.done && !memory.gone && bird.ore.includes(Gioco.now());
    el.postcard.classList.add("is-scope");
    Cartolina.render({ seed: zone.seed, tags: zone.tags, time: Gioco.now(), bird: flying }, el.postcard);
    Suoni.play("pagina");
  }

  // T prende il cannocchiale; per riporlo basta allontanarsi dalla costa
  function openScope() {
    if (scoping) return;
    if (!near) {
      Gioco.toast("Col cannocchiale vedi solo mare.");
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

  // Il globo piccolo del riquadro B, quando sei a terra
  function drawMini(canvas) {
    const trip = Gioco.trip;
    const size = 120, dpr = window.devicePixelRatio || 1;
    if (canvas.width !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    }
    Globo.draw(canvas, trip.world, trip.ship, { res: MINI_RES, time: Gioco.now(), ship: true, markers: true, marks: trip.zones });
  }

  return { enter, stop, statusRows, drawMini };
})();
