// Gli oggetti che si trovano a terra (nei boschi a volte, nelle rovine sempre) e finiscono in stiva:
// solo oggetti rituali, niente armi né piume (non devono sembrare indizi di uccelli).
// Servono a essere venduti al mercato, o dati a un mercante in cambio di una voce.
// cat: il porticciolo non compra l'arte, roba da città.
// Espone l'oggetto globale `OGGETTI`.
const OGGETTI = {
  venere: { nome: "Venere di pietra", icona: "venus", cat: "reliquia", rovine: true },
  calice: { nome: "Calice ingemmato", icona: "chalice", cat: "reliquia", rovine: true },
  ciondolo: { nome: "Ciondolo rituale", icona: "pendant", cat: "reliquia", rovine: true },
  maschera: { nome: "Maschera rituale", icona: "mask", cat: "arte", rovine: true },
  vaso: { nome: "Vaso dipinto", icona: "vase", cat: "arte", rovine: true },
  quadro: { nome: "Ritratto antico", icona: "painting", cat: "arte", rovine: true },
  idolo: { nome: "Idolo di pietra", icona: "statue", cat: "arte", rovine: true },
  // la coppa del centro del labirinto: una sola, vale di più (valore: il prezzo al mercato)
  coppa: { nome: "Coppa dei Tre Maghi", icona: "cup", cat: "reliquia", valore: 11, unica: true },
};

// Un oggetto a caso: nelle rovine solo cose antiche, nel bosco di tutto
function oggettoACaso(r, rovine) {
  const ids = Object.keys(OGGETTI).filter((id) => !OGGETTI[id].unica && (!rovine || OGGETTI[id].rovine));
  return ids[Math.floor(r() * ids.length)];
}

// Gli oggetti magici, che ti dà lo sconosciuto col punto esclamativo (uno per tipo a partita), e la merce
// dell'emporio: vanno nello zaino. La lettera va consegnata alla donna della torre, la chiave apre i
// forzieri, l'uovo dopo tredici giorni si schiude, i semi fanno tornare un uccello volato via
const OGGETTI_SPECIALI = {
  lettera: { nome: "Lettera sigillata", icona: "scroll" },
  chiave: { nome: "Chiave arrugginita", icona: "key" },
  uovo: { nome: "Uovo maculato", icona: "egg" },
  semi: { nome: "Sacchetto di semi", icona: "seeds" },
  // l'emporio: il cibo in scatola (uno solo nello zaino) e le tagliole da mettere a terra
  cibo: { nome: "Pesce in scatola", icona: "cannedfish" },
  tagliola: { nome: "Tagliola", icona: "trap" },
  // il marshmallow della radura del falò: si cuoce, si mangia
  marshmallow: { nome: "Marshmallow", icona: "marshmallow" },
  // il castello abbandonato: la chiave della sala del trono, e la fede delle nozze
  ottone: { nome: "Chiave della sala del trono", icona: "brasskey" },
  fede: { nome: "Fede nuziale", icona: "ring" },
};
const OGGETTI_SPECIALI_IDS = ["lettera", "chiave", "uovo"];   // quelli che regala lo sconosciuto
