// Gli uccelli del taccuino: 8 specie (con la loro icona) e 51 varianti (con i loro colori).
// Ogni variante vive in un bioma (o ovunque), a volte vuole una caratteristica della zona,
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
  u(4, "pettirosso", "Pettirosso zampe rosse", "#e05a4a", ["alba"], "palude", null,
    "Impronte rosse nel fango.", "Non si bagna mai le piume, solo le zampe."),
  u(5, "pettirosso", "Pettirosso dell'alba", "#f4b04a", ["alba"], null, null,
    "Canta solo quando il cielo schiarisce, ovunque.", "Dicono che sia lui a svegliare il sole."),
  u(6, "pettirosso", "Pettirosso cenerino", "#8a8a8a", ["alba"], null, "vulcano",
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
  u(12, "gufo", "Gufo muto", "#d8c8a0", ["notte", "alba"], "deserto", null,
    "Piume chiare sulle pietre, nessun verso.", "Non ha mai detto una parola. Nemmeno uh."),
  u(13, "gufo", "Gufo del plenilunio", "#e8e0b0", ["notte"], null, "lago",
    "Si specchia nell'acqua ferma.", "Esce solo quando la luna è piena nel lago.", { latino: "Bubo selenicus plenus", rara: true }),

  u(14, "airone", "Airone comune", "#a8b0b8", ["alba", "pomeriggio"], "palude", null,
    "Una zampa sola nell'acquitrino.", "Aspetta il pesce da un'ora. E aspetterà."),
  u(15, "airone", "Airone ali di vapore", "#d8e4ec", ["alba"], "ghiaccio", null,
    "Un velo di nebbia che si alza dal ghiaccio.", "Quando vola sembra fumare."),
  u(16, "airone", "Airone becco nero", "#7a8494", ["pomeriggio"], null, "fiume",
    "Pesci a metà sulla riva del fiume.", "Ha il becco tinto d'inchiostro, dice qualcuno."),
  u(17, "airone", "Airone ardito", "#5a7a9a", ["pomeriggio"], "tropicale", null,
    "Lunghe impronte a tre dita nel fango caldo.", "Ruba i pesci ai coccodrilli."),
  u(18, "airone", "Airone tre creste", "#b8c8d0", ["alba"], null, "lago",
    "Tre piume sottili sulla riva di un lago.", "Le creste si alzano quando è offeso."),
  u(19, "airone", "Airone fumoso", "#8a94a0", ["alba"], null, "cascata",
    "Nella nebbia della cascata, una sagoma lunga.", "Nessuno l'ha visto fuori dagli spruzzi.", { latino: "Ardea nebulosa fumosa", rara: true }),

  u(20, "cinciallegra", "Cinciallegra comune", "#e8d040", ["pomeriggio"], "foresta", null,
    "Un tintinnio allegro tra i rami.", "Batte sulle ghiande come su un campanello."),
  u(21, "cinciallegra", "Cinciallegra becco verde", "#7ac860", ["alba"], "tropicale", null,
    "Semi spaccati con un becco minuscolo.", "Il becco cambia colore quando piove."),
  u(22, "cinciallegra", "Cinciallegra canterina", "#f0e070", ["alba", "pomeriggio"], "taiga", null,
    "Un canto che non finisce mai, tra gli abeti.", "Conosce trecento strofe. Tutte uguali."),
  u(23, "cinciallegra", "Cinciallegra petto a goccia", "#a0c8e0", ["pomeriggio"], "palude", null,
    "Gocce che cadono dalle canne, ma non piove.", "Ha sul petto una goccia che non si asciuga."),
  u(24, "cinciallegra", "Cinciallegra unghie sonanti", "#c0d8e8", ["pomeriggio"], "ghiaccio", null,
    "Ticchettii sul ghiaccio, come piccoli chiodi.", "Cammina sul ghiaccio suonandolo."),
  u(25, "cinciallegra", "Cinciallegra prismatica", "#c8a8f0", ["pomeriggio"], "ghiaccio", "lago",
    "Arcobaleni sul lago gelato, senza sole.", "Le piume scompongono la luce come vetro.", { latino: "Parus vitreus iridis", rara: true }),

  u(26, "corvo", "Corvo comune", "#3a3a40", ["pomeriggio"], null, null,
    "Gracchiare lontano, dove capita.", "Si ricorda le facce. Anche la tua."),
  u(27, "corvo", "Corvo riflesso viola", "#6a4a8a", ["pomeriggio"], "tropicale", null,
    "Una penna nera che al sole diventa viola.", "Si vanta del colore con gli altri corvi."),
  u(28, "corvo", "Corvo campanone", "#4a4038", ["alba"], null, "villaggio",
    "Un verso grave come una campana, vicino alle case.", "I paesani rimettono gli orologi col suo verso."),
  u(29, "corvo", "Corvo calzato bianco", "#2a2a30", ["pomeriggio"], "ghiaccio", null,
    "Impronte nere che finiscono in calze bianche.", "Ha le zampe bianche, per non sporcarsi di neve."),
  u(30, "corvo", "Corvo del vespro", "#5a3a3a", ["notte"], "deserto", null,
    "Un gracchio quando il sole cala sulle dune.", "Annuncia la sera, poi va a dormire."),
  u(31, "corvo", "Corvo segnaore", "#8a7ac8", ["pomeriggio"], null, "castello",
    "Batte le ore dai merli di un castello.", "Non sbaglia un'ora da cent'anni.", { latino: "Corvus campanarius horologius", rara: true }),

  u(32, "colibri", "Colibrì d'ambra", "#e8a030", ["pomeriggio"], "tropicale", null,
    "Un ronzio dorato tra i fiori.", "Brilla come resina al sole."),
  u(33, "colibri", "Colibrì gola d'oro", "#f4d040", ["alba"], "deserto", null,
    "Fiori di cactus aperti all'alba, già visitati.", "Beve la rugiada prima che evapori."),
  u(34, "colibri", "Colibrì arancio", "#f07a30", ["pomeriggio"], "foresta", null,
    "Un lampo arancione tra le more.", "Si ferma a mezz'aria come appeso a un filo."),
  u(35, "colibri", "Colibrì becco corto", "#a0a040", ["pomeriggio"], "palude", null,
    "Fiori d'acqua morsicati, non succhiati.", "Il becco corto lo costringe all'impegno."),
  u(36, "colibri", "Colibrì ali lilla", "#c8a0e0", ["alba"], "tropicale", "cascata",
    "Ali lilla negli spruzzi d'acqua.", "Si fa la doccia sotto la cascata."),
  u(37, "colibri", "Colibrì fossile", "#b08a4a", ["pomeriggio"], "deserto", "rovine",
    "Una piuma dura come pietra, tra le rovine.", "Sembra scolpito nell'ambra antica.", { latino: "Trochilus ambrinus fossilis", rara: true }),

  u(38, "gabbiano", "Gabbiano comune", "#e6e2d4", ["pomeriggio"], null, null,
    "Strilla sulle coste, dovunque.", "Ruba il pane ai marinai, e non se ne vergogna."),
  u(39, "gabbiano", "Gabbiano punte nere", "#c8ccd0", ["alba"], "taiga", null,
    "Penne con la punta nera lungo le rive dei pini.", "Vola basso quando arriva la nebbia."),
  u(40, "gabbiano", "Gabbiano becco a saetta", "#d8e0e8", ["pomeriggio"], "ghiaccio", null,
    "Un becco giallo a zigzag inciso nel ghiaccio.", "Pesca tra i lastroni con un colpo solo.", { latino: "Larus procellae fulgur" }),
  u(41, "gabbiano", "Gabbiano ladro", "#b8b0a0", ["pomeriggio"], null, "villaggio",
    "Lische rubate sui tetti del villaggio.", "Ruba anche quello che non mangia."),
  u(42, "gabbiano", "Gabbiano controvento", "#a8b8c8", ["alba"], null, "montagne",
    "Fermo nel vento sopra le alture.", "Vola all'indietro, quando gli conviene."),
  u(43, "gabbiano", "Gabbiano elettrico", "#4a9be8", ["notte"], null, null,
    "Lampi azzurri sul mare, nelle notti di temporale.", "Toccarlo fa rizzare i capelli.", { latino: "Larus procellae fulmineus", rara: true }),

  u(44, "fenice", "Fenice minore", "#e8602a", ["pomeriggio"], "deserto", null,
    "Sabbia vetrificata a forma d'ala.", "Piccola, ma scotta lo stesso."),
  u(45, "fenice", "Fenice carbone", "#3a2a2a", ["notte"], null, "vulcano",
    "Brace che si muove da sola, vicino alla lava.", "Si accende solo quando si arrabbia."),
  u(46, "fenice", "Fenice coda mozza", "#f08a4a", ["alba"], "tropicale", null,
    "Una coda bruciata a metà, ancora tiepida.", "Rinasce ogni volta un po' più corta.", { latino: "Phoenix minor renata" }),
  u(47, "fenice", "Fenice testa d'oro", "#f4c040", ["alba"], "deserto", null,
    "Una luce dorata sulle dune prima del sole.", "La testa brilla anche al buio."),
  u(48, "fenice", "Fenice tiepida", "#e8a080", ["pomeriggio"], "foresta", null,
    "Foglie appena scaldate, non bruciate.", "La fenice più gentile: non incendia niente."),
  u(49, "fenice", "Fenice occhi di rubino", "#c02a3a", ["notte"], null, "rovine",
    "Due punti rossi nel buio delle rovine.", "Gli occhi valgono più di una nave, dicono."),
  u(50, "fenice", "Fenice eterna", "#f4702a", ["notte"], null, "vulcano",
    "Una piuma ancora calda, vicino alla lava.", "Nessuno l'ha mai vista spegnersi.", { latino: "Phoenix minor aeterna", rara: true }),
];

const iconaUccello = (u) => SPECIE[u.specie].icona;

// Dove vive, a parole: il bioma e la caratteristica che cerca
const habitatUccello = (u) => [u.bioma ? BIOMI[u.bioma].nome : null, u.tratto].filter(Boolean).join(", ") || "ovunque";

// Una zona va bene per un uccello se ne rispetta il bioma e la caratteristica
const zonaAdatta = (u, tags, biome) => (!u.bioma || u.bioma === biome) && (!u.tratto || tags.has(u.tratto));

// L'uccello di una zona (mai un raro: quelli arrivano con le voci): tra quelli adatti al bioma e alle caratteristiche, chi vuole una caratteristica ha un po' di precedenza
function uccelloPerZona(tags, biome, r) {
  const fits = UCCELLI.filter((u) => !u.rara && zonaAdatta(u, tags, biome));
  const special = fits.filter((u) => u.tratto);
  const pool = special.length && r() < 0.5 ? special : fits.filter((u) => !u.tratto);
  const list = pool.length ? pool : fits;
  return list.length ? list[Math.floor(r() * list.length)] : null;
}
