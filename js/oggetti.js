// Gli oggetti che si trovano a terra (nei boschi a volte, nelle rovine sempre) e finiscono in stiva.
// Servono a essere venduti al mercato, o dati a un mercante in cambio di una voce.
// cat: il porticciolo non compra l'arte, roba da città.
// Espone l'oggetto globale `OGGETTI`.
const OGGETTI = {
  spada: { nome: "Spada cerimoniale", icona: "sword", cat: "reliquia", rovine: true },
  calice: { nome: "Calice ingemmato", icona: "chalice", cat: "reliquia", rovine: true },
  ciondolo: { nome: "Ciondolo di pietra", icona: "pendant", cat: "reliquia", rovine: true },
  moneta: { nome: "Moneta antica", icona: "coin", cat: "reliquia", rovine: true },
  maschera: { nome: "Maschera rituale", icona: "mask", cat: "arte", rovine: true },
  vaso: { nome: "Vaso dipinto", icona: "vase", cat: "arte", rovine: true },
  idolo: { nome: "Idolo di pietra", icona: "statue", cat: "arte", rovine: true },
  coccio: { nome: "Ceramica dipinta", icona: "pottery", cat: "arte" },
  mappa: { nome: "Mappa strappata", icona: "map", cat: "carta" },
  lanterna: { nome: "Lanterna vecchia", icona: "lantern", cat: "utensile" },
  piume: { nome: "Mazzo di piume", icona: "feathers", cat: "natura" },
  teschio: { nome: "Teschio di bestia", icona: "skull", cat: "natura" },
  pelliccia: { nome: "Pelliccia", icona: "furs", cat: "natura" },
  erbe: { nome: "Erbe rare", icona: "herbs", cat: "natura" },
};

// Un oggetto a caso: nelle rovine solo cose antiche, nel bosco di tutto
function oggettoACaso(r, rovine) {
  const ids = Object.keys(OGGETTI).filter((id) => !rovine || OGGETTI[id].rovine);
  return ids[Math.floor(r() * ids.length)];
}
