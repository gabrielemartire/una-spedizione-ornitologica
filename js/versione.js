// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.7";
const NOVITA = [
  "<b>Gli animali vagano intorno alla loro tana</b> e non sanno dove sei, finché non ti vedono, sentono o fiutano.",
  "<b>Sul globo</b> c'è il castello; i vulcani si scoprono andandoci.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
