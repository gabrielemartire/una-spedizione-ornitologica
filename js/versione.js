// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.10";
const NOVITA = [
  "<b>Il ricercato</b> di notte accende un fuoco: un puntino rosso, solo col binocolo. La W sta al centro della sua isola.",
  "<b>Il campo dei bucanieri</b>: col binocolo, una colonna di fumo grasso. Dentro un tesoro da 30 m.o.; di notte dormono, ma attento a dove metti i piedi.",
  "<b>L'orso</b> è di nuovo appena più veloce di te: camminando non lo semini, nascondendoti sì.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
