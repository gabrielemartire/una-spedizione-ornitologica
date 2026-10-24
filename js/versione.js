// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.11.5";
const NOVITA = [
  "<b>Acqua nera a babordo</b>: andando al largo capita più spesso (una volta su 8).",
  "Dalla 0.11.4: il mare sulla battlemap sta dal lato giusto, col nord in alto, e c'è la bussola.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
