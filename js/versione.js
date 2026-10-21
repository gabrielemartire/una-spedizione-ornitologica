// La versione del gioco, mostrata nel menu e nella barra in alto
const VERSIONE = "v0.2.1";
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = VERSIONE; });
