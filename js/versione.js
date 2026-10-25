// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.13";
const NOVITA = [
  "<b>Nella nebbia c'è una lucina.</b> Non andarle incontro a vele spiegate.",
  "<b>Nella nebbia il tempo non passa</b>, e in mare aperto passa la metà più piano.",
  "<b>Le taglie</b> sono fogli infilati in fondo al diario, uno per avviso.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
