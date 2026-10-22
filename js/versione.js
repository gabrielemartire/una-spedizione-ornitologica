// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.5";
const NOVITA = [
  "<b>Gli oggetti magici</b> dello sconosciuto col punto esclamativo (uno per tipo a partita): la lettera, la chiave e l'uovo. La bussola non c'è più.",
  "<b>La lettera</b> va consegnata alla donna della torre: in ogni mappa c'è una torre, ti avvicini e lei si affaccia. Senza lettera piange; con la lettera ti bacia e hai un cuore rosa in più, per sempre.",
  "<b>La chiave</b> apre i forzieri chiusi (circa uno ogni 8 zone): dentro un oggetto rituale e qualche moneta. Resta per tutta la partita.",
  "<b>L'uovo</b> dopo 13 giorni si schiude: nel taccuino arriva il Pulcino.",
  "<b>L'emporio</b> è aperto: sul tavolo i semi (5 m.o.). Dove un uccello è volato via, spargili con E e aspetta un momento: l'uccello torna nella zona.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
