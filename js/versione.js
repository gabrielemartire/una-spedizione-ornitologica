// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.7";
const NOVITA = [
  "<b>A piedi nell'interno</b>: le zone che non toccano il mare ora si raggiungono. Sulla battlemap ci sono uno o due passaggi (il ponte sul bordo) verso le zone vicine della stessa isola: attraversarne uno costa un momento.",
  "<b>La nave resta dove l'hai ormeggiata</b>: per ripartire torni da lei a piedi, passaggio dopo passaggio.",
  "<b>Isole più grandi</b>, con più zone interne, e in ogni globo un'isola con un grande lago al centro.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
