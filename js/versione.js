// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.8";
const NOVITA = [
  "<b>La nave non si incaglia più</b> nel lago in mezzo alle isole: il lago non si naviga, e una nave finita lì torna al mare.",
  "<b>Niente avvisi sopra la battlemap</b>: i fatti importanti vanno nel diario. I dialoghi restano.",
  "<b>Il taccuino</b>: capitolo <i>Taglie</i> coi manifesti WANTED e il timbro CATTURATO; voci barrate quando trovi l'uccello; il numero del viaggio.",
  "<b>La lettera</b> segna sul globo la torre della donna, con un cuore rosa.",
  "<b>Persa una spedizione</b>, si riparte col taccuino collegato; il codice ora conta anche i viaggi.",
  "<b>L'orso</b> si può seminare e ogni tanto si allontana; il ricercato spara un cuore; taverna a 5 e 4 m.o.; il fiume della cartolina serpeggia.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
