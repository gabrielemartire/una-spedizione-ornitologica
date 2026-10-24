// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.6";
const NOVITA = [
  "<b>I tasti sotto la mappa</b> sono disegnati come tasti: si capisce subito quale premere.",
  "Dalla 0.12.4 si usa tutto dallo zaino (Tab, capitolo Zaino: il numero accanto a una cosa la usa).",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
