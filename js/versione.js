// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.10";
const NOVITA = [
  "<b>La nebbia</b>, di notte in mare aperto, è più ampia: lì sotto qualcosa sente ogni rumore. Più di una vela, e non c'è tempo.",
  "Dalla 0.12.9: il Kraken ferma la nave.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
