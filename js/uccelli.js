// Gli uccelli del taccuino: specie (con la loro icona) e varianti (con il loro colore).
// Ogni variante vive in un bioma (o ovunque), a volte vuole una caratteristica della zona,
// e si fa vedere solo in certi momenti del giorno. Gli id non cambiano mai: il codice
// del taccuino si baserà su di essi.
// Espone gli oggetti globali `SPECIE` e `UCCELLI`.
const SPECIE = {
  gabbiano: { nome: "Gabbiani", icona: "seagull" },
  gufo: { nome: "Gufi", icona: "owl" },
  corvo: { nome: "Corvi", icona: "raven" },
  anatra: { nome: "Anatre", icona: "duck" },
  tucano: { nome: "Tucani", icona: "toucan" },
  aquila: { nome: "Aquile", icona: "eagle" },
};

// rara: non lascia tracce a terra, se ne sa qualcosa solo dalle voci in città
const UCCELLI = [
  { id: 0, specie: "gabbiano", nome: "Gabbiano comune", colore: "#e6e2d4", bioma: "foresta", ore: ["pomeriggio"],
    indizio: "Strilla sulle coste temperate.", curiosita: "Ruba il pane ai marinai, e non se ne vergogna." },
  { id: 1, specie: "gabbiano", nome: "Gabbiano ala nera", colore: "#7a8494", bioma: "taiga", ore: ["alba"],
    indizio: "Penne scure lungo le rive dei pini.", curiosita: "Vola basso quando arriva la nebbia." },
  { id: 2, specie: "gabbiano", nome: "Gabbiano becco blu", colore: "#4a9be8", bioma: "foresta", tratto: "cascata", ore: ["alba"], rara: true,
    indizio: "Si dice che ami le acque che cadono.", curiosita: "Canta solo quando la cascata è in piena." },

  { id: 3, specie: "gufo", nome: "Gufo delle radure", colore: "#d0a060", bioma: "foresta", ore: ["notte"],
    indizio: "Borre di ossicini sotto gli alberi.", curiosita: "Gira la testa più di quanto sembri decoroso." },
  { id: 4, specie: "gufo", nome: "Gufo delle nevi", colore: "#f2f2ea", bioma: "ghiaccio", ore: ["notte"],
    indizio: "Un'impronta d'ala sulla neve fresca.", curiosita: "Non lo vedi finché non apre gli occhi." },
  { id: 5, specie: "gufo", nome: "Gufo cornuto", colore: "#a8885a", bioma: "palude", ore: ["notte", "alba"],
    indizio: "Due ciuffi di piume impigliati nelle canne.", curiosita: "Le corna sono piume. Lui non lo sa." },

  { id: 6, specie: "corvo", nome: "Corvo delle nebbie", colore: "#8a9aac", bioma: "taiga", ore: ["alba"],
    indizio: "Una penna grigia e umida, tra i pini.", curiosita: "Gracchia una volta per ogni nave all'orizzonte." },
  { id: 7, specie: "corvo", nome: "Corvo del deserto", colore: "#9a7a62", bioma: "deserto", ore: ["pomeriggio"],
    indizio: "Una penna bruna cotta dal sole.", curiosita: "Sa dove sono i pozzi, ma non lo dice." },
  { id: 8, specie: "corvo", nome: "Corvo delle mura", colore: "#8a7ac8", tratto: "castello", ore: ["pomeriggio"], rara: true,
    indizio: "Fa il nido sotto i merli di un castello.", curiosita: "Colleziona cose luccicanti. Anche le tue." },

  { id: 9, specie: "anatra", nome: "Anatra marmorizzata", colore: "#a8b878", bioma: "palude", ore: ["alba"],
    indizio: "Una piuma a chiazze che galleggia nell'acquitrino.", curiosita: "Si tuffa solo se nessuno guarda." },
  { id: 10, specie: "anatra", nome: "Anatra dei ghiacci", colore: "#b8d8e8", bioma: "ghiaccio", ore: ["pomeriggio"],
    indizio: "Impronte palmate che finiscono in una scivolata.", curiosita: "Pattina meglio di quanto nuoti." },
  { id: 11, specie: "anatra", nome: "Anatra del lago", colore: "#5aa878", tratto: "lago", ore: ["alba", "pomeriggio"],
    indizio: "Piume verdi sulla riva di un lago.", curiosita: "Ogni lago ha la sua, e litigano per i confini." },

  { id: 12, specie: "tucano", nome: "Tucano arcobaleno", colore: "#f4a838", bioma: "tropicale", ore: ["pomeriggio"],
    indizio: "Gusci di frutta spaccati con un becco enorme.", curiosita: "Il becco pesa meno di quanto sembri." },
  { id: 13, specie: "tucano", nome: "Tucano notturno", colore: "#6a6ab0", bioma: "tropicale", ore: ["notte"],
    indizio: "Semi sparsi sotto le palme, ma solo al mattino.", curiosita: "Di giorno dorme col becco sotto l'ala." },
  { id: 14, specie: "tucano", nome: "Tucano delle oasi", colore: "#e86a4a", bioma: "deserto", tratto: "lago", ore: ["alba"], rara: true,
    indizio: "Qualcuno dice di averlo visto bere in un'oasi.", curiosita: "Nessuno sa come sia arrivato fin lì." },

  { id: 15, specie: "aquila", nome: "Aquila grigia", colore: "#b4bcc4", bioma: "taiga", ore: ["pomeriggio"],
    indizio: "Resti di un pasto e artigli incisi sulla corteccia.", curiosita: "Caccia solo controsole." },
  { id: 16, specie: "aquila", nome: "Aquila delle dune", colore: "#d8b47a", bioma: "deserto", ore: ["pomeriggio"],
    indizio: "Un'ombra larga che gira in tondo sopra la pietraia.", curiosita: "Aspetta. È molto brava ad aspettare." },
  { id: 17, specie: "aquila", nome: "Aquila di fuoco", colore: "#f4702a", tratto: "vulcano", ore: ["notte"], rara: true,
    indizio: "Una piuma ancora calda, vicino alla lava.", curiosita: "Nessuno l'ha mai vista spegnersi." },
];

const iconaUccello = (u) => SPECIE[u.specie].icona;

// L'uccello di una zona (mai un raro: quelli arrivano con le voci): tra quelli adatti al bioma e alle caratteristiche, chi vuole una caratteristica ha la precedenza
function uccelloPerZona(tags, biome, r) {
  const fits = UCCELLI.filter((u) => !u.rara && (!u.bioma || u.bioma === biome) && (!u.tratto || tags.has(u.tratto)));
  const special = fits.filter((u) => u.tratto);
  const pool = special.length && r() < 0.75 ? special : fits.filter((u) => !u.tratto);
  const list = pool.length ? pool : fits;
  return list.length ? list[Math.floor(r() * list.length)] : null;
}
