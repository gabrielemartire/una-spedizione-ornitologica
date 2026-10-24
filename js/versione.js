// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.11.3";
const NOVITA = [
  "<b>Le onde si muovono</b> sulla battlemap.",
  "<b>La spiaggia caraibica</b> è più larga, e <b>la bottiglia</b> col messaggio è nera: ora si vede.",
  "Dalla 0.11.2 <b>Come si gioca</b> è riscritto (<i>Spedizione → Istruzioni</i>); dalla 0.11.1 tutti i nemici sono rossi.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
