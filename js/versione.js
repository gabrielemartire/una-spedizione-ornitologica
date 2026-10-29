// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.13.2";
const NOVITA = [
  "<b>Sul globo, nuove icone</b>: un fuoco segna il falò, una campana d'oro il Forte e una campana d'oro rosso il porticciolo.",
  "Sul castello visitato resta il castello, e sul labirinto non compare più il punto di domanda.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
