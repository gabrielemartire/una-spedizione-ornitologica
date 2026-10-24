// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.3";
const NOVITA = [
  "<b>Sotto la battlemap</b> solo i tasti che servono; <b>Z</b> per attendere.",
  "Dalla 0.12.2: la sala del trono è una chiesa, e dopo le nozze il castello è <i>chiuso per nozze</i>.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
