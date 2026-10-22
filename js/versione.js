// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.6.3";
const NOVITA = [
  "<b>L'orso</b> fa meno male: un cuore a colpo invece di due. Dopo averti colpito resta fermo per 3 tue mosse: è il momento di scappare.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
