// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.4";
const NOVITA = [
  "<b>Ricercati</b>: nella bacheca dei porti a volte c'è un avviso. Accettalo, cerca la W rossa sul globo e il fumo col binocolo, prendi il fuggitivo (spara!) e portalo alla gendarmeria del Forte: 15 m.o.",
  "<b>Società ornitologica</b> al Forte: per ogni specie completata (tutti gli uccelli comuni) un premio di 8 m.o. Il taccuino ora dice dove si trova ogni specie.",
  "<b>Sei uccelli nuovi</b>, ognuno a sé: kiwi, corridore, gallo, dodo, gru di carta, oca.",
  "<b>Finanze</b> al posto della ciurma: nel registro ci sono anche le monete che entrano.",
  "<b>Esplorazione pura</b>: niente più avvisi sull'uccello e sugli animali, si cerca a occhio. E in ogni zona c'è sempre almeno un animale.",
  "Le città hanno tutta la loro zona e col binocolo si vedono dal mare; cartoline delle città ridisegnate, insegne con le icone, gente che cammina.",
  "Oggetti solo rituali (veneri, maschere, vasi, ritratti); i tesori non si spostano più aspettando a bordo.",
  "Una sola linguetta per aprire il diario; cornice d'oro per gli uccelli rari; attestato in PDF; il falegname saluta e ringrazia.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
