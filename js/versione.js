// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.4.3";
const NOVITA = [
  "<b>Il porticciolo</b> è attaccato alla terraferma in alto, sulla riva innevata con gli abeti: le passerelle partono da lì.",
  "<b>Più pontili per le barche</b>: tre sul mare a est e uno a ovest, coi pescherecci ormeggiati accanto.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
