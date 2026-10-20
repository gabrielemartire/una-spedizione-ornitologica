// Navigazione tra le schermate del menu, con mouse o tastiera
const screens = document.querySelectorAll(".screen");

function show(id) {
  Suoni.stopAll();
  document.querySelectorAll(".is-playing").forEach((el) => el.classList.remove("is-playing"));
  screens.forEach((s) => s.classList.toggle("is-active", s.id === id));
  document.body.classList.toggle("in-game", id === "screen-game");
  if (id === "screen-game") Gioco.start();
  else focusFirst();
}

function activeItems() {
  return [...document.querySelectorAll(".screen.is-active .menu-item:not(:disabled)")];
}

function focusFirst() {
  activeItems()[0]?.focus();
}

function renderSoundLabels() {
  document.querySelector('[data-label="sound"]').textContent = Suoni.on ? "ON" : "OFF";
  const bars = "■".repeat(Suoni.vol) + "□".repeat(5 - Suoni.vol);
  document.querySelector('[data-label="volume"]').textContent = `◀ 1 ${bars} 5 ▶`;
}

function setVolume(vol) {
  Suoni.setVol(vol);
  renderSoundLabels();
  Suoni.play("blip");
}

document.addEventListener("click", (e) => {
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
    show("screen-menu");
  }
});

renderSoundLabels();
focusFirst();
