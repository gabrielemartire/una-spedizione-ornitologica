// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.18";
const NOVITA = [
  "<b>La ciurma costa 5 monete al giorno</b>, non più 8.",
  "<b>C'è sempre un castello</b> nell'arcipelago.",
  "<b>Avvicinandoti a un cartello</b> leggi dove porta. Verso il castello c'è uno <b>stendardo</b>.",
  "<b>Con la lettera sigillata</b> la torre si vede sul globo: alta, col tetto rosa.",
  "<b>Dopo le nozze hai casa al Forte</b>: la porta con la fede sul tetto. Si dorme gratis.",
  "<b>Il cinghiale colpisce</b> anche se gli vai addosso.",
  "<b>I bucanieri</b> di notte dormono anche se rubi il tesoro, e sparano ogni 8 passi.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
