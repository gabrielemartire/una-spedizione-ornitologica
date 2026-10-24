// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.2";
const NOVITA = [
  "<b>La sala del trono è una chiesa</b>: il prete, la sposa, la navata, gli invitati ai lati.",
  "I tesori del castello non ricompaiono; dopo le nozze il castello è <i>chiuso per nozze</i>; la chiave della sala del trono resta nella porta.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
