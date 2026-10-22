// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.4.1";
const NOVITA = [
  "<b>Il Forte</b> ha una cartolina nuova: dall'alto di una strada, le mura lungo il mare con la nave ormeggiata e la torre di guardia, l'arco, la salita al castello sulla collina, il mercato. Di notte fiaccole sulle mura e il castello acceso; all'alba non c'è nessuno.",
  "<b>Il porticciolo</b> ridisegnato: la banchina di assi bagnate nella foschia, un peschereccio di legno del Cinquecento e una fila di locande a un piano, con le finestre calde e il fumo dai comignoli.",
  "Col binocolo, il porticciolo visto dal mare è come la sua cartolina.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
