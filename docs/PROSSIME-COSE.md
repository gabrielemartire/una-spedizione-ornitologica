# Prossime cose

Lista di lavoro. Le idee nascono nella chat di progetto; il quadro completo è nel [documento di design](DESIGN.md).

## Priorità
1. **Risorse, zaino e mercato**: oggi i soldi possono solo scendere e ogni spedizione finisce per forza in bancarotta. È il buco più grande: chiude il giro città → mare → terra → città. La scheda *Stiva* del diario è già pronta ad accoglierle.
2. **Taverna e voci**: l'unico modo per trovare gli uccelli rari (max 2 voci a spedizione, § 13 del design).
3. **Codice del taccuino** e "Riprendi un taccuino" (oggi disattivato nel menu).
4. Poi: strumenti e trappole, altre specie di uccelli.

## Versione 2
- [ ] **Eventi marini**: cose che attirano l'attenzione mentre si naviga (luccichii, relitti) e si possono visitare.
- [ ] **Esplorare più a fondo un'isola grande**: una seconda porzione dell'isola, cioè una nuova battlemap (costa un momento), raggiungibile da ogni zona dell'isola (al massimo una zona centrale). Il passaggio dev'essere evidente, con un'icona ponte o un sentiero.
- [ ] **Entrare nel castello e nelle rovine**: il ponte levatoio (già sulla mappa, tra due bandiere) apre una nuova battlemap con mostri o nemici che ti inseguono.
- [ ] **Lupi che ti circondano**: oggi il branco ti insegue soltanto.
- [ ] **Il vulcano scalda l'isola**: tutta l'isola diventa di un bioma più caldo (oggi l'effetto è solo nella zona del vulcano).
- [ ] **Vignetta notturna**: di notte la mappa più scura lontano dall'esploratore.

## Fatto di recente
- [x] **Salvataggio automatico** in localStorage: un refresh non cancella più la spedizione; *Continua la spedizione* nel menu.
- [x] **Versione 0.2.1**: niente globo a terra; binocolo chiaro in alto a sinistra sul globo (*usa binocolo (T)*); diario su carta vecchia e taccuino come libro aperto a misura fissa, capitoli a sinistra, ← → pagine, ↑ ↓ capitoli; ciurma come registro dei pagamenti; firma in corsivo barocco; si gioca tutto da tastiera.
- [x] **Versione 0.2**: tutto in una schermata, barra menu in alto, niente titoli sui riquadri, versione nel menu, link a GitHub nei crediti.
- [x] **Tempo in terzi**: attraccare gratis, ripartire due momenti, aspettare a bordo uno, traversate lunghe uno ogni 60°.
- [x] **Animali per momento**: cinghiale all'alba, orso di pomeriggio (più spesso col fiume), lupi di notte. Di notte ogni passo fa più rumore.
- [x] **18 uccelli** in 6 specie (un'icona per specie, varianti a colori), un uccello per zona deciso al primo attracco, solo in certi momenti del giorno.
- [x] **Diario di viaggio** con linguette (note, uccelli, voci, ciurma, zaino, stiva) e avvisi separati dalle note.
- [x] **Nuovi elementi**: fiume non sempre, lago, vulcano, castello (max uno per globo) con ponte e bandiere.
- [x] **Segni sul globo**: ✓ nera, ?, ✗.
- [x] **Cannocchiale** a lente, che segue la costa e si ripone allontanandosi; **mare dal ponte** con ringhiera, albero, vela e qualche variazione.
- [x] **Nome all'inizio** e **resoconto di fine spedizione** con attestato PNG.
- [x] Bug: la nave si fermava andando verso nord (ora naviga sui cerchi massimi e passa sopra i poli); castello nella cartolina ma non sulla mappa.
- [x] **Biomi**: foresta, taiga, isole ghiacciate, palude, tropicale, deserto, su un pianeta più piccolo con isole sparse ovunque.

## Città
- [ ] **Mercato**: vendere le risorse raccolte a terra (piume, erbe, funghi, legno, pelli, tesori), con prezzi diversi tra il Forte e il Porto del fiordo.
- [ ] **Risorse a terra**: da raccogliere sulla battlemap, con peso e spazio nello zaino.
- [ ] **Taverna**: voci da comprare ("ho visto un uccello dal becco blu a nord") che legano un uccello raro a una zona e la segnano sul globo; al massimo 2 a spedizione. Anche voci di tesori.
- [ ] **Bottega**: tagliole, carne, petardi, semi, mantella; binocolo migliorabile.
- [ ] **Schermata della città vera**: oggi è solo un riquadro con il guaritore.
- [ ] **Cartoline delle città**: il Forte (mura sul mare, torri, porta ad arco, vicoli e bancarelle) e il Porto del fiordo (molo di legno nella nebbia, case grigio-azzurre, boe rosse).

## Uccelli e taccuino
- [ ] **I 60 uccelli**: 20 specie × 3 varianti (oggi 6 specie, 18 uccelli in `js/uccelli.js`).
- [ ] **Comportamenti**: timido, curioso, nomade, notturno, mattiniero, ghiotto.
- [ ] **Verso di ogni uccello** generato dal suo ID.

## Fine spedizione
- [ ] **Attestato PDF** con QR (oggi è un'immagine PNG).
- [ ] **Codice del taccuino** (Crockford base32, 16 caratteri) e **Riprendi un taccuino** dal menu.

## Mondo e navigazione
- [ ] **Altri biomi**: scogliera, montagna, foresta d'autunno, vulcanica (lava), bosco di cristallo, foresta di funghi.
- [ ] **Creature per bioma**: orso polare al nord, coccodrillo in palude, scorpione nel deserto…
- [ ] **Puntatori delle voci** sul globo.
- [ ] Tarare velocità della nave, lunghezza della traversata che costa un momento (60°), probabilità degli animali.

## Battlemap
- [ ] **Refresh a terra**: ricaricando la pagina si torna sulla nave della zona con animali nuovi; si potrebbe usare per scappare da un orso. Se dà fastidio, salvare anche la battlemap.
- [ ] **Altre creature**: serpente nell'erba, pipistrelli nelle rovine; creature diverse per bioma.
- [ ] Un **verso per il cinghiale** (oggi usa quello dell'orso).
- [ ] **Strumenti in uso**: tagliola, carne, petardo, semi, mantella.
- [ ] Il villaggio sulla mappa potrebbe ospitare qualcuno con cui parlare o commerciare.
- [ ] **Nascondersi sul ghiaccio**: sulle isole ghiacciate non c'è erba alta, ci si nasconde quasi solo nei cespugli. Verificare giocando se diventa troppo difficile (magari cumuli di neve come nascondiglio).

## Suoni
- [ ] Togliere da "Ascolta i suoni" i suoni non più usati ("Turno degli animali", "Tocca a te").
- [ ] **Ambienti per bioma**: vento gelido al nord, insetti e rane in palude, onde e pappagalli ai tropici, vento secco nel deserto.

## Comandi
- [ ] **Mouse e touch**: in mare si guida solo da tastiera; servono comandi cliccabili (e per il telefono) per rotta, vele, binocolo e sbarco.

## Pubblicazione
- [x] Gioco online su GitHub Pages: https://gabrielemartire.github.io/una-spedizione-ornitologica/
- [ ] Più avanti: Cloudflare Pages con un dominio.
- [ ] Scegliere una licenza per il codice.
