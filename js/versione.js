// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.12.1";
const NOVITA = [
  "<b>Il castello è un labirinto</b> di cunicoli, con le stanze dietro porte nel muro, ed è <b>tutto buio</b> finché non ci passi.",
  "Alla festa delle nozze c'è solo gente: l'unicorno e il mostro restano nel loro labirinto.",
  "Dalla 0.12: il labirinto di siepi, il castello abbandonato e una dama che aspetta.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
