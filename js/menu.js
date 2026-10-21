// Navigazione tra le schermate del menu, con mouse o tastiera
const screens = document.querySelectorAll(".screen");

function show(id) {
  Suoni.stopAll();
  document.querySelectorAll(".is-playing").forEach((el) => el.classList.remove("is-playing"));
  screens.forEach((s) => s.classList.toggle("is-active", s.id === id));
  document.body.classList.toggle("in-game", id === "screen-game");
  closeMenubar();
  if (id === "screen-game") {
    Gioco.start(document.getElementById("player-name").value);
    return;
  }
  if (id === "screen-end") Diario.renderEnd();
  if (id === "screen-name") {
    const input = document.getElementById("player-name");
    input.value = Gioco.explorer === "Senza nome" ? "" : Gioco.explorer;
    input.focus();
    return;
  }
  focusFirst();
}

function activeItems() {
  return [...document.querySelectorAll(".screen.is-active .menu-item:not(:disabled), .screen.is-active .name-input")];
}

function focusFirst() {
  document.querySelector(".screen.is-active .menu-item:not(:disabled)")?.focus();
}

function renderSoundLabels() {
  document.querySelectorAll('[data-label="sound"]').forEach((el) => { el.textContent = Suoni.on ? "ON" : "OFF"; });
  const bars = "■".repeat(Suoni.vol) + "□".repeat(5 - Suoni.vol);
  document.querySelector('[data-label="volume"]').textContent = `◀ 1 ${bars} 5 ▶`;
}

function setVolume(vol) {
  Suoni.setVol(vol);
  renderSoundLabels();
  Suoni.play("blip");
}

// La barra del menu in partita: "Spedizione" apre una tendina
function closeMenubar() {
  const drop = document.getElementById("mb-drop");
  if (drop) drop.hidden = true;
}

document.getElementById("name-form").addEventListener("submit", (e) => {
  e.preventDefault();
  Suoni.play("conferma");
  show("screen-game");
});

document.addEventListener("click", (e) => {
  const action = e.target.closest("[data-game-action]")?.dataset.gameAction;
  if (action === "menubar") {
    const drop = document.getElementById("mb-drop");
    drop.hidden = !drop.hidden;
    return;
  }
  if (!e.target.closest(".mb-group")) closeMenubar();
  if (action === "to-menu") { show("screen-menu"); return; }
  if (action === "restart") { show("screen-name"); return; }

  const el = e.target.closest("button");
  if (!el) return;

  if (el.dataset.goto) {
    Suoni.play("conferma");
    show(el.dataset.goto);
  } else if (el.dataset.action === "toggle-sound") {
    Suoni.setOn(!Suoni.on);
    renderSoundLabels();
    Suoni.play("conferma");
  } else if (el.dataset.action === "volume") {
    setVolume((Suoni.vol % 5) + 1); // il clic fa ciclare 1 → 5 → 1
  } else if (el.dataset.sound) {
    Suoni.play(el.dataset.sound);
  } else if (el.dataset.ambient) {
    el.classList.toggle("is-playing", Suoni.toggleAmbient(el.dataset.ambient));
  }
});

document.addEventListener("keydown", (e) => {
  const items = activeItems();
  const i = items.indexOf(document.activeElement);
  const onVolume = document.activeElement?.dataset.action === "volume";
  const inGame = document.body.classList.contains("in-game");

  if (e.key === "ArrowDown") {
    e.preventDefault();
    items[(i + 1) % items.length]?.focus();
    Suoni.play("blip");
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    items[(i - 1 + items.length) % items.length]?.focus();
    Suoni.play("blip");
  } else if (onVolume && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
    e.preventDefault();
    setVolume(Suoni.vol + (e.key === "ArrowLeft" ? -1 : 1));
  } else if (e.key === "Escape") {
    // In partita Esc apre la tendina "Spedizione": uscire per sbaglio farebbe perdere il viaggio
    if (inGame) {
      const drop = document.getElementById("mb-drop");
      drop.hidden = !drop.hidden;
      if (!drop.hidden) drop.querySelector("button").focus();
    } else show("screen-menu");
  }
});

renderSoundLabels();
focusFirst();
