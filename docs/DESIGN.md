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

**Generazione.** Ogni spedizione genera un **pianeta piccolo**: un'isola grande (la foresta del Forte) e **11–13 isole sparse su tutta la sfera**, da un seed, su una texture di 360 × 180 gradi. **Il bioma di ogni isola dipende dalla latitudine**: ghiaccio verso i poli, taiga, foresta e palude alle medie latitudini, tropicale e deserto verso l'equatore. Ogni isola è divisa in **zone** (punti distanti almeno 9°, ognuno con il suo territorio); ogni zona ha un seed e dei tag (§ 7), quindi la stessa cartolina e la stessa mappa a ogni visita. Le zone ricordano se il loro uccello è già stato osservato o è volato via. **Non tutti i biomi sono presenti in ogni partita**: alcuni uccelli in certi viaggi semplicemente non ci sono.

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

Una griglia fitta (**40 × 24 caselle**) generata dallo stesso seed della cartolina.

**Grafica:** icone monocromatiche da [game-icons.net](https://game-icons.net), colorate con la palette della zona. Una casella, un'icona leggibile.

**Contenuto:** terreno (erba, erba alta, cespugli, alberi, rocce, acqua bassa, acqua profonda), **rovine**, **lava**, **castello**, la **casella nave** (punto di arrivo e di partenza), uccelli, animali, a volte un tesoro.

**Cosa blocca e cosa no.** Dove si passa (erba, erba alta, cespugli, acqua bassa, ghiaccio, macerie) le icone sono **velate**; quello che blocca (alberi, rocce, muri, acqua profonda, lava) è pieno. Passando sopra una casella col mouse, o camminandoci, sotto la mappa compare che cosa è: "Erba alta · si passa · ti nasconde". **Quanto rumore fa ogni terreno resta da scoprire**: non sapere bene quando l'orso ti sente è più realistico.

**Il tempo scorre solo quando agisci.** Ogni azione (un passo, un'osservazione, aspettare) è un **battito**: in quel battito si muovono anche gli animali, nella stessa animazione, scivolando di casella in casella. Se non fai niente il mondo resta fermo e puoi pensare quanto vuoi; non ci sono turni né annunci che interrompono il gioco. (Il primo prototipo usava round "3 passi, poi gli animali" con il banner *Turno degli animali*: spezzava il ritmo ed è stato scartato.)

**Velocità come frazioni del tuo passo.** Ogni animale accumula slancio a ogni battito e si muove quando ne ha abbastanza: l'orso che ti insegue fa **4 passi ogni 3 tuoi**, quando ti cerca va al tuo passo, quando vaga fa un passo ogni due. L'acqua gli costa doppio.

**Si vede dove arrivano gli animali.** Le caselle che l'orso può raggiungere al prossimo battito sono evidenziate in rosso (tenue se non ti ha notato, acceso se ti insegue), e la casella dove sta per andare è segnata più forte. Restarci dentro significa farsi prendere.

**Animali non stupidi.** Le creature non si fanno male da sole (niente cariche contro gli alberi): aggirano gli ostacoli, ti seguono, cercano dove ti hanno visto l'ultima volta. Si battono con le trappole, le esche e il terreno, non con i loro errori.

**Tempo a terra.** Sbarcare è gratis e a terra i passi non consumano tempo (contare i passi era troppo punitivo); il tempo passa solo ripartendo o aspettando a bordo (§ 6). Il passaggio dei giorni è sempre visibile: campana, banner *Giorno N*, paga della ciurma nel diario. Se non puoi pagare, la ciurma ti abbandona e la spedizione finisce.

**Rovine.** Un edificio diroccato di circa 8 × 6 caselle: muri spessi, un varco e un crollo pieno di macerie (rumorose), a volte un pilastro. **Da fuori si vede solo il tetto: l'interno si scopre entrando.** I muri bloccano la vista, l'orso può entrare dai varchi. A volte l'uccello nidifica dentro.

### 9.1 Rumore e visione
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
Ogni creatura mostra il suo stato (`!` ti insegue o carica, `?` ti cerca, `z` si riposa o è stordita) e la sua portata: non si viene mai colpiti a sorpresa.

**Chi c'è dipende dal momento del giorno**, ed è deciso a ogni sbarco:

| Momento | Animali |
|---|---|
| Alba | il **cinghiale** (a volte, vicino al fiume, un orso) |
| Pomeriggio | l'**orso**, sempre |
| Notte | i **lupi**, in branco da 2 (3 nella taiga e sui ghiacci) |

**Non esiste una zona senza animali**: in ogni momento del giorno almeno uno c'è (prima capitava troppo spesso di trovare la zona vuota).

**Esplorazione pura.** Sbarcando non compare nessun avviso sull'uccello ("canta un uccello", "il canto viene dalle rovine") né sugli animali (impronte, ululati), e il riquadro B non elenca più gli animali: si cerca a occhio. Resta solo, all'ora sbagliata, *«Nessun canto. Forse non è l'ora giusta.»* (virgolettato e in corsivo).

| Creatura | Comportamento | Come la gestisci |
|---|---|---|
| Orso | 4 passi ogni 3 tuoi quando ti insegue (più veloce di te!), al tuo passo quando ti cerca, uno ogni due quando vaga; l'acqua gli costa doppio. Dopo averti colpito (−4) si ferma per 3 battiti. Tenace: ti fiuta da vicino, ti vede da lontano, aggira gli ostacoli e ti segue | Correndo non lo semini: nasconditi nell'erba alta e nei cespugli, attraversa il ruscello |
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

**I mercanti.** Due per globo, ognuno in una zona, incappucciati vicino alla riva. Ognuno cerca **un oggetto preciso**: se ce l'hai e glielo dai, ti racconta **una voce** (in più rispetto alle 2 di taverna). Poi se ne va.

*(Più avanti: peso e limite della stiva.)*

### 9.6 I ricercati

**La bacheca.** In tutti e due i porti, sulla banchina, c'è la **bacheca dei ricercati**. A ogni visita c'è un avviso nuovo il **60%** delle volte, ma **al massimo uno ogni 6 giorni** e mai mentre ne hai uno in corso. L'avviso dice chi è, cosa ha fatto e in quale zona si nasconde.

**La caccia.** Accettato l'avviso, sul globo compare una **W rossa** sulla zona, e col binocolo si vede **una colonna di fumo** che sale dagli alberi (nella cartolina della zona). Hai **3 giorni**, poi il ricercato lascia l'arcipelago. Sbarcando, il fuggitivo (icona *bandit*, rossa) sta al suo fuoco vicino agli alberi, lontano dalla nave:
- finché non ti vede (8 caselle, 5 di notte, come gli animali: nascosto ti vede solo da vicinissimo) o non ti sente, resta fermo;
- poi **scappa**: un passo per ogni tuo passo se cammini, due ogni tre se corri; si ferma contro alberi e rocce;
- se ti vede entro 6 caselle **ti spara** (mezzo cuore, un colpo ogni 4 battiti): alberi e rocce fermano il colpo, cespugli ed erba alta ti nascondono;
- se arriva al bordo della mappa mentre sei lontano (più di 10 caselle) **sparisce** e l'avviso è perso;
- lo **prendi** arrivandogli accanto.

Restano gli animali, che inseguono solo te, e l'uccello, che può spaventarsi (anche per il fuggitivo che gli passa vicino). Preso, il ricercato **va in stiva**; alla **gendarmeria del Forte** (non al porticciolo) si riscuote la **taglia: 15 m.o.**

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
| Società ornitologica | **8 m.o.** per ogni specie completata | no |
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
- **Note**: tutto ciò che è stato annotato, con giorno e momento.
- **Uccelli**: per specie, con sotto il titolo **dove si trovano** i suoi uccelli comuni (*Si trovano: foresta · taiga · palude · ovunque*), così si può partire a caccia di una specie intera. Ogni uccello è una **scheda**: quattro angoli appena segnati, il riquadro del disegno e righe vuote da riempire. **Sconosciuto**: tutto vuoto. **Incrociato** (traccia: sbarcato all'ora sbagliata, volato via, o tornato a bordo senza osservarlo): nome sulla prima riga, habitat e ore sulla seconda, terza e quarta vuote, niente disegno. **Osservato**: nome (e latino), habitat e ore, curiosità, dove e quando, e il disegno a colori. **I rari osservati hanno una cornice d'oro** (doppio filo dorato, gemme agli angoli, *✦ raro*).
- **Voci**: le voci sentite.
- **Finanze**: in alto a destra, a penna e di sbieco, *ciurma: 8 m.o. al giorno*; sotto il registro delle **entrate e uscite** a tre colonne (cosa · giorno · importo), con le uscite in rosso (ciurma, medico, taverna, rapine) e le entrate in verde (mercato, premi della Società, taglie); le righe vuote si riempiono man mano.
- **Zaino**: la lista degli oggetti (per ora il binocolo).
- **Stiva**: gli oggetti trovati, e il ricercato legato, se l'hai preso.

**È un solo libro**: le pagine sono numerate di seguito (Note 1–2, Uccelli dalla 3…) e **ogni capitolo comincia su una pagina di sinistra**. Testo in corsivo d'epoca (IM Fell English), carta in pixel art con grana, macchie, bordi bruniti e la piega; linguette di stoffa vecchia.

**Le tracce.** Se sbarchi in una zona all'ora sbagliata, o se l'uccello ti vola via per sempre, trovi le sue tracce: diventa una sagoma nel diario. Gli uccelli **rari** non lasciano tracce: di loro si sa solo dalle voci.

## 13. Gli uccelli

**Specie e varianti.** Ogni specie ha **una sola icona** (provvisoria: arriveranno i disegni); le varianti si distinguono per colore e nome. **8 specie, 51 uccelli**, in `js/uccelli.js`: Pettirosso (*Erithacus ignifer*), Gufo selenicus, Airone di nebbia, Cinciallegra di vetro, Corvo dei campanili, Colibrì d'ambra, Gabbiano di tempesta, Fenice. **Ogni specie ha un uccello raro.**

**Altri uccelli.** Una nona specie raccoglie **6 uccelli singoli**, ognuno con la sua icona e senza raro: kiwi notturno (foresta, notte), corridore delle dune (deserto, alba; icona *ostrich*), gallo del villaggio (villaggio, alba), dodo (isola tropicale, pomeriggio), gru di carta (palude, alba), oca del lago (lago, pomeriggio). In tutto 57 uccelli, più il **Pulcino**, che non vive in nessuna zona: nasce dall'uovo maculato (non conta per il premio della Società).

**Perché inseguire una specie: la Società ornitologica.** Al Forte, quando hai osservato **tutti gli uccelli comuni di una specie**, la Società ti paga **8 m.o.** (una volta per specie, entrando nella sua sede). Il taccuino dice dove cercarli: chi ha poche monete può decidere di andare a completare i gabbiani invece di girare a caso.

Ogni uccello ha: bioma (o "ovunque"), a volte una caratteristica (fiume, lago, cascata, rovine, villaggio, montagne, castello, vulcano), **i momenti in cui si fa vedere**, un indizio e una curiosità. Gli ID non cambiano mai: il codice del taccuino si baserà su di essi.

**Un uccello per zona, deciso all'attracco.** Al primo sbarco in una zona si sceglie il suo uccello tra quelli adatti al bioma e alle caratteristiche (chi vuole una caratteristica ha la precedenza); da lì in poi è sempre quello. Se l'ora è sbagliata non si fa vedere: puoi aspettare a bordo e riprovare. Una volta osservato, la zona è segnata con la ✓ e lì non compare più niente.

**Gli uccelli rari** (uno per specie: Pettirosso cenerino, Gufo del plenilunio, Airone fumoso, Cinciallegra prismatica, Corvo segnaore, Colibrì fossile, Gabbiano elettrico, Fenice eterna) non escono mai a caso: li lega a una zona precisa **solo una voce** (§ 10).

## 14. Fine partita, attestato e codice

**Resoconto** (fatto): una schermata con la causa della fine, giorni di viaggio, sbarchi, zone esplorate, isole toccate, passi, ferite, uccelli osservati, e la griglia del taccuino (a colori gli osservati, sagome le tracce, "?" il resto).

**Attestato** (fatto, **in PDF**, con l'icona PDF sul pulsante): nome dell'esploratore, causa della fine, resoconto, la griglia degli uccelli per specie (i rari con il bordo d'oro). Il PDF è un A4 orizzontale fatto senza librerie, con dentro l'immagine dell'attestato. *(Più avanti: il codice e il QR.)*

**Codice del taccuino**: per ora non c'è; *Riprendi un taccuino* resta nel menu, disattivato, per far capire che arriverà.

**Nuova spedizione.** Dal menu principale; se ce n'è una in corso, prima chiede conferma (quella vecchia si perde). Dalla tendina *Spedizione* in partita non c'è più.

**Il taccuino resta salvato.** A fine spedizione il taccuino (nome e uccelli osservati) si salva nel browser: *Riprendi un taccuino* lo userà direttamente, senza reinserire il codice. Il codice serve solo per cambiare browser o dispositivo, o per condividerlo.

**Il codice** (senza server):

| Parte | Bit |
|---|---|
| Versione del formato | 4 |
| Uccelli visti (uno per ID) | 60 |
| Checksum | 16 |
| **Totale** | **80 bit = 16 caratteri** |

Codifica **Crockford base32**, che non ha lettere ambigue come I, L, O e U. Formato: `K7QF-2MXA-9PLD-R4TB`.

Il checksum intercetta gli errori di battitura. Il codice è falsificabile da chi ci si mette: è un gioco, va bene così.

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

- **Nome del giocatore:** si sceglie all'inizio della partita ("Il registro di bordo").
- **Tempo in terzi:** attraccare gratis, ripartire due momenti, aspettare a bordo uno, traversate lunghe uno ogni 60° (§ 6).
- **Animali per momento:** alba cinghiale, pomeriggio orso, notte lupi; mai una zona vuota (§ 9.3).
- **Esplorazione pura:** niente avvisi su uccello e animali, solo «Nessun canto» (§ 9.3).
- **Ricercati:** bacheca nei due porti, W rossa, fumo, fuggitivo che spara, taglia di 15 m.o. alla gendarmeria del Forte (§ 9.6).
- **Società ornitologica:** 8 m.o. per specie completata, per dare un motivo a inseguire una specie (§ 13).
- **Patch note:** in `PATCH-NOTE.md` e, alla prima accensione di ogni versione, in un riquadro nel gioco (*Patch note n.m*).
- **Un uccello per zona**, deciso al primo attracco; i rari solo con le voci, al massimo 2 (§ 13).
- **Un'icona per specie**, le varianti cambiano colore.
- **Cosa sopravvive al viaggio:** solo il taccuino. Strumenti, soldi e binocolo migliorato si perdono.
- **Ciurma:** per ora è solo un costo giornaliero, senza eventi.
- **Audio:** niente musica, suoni d'ambiente ed effetti sintetizzati; le proposte del § 16 sono approvate come base.
