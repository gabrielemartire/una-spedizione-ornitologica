// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.6.5";
const NOVITA = [
  "<b>L'orso</b> colpisce fortissimo, quattro cuori su cinque: ti lascia moribondo. Ma poi è sazio: sta fermo 3 mosse, si allontana e ti lascia andare. Ti riattacca solo se gli vai addosso o fai molto rumore accanto a lui.",
  "<b>La Società ornitologica</b> paga 25 m.o. per ogni specie completata. Le specie già complete nel taccuino ripreso col codice non si ripagano.",
  "I danni si leggono in cuori: «−4 cuori», «−mezzo cuore».",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
