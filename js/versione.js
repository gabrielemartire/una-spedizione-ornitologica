// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.6.2";
const NOVITA = [
  "<b>Il libretto del taccuino</b> ora è un foglio A4 solo, da stampare da un lato e piegare in quattro (prima a metà in orizzontale con la stampa fuori, poi in verticale): diventa un libretto piccolo, con copertina, retro col QR e dentro gli uccelli.",
  "Le cose scritte a penna stanno su una riga, come in un modulo, in una grafia semplice; il nome resta in corsivo barocco. Il QR è color sabbia.",
  "Isole, zone e uccelli osservati sono dentro il libretto, in cima.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
