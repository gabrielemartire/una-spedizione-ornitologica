// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.13.3";
const NOVITA = [
  "<b>La radura del falò è tranquilla</b>: niente animali, a nessuna ora, e il ricercato non ci si nasconde.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
