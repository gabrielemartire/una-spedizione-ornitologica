// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.6.4";
const NOVITA = [
  "<b>L'orso</b> torna a togliere due cuori a colpo (la 0.6.3 li aveva dimezzati per sbaglio). Dopo averti colpito resta fermo per 3 tue mosse.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
