// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.11.7";
const NOVITA = [
  "<b>La bussola</b> è sul diario, sotto la linguetta: l'ago punta alla città più vicina.",
  "Dalla 0.11.4 il mare sulla battlemap sta dal lato giusto, col nord in alto.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
