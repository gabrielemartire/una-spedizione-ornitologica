// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.11";
const NOVITA = [
  "<b>La sala del trono è una navata</b>: il re e la regina in prima fila, il pianista, la sposa a sinistra.",
  "<b>In piazza al Forte</b>, a volte, una protesta. Per cosa, non si capisce.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
