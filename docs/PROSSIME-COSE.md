# Prossime cose

Lista di lavoro. Le idee nascono nella chat di progetto; il quadro completo è nel [documento di design](DESIGN.md).

## Priorità
1. **Risorse, zaino e mercato**: oggi i soldi possono solo scendere e ogni spedizione finisce per forza in bancarotta. È il buco più grande: chiude il giro città → mare → terra → città.
2. **I primi 8–10 uccelli** e il taccuino vero: oggi c'è un solo uccello uguale ovunque, non c'è niente da collezionare.
3. **Fine spedizione**: resoconto, attestato PDF, codice e "Riprendi un taccuino" (oggi disattivato nel menu).
4. Poi: strumenti e trappole, creature per bioma, taverna e bottega.

## Fatto di recente
- [x] **Biomi**: foresta, taiga, isole ghiacciate, palude, tropicale, deserto, su un pianeta più piccolo con isole sparse ovunque.
- [x] **Tempo più clemente**: sbarcare costa un giorno, i passi a terra non consumano tempo; in mare i giorni durano di più.
- [x] **Ritmo della battlemap**: niente più round e banner. Il tempo scorre solo quando agisci, gli animali si muovono insieme a te con velocità frazionarie (l'orso 4 passi ogni 3 tuoi).

## Città
- [ ] **Mercato**: vendere le risorse raccolte a terra (piume, erbe, funghi, legno, pelli, tesori), con prezzi diversi tra il Forte e il Porto del fiordo.
- [ ] **Risorse a terra**: da raccogliere sulla battlemap, con peso e spazio nello zaino.
- [ ] **Taverna**: voci da comprare ("ho visto un uccello dal becco blu a nord") che segnano punti sul globo; vaghe ed economiche, oppure precise e care.
- [ ] **Bottega**: tagliole, carne, petardi, semi, mantella; binocolo migliorabile.
- [ ] **Schermata della città vera**: oggi è solo un riquadro con il guaritore.
- [ ] **Cartoline delle città**: il Forte (mura sul mare, torri, porta ad arco, vicoli e bancarelle) e il Porto del fiordo (molo di legno nella nebbia, case grigio-azzurre, boe rosse).

## Uccelli e taccuino
- [ ] **I 60 uccelli**: 20 famiglie × 3 varianti, inventati (buffi e seri) e alcuni reali, in un file di dati modificabile.
- [ ] **Habitat**: ogni uccello legato a bioma, caratteristiche e momento del giorno; compare solo nelle zone con i suoi tag.
- [ ] **Comportamenti**: timido, curioso, nomade, notturno, mattiniero, ghiotto.
- [ ] **Verso di ogni uccello** generato dal suo ID.
- [ ] **Taccuino vero** (riquadro C): una pagina per uccello con disegno, habitat, curiosità; sagome per i mancanti; inventario.

## Fine spedizione
- [ ] **Resoconto**: giorni, zone visitate, uccelli nuovi, causa della fine.
- [ ] **Attestato PDF** con il nome dell'esploratore, la griglia degli uccelli, il codice e un QR.
- [ ] **Codice del taccuino** (Crockford base32, 16 caratteri) e **Riprendi un taccuino** dal menu.
- [ ] **Nome del giocatore** scelto all'inizio.

## Mondo e navigazione
- [ ] **Altri biomi**: scogliera, montagna, foresta d'autunno, vulcanica (lava), bosco di cristallo, foresta di funghi.
- [ ] **Creature per bioma**: orso polare al nord, coccodrillo in palude, scorpione nel deserto…
- [ ] **Puntatori delle voci** sul globo.
- [ ] Tarare velocità della nave, durata del giorno, costo dello sbarco.

## Battlemap
- [ ] **Altre creature**: lupi in branco, cinghiale, serpente nell'erba, pipistrelli nelle rovine.
- [ ] **Strumenti in uso**: tagliola, carne, petardo, semi, mantella.
- [ ] Il villaggio sulla mappa potrebbe ospitare qualcuno con cui parlare o commerciare.
- [ ] **Nascondersi sul ghiaccio**: sulle isole ghiacciate non c'è erba alta, ci si nasconde quasi solo nei cespugli. Verificare giocando se diventa troppo difficile (magari cumuli di neve come nascondiglio).

## Suoni
- [ ] Togliere da "Ascolta i suoni" i suoni non più usati ("Turno degli animali", "Tocca a te").
- [ ] **Ambienti per bioma**: vento gelido al nord, insetti e rane in palude, onde e pappagalli ai tropici, vento secco nel deserto.

## Comandi
- [ ] **Mouse e touch**: in mare si guida solo da tastiera; servono comandi cliccabili (e per il telefono) per rotta, vele, cannocchiale e sbarco.

## Pubblicazione
- [ ] Mettere il gioco online su Cloudflare Pages.
- [ ] Scegliere una licenza per il codice.
