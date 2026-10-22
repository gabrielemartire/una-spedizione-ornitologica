// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.4.2";
const NOVITA = [
  "<b>Il porticciolo</b> sta tutto sull'acqua: due passerelle di legno, ognuna con la sua fila di case, il mare da tutti e due i lati, un pontile e i pescherecci.",
  "La taverna del porticciolo ora è la <b>Taverna Pesce Sgozzato</b>, su palafitte sul mare.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
