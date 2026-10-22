// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.6";
const NOVITA = [
  "<b>Il codice del taccuino</b>: a fine spedizione hai un codice di 16 caratteri. Nel menu, <b>Riprendi un taccuino</b>: lo scrivi e la nuova spedizione parte con gli uccelli che avevi già osservato.",
  "<b>L'attestato è un libretto A5</b>: un PDF di due pagine da stampare fronte e retro e piegare a metà. In copertina lo stemma della Società ornitologica, il tuo nome e il viaggio scritto a penna; sul retro il QR; dentro il codice e tutti gli uccelli.",
  "Il QR apre il gioco con il codice già scritto, anche dal telefono.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
