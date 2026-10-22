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
};

// Un oggetto a caso: nelle rovine solo cose antiche, nel bosco di tutto
function oggettoACaso(r, rovine) {
  const ids = Object.keys(OGGETTI).filter((id) => !rovine || OGGETTI[id].rovine);
  return ids[Math.floor(r() * ids.length)];
}

// Gli oggetti speciali, che ti dà la gente in città: vanno nello zaino. Provvisori: la lista vera arriverà
const OGGETTI_SPECIALI = {
  bussola: { nome: "Bussola che punta a sud", icona: "compass" },
  lettera: { nome: "Lettera sigillata", icona: "scroll" },
  chiave: { nome: "Chiave arrugginita", icona: "key" },
  uovo: { nome: "Uovo maculato", icona: "egg" },
};
const OGGETTI_SPECIALI_IDS = Object.keys(OGGETTI_SPECIALI);
