// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.15";
const NOVITA = [
  "<b>Il castello è arredato</b>: l'atrio con le armature, la biblioteca, mobili in ogni stanza.",
  "<b>Nei cunicoli, trappole</b>: spuntoni a tempo e lastre che cedono.",
  "<b>Il tempo in mare</b> passa ancora più piano.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
