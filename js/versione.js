// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.11.4";
const NOVITA = [
  "<b>Il mare sta dal lato giusto</b>: sulla battlemap è dove sta sul globo, col nord in alto.",
  "<b>La bussola</b>, in basso a destra: utile per i messaggi nelle bottiglie.",
  "Dalla 0.11.3: le onde si muovono, la spiaggia caraibica è più larga, la bottiglia è una fiaschetta nera.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
