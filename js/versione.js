// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.11";
const NOVITA = [
  "<b>La nebbia</b>: di notte, in mare aperto, macchie di nebbia. Qualcosa ci nuota sotto e sente il rumore: al massimo una vela.",
  "<b>Acqua nera a babordo.</b> Nessuno vuole parlarne.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
