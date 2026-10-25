// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.14";
const NOVITA = [
  "<b>Le istruzioni sono riscritte</b>: le ritrovi in <i>Spedizione → Istruzioni</i>.",
  "<b>Nel castello i fantasmi</b> si spostano di due caselle alla volta.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
