// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.11.2";
const NOVITA = [
  "<b>Come si gioca</b> è riscritto, più asciutto: lo trovi in <i>Spedizione → Istruzioni</i>.",
  "Dalla 0.11.1 <b>tutti i nemici sono rossi</b>; dalla 0.11 <b>la nebbia</b> di notte in mare aperto (al massimo una vela!).",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
