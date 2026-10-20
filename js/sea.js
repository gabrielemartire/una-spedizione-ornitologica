// La navigazione: la nave si guida in tempo reale sul globo.
// ← → cambiano la rotta, ↑ ↓ le vele. Il tempo passa solo mentre navighi.
// Vicino a una costa si può guardare col cannocchiale (gratis) o sbarcare (costa un momento del giorno).
// Espone l'oggetto globale `Mare`.
const Mare = (() => {
  const DAY_SECONDS = 20;     // secondi di navigazione per un giorno
  const MAX_SAILS = 4;
  const SAIL_SPEED = 1.1;     // gradi al secondo per ogni livello di vela
  const TURN_RATE = 100;      // gradi di rotta al secondo
  const LAND_RANGE = 2.4;     // gradi: abbastanza vicino per sbarcare
  const SCOPE_RANGE = 9;      // gradi: abbastanza vicino per il cannocchiale
  const CITY_RANGE = 3.2;
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
  let scope = null;           // la zona guardata col cannocchiale
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
      postcardTitle: g.postcardTitle,
      zoneTitle: g.zoneTitle,
    };
    const trip = Gioco.trip;
    trip.mode = "sea";
    trip.ship.sails = 0;
    turning = 0;
    scope = null;
    seaTime = null;
    Gioco.showView("sea");
    el.zoneTitle.textContent = "In mare aperto";
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

  function fitCanvas() {
    const box = el.canvas.parentElement.getBoundingClientRect();
    const size = Math.max(200, Math.min(box.width, window.innerHeight * 0.62));
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
      const next = Globo.advance(ship.lat, ship.lon, ship.heading, ship.sails * SAIL_SPEED * dt);
      if (Globo.isWater(trip.world, next.lat, next.lon)) {
        Object.assign(ship, next);
        if (!wake.length || Math.hypot(wake[0].lat - ship.lat, wake[0].lon - ship.lon) > 0.6) {
          wake.unshift({ lat: ship.lat, lon: ship.lon });
          wake.length = Math.min(wake.length, 24);
        }
      } else {
        ship.sails = 0;
        Suoni.play("legno");
        Gioco.log("Ammaini le vele: la costa è a un passo.", "ship");
      }
      // Il tempo passa solo navigando
      if (!Gioco.advanceClock(dt / DAY_SECONDS)) return;
      if (Math.random() < dt * 0.05) Suoni.play(Math.random() < 0.5 ? "gabbiano" : "legno");
    }

    near = Globo.nearestCoast(trip.world, ship.lat, ship.lon, SCOPE_RANGE);
    city = Globo.nearestCity(trip.world, ship.lat, ship.lon, CITY_RANGE);
    if (scope && (!near || near.zone.id !== scope.id)) closeScope();

    const time = Gioco.timeOf(trip.clock);
    const canLand = near && near.distance <= LAND_RANGE;
    Globo.draw(el.canvas, trip.world, ship, {
      res: BIG_RES, time, wake, ship: true, markers: true,
      highlight: scope ? scope.id : canLand ? near.zone.id : null,
    });
    if (!scope && seaTime !== time) drawSeaPostcard(time);
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
    else if (canLand) msg = `<b>${near.zone.name}</b> · Invio sbarca (costa un momento del giorno) · T cannocchiale`;
    else if (near) msg = `Una costa all'orizzonte · T cannocchiale`;
    el.prompt.innerHTML = msg;
  }

  // Righe del riquadro B in navigazione
  function statusRows() {
    const ship = Gioco.trip.ship;
    return `
      <div>${Gioco.iconHtml("ship")}<span>Rotta</span><b>${Math.round(ship.heading)}° ${compass(ship.heading)}</b></div>
      <div><span>Vele</span><b>${"▰".repeat(ship.sails)}${"▱".repeat(MAX_SAILS - ship.sails)}</b></div>`;
  }

  // --- Cartolina: il mare, oppure la costa vista col cannocchiale ---

  function drawSeaPostcard(time) {
    seaTime = time;
    el.postcardTitle.textContent = `Dal ponte · ${time}`;
    Cartolina.render({ seed: Gioco.trip.seed, sea: true, time, tags: new Set() }, el.postcard);
  }

  function openScope() {
    if (!near) {
      Gioco.log("Col cannocchiale vedi solo mare.", "telescope");
      return;
    }
    scope = near.zone;
    const time = Gioco.timeOf(Gioco.trip.clock);
    const memory = Gioco.trip.zones[scope.id];
    el.postcardTitle.textContent = `Cannocchiale · ${scope.name}`;
    Cartolina.render({ seed: scope.seed, tags: scope.tags, time, bird: !memory?.gone }, el.postcard);
    Suoni.play("pagina");
    Gioco.log(`Col cannocchiale: ${scope.name.toLowerCase()}.`, "telescope");
  }

  function closeScope() {
    scope = null;
    seaTime = null;
  }

  // --- Comandi ---

  document.addEventListener("keydown", (e) => {
    const trip = Gioco.trip;
    if (!running || !trip || trip.mode !== "sea" || !document.body.classList.contains("in-game")) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const ship = trip.ship;
    if (k === "ArrowLeft" || k === "a") turning = -1;
    else if (k === "ArrowRight" || k === "d") turning = 1;
    else if ((k === "ArrowUp" || k === "w") && !e.repeat) { ship.sails = Math.min(MAX_SAILS, ship.sails + 1); Suoni.play("legno"); }
    else if ((k === "ArrowDown" || k === "s") && !e.repeat) { ship.sails = Math.max(0, ship.sails - 1); Suoni.play("legno"); }
    else if (k === "t" && !e.repeat) scope ? closeScope() : openScope();
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
    const size = 150, dpr = window.devicePixelRatio || 1;
    if (canvas.width !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    }
    Globo.draw(canvas, trip.world, trip.ship, { res: MINI_RES, time: Gioco.timeOf(trip.clock), ship: true, markers: true });
  }

  return { enter, stop, statusRows, drawMini };
})();
