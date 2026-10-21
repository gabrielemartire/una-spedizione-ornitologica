# Prossime cose

Lista di lavoro. Le idee nascono nella chat di progetto; il quadro completo è nel [documento di design](DESIGN.md).

## Priorità
0. **La lista degli oggetti speciali** (quelli del punto esclamativo): ora sono quattro provvisori.
1. **Le icone degli uccelli**: le 8 specie usano icone provvisorie di game-icons, in attesa dei disegni.
2. **Tarare l'economia**: oggetti a 2–4 m.o. bastano a pagare la ciurma? Giocare qualche spedizione.
3. **Codice del taccuino** e "Riprendi un taccuino" (oggi disattivato nel menu).
4. **Emporio**: strumenti e trappole.

## Versione 2
- [ ] **Eventi marini**: cose che attirano l'attenzione mentre si naviga (luccichii, relitti) e si possono visitare.
- [ ] **Esplorare più a fondo un'isola grande**: una seconda porzione dell'isola, cioè una nuova battlemap (costa un momento), raggiungibile da ogni zona dell'isola (al massimo una zona centrale). Il passaggio dev'essere evidente, con un'icona ponte o un sentiero.
- [ ] **Entrare nel castello e nelle rovine**: il ponte levatoio (già sulla mappa, tra due bandiere) apre una nuova battlemap con mostri o nemici che ti inseguono.
- [ ] **Lupi che ti circondano**: oggi il branco ti insegue soltanto.
- [ ] **Il vulcano scalda l'isola**: tutta l'isola diventa di un bioma più caldo (oggi l'effetto è solo nella zona del vulcano).
- [ ] **Vignetta notturna**: di notte la mappa più scura lontano dall'esploratore.

## Fatto di recente
- [x] **Versione 0.3.1**: città in pixel art (tetti a falde, castello, chiesa, vicoli sfalsati), insegne sulle botteghe, barili con la nota del grog, il punto esclamativo (rapina o oggetto speciale), il falegname del porticciolo e il roditore; niente più casse davanti alla nave.
- [x] **Versione 0.3.2**: il falegname lavora sulla banchina (non è più una bottega); davanti alle porte un cartellino in basso dice cos'è e quanto costa; dialoghi della città piccoli e in basso, con le parole che compaiono una alla volta; la mappa non si allarga più quando cambia il tipo di terreno.
- [x] **Versione 0.3.3**: navi in scala in pixel art (la tua, quelle del Forte, i pescherecci), l'icona della nave sulla banchina, insegne in pixel art sui tetti, niente boe sulla banchina, gente che si muove poco e si scansa.
- [x] **Versione 0.3**: le città sono battlemap (Forte e porticciolo, gente che cammina, botteghe con la porta →: medico, taverna, mercato, emporio chiuso); cartoline verticali delle città; oggetti a terra (rovine sempre, altrove 1 su 3) in stiva; due mercanti per globo che scambiano un oggetto con una voce; voci con la X dorata sul globo; porticciolo sempre su un'isola di ghiaccio; cuore in più dal medico del porticciolo; tenere premuto = correre = più rumore.
- [x] **51 uccelli in 8 specie**, uno raro per specie; il taccuino è un solo libro con pagine numerate, schede a righe, carta in pixel art, corsivo d'epoca.
- [x] **Salvataggio automatico** in localStorage: un refresh non cancella più la spedizione; *Continua la spedizione* nel menu. Ricaricare a terra costa un giorno.
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
- [ ] **Emporio**: tagliole, carne, petardi, semi, mantella; binocolo migliorabile.
- [ ] **Stiva con un limite** (peso o posti).
- [ ] Voci di tesori, oltre a quelle sugli uccelli.

## Uccelli e taccuino
- [ ] **Comportamenti**: timido, curioso, nomade, notturno, mattiniero, ghiotto.
- [ ] **Verso di ogni uccello** generato dal suo ID.

## Fine spedizione
- [ ] **Attestato PDF** con QR (oggi è un'immagine PNG).
- [ ] **Codice del taccuino** (Crockford base32, 16 caratteri) e **Riprendi un taccuino** dal menu. Il taccuino di fine partita è già salvato nel browser (`spedizione-ornitologica:taccuino`): Riprendi lo usa senza chiedere il codice, il codice serve per un altro dispositivo.

## Mondo e navigazione
- [ ] **Altri biomi**: scogliera, montagna, foresta d'autunno, vulcanica (lava), bosco di cristallo, foresta di funghi.
- [ ] **Creature per bioma**: orso polare al nord, coccodrillo in palude, scorpione nel deserto…
- [ ] **Puntatori delle voci** sul globo.
- [ ] Tarare velocità della nave, lunghezza della traversata che costa un momento (60°), probabilità degli animali.

## Battlemap
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
