// Navigazione tra le schermate del menu, con mouse o tastiera
const screens = document.querySelectorAll(".screen");

function show(id, { resume = false } = {}) {
  Suoni.stopAll();
  document.querySelectorAll(".is-playing").forEach((el) => el.classList.remove("is-playing"));
  screens.forEach((s) => s.classList.toggle("is-active", s.id === id));
  document.body.classList.toggle("in-game", id === "screen-game");
  closeMenubar();
  if (id === "screen-game") {
    if (!resume || !Gioco.resume()) Gioco.start(document.getElementById("player-name").value);
    return;
  }
  if (id === "screen-menu") renderContinue();
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
  return [...document.querySelectorAll(".screen.is-active .menu-item:not(:disabled):not([hidden]), .screen.is-active .name-input")];
}

function focusFirst() {
  document.querySelector(".screen.is-active .menu-item:not(:disabled):not([hidden])")?.focus();
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

// La barra del menu in partita: "Spedizione" apre una tendina, anche con Esc
function closeMenubar() {
  const drop = document.getElementById("mb-drop");
  if (!drop || drop.hidden) return;
  drop.hidden = true;
  // la tastiera torna al gioco, o alla scelta che era aperta sulla mappa
  document.activeElement?.blur();
  document.querySelector("#map-overlay:not([hidden]) .menu-item")?.focus();
}

function openMenubar() {
  const drop = document.getElementById("mb-drop");
  drop.hidden = false;
  drop.querySelector("button").focus();
}

document.getElementById("name-form").addEventListener("submit", (e) => {
  e.preventDefault();
  Suoni.play("conferma");
  show("screen-game");
});

document.addEventListener("click", (e) => {
  const action = e.target.closest("[data-game-action]")?.dataset.gameAction;
  if (action === "menubar") {
    document.getElementById("mb-drop").hidden ? openMenubar() : closeMenubar();
    return;
  }
  if (!e.target.closest(".mb-group")) closeMenubar();
  if (action === "to-menu") { Gioco.save(); show("screen-menu"); return; }

  const el = e.target.closest("button");
  if (!el) return;

  if (el.dataset.action === "new") {
    // c'è una spedizione salvata: prima di perderla si chiede
    Suoni.play("conferma");
    show(Gioco.hasSave() ? "screen-confirm" : "screen-name");
  } else if (el.dataset.action === "continue") {
    Suoni.play("conferma");
    show("screen-game", { resume: true });
  } else if (el.dataset.goto) {
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
    if (inGame) openMenubar();
    else show("screen-menu");
  }
});

// A tendina aperta la tastiera è sua: ↑ ↓ scelgono, Invio conferma, Esc chiude
window.addEventListener("keydown", (e) => {
  const drop = document.getElementById("mb-drop");
  if (!document.body.classList.contains("in-game") || drop.hidden) return;
  const items = [...drop.querySelectorAll("button")];
  const i = items.indexOf(document.activeElement);
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
    Suoni.play("blip");
  } else if (e.key === "Escape") {
    closeMenubar();
  }
  if (e.key !== "Enter") e.preventDefault(); // Invio preme il pulsante scelto
  e.stopImmediatePropagation();
}, true);

// "Continua la spedizione" c'è solo se ce n'è una salvata
function renderContinue() {
  document.querySelector('[data-action="continue"]').hidden = !Gioco.hasSave();
}

// --- Le patch note: chi accende una versione nuova per la prima volta vede le novità ---

const PATCH_KEY = "spedizione-ornitologica:patch";

function showPatchNotes() {
  let seen = null;
  try { seen = localStorage.getItem(PATCH_KEY); } catch (e) { /* senza memoria si mostrano ogni volta */ }
  if (seen === VERSIONE) return;
  const box = document.getElementById("patch");
  box.innerHTML = `<div class="patch-card" role="dialog" aria-label="Patch note">
      <h2>Patch note ${VERSIONE.slice(1)}</h2>
      <ul>${NOVITA.map((n) => `<li>${n}</li>`).join("")}</ul>
      <p class="patch-foot"><a href="https://github.com/gabrielemartire/una-spedizione-ornitologica/blob/main/PATCH-NOTE.md" target="_blank" rel="noopener">tutte le patch note</a> · Invio per chiudere</p>
      <button class="menu-item" data-action="close-patch">Si parte!</button>
    </div>`;
  box.hidden = false;
  box.querySelector("button").focus();
}

function closePatchNotes() {
  const box = document.getElementById("patch");
  box.hidden = true;
  try { localStorage.setItem(PATCH_KEY, VERSIONE); } catch (e) { /* pazienza */ }
  if (document.body.classList.contains("in-game")) document.querySelector("#map-overlay:not([hidden]) .menu-item")?.focus();
  else focusFirst();
}

// A patch note aperte la tastiera è loro: Invio, spazio o Esc le chiudono
window.addEventListener("keydown", (e) => {
  if (document.getElementById("patch").hidden) return;
  if (["Enter", " ", "Escape"].includes(e.key)) closePatchNotes();
  e.preventDefault();
  e.stopImmediatePropagation();
}, true);

document.addEventListener("click", (e) => {
  if (e.target.closest('[data-action="close-patch"]') || e.target.id === "patch") closePatchNotes();
});

renderSoundLabels();
// Un refresh durante la partita riporta dritto alla spedizione salvata
if (Gioco.hasSave()) show("screen-game", { resume: true });
else { renderContinue(); focusFirst(); }
showPatchNotes();
