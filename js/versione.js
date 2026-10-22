// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.6.8";
const NOVITA = [
  "<b>La battlemap ha una cornice</b>: il bordo della mappa si vede bene e il nero del riquadro non sembra più un passaggio.",
  "I cuori della vita tornano rossi (erano diventati verdi per sbaglio).",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
