// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.13.1";
const NOVITA = [
  "<b>Sul globo c'è il marshmallow</b>: un marshmallow sullo stecco segna la zona del falò, così si sa dove andare a cuocerlo.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
