// Gli uccelli del taccuino: 8 specie (con la loro icona) e 51 varianti (con i loro colori),
// più 6 uccelli singoli nella specie "altro", ognuno con la sua icona.
// Ogni specie ha la sua regola, sempre la stessa: i gabbiani solo sulle coste delle isole col porto,
// i corvi solo nelle paludi, gli aironi dove c'è acqua, i gufi di notte, i colibrì ai tropici e nel deserto,
// le fenici nel deserto e sui vulcani, i pettirossi nei boschi e nei villaggi, le cinciallegre nella taiga e sul
// ghiaccio. Ogni variante vive in un bioma (o in più d'uno), a volte vuole una caratteristica della zona,
// e si fa vedere solo in certi momenti del giorno. Ogni specie ha un uccello raro, che si trova
// solo seguendo una voce. Gli id non cambiano mai: il codice del taccuino si baserà su di essi.
// Espone gli oggetti globali `SPECIE` e `UCCELLI`.
const SPECIE = {
  pettirosso: { nome: "Pettirosso", latino: "Erithacus ignifer", icona: "sparrow" },
  gufo: { nome: "Gufo selenicus", latino: "Bubo selenicus", icona: "owl" },
  airone: { nome: "Airone di nebbia", latino: "Ardea nebulosa", icona: "heron" },
  cinciallegra: { nome: "Cinciallegra di vetro", latino: "Parus vitreus", icona: "tit" },
  corvo: { nome: "Corvo dei campanili", latino: "Corvus campanarius", icona: "raven" },
  colibri: { nome: "Colibrì d'ambra", latino: "Trochilus ambrinus", icona: "bird" },
  gabbiano: { nome: "Gabbiano di tempesta", latino: "Larus procellae", icona: "seagull" },
  fenice: { nome: "Fenice", latino: "Phoenix minor", icona: "phoenix" },
  // uccelli singoli, ognuno con la sua icona e senza un raro
  altro: { nome: "Altri uccelli", latino: "Aves variae", icona: "bird" },
};

// colore: il piumaggio; rara: si trova solo con una voce, non lascia tracce a terra
const u = (id, specie, nome, colore, ore, bioma, tratto, indizio, curiosita, extra = {}) =>
  ({ id, specie, nome, colore, ore, bioma, tratto, indizio, curiosita, ...extra });

const UCCELLI = [
  u(0, "pettirosso", "Pettirosso comune", "#d8643a", ["alba", "pomeriggio"], "foresta", null,
    "Un trillo breve tra i faggi.", "Segue chi zappa la terra, per i vermi."),
  u(1, "pettirosso", "Pettirosso petto pesca", "#f0a878", ["pomeriggio"], "tropicale", null,
    "Una piuma rosata tra le foglie larghe.", "Profuma di frutta, giurano i marinai."),
  u(2, "pettirosso", "Pettirosso fronte grigia", "#9a8a80", ["alba"], "taiga", null,
    "Un canto sottile tra i pini.", "Si arruffa come un gomitolo quando gela."),
  u(3, "pettirosso", "Pettirosso maggiore", "#c04a2a", ["pomeriggio"], "foresta", "villaggio",
    "Becca le briciole vicino alle case.", "Il doppio degli altri, e lo sa."),
  u(4, "pettirosso", "Pettirosso zampe rosse", "#e05a4a", ["alba"], "foresta", "fiume",
    "Impronte rosse nel fango del ruscello.", "Non si bagna mai le piume, solo le zampe."),
  u(5, "pettirosso", "Pettirosso dell'alba", "#f4b04a", ["alba"], ["foresta", "taiga", "tropicale"], null,
    "Canta solo quando il cielo schiarisce, in ogni bosco.", "Dicono che sia lui a svegliare il sole."),
  u(6, "pettirosso", "Pettirosso cenerino", "#8a8a8a", ["alba"], ["foresta", "taiga", "tropicale"], "vulcano",
    "Cenere che vola contro vento.", "Fa il nido nella pietra ancora calda.", { latino: "Erithacus ignifer cinereus", rara: true }),

  u(7, "gufo", "Gufo comune", "#b08a5a", ["notte"], "foresta", null,
    "Borre di ossicini sotto gli alberi.", "Gira la testa più di quanto sembri decoroso."),
  u(8, "gufo", "Gufo lunare bianco", "#f2f2ea", ["notte"], "ghiaccio", null,
    "Un'impronta d'ala sulla neve fresca.", "Non lo vedi finché non apre gli occhi."),
  u(9, "gufo", "Gufo orecchie storte", "#a8885a", ["notte"], "palude", null,
    "Ciuffi di piume impigliati nelle canne.", "Sente meglio da un orecchio solo."),
  u(10, "gufo", "Gufo lunare scuro", "#4a4a6a", ["notte"], "taiga", null,
    "Un'ombra che passa tra i tronchi, senza rumore.", "Nelle notti senza luna è invisibile."),
  u(11, "gufo", "Gufo occhi spaiati", "#c8a050", ["notte"], null, "rovine",
    "Uno sguardo giallo e uno verde tra i muri crollati.", "Un occhio veglia, l'altro sogna."),
  u(12, "gufo", "Gufo muto", "#d8c8a0", ["notte"], "deserto", null,
    "Piume chiare sulle pietre, nessun verso.", "Non ha mai detto una parola. Nemmeno uh."),
  u(13, "gufo", "Gufo del plenilunio", "#e8e0b0", ["notte"], null, "lago",
    "Si specchia nell'acqua ferma.", "Esce solo quando la luna è piena nel lago.", { latino: "Bubo selenicus plenus", rara: true }),

  u(14, "airone", "Airone comune", "#a8b0b8", ["alba", "pomeriggio"], "palude", null,
    "Una zampa sola nell'acquitrino.", "Aspetta il pesce da un'ora. E aspetterà."),
  u(15, "airone", "Airone ali di vapore", "#d8e4ec", ["alba"], "ghiaccio", "fiume",
    "Un velo di nebbia che si alza dal fiume gelato.", "Quando vola sembra fumare."),
  u(16, "airone", "Airone becco nero", "#7a8494", ["pomeriggio"], null, "fiume",
    "Pesci a metà sulla riva del fiume.", "Ha il becco tinto d'inchiostro, dice qualcuno."),
  u(17, "airone", "Airone ardito", "#5a7a9a", ["pomeriggio"], "tropicale", "fiume",
    "Lunghe impronte a tre dita nel fango caldo del fiume.", "Ruba i pesci ai coccodrilli."),
  u(18, "airone", "Airone tre creste", "#b8c8d0", ["alba"], null, "lago",
    "Tre piume sottili sulla riva di un lago.", "Le creste si alzano quando è offeso."),
  u(19, "airone", "Airone fumoso", "#8a94a0", ["alba"], null, "cascata",
    "Nella nebbia della cascata, una sagoma lunga.", "Nessuno l'ha visto fuori dagli spruzzi.", { latino: "Ardea nebulosa fumosa", rara: true }),

  u(20, "cinciallegra", "Cinciallegra comune", "#e8d040", ["pomeriggio"], "taiga", null,
    "Un tintinnio allegro tra i pini.", "Batte sulle ghiande come su un campanello."),
  u(21, "cinciallegra", "Cinciallegra becco verde", "#7ac860", ["alba"], "ghiaccio", null,
    "Semi spaccati con un becco minuscolo, sulla neve.", "Il becco cambia colore quando nevica."),
  u(22, "cinciallegra", "Cinciallegra canterina", "#f0e070", ["alba"], "taiga", null,
    "Un canto che non finisce mai, tra gli abeti.", "Conosce trecento strofe. Tutte uguali."),
  u(23, "cinciallegra", "Cinciallegra petto a goccia", "#a0c8e0", ["pomeriggio"], "taiga", "lago",
    "Gocce che cadono dai pini sul lago, ma non piove.", "Ha sul petto una goccia che non si asciuga."),
  u(24, "cinciallegra", "Cinciallegra unghie sonanti", "#c0d8e8", ["pomeriggio"], "ghiaccio", null,
    "Ticchettii sul ghiaccio, come piccoli chiodi.", "Cammina sul ghiaccio suonandolo."),
  u(25, "cinciallegra", "Cinciallegra prismatica", "#c8a8f0", ["pomeriggio"], "ghiaccio", "lago",
    "Arcobaleni sul lago gelato, senza sole.", "Le piume scompongono la luce come vetro.", { latino: "Parus vitreus iridis", rara: true }),

  u(26, "corvo", "Corvo comune", "#3a3a40", ["pomeriggio"], "palude", null,
    "Gracchiare lontano, tra le canne.", "Si ricorda le facce. Anche la tua."),
  u(27, "corvo", "Corvo riflesso viola", "#6a4a8a", ["alba"], "palude", null,
    "Una penna nera che all'alba diventa viola.", "Si vanta del colore con gli altri corvi."),
  u(28, "corvo", "Corvo campanone", "#4a4038", ["alba"], "palude", "villaggio",
    "Un verso grave come una campana, vicino alle case.", "I paesani rimettono gli orologi col suo verso."),
  u(29, "corvo", "Corvo calzato bianco", "#2a2a30", ["pomeriggio"], "palude", "fiume",
    "Impronte nere che finiscono in calze bianche, lungo il fiume.", "Ha le zampe bianche, e non se le sporca mai di fango."),
  u(30, "corvo", "Corvo del vespro", "#5a3a3a", ["notte"], "palude", null,
    "Un gracchio quando il sole cala sulle canne.", "Annuncia la sera, poi va a dormire."),
  u(31, "corvo", "Corvo segnaore", "#8a7ac8", ["pomeriggio"], "palude", "rovine",
    "Batte le ore da un campanile in rovina, nella palude.", "Non sbaglia un'ora da cent'anni.", { latino: "Corvus campanarius horologius", rara: true }),

  u(32, "colibri", "Colibrì d'ambra", "#e8a030", ["pomeriggio"], "tropicale", null,
    "Un ronzio dorato tra i fiori.", "Brilla come resina al sole."),
  u(33, "colibri", "Colibrì gola d'oro", "#f4d040", ["alba"], "deserto", null,
    "Fiori di cactus aperti all'alba, già visitati.", "Beve la rugiada prima che evapori."),
  u(34, "colibri", "Colibrì arancio", "#f07a30", ["alba"], "tropicale", null,
    "Un lampo arancione tra i fiori della giungla.", "Si ferma a mezz'aria come appeso a un filo."),
  u(35, "colibri", "Colibrì becco corto", "#a0a040", ["pomeriggio"], "deserto", "lago",
    "Fiori dell'oasi morsicati, non succhiati.", "Il becco corto lo costringe all'impegno."),
  u(36, "colibri", "Colibrì ali lilla", "#c8a0e0", ["alba"], "tropicale", "cascata",
    "Ali lilla negli spruzzi d'acqua.", "Si fa la doccia sotto la cascata."),
  u(37, "colibri", "Colibrì fossile", "#b08a4a", ["pomeriggio"], "deserto", "rovine",
    "Una piuma dura come pietra, tra le rovine.", "Sembra scolpito nell'ambra antica.", { latino: "Trochilus ambrinus fossilis", rara: true }),

  u(38, "gabbiano", "Gabbiano comune", "#e6e2d4", ["pomeriggio"], null, null,
    "Strilla sulle coste vicino ai porti.", "Ruba il pane ai marinai, e non se ne vergogna.", { porto: true }),
  u(39, "gabbiano", "Gabbiano punte nere", "#c8ccd0", ["alba"], null, null,
    "Penne con la punta nera sulla riva, all'alba.", "Vola basso quando arriva la nebbia.", { porto: true }),
  u(40, "gabbiano", "Gabbiano becco a saetta", "#d8e0e8", ["pomeriggio"], "ghiaccio", null,
    "Un becco giallo a zigzag inciso nel ghiaccio.", "Pesca tra i lastroni con un colpo solo.", { latino: "Larus procellae fulgur", porto: true }),
  u(41, "gabbiano", "Gabbiano ladro", "#b8b0a0", ["pomeriggio"], null, "villaggio",
    "Lische rubate sui tetti del villaggio.", "Ruba anche quello che non mangia.", { porto: true }),
  u(42, "gabbiano", "Gabbiano controvento", "#a8b8c8", ["alba"], null, "montagne",
    "Fermo nel vento sopra le alture.", "Vola all'indietro, quando gli conviene.", { porto: true }),
  u(43, "gabbiano", "Gabbiano elettrico", "#4a9be8", ["notte"], null, null,
    "Lampi azzurri sul mare vicino ai porti, nelle notti di temporale.", "Toccarlo fa rizzare i capelli.", { latino: "Larus procellae fulmineus", rara: true, porto: true }),

  u(44, "fenice", "Fenice minore", "#e8602a", ["pomeriggio"], "deserto", null,
    "Sabbia vetrificata a forma d'ala.", "Piccola, ma scotta lo stesso."),
  u(45, "fenice", "Fenice carbone", "#3a2a2a", ["notte"], null, "vulcano",
    "Brace che si muove da sola, vicino alla lava.", "Si accende solo quando si arrabbia."),
  u(46, "fenice", "Fenice coda mozza", "#f08a4a", ["alba"], null, "vulcano",
    "Una coda bruciata a metà, ancora tiepida, sotto il vulcano.", "Rinasce ogni volta un po' più corta.", { latino: "Phoenix minor renata" }),
  u(47, "fenice", "Fenice testa d'oro", "#f4c040", ["alba"], "deserto", null,
    "Una luce dorata sulle dune prima del sole.", "La testa brilla anche al buio."),
  u(48, "fenice", "Fenice tiepida", "#e8a080", ["pomeriggio"], null, "vulcano",
    "Foglie appena scaldate, non bruciate, ai piedi del vulcano.", "La fenice più gentile: non incendia niente."),
  u(49, "fenice", "Fenice occhi di rubino", "#c02a3a", ["notte"], "deserto", "rovine",
    "Due punti rossi nel buio delle rovine.", "Gli occhi valgono più di una nave, dicono."),
  u(50, "fenice", "Fenice eterna", "#f4702a", ["notte"], null, "vulcano",
    "Una piuma ancora calda, vicino alla lava.", "Nessuno l'ha mai vista spegnersi.", { latino: "Phoenix minor aeterna", rara: true }),

  u(51, "altro", "Kiwi notturno", "#8a6a44", ["notte"], "foresta", null,
    "Buchetti nel terriccio, come di un becco lungo.", "Non vola, e non sembra dispiacersene.", { latino: "Apteryx nocturna", icona: "kiwi" }),
  u(52, "altro", "Corridore delle dune", "#b89a6a", ["alba"], "deserto", null,
    "Impronte lunghissime, a passo di corsa.", "Corre più veloce della sua ombra.", { latino: "Struthio cursor", icona: "ostrich" }),
  u(53, "altro", "Gallo del villaggio", "#c8502a", ["alba"], null, "villaggio",
    "Un chicchirichì dietro le case.", "Canta all'alba, e anche quando non serve.", { latino: "Gallus vicanus", icona: "rooster" }),
  u(54, "altro", "Dodo", "#8a8a9a", ["pomeriggio"], "tropicale", null,
    "Gusci di frutta beccati, sotto le palme.", "Si fida di tutti. Troppo.", { latino: "Raphus fiducialis", icona: "dodo" }),
  u(55, "altro", "Gru di carta", "#e8e0d0", ["alba"], "palude", null,
    "Una piega bianca tra le canne.", "Leggera come un foglio, e piegata con cura.", { latino: "Grus chartacea", icona: "crane" }),
  u(56, "altro", "Oca del lago", "#d8d8c8", ["pomeriggio"], null, "lago",
    "Starnazzi sulla riva del lago.", "Fa la guardia meglio di un cane.", { latino: "Anser lacustris", icona: "goose" }),
  // non vive in nessuna zona: nasce dall'uovo maculato, dopo tredici giorni nello zaino
  u(57, "altro", "Pulcino", "#f2d04a", ["alba", "pomeriggio", "notte"], null, null,
    "", "Pigola dietro a chi l'ha covato, convinto che sia sua madre.", { latino: "Pullus ovi maculati", icona: "chick", uovo: true }),
];

const iconaUccello = (u) => u.icona || SPECIE[u.specie].icona;

// I biomi di un uccello: uno, più d'uno (un elenco) o nessuno (ovunque)
const biomiUccello = (u) => (u.bioma == null ? [] : [].concat(u.bioma));

// Dove vive, a parole: il bioma, la caratteristica che cerca, e i gabbiani solo sulle coste delle isole col porto
const habitatUccello = (u) => u.uovo ? "nato dall'uovo"
  : [biomiUccello(u).map((b) => BIOMI[b].nome).join(" o ") || null, u.porto ? "coste delle isole col porto" : null, u.tratto].filter(Boolean).join(", ") || "ovunque";

// Una zona va bene per un uccello se ne rispetta il bioma, la caratteristica e (per i gabbiani) il porto.
// zone = { tags, biome, coast: tocca il mare, port: sta su un'isola con una città }
const zonaAdatta = (u, zone) => {
  const biomi = biomiUccello(u);
  return (!biomi.length || biomi.includes(zone.biome)) && (!u.tratto || zone.tags.has(u.tratto)) && (!u.porto || (zone.coast && zone.port));
};

// L'uccello di una zona (mai un raro: quelli arrivano con le voci): tra quelli adatti al bioma e alle caratteristiche, chi vuole una caratteristica ha un po' di precedenza
function uccelloPerZona(zone, r) {
  const fits = UCCELLI.filter((u) => !u.rara && !u.uovo && zonaAdatta(u, zone));
  const special = fits.filter((u) => u.tratto);
  const pool = special.length && r() < 0.5 ? special : fits.filter((u) => !u.tratto);
  const list = pool.length ? pool : fits;
  return list.length ? list[Math.floor(r() * list.length)] : null;
}
