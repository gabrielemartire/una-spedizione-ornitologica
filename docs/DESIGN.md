# Una spedizione ornitologica · Documento di design

> Versione 0.3 · ottobre 2026 · documento vivo, cambia mentre il gioco prende forma.

---

## 1. In una frase

**Sei un ornitologo del '500 che noleggia una nave per completare il suo taccuino.** Navighi liberamente un arcipelago sempre nuovo, sbarchi nelle zone che ti ispirano, ti avvicini agli uccelli per osservarli senza farti sbranare, vendi quello che trovi per pagare la ciurma. Quando i soldi finiscono, la ciurma ti butta in mare. Quando muori, il viaggio finisce. Il taccuino, però, resta.

## 2. Pilastri

1. **Accendi e parti da zero.** Nessun salvataggio: una partita dura finché giochi. Se chiudi, ricominci con un mondo nuovo.
2. **Il taccuino sopravvive al viaggio.** A fine partita ricevi un attestato PDF con un codice: inserendolo nella partita successiva riprendi la tua collezione.
3. **Furbizia, non spada.** Sei uno studioso: eviti, inganni e intrappoli. Il combattimento è un piccolo rompicapo leggibile, mai una rissa.
4. **Il mondo non mente.** Quello che vedi nella cartolina esiste davvero nella zona. Leggere il paesaggio è un'abilità del giocatore.
5. **Retro, sobrio, con carattere.** Testo e ASCII, palette ridotte per area, icone pulite. Un gioco "da floppy".

## 3. Il loop

```
        ┌──────────────── CITTÀ ────────────────┐
        │ vendi · ti curi · compri voci e       │
        │ strumenti · paghi la ciurma           │
        └───────────────────┬───────────────────┘
                            │ salpi
                            ▼
        ┌──────────────── GLOBO ────────────────┐
        │ navighi in tempo reale · scorrono i   │
        │ giorni · scegli dove attraccare       │
        └───────────────────┬───────────────────┘
                            │ sbarchi
                            ▼
        ┌────────────── BATTLEMAP ──────────────┐
        │ a turni · osservi uccelli · raccogli  │
        │ risorse · eviti o intrappoli mostri   │
        └───────────────────┬───────────────────┘
                            │ torni alla casella nave
                            └──────▶ di nuovo il globo
```

Una partita tipica dura **20–40 minuti**.

## 4. Inizio e fine partita

**Inizio**
- Schermata titolo → *Nuova spedizione* oppure *Riprendi un taccuino* (inserisci il codice).
- Il giocatore **sceglie il suo nome**: compare nel taccuino, sull'attestato e nei dialoghi in città ("Ah, siete voi il naturalista Martire!").
- Viene generato un nuovo globo da un seed casuale.
- Parti ormeggiato nella **città grande** con soldi iniziali, il binocolo e pochi strumenti.

**Fine** (una delle due)
- **Bancarotta:** a fine giornata non puoi pagare la ciurma → ti lasciano su uno scoglio.
- **Morte:** i punti vita scendono a zero in una battlemap.

In entrambi i casi si apre il **resoconto del viaggio** con l'attestato PDF (§ 14).

## 5. La schermata

Tutto sta in **una schermata senza scorrere**, anche su un portatile da 13" (circa 1440 × 800): la battlemap si ridimensiona sullo spazio che resta. Sugli schermi piccoli si torna a una colonna che scorre.

```
┌ Spedizione · Diario · Suoni ─────────────────── nome · v0.2 ┐
├─────────────────────────────────────┬───────────────────────┤
│                                     │  D · CARTOLINA        │
│          A · BATTLEMAP              │                       │
│        (o il globo, in mare)        ├───────────────────────┤
│                                     │  B · giorno · ☀ ☾     │
│                                     │                       │
├────────────────────── ▼ ▼ ▼ ▼ ▼ ▼ ──┤      monete · vita    │
│  C · DIARIO (ultime 3 note)         │      rumore · animali │
└─────────────────────────────────────┴───────────────────────┘
```

| Riquadro | Contenuto | Note |
|---|---|---|
| **A** Battlemap | La zona in cui sei sbarcato, a griglia, con icone | In mare mostra il globo grande. Sotto: che cosa c'è nella casella indicata ("Erba alta · si passa · ti nasconde") e i tasti |
| **B** Stato | Giorno e i tre momenti, monete, vita; a terra rumore e animali, in mare rotta, vele e traversata | |
| **C** Diario | Una pagina di carta con le ultime 3 note utili | Una sola linguetta rossa, *Diario*, apre il taccuino intero (§ 12) |
| **D** Cartolina | Il panorama della zona in pixel art, visto da una persona in piedi | In mare: il mare dal ponte; col binocolo: la costa |

**Niente titoli sui riquadri.** In alto una **barra menu** in stile anni '90: *Spedizione* (tendina: torna al menu principale, nuova spedizione, suoni), *Diario*, *Suoni*; a destra il nome dell'esploratore e la **versione** del gioco. In partita **Esc** apre la tendina invece di uscire, per non perdere il viaggio per sbaglio.

**La spedizione si salva da sola** nel browser (localStorage), ogni paio di secondi e quando chiudi o ricarichi la pagina. Al refresh si riparte da dove eri: in mare nello stesso punto, in città in porto, a terra **di nuovo sulla nave della stessa zona, ma un giorno dopo** (la battlemap si rigenera, animali compresi: il giorno perso, con la paga della ciurma, toglie la voglia di scappare dagli orsi col refresh). Dal menu principale *Continua la spedizione*; a fine spedizione il salvataggio si cancella. Il globo non si salva: nasce dal seed.

**Si gioca tutto con la tastiera.** Frecce/WASD a terra e in mare, T binocolo, Invio, Tab diario, Esc tendina (↑ ↓ e Invio dentro), ↑ ↓ e Invio nelle scelte che compaiono sulla mappa. Il mouse è un aiuto, non serve.

**Avvisi e diario sono separati.** Quello che succede adesso ("l'orso ti ha fiutato", "troppo lontano") è un avviso che compare sulla mappa e sparisce. Nel diario finisce solo ciò che serve ricordare: uccelli osservati, tracce, uccelli volati via.

## 6. Il globo

**Generazione.** Ogni spedizione genera un **pianeta piccolo**: un'isola grande (la foresta del Forte) e **11–13 isole sparse su tutta la sfera**, da un seed, su una texture di 360 × 180 gradi. **Il bioma di ogni isola dipende dalla latitudine**: ghiaccio verso i poli, taiga, foresta e palude alle medie latitudini, tropicale e deserto verso l'equatore. Le isole sono grandi (quella del Forte di circa 30° di raggio, le altre tra 9° e 18°) e **una per globo ha un grande lago al centro**, che non si naviga. Ogni isola è divisa in **zone** (punti distanti almeno 9°, ognuno con il suo territorio; quelle che non toccano il mare si raggiungono a piedi, § 9); ogni zona ha un seed e dei tag (§ 7), quindi la stessa cartolina e la stessa mappa a ogni visita. Le zone ricordano se il loro uccello è già stato osservato o è volato via. **Non tutti i biomi sono presenti in ogni partita**: alcuni uccelli in certi viaggi semplicemente non ci sono.

**Navigazione (tempo reale).** In mare il riquadro A mostra il globo grande; a terra il globo non c'è.
- ← → cambiano la rotta, ↑ ↓ le vele (4 livelli). Indicatori di rotta in gradi e punti cardinali.
- La sfera, in pixel art con luce, ombra e atmosfera sul bordo, **ruota sotto la nave**, che resta al centro con la sua scia.
- Mari profondi e bassi fondali, spiagge, prati, boschi, colline; rocce e neve dove la zona ha le montagne. I confini delle zone sono appena segnati.
- La costa ferma la nave. **Vicino alla costa** (≈2,4°) la zona si illumina: **Invio sbarca** (gratis). Vicino a una città, Invio attracca in porto.

**Binocolo (T).** In alto a sinistra sul globo c'è sempre un binocolo chiaro con scritto *usa binocolo (T)*: si accende e pulsa quando c'è una costa da guardare, perché chi gioca capisca che è lo strumento principale. Entro ≈12° da una costa, il binocolo mostra **la cartolina di quella zona senza sbarcare**, dentro una lente con gli angoli scuri. Premere di nuovo T non fa nulla: per riporlo basta allontanarsi dalla costa. **Se circumnavighi l'isola, mostra via via la costa successiva.** La cartolina diventa lo strumento per decidere dove attraccare: c'è un fiume (e quindi forse un orso)? un lago? un vulcano? Sbarcare è gratis, ma ripartire costa tempo: conviene guardare prima.

**Segni sul globo.** Le zone visitate restano segnate: **✓ nera** se ne hai osservato l'uccello (lì non comparirà altro), **?** se ci sei stato senza vederlo, **✗ rossa** se ti è volato via per sempre. Il vulcano si vede anche dal mare, come un cono scuro con la bocca rossa.

**Puntatori.** Le voci comprate in città compaiono sul globo come segni: un cerchio largo per le voci vaghe, una croce precisa per quelle care.

**Tempo: la giornata in tre momenti.** Ogni giorno ha **alba**, **pomeriggio** e **notte**. Il tempo avanza solo a scatti di un momento:
- **Attraccare e camminare a terra non costano niente**: se arrivi di giorno, resta giorno.
- **Ripartire costa due momenti** (si pensa alla notte di navigazione): parti di pomeriggio e arrivi all'alba; se riattracchi è ancora alba.
- **Aspettare a bordo costa un momento**: dalla casella nave puoi aspettare che venga pomeriggio, se l'uccello che cerchi è diurno, e risbarcare nella stessa zona.
- **In mare l'orologio è fermo**, ma una **traversata lunga** aggiunge un momento ogni 60° percorsi (barra *Traversata* nel riquadro B).
- A ogni nuova alba suona la campana e si paga la ciurma.

Così il ciclo tipico (sbarco, esplorazione, ripartenza) costa due terzi di giornata, e l'attesa diventa una scelta: *investire tempo per vedere se arriva l'uccello che cerco*.

**Il momento cambia tutto.** La palette della mappa, del globo e della cartolina; quali uccelli si fanno vedere (§ 13); quali animali ci sono (§ 9.3). Di notte gli animali vedono meno lontano, ma **ogni passo fa più rumore**: l'uccello scappa prima.

### 6.1 La nebbia e il Kraken (0.11)

**La nebbia del pesce gatto**: 2–3 macchie in mare aperto (raggio 5–7,5°, lontane dalle coste e dalla partenza), solo **di notte**, visibili sul globo come macchie grigie e dal ponte come nebbia fitta. Il pesce gatto (come quello di *Outer Wilds*, cieco, con la lucina) caccia col rumore: **oltre una vela** si accende la lucina (sul globo accanto alla nave, dal ponte nella nebbia) e dopo **1,5 secondi** la nave affonda (*Inghiottito*, e dal ponte la sua bocca). Con una vela si passa.

**Il Kraken**: ogni volta che la nave va **al largo** (nessuna costa alla portata del binocolo) si tira 1 su 8; se esce, **3–7 secondi dopo** il mare intorno diventa nero d'inchiostro (macchia di 3,5° con sei tentacoli sul globo; dal ponte acqua nera e tentacoli). Arrivando **ferma la nave** (vele a zero); dentro al massimo una vela, e la nave va **a un terzo della velocità** (5–6 secondi per uscire); uscendo passa un momento. Diario: *«Acqua nera a babordo. Nessuno vuole parlarne.»* Una volta per viaggio. Il timbro del Kraken per ora non si prende.

**Sul globo** (0.12.7) si vedono le città e il castello (un torrione coi merli); i vulcani no, si scoprono andandoci.

## 7. Zone, biomi e caratteristiche

Ogni zona ha **un bioma** e **0–3 caratteristiche**. Insieme formano i **tag** della zona.

**Biomi.** I primi sei sono nel gioco (dati in `js/biomes.js`): **foresta, taiga, isola ghiacciata, palude, isola tropicale, deserto**. Ognuno cambia il globo (colori, bassi fondali turchesi ai tropici), la cartolina (palette, alberi: pini, palme, cactus, alberi secchi; neve sui rami, nebbia, dune) e la battlemap (icone di alberi ed erbe, densità, pozze della palude, ruscello ghiacciato al nord). Lista completa, realistici con qualche tocco fantastico:

| Bioma | Palette indicativa | Note |
|---|---|---|
| Foresta temperata | verdi | il bioma "base" |
| Pineta / taiga | verde scuro, grigio | nebbia frequente |
| Palude | verde-marrone, ocra | acqua bassa ovunque |
| Scogliera | grigio, blu, bianco | uccelli marini |
| Tundra innevata | bianco, azzurro | |
| Montagna | grigi | rapaci |
| Dune e deserto | giallo, ocra | |
| Isola tropicale | verde acceso, turchese | pappagalli |
| Foresta d'autunno | arancio, rosso | |
| Terre vulcaniche | nero, arancio | rare, pericolose |
| Bosco di cristallo | azzurro, viola | fantastico, raro |
| Foresta di funghi | viola, crema | fantastico, raro |

**Caratteristiche:** `fiume` (con o senza `cascata`), `lago`, oppure nessuna acqua; `rovine`, `villaggio`, `colline`, `montagne`; rari, al massimo uno per globo: `castello` e `vulcano`.
- **Fiume:** non c'è sempre; dove c'è, di giorno **l'orso è molto più probabile**. Col binocolo si valuta se vale la pena attraccare.
- **Lago:** tondo, profondo nel mezzo; nelle isole ghiacciate è gelato e ci si cammina sopra.
- **Vulcano:** una colata di lava (non si attraversa) e rocce nere; il calore scioglie il ghiaccio della zona. *(v2: tutta l'isola diventa di un bioma più caldo.)*
- **Castello:** al margine della mappa, mura, fossato e **un ponte tra due bandiere** che porta al ponte levatoio, ben visibile. Per ora è chiuso; entrarci (una nuova battlemap) è in v2.

Un uccello può comparire **solo** in una zona che ha i suoi tag (§ 13).

## 8. La cartolina (D)

Il panorama della zona come lo vedrebbe una persona appena sbarcata: **vista frontale, in prima persona**, come le scene di Pioneers.

**Regola d'oro:** la cartolina viene composta **dai tag della zona**. Se la zona ha una cascata, la cartolina mostra una cascata, e la battlemap contiene una cascata. Vale anche al contrario: niente nella cartolina è inventato.

**Layer** (dal fondo al primo piano):

```
1. cielo        (giorno / alba / notte / nebbia)
2. nuvole
3. montagne
4. castello · faro
5. colline
6. villaggio · rovine
7. alberi       (forma decisa dal bioma)
8. acqua        (fiume / lago / cascata)
9. rocce e primo piano
10. uccelli in volo (solo se presenti nella zona)
```

Ogni layer ha 3–5 varianti, ognuna è un piccolo disegno ASCII con trasparenza (lo spazio non copre ciò che sta dietro).

**Pixel art 120 × 80**, con retino ordinato per le sfumature, luce e ombra decise dalla posizione del sole o della luna, foschia sulle montagne lontane, riflessi sull'acqua, finestre accese di notte. (Una versione ASCII è stata provata e scartata: la pixel art rende molto di più.)

**Lontano e vicino.** Lo **sfondo** (montagne, vulcano) è la regione intorno: si vede ma non si raggiunge (ma dal vulcano scende una colata di lava fin dentro la zona). Il **piano medio** (castello, villaggio, rovine, cascata, ruscello, lago) è dentro la zona: sulla battlemap c'è davvero. Il villaggio diventa qualche casa al margine della mappa; il castello mura, fossato e ponte al margine sud; le rovine un edificio in cui entrare; la cascata la sorgente del ruscello.

**Impaginazione garantita:** ruscello, castello, villaggio e rovine vengono messi in fila in ordine casuale, ognuno con una larghezza minima e massima, così nessuno copre mai un altro.

**Dimensioni:** **60 × 20 caratteri**, quanto una schermata di Game Boy: abbastanza per leggere le forme, abbastanza piccolo da restare "vintage".

**Colore:** **3–4 colori per bioma**, applicati per profondità: il fondo più chiaro e desaturato, il primo piano più scuro. La nebbia schiarisce tutto.

## 9. La battlemap (A)

Una griglia fitta (**40 × 24 caselle**) generata dallo stesso seed della cartolina. Tutt'intorno una **cornice verde**, sempre la stessa in ogni bioma, a doppio filo e con un fregio barocco a ogni angolo, segna il bordo: sta appena fuori dalle caselle (non copre le icone) e oltre non si va (il nero del riquadro sembrava un passaggio).

**Grafica:** icone monocromatiche da [game-icons.net](https://game-icons.net), colorate con la palette della zona. Una casella, un'icona leggibile.

**Contenuto:** terreno (erba, erba alta, cespugli, alberi, rocce, acqua bassa, acqua profonda), **rovine**, **lava**, **castello**, la **casella nave** (punto di arrivo e di partenza), uccelli, animali, a volte un tesoro.

**Cosa blocca e cosa no.** Dove si passa (erba, erba alta, cespugli, acqua bassa, ghiaccio, macerie) le icone sono **velate**; quello che blocca (alberi, rocce, muri, acqua profonda, lava) è pieno. Passando sopra una casella col mouse, o camminandoci, sotto la mappa compare che cosa è: "Erba alta · si passa · ti nasconde". **Quanto rumore fa ogni terreno resta da scoprire**: non sapere bene quando l'orso ti sente è più realistico.

**Il tempo scorre solo quando agisci.** Ogni azione (un passo, un'osservazione, aspettare) è un **battito**: in quel battito si muovono anche gli animali, nella stessa animazione, scivolando di casella in casella. Se non fai niente il mondo resta fermo e puoi pensare quanto vuoi; non ci sono turni né annunci che interrompono il gioco. (Il primo prototipo usava round "3 passi, poi gli animali" con il banner *Turno degli animali*: spezzava il ritmo ed è stato scartato.)

**Velocità come frazioni del tuo passo.** Ogni animale accumula slancio a ogni battito e si muove quando ne ha abbastanza: l'orso che ti insegue fa **4 passi ogni 3 tuoi**, quando ti cerca va al tuo passo, quando vaga fa un passo ogni due. L'acqua gli costa doppio.

**Si vede dove arrivano gli animali.** Le caselle che l'orso può raggiungere al prossimo battito sono evidenziate in rosso (tenue se non ti ha notato, acceso se ti insegue), e la casella dove sta per andare è segnata più forte. Restarci dentro significa farsi prendere.

**Animali non stupidi.** Le creature non si fanno male da sole (niente cariche contro gli alberi): aggirano gli ostacoli, ti seguono, cercano dove ti hanno visto l'ultima volta. Si battono con le trappole, le esche e il terreno, non con i loro errori.

**Tempo a terra.** Sbarcare è gratis e a terra i passi non consumano tempo (contare i passi era troppo punitivo); il tempo passa solo ripartendo o aspettando a bordo (§ 6). Il passaggio dei giorni è sempre visibile: campana, banner *Giorno N*, paga della ciurma nel diario. Se non puoi pagare, la ciurma ti abbandona e la spedizione finisce.

**Rovine.** Un edificio diroccato di circa 8 × 6 caselle: muri spessi, un varco e un crollo pieno di macerie (rumorose), a volte un pilastro. **Da fuori si vede solo il tetto: l'interno si scopre entrando.** I muri bloccano la vista, l'orso può entrare dai varchi. A volte l'uccello nidifica dentro.

**Le zone interne e i passaggi.** Le isole grandi hanno zone che non toccano il mare. Ogni battlemap ha **uno o due passaggi** (a volte tre, nelle zone di snodo) sul bordo che guarda la zona vicina: a nord, a sud, a est; a ovest solo nelle zone interne, che non hanno il mare. Sono segnati con l'icona del **ponte**. Ognuno porta a una zona confinante della stessa isola (mai alla zona di una città), interna o sulla costa. Passandoci sopra, una finestrella dice dove porta: prendere il sentiero **costa un momento**, e si arriva sul passaggio corrispondente dell'altra zona. I passaggi sono scelti in modo che **ogni zona interna sia collegata a una zona sul mare**; sul globo non si vedono, si scoprono esplorando.

**La nave resta ferma** dove l'hai ormeggiata: per ripartire o aspettare a bordo si torna da lei a piedi. Le zone sulla costa raggiunte a piedi hanno il mare ma non la nave; le zone interne sono tutta terra e si entra dal passaggio. La mappa di una zona è sempre la stessa, comunque ci si arrivi.

#**Il lato del mare** (0.11.4): sulla battlemap il mare sta dove sta sul globo (la media delle rive della zona, vista dal suo centro), col **nord sempre in alto**. La zona si genera sempre col mare a ovest e poi si specchia (mare a est) o si gira (mare a nord o a sud, generata su una mappa in piedi 24×40). I passaggi non stanno mai sul lato del mare. **La bussola** (0.11.7) sta sulla pagina del diario, sotto la linguetta: pixel art (cassa d'ottone, quadrante crema, tacca rossa al nord), l'ago in sedici direzioni **verso la città più vicina** (in mare dalla nave, a terra dalla zona, in città verso l'altra). Il nord del quadrante è in alto, come sul globo e sulla battlemap.

## 9.1 Rumore e visione
Un unico sistema regola uccelli e mostri.

| Azione | Rumore (raggio in caselle) |
|---|---|
| Aspettare / osservare | 0 |
| Camminare nell'erba alta | 1 |
| Camminare nell'erba | 2 |
| Attraversare un cespuglio | 3 |
| Camminare nell'acqua | 4 |
| Petardo | 6, nel punto in cui esplode |

- **Tenere premuto per muoversi è correre**: ogni tre passi di fila il rumore sale di uno, fino a +3. Il riquadro di stato lo segnala (*no, corri*).
- Il rumore **fa fuggire gli uccelli** nel raggio e **attira i mostri** (l'orso sente 2 caselle più lontano). L'erba alta è la via silenziosa.
- **Cespugli ed erba alta** ti nascondono: sei visibile solo da una casella adiacente.
- **Alberi e rocce** bloccano la linea di vista.

### 9.2 Osservare un uccello
Ogni uccello ha **due anelli**:
- **anello di fuga** (le caselle accanto, ~1,5): se ci entri, vola via;
- **anello di osservazione** (~3,5 caselle, ampliato dal binocolo).

Basta **un'azione di osservazione** dalla fascia tra i due anelli, con l'uccello in vista: l'uccello entra nel taccuino. La difficoltà sta nell'arrivarci senza farlo scappare.

**Se si spaventa** (troppo vicino, troppo rumore, l'orso che gli passa accanto) vola **in un altro punto della radura**, oppure, con meno probabilità, **lascia la zona per sempre**. Ogni tanto saltella da una casella all'altra.

Comportamenti possibili: *timido* (fuga ampia), *curioso* (si avvicina se stai fermo), *nomade* (cambia posatoio), *notturno*, *mattiniero*, *ghiotto* (attirato dai semi).

### 9.3 Creature
**Vagando gli animali non sanno dove sei** (0.12.7–0.12.8): ognuno ha la sua tana (dove compare) e sceglie una meta lontana almeno 5 caselle, entro 12 dalla tana; ci va **barcollando** (4 volte su 10 un passo di lato, o ogni tanto indietro), arrivato **annusa** 2–5 battiti, poi un'altra meta. Il branco di lupi ha **una meta sola** e si muove insieme. Ti vengono addosso solo se ti vedono, sentono o fiutano.

**Tutti i nemici** (animali, ricercato, bucanieri) hanno **lo stesso rosso scuro** (`--enemy`), così si riconoscono a colpo d'occhio; li distingue l'icona.

Ogni creatura mostra il suo stato (`!` ti insegue o carica, `?` ti cerca, `z` si riposa o è stordita) e la sua portata: non si viene mai colpiti a sorpresa.

**Chi c'è dipende dal momento del giorno**, ed è deciso a ogni sbarco:

| Momento | Animali |
|---|---|
| Alba | il **cinghiale** (a volte, vicino al fiume, un orso) |
| Pomeriggio | l'**orso**, sempre |
| Notte | i **lupi**, in branco da 2 (3 nella taiga e sui ghiacci) |

**Non esiste una zona senza animali**: in ogni momento del giorno almeno uno c'è (prima capitava troppo spesso di trovare la zona vuota).

**Esplorazione pura.** Sbarcando non compare nessun avviso sull'uccello ("canta un uccello", "il canto viene dalle rovine") né sugli animali (impronte, ululati), e il riquadro B non elenca più gli animali: si cerca a occhio. Dalla 0.8 **sopra la battlemap non compare nessun avviso**: i fatti importanti (oggetti, colpi, fughe, l'uccello osservato o volato via, il ricercato) vanno nel diario, i suggerimenti piccoli tacciono. I dialoghi restano.

| Creatura | Comportamento | Come la gestisci |
|---|---|---|
| Orso | Appena più veloce di te quando ti insegue (1,15 passi per tuo passo: in campo aperto ti prende in 6–7 passi), al tuo passo quando ti cerca, uno ogni due quando vaga; vagando ti gira intorno, ma ogni tanto se ne va di 5–6 caselle e poi torna; l'acqua gli costa doppio. Colpisce fortissimo: **−8, cioè quattro cuori su cinque**, ti lascia moribondo. Poi però è **sazio**: resta fermo per 3 tue mosse, poi si allontana da te (finché sei a meno di 8 caselle) e torna a vagare; ti riattacca solo se gli vai addosso o fai molto rumore accanto a lui. Ti fiuta solo da vicinissimo (3 caselle), ti vede da lontano, aggira gli ostacoli | Si può scappare: rompi la linea di vista, nasconditi nell'erba alta e nei cespugli, attraversa il ruscello |
| Lupi | In branco, al tuo passo, colpiscono meno forte (−2) ma sono tanti; ci vedono bene anche di notte | Nasconditi e aspetta; *(v2: cercano di circondarti)* |
| Cinghiale | Non sa curvare: se sei sulla sua riga o colonna, in vista, **carica in linea retta** di 2 caselle a battito (−3). Contro un ostacolo si pianta e resta stordito | Le sue linee di carica sono evidenziate: spostati di lato, oppure fallo schiantare contro un albero |
| Serpente | Fermo nell'erba alta, morde chi è adiacente | Va notato ed evitato |
| Pipistrelli | In grotte e rovine, si muovono a caso, sentono il rumore | Stai fermo e passano |

Il contatto toglie **punti vita** (vita iniziale: 10). Ci si cura **solo in città**, pagando.

**Uccidere** si può (trappola + creatura stordita) e lascia una pelle da vendere, ma **fa fuggire tutti gli uccelli della zona**.

### 9.4 Strumenti
| Strumento | Effetto | Tipo |
|---|---|---|
| Binocolo | Amplia l'anello di osservazione; migliorabile | permanente |
| Tagliola | Blocca una creatura 5 turni, o la elimina se è piccola | consumabile |
| Carne | Esca: attira le creature su una casella | consumabile |
| Petardo | Rumore lontano da te: distrae, mette in fuga i lupi, spaventa gli uccelli | consumabile |
| Semi | Esca per uccelli: li fa avvicinare o restare | consumabile |
| Mantella mimetica | Ti rende nascosto anche fuori dai cespugli per 5 turni | consumabile |

### 9.5 Oggetti
**Nelle rovine c'è sempre un oggetto, nelle altre zone una volta su tre** (deciso al primo sbarco, poi resta lì finché non lo prendi, **sempre nella stessa casella**: aspettare a bordo non lo sposta). Brilla sulla mappa; nelle rovine è sotto il tetto e lo vedi solo entrando. Ci passi sopra e **finisce in stiva**. **Solo oggetti rituali**, niente armi né armature, e niente piume (si confonderebbero con gli indizi degli uccelli). Sono 7, in `js/oggetti.js`: *reliquie* (venere di pietra, calice ingemmato, ciondolo rituale) e *arte* (maschera rituale, vaso dipinto, ritratto antico, idolo di pietra), con le icone di game-icons.net (venus-of-willendorf, mona-lisa…).

Servono a **vendere al mercato**, ma conviene tenerne qualcuno: **i mercanti** li vogliono.

**I mercanti.** Due per globo, ognuno in una zona, vicino alla riva: una persona (icona *person*) con accanto, a est, **il suo carretto di merce** (icona *old-wagon*), quindi due caselle. Si parla con lui andando contro l'uno o l'altro. Ognuno cerca **un oggetto preciso**: se ce l'hai e glielo dai, ti racconta **una voce** (in più rispetto alle 2 di taverna). Poi se ne va.

*(Più avanti: peso e limite della stiva.)*

### 9.6 I ricercati

**La bacheca.** In tutti e due i porti, sulla banchina, c'è la **bacheca dei ricercati**. A ogni visita c'è un avviso nuovo il **60%** delle volte, ma **al massimo uno ogni 6 giorni** e mai mentre ne hai uno in corso. L'avviso dice chi è, cosa ha fatto e in quale zona si nasconde.

**La caccia.** Accettato l'avviso, sul globo compare una **W rossa** al **centro dell'isola** (non sulla zona). Il ricercato non fa fumo: **di notte** accende un fuoco, che si vede **solo col binocolo** come un puntino rosso tra gli alberi della sua zona (e nella cartolina della zona, se ci sbarchi di notte). All'alba e di pomeriggio è lì ma non si vede niente: bisogna aspettare la notte. Hai **3 giorni**, poi il ricercato lascia l'arcipelago. Sbarcando, il fuggitivo (icona *bandit*, rossa) sta al suo fuoco vicino agli alberi, lontano dalla nave:
- finché non ti vede (8 caselle, 5 di notte, come gli animali: nascosto ti vede solo da vicinissimo) o non ti sente, resta fermo;
- poi **scappa**: un passo per ogni tuo passo se cammini, due ogni tre se corri; si ferma contro alberi e rocce;
- se ti vede entro 6 caselle **ti spara** (un cuore, un colpo ogni 4 battiti): alberi e rocce fermano il colpo, cespugli ed erba alta ti nascondono;
- se arriva al bordo della mappa mentre sei lontano (più di 10 caselle) **sparisce** e l'avviso è perso;
- lo **prendi** arrivandogli accanto.

Restano gli animali, che inseguono solo te, e l'uccello, che può spaventarsi (anche per il fuggitivo che gli passa vicino). Preso, il ricercato **va in stiva**; alla **gendarmeria del Forte** (non al porticciolo) si riscuote la **taglia: 15 m.o.**

### 9.7 Il campo dei bucanieri (0.10)

Uno o due per arcipelago, mai nella zona del ricercato, di una città, del castello, del vulcano, della torre o del falò; niente mercanti né forzieri. **Il segnale**: col binocolo, a ogni ora, una colonna di fumo grasso (il *boucan*); la prima volta il diario annota *«Fumo grasso dalla costa. Odore di carne.»*. Dal globo niente; il nome della zona non dice niente.

**Dentro**: nessun animale (*«Nessuna traccia di animali.»*). Il tesoro (30 m.o., ci passi sopra) lontano da dove si arriva, accanto la carne che affumica, intorno **quattro bucanieri**: due col fucile (un cuore ogni 6 battiti, entro 6 caselle, in vista; da vicino aspettano di poter sparare), due con la spada (un cuore a contatto, poi 2 battiti di pausa). Al tuo passo; vista 6 caselle di giorno, 4 di notte; le tagliole le scavalcano. Svegli e tranquilli girano vicino al fuoco.

**Di notte, finché il tesoro c'è, dormono** (`z`). Le caselle rumorose (vetri rotti, padelle, cocci, con la loro icona) li svegliano 4 volte su 5; andare addosso a uno che dorme li sveglia sempre; se se ne sveglia uno si svegliano tutti. Il generatore garantisce, da ogni entrata (la nave e i passaggi), un sentiero al tesoro senza caselle rumorose e senza bucanieri.

**Dopo il furto** restano lì per sempre, non dormono più e sanno sempre dove sei: la zona è persa per il resto del viaggio, uccelli compresi.

### 9.8 Il labirinto di siepi (0.12)

Uno per globo, in una zona di **foresta** (*… del labirinto*), senza fiume, lago, rovine né villaggio. La **cartolina** lo mostra dall'alto, in prospettiva, col centro che brilla d'oro. **La battlemap** è tutta labirinto: un labirinto perfetto su caselle dispari con il 7% di varchi in più (anelli), siepi piene, uno slargo 5×5 al centro; dalla nave e da ogni passaggio un'apertura fino al corridoio più vicino.
- **Le trappole**: 16 caselle *foglie smosse* nei corridoi, lontane dalle entrate, appena visibili; un cuore ogni volta che ci passi (non si consumano). Sono la difficoltà del labirinto, con i corridoi.
- **Nessun animale.** Ci girano **l'unicorno** e **il mostro con le corna**, gentili e garbati: la prima volta che sono vicini salutano (nel diario); andandoci contro si scambiano di posto con te, come la gente in città, con una battuta.
- **Al centro**: l'uccello della zona (con le sue ore, come altrove) e la **Coppa dei Tre Maghi** (in stiva; al mercato **11 m.o.**, una sola per viaggio).
- **Uscire costa un giorno intero** (a bordo o da un passaggio), una volta per visita.

### 9.9 Il castello abbandonato (0.12)

Il ponte levatoio: ci vai contro e sei dentro; il tempo non passa né entrando né uscendo. Una battlemap a parte (`js/castello.js`), sempre uguale nello stesso viaggio:
- **La pianta** (0.12.1): un **labirinto di cunicoli** larghi una casella (labirinto perfetto sulle caselle dispari, più il 10% di muri in meno per gli anelli), con le stanze incastonate (lati dispari) e **porte nel muro** (una o due per stanza). L'atrio in basso col portone.
- **Il buio**: quello che non hai visto è nero, senza forme (anche passandoci col mouse dice solo *Buio*). Si accende quello che hai intorno, due caselle, non dietro i muri; entrando in una stanza si accende tutta, muri compresi. Resta acceso per tutto il viaggio.
- **I mostri**: pipistrelli e fantasmi (rossi), uno o due in quattro o cinque stanze, mai nell'atrio. Vanno in diagonale e **rimbalzano sui muri della loro stanza** senza uscirne; i fantasmi a metà velocità. Toccarli costa un cuore.
- **Le cose**: monete (4–9 m.o.) in due stanze, una cosa da vendere in una terza; la **chiave della sala del trono** in una stanza qualunque apre la **porta chiusa** della sala (e resta nella toppa: esce dallo zaino); un **muro che cede** (sembra un muro: ci vai contro e si apre) porta alla stanza del tesoro (20–25 m.o.). Quello che prendi resta preso per tutto il viaggio: si ricorda per cosa è, non per dov'era.
- **La sala del trono**, in alto, addobbata a nozze **come una chiesa** (0.12.2): in fondo il **prete**, davanti a lui **la dama in bianco**, la **navata** col tappeto rosso fino alla porta (in fondo, al centro), gli **invitati** ai due lati, rose agli angoli. Andando contro la dama: «Volete sposarmi?»
  ```
  |      A      |   A il prete
  |      B      |   B la sposa
  | inv  V  inv |   V il tappeto
  ```
- **Sì**: auguri (riquadro), il buio, **la festa** (una scena in pixel art: la tavolata, gli invitati coi boccali, gli sposi, il suonatore di liuto e l'oste, i coriandoli; quattro battute con Invio; solo gente, niente creature del labirinto), il buio. Ti risvegli **all'alba** in un cespuglio accanto alla nave, con la **fede nuziale** nello zaino e il timbro dell'anello. Da lì il castello è **chiuso per nozze** (il portone sbarrato, col cartello). **No**: lei resta lì.
- **Poi** (da fare): in città una casa nuova, la tua.

**I passaggi** hanno l'icona del cartello (non più del ponte, che si confondeva col ponte del castello) e non stanno mai sul lato del castello.

## 10. Le città

Due città per globo, sempre presenti. **La città è disegnata in pixel art vista dall'alto**: tetti a falde di forme diverse (coppi, ardesia, paglia, mattoni; a L, lunghi, stretti) con comignoli e ombre, ciottoli, banchina di assi, mura coi merli. **Sopra, ben visibili, solo le cose con cui si interagisce**: le porte delle botteghe (→) con **l'insegna sul tetto, un'icona di game-icons.net** (medicine per il medico, il boccale della taverna, la bottega del mercato, la porta chiusa dell'emporio, le manette della gendarmeria, la casetta degli uccelli della Società ornitologica; sulla porta l'icona della porta aperta), i **barili** (c'è una nota da leggere: la ricetta del grog), la **bacheca dei ricercati**, le persone (icona *walk*). **Le navi sono in scala**: la tua è grande (tre caselle per nove, tre alberi) e ormeggiata lungo la banchina, dove l'icona della nave segna il punto per salire a bordo; anche le navi del Forte e i pescherecci rossi del porticciolo sono disegnati interi. **La gente si muove poco**: qualche passo ogni tanto vicino a dove sta, mai davanti a porte, nave o falegname, e se le vai addosso si scansa. **Davanti a una porta compare un cartellino in basso** che dice cos'è la bottega, cosa offre e quanto costa, con la freccia da premere per entrare. **I popup della città sono piccoli e stanno in basso**: i dialoghi sono una finestrella sopra la mappa, le parole di chi parla compaiono una alla volta con la vocina (Invio le mostra tutte), poi arrivano le risposte.

**Il Forte**: mura con le torri, la porta sul mare, la strada principale che fa qualche gomito, vicoli sfalsati, **il quartiere del castello** (mura sue, torri, mastio con la bandiera) e **la piazza con la chiesa** (campanile, pozzo, bancarelle); in più **la gendarmeria** (§ 9.6) e **la Società ornitologica** (§ 13). **Il porticciolo**: la banchina, le case in fila, la neve e gli abeti, e **il falegname**, che non ha bottega: lavora **in fondo alla banchina** accanto alle sue casse (pedina col martello, sta fermo). Ci si parla andandogli addosso; con lui si fa la conversazione del roditore di *Monkey Island 2*: lui apre con *«Heilà!»*, poi le tue battute (col tuo nome) si scelgono una alla volta (ce n'è sempre una sola) e lui risponde con la vocina, parola per parola; alla fine ti ringrazia per aver chiarito tutto e resta solo *Esci*. La finestra cresce a ogni battuta, senza barre di scorrimento.

**La città ha tutta la sua zona.** Il Forte e il porticciolo occupano un'intera zona della loro isola: dovunque si attracchi lì, si entra in porto, e **col binocolo si vede la città dal mare** (il Forte con le mura, il castello e la chiesa; il porticciolo con le case colorate sotto le montagne innevate).

**Il punto esclamativo.** A volte in città qualcuno ha un **!** sopra la testa e ti aspetta fermo: ci vai e **o ti rapina** (−2…4 m.o.) **o ti dà un oggetto magico** che finisce nello zaino. Gli oggetti magici sono tre e ognuno si riceve **una sola volta per partita**; finiti quelli, lo sconosciuto può solo rapinarti.

| Oggetto magico | A cosa serve |
|---|---|
| **Lettera sigillata** | In ogni mappa c'è **una torre** (tag `torre`, in una zona a caso senza castello né vulcano: si vede nella cartolina e col binocolo, sulla battlemap è di pietra, due caselle per due, con la donna alla finestra). Ti avvicini e lei si affaccia: **senza lettera piange** e guarda il mare; **con la lettera** ti ringrazia, scende, ti bacia: **un cuore rosa in più, per sempre** (la vita massima passa da 10 a 12), che i medici curano come gli altri. Poi lei ha solo una battuta di ringraziamento. |
| **Chiave arrugginita** | Apre i **forzieri chiusi**: circa una zona su otto (almeno una) ne ha uno, vicino ad alberi o rocce. Senza chiave: «Un forziere chiuso. Serve una chiave.» Dentro: un oggetto rituale e 5–10 m.o. **La chiave resta** per tutta la partita. |
| **Uovo maculato** | **Tredici giorni** dopo averlo avuto (ovunque tu sia) si schiude: nel taccuino arriva il **Pulcino**, tra gli altri uccelli. Nello zaino si vede quanti giorni mancano. |

**L'emporio.** Entrando, la merce è appoggiata su un **tavolo di legno** e si sceglie con le frecce. Per ora c'è solo il **sacchetto di semi** (5 m.o.): in una zona dove l'uccello è **volato via per sempre**, lo spargi con **E**; aspettato almeno un momento (1/3 di giorno), l'uccello **torna nella zona**, in un punto a caso della battlemap (non dove sono i semi), e si fa vedere nelle sue ore. Un sacchetto, un uccello.

Le città **sono battlemap cittadine**: la banchina con le altre navi, le strade, le case, la gente che va e viene (si muove da sola, anche se stai fermo; se le vai addosso brontola). Lungo la strada principale **le botteghe**: la porta ha il simbolo **→** (si entra), ci passi sopra e il padrone ti fa la sua domanda. Per ripartire si torna alla propria nave. In città il tempo non passa, tranne dormendo in taverna.

| | **Il Forte** (città grande) | **Il porticciolo del fiordo** (città piccola) |
|---|---|---|
| Dove | sull'isola grande | **sempre su un'isola di ghiaccio** (c'è sempre almeno un'isola di ghiaccio) |
| Mappa | mura tutt'intorno, porta sul mare, strada principale, vicoli, cortili, piazza col pozzo, bancarelle | sull'acqua, attaccato in alto alla riva innevata con gli abeti: due passerelle di legno parallele, ognuna con la sua fila di case, il mare a ovest e di nuovo a est, quattro pontili coi pescherecci ormeggiati; la taverna su palafitte sul mare |
| Cartolina | **verticale**, a colori pieni: dall'alto di una strada; a sinistra le mura lungo il mare con una nave ormeggiata e una torre di guardia, in fondo l'arco e la salita al castello sulla collina tra due palazzi, a destra le case, in primo piano il mercato e la gente. Notte: fiaccole sulle mura, poche finestre, castello illuminato. Alba: nessuno in giro | **verticale**, freddo ma accogliente (da una foto): la banchina di assi bagnate nella foschia, un peschereccio di legno del Cinquecento, una fila di locande a un piano grigio-azzurre con le finestre calde e il fumo, boe rosse e gabbie per le aragoste |
| Medico | «Volete curarvi le ferite?» **5 m.o.**, cura completa (5 cuori) | **3 m.o.**, 5 cuori **+ 1 in più**; quel cuore il Forte non lo ripristina |
| Taverna | «Una notte in locanda?» **11 m.o.**: dormi fino all'alba (la ciurma si paga) e senti una voce, sempre su un uccello raro | la **Taverna Pesce Sgozzato**, su palafitte: **7 m.o.**, ma la voce è su un raro solo l'84% delle volte |
| Mercato | **2 m.o.** a oggetto, compra tutto | **4 m.o.** a oggetto, ma l'arte no |
| Emporio | i semi, **5 m.o.** | i semi, **5 m.o.** |
| Gendarmeria | la taglia del ricercato: **15 m.o.** | no |
| Società ornitologica | **25 m.o.** per ogni specie completata | no |
| Bacheca dei ricercati | sì | sì |

**Le voci.** Una voce lega un uccello a **una zona precisa**, segnata sul globo con una **X dorata**. Dice la specie, non quale uccello: chi va a vedere può trovare un raro, o (al porticciolo) restare deluso da uno qualunque. Massimo **2 voci di taverna** a spedizione, più quelle dei mercanti. Finite le voci, in taverna si dorme e basta.

## 11. Economia

Valori iniziali, da tarare giocando.

| Voce | Valore |
|---|---|
| Soldi iniziali | 100 |
| Paga della ciurma | 8 al giorno |
| Voce vaga / precisa | 10 / 35 |
| Cura | 5 per punto vita |
| Tagliola · carne · petardo · semi | 12 · 4 · 8 · 3 |
| Risorse | da 2 (erbe) a 60 (tesori) |

Obiettivo: i soldi iniziali bastano per **circa 10 giorni**. Devi vendere presto, e ogni traversata lunga è una scommessa.

## 12. Il diario (C)

Sotto la mappa c'è il **bordo del diario**: carta vecchia, macchiata ai bordi, senza righe, con le **ultime 3 note** e la firma dell'esploratore in corsivo barocco. Dall'alto, sopra la firma, spunta **una sola linguetta rossa biforcuta**, *Diario* (le sei linguette di prima coprivano il testo delle note).

La linguetta, **Tab** o *Diario* nella barra aprono il **taccuino**: un libro aperto con due pagine e la piega in mezzo, **sempre della stessa misura** (si rimpicciolisce solo su schermi troppo piccoli). Le linguette dei capitoli escono da sotto il libro a sinistra, con la coda biforcuta verso fuori. **← →** sfogliano le pagine (finito un capitolo si passa al successivo), **↑ ↓** cambiano capitolo, **Esc** o Tab chiudono. Col mouse: clic sulla pagina sinistra o destra.

Il diario è un diario, non un manuale: niente spiegazioni, se un capitolo è vuoto è vuoto.
- **Note**: in alto a penna *viaggio n. X*. Gli sbarchi, con giorno e momento, la zona e se l'uccello c'era (*sembra un cinguettio*, *nessun uccello, ora sbagliata*, *l'uccello è volato via*, *uccello già nel taccuino*); arrivando a piedi da un passaggio, *(a piedi da …)*. Poi i fatti importanti della battlemap, che non ha più avvisi sopra.
- **Uccelli**: per specie, con sotto il titolo **dove si trovano** i suoi uccelli comuni (*Si trovano: foresta · taiga · palude · ovunque*), così si può partire a caccia di una specie intera. Ogni uccello è una **scheda**: quattro angoli appena segnati, il riquadro del disegno e righe vuote da riempire. **Sconosciuto**: tutto vuoto. **Incrociato** (traccia: sbarcato all'ora sbagliata, volato via, o tornato a bordo senza osservarlo): nome sulla prima riga, habitat e ore sulla seconda, terza e quarta vuote, niente disegno. **Osservato**: nome (e latino), habitat e ore, curiosità, dove e quando, e il disegno a colori. **I rari osservati hanno una cornice d'oro** (doppio filo dorato, gemme agli angoli, *✦ raro*).
- **Voci**: le voci sentite; quella su un uccello **si barra** quando l'hai osservato. La lettera sigillata aggiunge l'indirizzo della torre (e un cuore rosa sul globo).
- **Finanze**: in alto a destra, a penna e di sbieco, *ciurma: 8 m.o. al giorno*; sotto il registro delle **entrate e uscite** a tre colonne (cosa · giorno · importo), con le uscite in rosso (ciurma, medico, taverna, rapine) e le entrate in verde (mercato, premi della Società, taglie); le righe vuote si riempiono man mano.
- **Zaino**: la lista degli oggetti (il binocolo, la pala, gli oggetti magici; l'uovo dice solo *potrebbe schiudersi*). **Da qui si usano le cose** (0.12.4): quelle che si usano hanno un numero e cosa fanno (*mangia*, *posa*, *spargi*); il numero o un clic le usano, solo a terra. Sotto la battlemap i tasti scritti sono solo *spazio osserva · Z attendi · X scava · Tab diario*, disegnati come tasti (riquadrino col nome del tasto, poi l'azione), e così in mare e in città (T, M ed E restano come scorciatoie).
- **Stiva**: com'è adesso. Gli oggetti, e in basso nella pagina di destra **i ricercati presi e non ancora consegnati**, ognuno in **una cella con le sbarre**; consegnato, sparisce dalla stiva.
- **Taglie** (l'ultimo capitolo): una pagina per ogni avviso accettato, con l'insegna **WANTED**, il nome, il delitto, la taglia e il giorno; consegnato il ricercato, un timbro rosso bordato **CATTURATO**; se scappa, un timbro grigio *sfuggito*.

**È un solo libro**: le pagine sono numerate di seguito (Note 1–2, Uccelli dalla 3…) e **ogni capitolo comincia su una pagina di sinistra**. Testo in corsivo d'epoca (IM Fell English), carta in pixel art con grana, macchie, bordi bruniti e la piega; linguette di stoffa vecchia.

**Le tracce.** Se sbarchi in una zona all'ora sbagliata, o se l'uccello ti vola via per sempre, trovi le sue tracce: diventa una sagoma nel diario. Gli uccelli **rari** non lasciano tracce: di loro si sa solo dalle voci.

## 13. Gli uccelli

**Specie e varianti.** Ogni specie ha **una sola icona** (provvisoria: arriveranno i disegni); le varianti si distinguono per colore e nome. **8 specie, 51 uccelli**, in `js/uccelli.js`: Pettirosso (*Erithacus ignifer*), Gufo selenicus, Airone di nebbia, Cinciallegra di vetro, Corvo dei campanili, Colibrì d'ambra, Gabbiano di tempesta, Fenice. **Ogni specie ha un uccello raro.**

**Altri uccelli.** Una nona specie raccoglie **6 uccelli singoli**, ognuno con la sua icona e senza raro: kiwi notturno (foresta, notte), corridore delle dune (deserto, alba; icona *ostrich*), gallo del villaggio (villaggio, alba), dodo (isola tropicale, pomeriggio), gru di carta (palude, alba), oca del lago (lago, pomeriggio). In tutto 57 uccelli, più il **Pulcino**, che non vive in nessuna zona: nasce dall'uovo maculato (non conta per il premio della Società).

**Perché inseguire una specie: la Società ornitologica.** Al Forte, quando hai osservato **tutti gli uccelli comuni di una specie**, la Società ti paga **25 m.o.** (una volta per specie, entrando nella sua sede). Le specie già complete nel taccuino ripreso col codice non si ripagano: la Società le ha premiate nella spedizione di prima. Il taccuino dice dove cercarli: chi ha poche monete può decidere di andare a completare i gabbiani invece di girare a caso.

Ogni uccello ha: bioma (o "ovunque"), a volte una caratteristica (fiume, lago, cascata, rovine, villaggio, montagne, castello, vulcano), **i momenti in cui si fa vedere**, un indizio e una curiosità. Gli ID non cambiano mai: il codice del taccuino si baserà su di essi.

**Un uccello per zona, deciso all'attracco.** Al primo sbarco in una zona si sceglie il suo uccello tra quelli adatti al bioma e alle caratteristiche (chi vuole una caratteristica ha la precedenza); da lì in poi è sempre quello. Se l'ora è sbagliata non si fa vedere: puoi aspettare a bordo e riprovare. Una volta osservato, la zona è segnata con la ✓ e lì non compare più niente.

**Gli uccelli rari** (uno per specie: Pettirosso cenerino, Gufo del plenilunio, Airone fumoso, Cinciallegra prismatica, Corvo segnaore, Colibrì fossile, Gabbiano elettrico, Fenice eterna) non escono mai a caso: li lega a una zona precisa **solo una voce** (§ 10).

## 14. Fine partita, attestato e codice

**Resoconto** (fatto): una schermata con la causa della fine, giorni di viaggio, sbarchi, zone esplorate, isole toccate, passi, ferite, uccelli osservati, e la griglia del taccuino (a colori gli osservati, sagome le tracce, "?" il resto).

**L'attestato è un libretto da un foglio solo** (fatto). Un PDF di una pagina A4 verticale (immagine JPEG, senza librerie), da stampare **da un lato** e piegare in quattro: prima a metà in orizzontale con la stampa fuori, poi a metà in verticale. Diventa un libretto A6.
- **Metà in basso, dritta**: a sinistra il **retro**, a destra la **copertina**.
- **Metà in alto, capovolta**: l'**interno**, due facciate; dopo le pieghe si legge dritto.
- **Copertina**: *Società Ornitologica*, lo stemma (la casetta per gli uccelli in un cerchio d'oro), *Taccuino di viaggio di* e il nome in corsivo barocco; sotto, giorni di viaggio e data.
- **Retro**: il **QR** color sabbia (libreria qrcode-generator da cdnjs; senza connessione resta solo il codice), il codice in chiaro e l'indirizzo del gioco.
- **Interno**: in cima isole toccate, zone esplorate, uccelli osservati su 58; poi tutti gli uccelli, specie per specie (una specie può continuare sulla facciata accanto, con *segue*). Osservato: l'icona a colori e il nome (i rari col bordo d'oro e ✦). Non osservato: un riquadro chiaro vuoto e una riga per il nome; se l'hai incrociato, il nome scritto a penna sulla riga.
- **Tutto ciò che è scritto a penna sta su una riga**, come negli spazi di un modulo, in una grafia semplice (Cedarville Cursive); solo il nome è in corsivo barocco (Pinyon Script).
- Non ci sono il motivo della fine, sbarchi, passi, ferite, né la versione.

**Codice del taccuino** (fatto): compare nella schermata di fine, nel libretto e nel QR. Il QR apre il gioco con `?taccuino=CODICE`, cioè direttamente su *Riprendi un taccuino* col codice scritto.

**Riprendi un taccuino** (fatto, nel menu): si scrive il codice (proposto quello dell'ultimo taccuino rimasto nel browser), poi il nome; la spedizione nuova parte con quegli uccelli già osservati (*visto in una spedizione precedente*). Se c'è una spedizione in corso, prima chiede conferma.

**Il codice** (senza server):

| Parte | Bit |
|---|---|
| Versione del formato (2) | 4 |
| Uccelli visti (uno per ID, oggi 58) | 60 |
| Viaggi intrapresi | 8 |
| Timbri del taccuino | 6 |
| Per il futuro | 6 |
| Checksum | 16 |
| **Totale** | **100 bit = 20 caratteri** |

Codifica **Crockford base32**, che non ha lettere ambigue come I, L, O e U. Formato: `K7QF-2MXA-9PLD-R4TB-0C3E`. I codici della versione 1 (16 caratteri, solo uccelli) valgono ancora: un viaggio, nessun timbro.

**Il numero del viaggio**: la prima spedizione è il viaggio 1, ogni spedizione col taccuino ripreso è il successivo. Sta nel taccuino (Note), nel resoconto e sulla copertina del libretto.

**Dopo la fine** (morte o bancarotta), *Nuova spedizione* riparte **col taccuino di quella appena finita già collegato**; il nome si chiede sempre, proponendo quello di prima.

Il controllo è un CRC-16: intercetta gli errori di battitura. Nel leggere si perdonano minuscole, spazi e trattini, e I, L, O valgono 1, 1, 0. Il codice è falsificabile da chi ci si mette: è un gioco, va bene così.

### 14.1 La fine del gioco e i timbri (0.9)

**Il taccuino completo** è *tutti* gli uccelli, rari e Pulcino compresi: ci vogliono più viaggi col taccuino ripreso. Appena completo, sul globo in alto a destra (dall'altra parte del binocolo) compare la **busta della Società**; prima non c'è niente, nemmeno un riquadro vuoto. Si apre con L o col clic: la busta col sigillo di ceralacca, Invio rompe il sigillo e la lettera esce. Alla **Società ornitologica** del Forte, con la lettera, si riceve l'attestato di **Ornitologo esperto** e il gioco finisce (resoconto *Ornitologo esperto*, in oro sulla copertina del libretto).

**I timbri**: un capitolo del taccuino, prima delle Taglie, con sei riquadri. Velati finché non li hai, nessuna descrizione. Nel codice, un bit ciascuno, in quest'ordine: marshmallow bruciato (falò), l'anello di fidanzamento (le nozze nel castello; dalla 0.12, al posto dell'Appeso), la Morte, il Sole, la Luna, il Kraken. Per ora si prendono i primi due.

### 14.2 La radura del falò, il cibo, le tagliole, la bottiglia (0.9)

- **La radura del falò**: una per globo, in una zona interna (*… del falò*). Un cerchio d'alberi con due varchi e una fascia libera intorno, il falò nel mezzo (non si attraversa), il marshmallow accanto: uno per viaggio. Contro il fuoco: cuocerlo (bianco → ancora bianco → dorato → bruciato, e il timbro), mangiarlo, andare.
- **Mangiare (M)**: il marshmallow rimette tutta la vita e dà un **cuore viola** che assorbe il primo colpo; il **pesce in scatola** (emporio, 2 m.o., uno alla volta) cura due cuori: costa meno del medico ma cura meno, però si porta dietro.
- **Tagliole (T, emporio, 3 m.o.)**: si posano dove sei; restano nella zona finché non scattano. Lupo: muore, ma la schiva 3 volte su 10 (la tagliola scatta comunque). Orso e cinghiale: fermi 15 tuoi passi.
- **La bottiglia col messaggio**: una zona caraibica sul mare su tre, sulla prima fila di terra. Si sceglie prima l'arrivo (calpestabile, non acqua), poi da 2 a 4 tratti dritti, alternando verticale e orizzontale; conta dove arrivi, non da dove passi. **X scava** con la pala (sempre nello zaino: il tasto S era già il passo in giù): un passo; nel posto giusto 0–9 m.o. e un oggetto se sono meno di 4, altrove *una buca vuota*.
- **La spiaggia caraibica**: cinque file di sabbia dal mare, quattro di sabbia ed erba che si diradano, poi erba con chiazze di sabbia. La bottiglia è nera col bordo chiaro, per vedersi sulla sabbia.
- **Le onde** del mare sulla battlemap si muovono piano, ogni casella sfalsata dalle vicine (ferme con *riduci movimento*).
- **La voce dei quattro occhi**: in taverna, una volta per viaggio.

## 15. Stile visivo

- **Font:** monospazio retro (VT323).
- **Interfaccia:** finestre con doppio bordo, barra menu, pulsanti testuali con `▶`, come Pioneers.
- **Palette:** il menu ha una palette verde da 4 colori; **ogni bioma e ogni città ha la propria palette da 3–4 colori**, applicata a cartolina e battlemap.
- **Icone:** la battlemap e il diario usano le icone di game-icons.net (CC BY 3.0), colorate con la palette della zona. L'esploratore è un binocolo.
- **Logo:** un binocolo dorato da cui spunta un'ala di pappagallo rossa, gialla e blu, in pixel art.
- **Riferimenti:** Pioneers (Eigen Lenk) per interfaccia e tono; scene a due toni stile Game Boy per la dimensione e la densità dell'ASCII; Brogue e Caves of Qud per l'uso del colore in modalità testo.

## 16. Audio

**Niente musica:** solo suoni d'ambiente ed effetti, sintetizzati nel browser (nessun file audio). Il silenzio fa parte dell'osservazione.

Nel menu: **Suoni ON/OFF** e **Volume da 1 a 5** (frecce ← → o clic). Le impostazioni audio sono l'unica cosa che il browser ricorda tra una sessione e l'altra.

Suoni approvati come base, ascoltabili dal menu in *Ascolta i suoni*:

| Gruppo | Suoni |
|---|---|
| Ambiente (continui) | vento, mare, foresta con uccelli lontani, notte con grilli |
| Interfaccia | spostamento, conferma, pagina del taccuino, monete |
| Battlemap | passo nell'erba, passo nell'acqua, fruscio di cespuglio, tagliola, petardo, orso, lupo, cinguettio, "uccello osservato!" |
| Mare | campana di bordo (fine giornata), gabbiani, scafo che scricchiola |

Idea: **ogni uccello ha il suo verso**, generato dal suo ID. Lo stesso uccello canta sempre allo stesso modo, e un giocatore attento lo riconosce prima di vederlo.

## 17. Tecnologia

- **Solo browser:** HTML, CSS e JavaScript (moduli ES), nessun server.
- **Generatore casuale con seed**: lo stesso seed produce sempre lo stesso globo, la stessa zona, la stessa cartolina.
- **PDF e QR:** generati nel browser con librerie leggere.
- **Pubblicazione:** sito statico su Cloudflare Pages.
- Un server servirebbe solo per classifiche o codici non falsificabili: per ora no.

## 18. Tabella di marcia

1. **Prototipo battlemap:** griglia, movimento a turni, un uccello da osservare, un orso da evitare. *Se non è divertente qui, il resto non conta.*
2. **Cartolina:** layer ASCII composti dai tag, stesso seed della battlemap.
3. **Taccuino e inventario** (C).
4. **Globo:** generazione dell'arcipelago, sfera ASCII, navigazione libera, giorni e paga.
5. **Città:** mercato, voci, guaritore, bottega.
6. **Fine partita:** resoconto, codice, PDF, ripresa del taccuino.
7. **Contenuti:** 60 uccelli, tutti i biomi, bilanciamento.

## 19. Decisioni prese

- **Nome del giocatore:** si sceglie all'inizio della partita ("Il registro di bordo"), anche col taccuino ripreso, proponendo quello di prima.
- **Come si gioca:** alla prima spedizione, un riquadro asciutto, senza retorica: i tasti in due colonne (in mare, a terra) e cinque regole brevi, l'ultima dice che ci sono attività secondarie e qualche segreto. Si riapre da *Spedizione → Istruzioni*.
- **Il grande lago non si naviga**, e la nave non passa tra due terre che si toccano per un angolo (§ 6).
- **Tempo in terzi:** attraccare gratis, ripartire due momenti, aspettare a bordo uno, traversate lunghe uno ogni 60° (§ 6).
- **Animali per momento:** alba cinghiale, pomeriggio orso, notte lupi; mai una zona vuota (§ 9.3).
- **Esplorazione pura:** niente avvisi su uccello e animali, solo «Nessun canto» (§ 9.3).
- **Ricercati:** bacheca nei due porti, W rossa, fumo, fuggitivo che spara, taglia di 15 m.o. alla gendarmeria del Forte (§ 9.6).
- **Società ornitologica:** 25 m.o. per specie completata, per dare un motivo a inseguire una specie; non si ripagano le specie già complete nel taccuino ripreso (§ 13).
- **Patch note:** in `PATCH-NOTE.md` e, alla prima accensione di ogni versione, in un riquadro nel gioco (*Patch note n.m*).
- **Un uccello per zona**, deciso al primo attracco; i rari solo con le voci, al massimo 2 (§ 13).
- **Un'icona per specie**, le varianti cambiano colore.
- **Cosa sopravvive al viaggio:** solo il taccuino. Strumenti, soldi e binocolo migliorato si perdono.
- **Ciurma:** per ora è solo un costo giornaliero, senza eventi.
- **Audio:** niente musica, suoni d'ambiente ed effetti sintetizzati; le proposte del § 16 sono approvate come base.
