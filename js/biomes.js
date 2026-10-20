// I biomi: come appare e com'è fatta una zona, sul globo, nella cartolina e sulla battlemap.
// Tutti i colori sono quelli del pomeriggio: alba e notte li tingono altrove.
// Espone l'oggetto globale `BIOMI`.
const BIOMI = {
  foresta: {
    nome: "Foresta",
    luoghi: ["Radura", "Bosco", "Radura sul ruscello"],
    globo: { low: "#6f9a44", high: "#3e6a2f", shore: "#d6c288" },
    cartolina: {},
    albero: "pino",
    mappa: {
      tree: ["beech", "pine"], tall: "grass", bush: "bush", water: "water",
      trees: 16, talls: 12, bushes: 40, rocks: 20, pools: 0,
      colors: { ground: "#121c10", dark: "#2c4a24", mid: "#6f9a4c", light: "#d9e4b0", water: "#4f8a9a", deep: "#24485a" },
    },
  },
  taiga: {
    nome: "Taiga",
    luoghi: ["Pineta", "Pineta nella nebbia", "Bosco scuro"],
    globo: { low: "#4f7458", high: "#2c4a36", shore: "#9a9a88" },
    cartolina: {
      hillLight: "#5f7a62", hill: "#47604c", hillShadow: "#344a3a", ground: "#2c3e30", groundDark: "#1f2e24",
      treeFar: "#2e4a3a", treeFarShadow: "#203629", tree: "#1f3a2c", treeShadow: "#13261c",
      grass: "#7a9a78", grassDark: "#4e6a52", haze: "#c4d2d6", flower: "#d8dccc", flower2: "#b8c4c0",
    },
    nebbia: true,
    albero: "pino",
    mappa: {
      tree: ["pine"], tall: "fern", bush: "bush", water: "water",
      trees: 22, talls: 6, bushes: 30, rocks: 26, pools: 0,
      colors: { ground: "#101a16", dark: "#24402f", mid: "#5f8a6c", light: "#d0dcd2", water: "#4a7a8e", deep: "#22405a" },
    },
  },
  ghiaccio: {
    nome: "Isola ghiacciata",
    luoghi: ["Banchisa", "Fiordo ghiacciato", "Distesa di neve"],
    globo: { low: "#e6eef2", high: "#ffffff", shore: "#b8c8d2" },
    cartolina: {
      hillLight: "#f2f6f8", hill: "#d6e2ea", hillShadow: "#aebfcc", ground: "#c4d4de", groundDark: "#9cb0c0",
      treeFar: "#3c5a58", treeFarShadow: "#2a4442", tree: "#2c4a46", treeShadow: "#1c3432",
      water: "#9ec8dc", waterLight: "#e8f6fa", waterDark: "#6e9cb4", foam: "#ffffff",
      grass: "#e8f0f4", grassDark: "#b4c6d2", flower: "#ffffff", flower2: "#dce8f0", haze: "#e4eef4",
      rock: "#7e8a96", rockLight: "#a8b4be", rockDark: "#56626e",
    },
    neve: true,
    albero: "pino",
    mappa: {
      tree: ["pine"], tall: null, bush: "bush", water: "ice",
      trees: 6, talls: 0, bushes: 12, rocks: 32, pools: 0,
      colors: { ground: "#1c2630", dark: "#3e5262", mid: "#a8c0d0", light: "#f2f8fc", water: "#7fb0c8", deep: "#2e5a78" },
    },
  },
  palude: {
    nome: "Palude",
    luoghi: ["Palude", "Acquitrino", "Canneto"],
    globo: { low: "#6b7a46", high: "#4e5a34", shore: "#7a7452" },
    cartolina: {
      hillLight: "#6e7448", hill: "#585e3a", hillShadow: "#42482c", ground: "#3a4028", groundDark: "#2a2e1c",
      treeFar: "#4a4e34", treeFarShadow: "#363a26", tree: "#3e3a2a", treeShadow: "#2a271c",
      water: "#5a6e58", waterLight: "#8a9a74", waterDark: "#3e4e3c",
      grass: "#8a8e52", grassDark: "#5e6238", haze: "#a8ae90", flower: "#c8c070", flower2: "#a0a878",
    },
    nebbia: true,
    albero: "secco",
    mappa: {
      tree: ["deadtree"], tall: "reed", bush: "bush", water: "water",
      trees: 8, talls: 26, bushes: 18, rocks: 6, pools: 12,
      colors: { ground: "#16180e", dark: "#3a4022", mid: "#8a8e52", light: "#dcdcb0", water: "#5e7462", deep: "#2e3e30" },
    },
  },
  tropicale: {
    nome: "Isola tropicale",
    luoghi: ["Spiaggia delle palme", "Giungla", "Laguna"],
    globo: { low: "#4fae4a", high: "#2a7a34", shore: "#f2e2a8", shallow: "#3fc0c8" },
    cartolina: {
      hillLight: "#7acc4a", hill: "#4fa63a", hillShadow: "#3a8030", ground: "#2e7a2a", groundDark: "#22601f",
      treeFar: "#2e8a3a", treeFarShadow: "#1f6a2c", tree: "#3a8a2a", treeShadow: "#145020", trunk: "#8a6a3a",
      water: "#3fb8c4", waterLight: "#a8eef0", waterDark: "#2a8a9e",
      grass: "#9ae05a", grassDark: "#5aae3a", flower: "#ff6a8a", flower2: "#ffd24a",
    },
    albero: "palma",
    mappa: {
      tree: ["palm"], tall: "fern", bush: "bush", water: "water",
      trees: 18, talls: 16, bushes: 48, rocks: 10, pools: 0,
      colors: { ground: "#10220e", dark: "#2a5a22", mid: "#6fc24a", light: "#e8f4b0", water: "#3fb0bc", deep: "#1e6a7a" },
    },
  },
  deserto: {
    nome: "Deserto",
    luoghi: ["Dune", "Oasi", "Pietraia"],
    globo: { low: "#e0c27a", high: "#c49a56", shore: "#f0dca0" },
    cartolina: {
      hillLight: "#f2d494", hill: "#dcb46e", hillShadow: "#b88e52", ground: "#d0a862", groundDark: "#a8824a",
      treeFar: "#a8904e", treeFarShadow: "#8a7440", tree: "#5a8a4a", treeShadow: "#3e6a36",
      grass: "#c8b06a", grassDark: "#a08850", haze: "#f2e2bc", flower: "#e86a4a", flower2: "#f2c060",
      rock: "#a07a5a", rockLight: "#c49a74", rockDark: "#7a5a42",
    },
    secco: true,
    albero: "cactus",
    mappa: {
      tree: ["cactus"], tall: "grass", bush: "bush", water: "water",
      trees: 6, talls: 6, bushes: 14, rocks: 36, pools: 0,
      colors: { ground: "#2a2012", dark: "#6a5230", mid: "#d0aa62", light: "#f6e6c0", water: "#4fa0aa", deep: "#2a5a6a" },
    },
  },
};

// Il bioma di un'isola dipende soprattutto dalla latitudine, con un po' di caso
function biomaPerLatitudine(lat, r) {
  const a = Math.abs(lat);
  if (a > 48) return "ghiaccio";
  if (a > 36) return r() < 0.75 ? "taiga" : "ghiaccio";
  if (a > 22) return r() < 0.6 ? "foresta" : r() < 0.6 ? "palude" : "taiga";
  if (a > 10) return r() < 0.45 ? "foresta" : r() < 0.5 ? "deserto" : "palude";
  return r() < 0.6 ? "tropicale" : "deserto";
}
