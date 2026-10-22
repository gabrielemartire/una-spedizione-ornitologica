// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.6.6";
const NOVITA = [
  "<b>I ricercati catturati</b> finiscono nel taccuino: nel capitolo Stiva, in basso nella pagina di destra, ognuno nella sua cella con le sbarre, col nome dentro e sotto «in stiva» o «consegnato».",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
