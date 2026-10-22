// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.6.9";
const NOVITA = [
  "<b>La cornice della battlemap</b> è sempre verde, a doppio filo, con un fregio barocco a ogni angolo, e sta appena fuori dalla mappa: non copre più le icone del bordo.",
  "<b>Il taccuino</b> non si scombina più: se i caratteri arrivano dopo l'apertura, le pagine si rifanno e ogni capitolo ricomincia a sinistra.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
