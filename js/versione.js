// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.11.1";
const NOVITA = [
  "<b>Tutti i nemici sono rossi</b>, dello stesso rosso scuro: orso, lupi, cinghiale, ricercato e bucanieri.",
  "Dalla 0.11: <b>la nebbia</b> di notte in mare aperto (al massimo una vela!) e <b>acqua nera a babordo</b>.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
