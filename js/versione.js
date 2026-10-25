// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.16";
const NOVITA = [
  "<b>Il diario sono i tuoi appunti</b>, in prima persona.",
  "<b>Chi parla, parla in una finestrella</b>: l'unicorno, il mostro del labirinto, il prete, il re.",
  "<b>Il ricercato che scappa</b> si nasconde altrove sull'isola: la taglia vale fino alla scadenza.",
  "<b>Nel labirinto</b> non ci sono più trappole tra le foglie.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
