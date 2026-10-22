// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.6.7";
const NOVITA = [
  "<b>Il diario</b> segna solo gli sbarchi: dove, a che ora, e se l'uccello c'era o se era l'ora sbagliata.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
