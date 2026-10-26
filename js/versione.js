// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.19";
const NOVITA = [
  "<b>Alle nozze si va avanti camminando</b>: un passo verso la sposa vale come Invio, dalla domanda fino alla fine della festa.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
