// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.9";
const NOVITA = [
  "<b>Acqua nera a babordo</b>: la nave si ferma, e uscirne è lento.",
  "Dalla 0.12.8 gli animali gironzolano verso una meta, barcollando.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
