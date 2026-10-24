// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12";
const NOVITA = [
  "<b>Il labirinto di siepi</b>, in un bosco: trappole tra le foglie, un unicorno gentile, e al centro la Coppa dei Tre Maghi. Uscirne costa un giorno.",
  "<b>Il castello abbandonato si apre</b>: stanze buie, pipistrelli e fantasmi, una chiave, un muro che cede… e nella sala del trono, qualcuno che aspetta.",
  "<b>I passaggi</b> verso le zone vicine hanno un cartello: non si confondono più col ponte del castello.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
