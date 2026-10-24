// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.8";
const NOVITA = [
  "<b>Gli animali gironzolano</b>: scelgono una meta e ci vanno barcollando, poi si fermano ad annusare. Il branco di lupi va insieme.",
  "Dalla 0.12.7: non sanno dove sei finché non ti vedono, sentono o fiutano; sul globo c'è il castello.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
