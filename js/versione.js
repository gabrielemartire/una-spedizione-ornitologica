// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.4";
const NOVITA = [
  "<b>Si usa tutto dallo zaino</b>: nel taccuino (Tab), capitolo Zaino, il numero accanto a una cosa la usa (mangiare, posare una tagliola, spargere i semi).",
  "Sotto la battlemap solo: ␣ osserva · Z attendi · X scava · Tab diario.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
