// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.6.1";
const NOVITA = [
  "<b>Il mercante</b> ora è sempre una persona, con accanto il suo carretto di merce: occupa due caselle, e si parla con lui andando contro l'uno o l'altro.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
