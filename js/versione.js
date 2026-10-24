// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.11.6";
const NOVITA = [
  "<b>Il diario</b>: dove l'uccello c'è, ora annota <i>sembra un cinguettio</i>.",
  "Dalla 0.11.5 il Kraken capita più spesso; dalla 0.11.4 il mare sta dal lato giusto, e c'è la bussola.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
