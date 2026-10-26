// La versione del gioco, mostrata nel menu e nella barra in alto, e le sue novità: alla prima
// accensione di una versione nuova compaiono come "Patch note" (le stesse di PATCH-NOTE.md)
const VERSIONE = "v0.13";
conconst NOVITA = [
  "<b>Ogni specie ha la sua regola</b>: i gabbiani solo sulle coste delle isole col porto, i corvi solo nelle paludi, e così via. Un viaggio può non averli tutti.",
  "<b>Primi passi</b>: alla prima isola, qualche finestrella al momento giusto.",
  "<b>La prima volta in città</b> fai il giro delle botteghe, con una freccia che le indica.",
  "<b>Il benvenuto</b> è più corto: chi sei, lo scopo e i tasti.",
];cument.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
