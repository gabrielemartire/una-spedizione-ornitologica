// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.12";
const NOVITA = [
  "<b>Il tempo si dice a parole</b>: <i>Aspetta a bordo (si farà pomeriggio)</i>, <i>Riparti (arriverai all'alba)</i>.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
