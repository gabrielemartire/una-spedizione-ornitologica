// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.9";
const NOVITA = [
  "<b>La fine del gioco</b>: a taccuino completo arriva una busta della Società (in alto a destra sul globo, L). Al Forte ti aspetta l'attestato di Ornitologo esperto.",
  "<b>I timbri</b>: un capitolo nuovo del taccuino, sei timbri da scoprire.",
  "<b>La radura del falò</b>, da qualche parte nell'interno: un marshmallow da cuocere e mangiare (M).",
  "<b>All'emporio</b> pesce in scatola (M, due cuori) e tagliole (T).",
  "<b>Sulle spiagge caraibiche</b> a volte c'è una bottiglia con un messaggio. La pala è nello zaino: si scava con X.",
];
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
