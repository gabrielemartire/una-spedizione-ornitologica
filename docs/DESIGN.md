# Una spedizione ornitologica · Documento di design

> Versione 0.2.1 · ottobre 2026 · documento vivo, cambia mentre il gioco prende forma.

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
| **C** Diario | Una pagina di carta con le ultime 3 note utili | Le linguette rosse biforcute aprono il taccuino intero (§ 12) |
| **D** Cartolina | Il panorama della zona in pixel art, visto da una persona in piedi | In mare: il mare dal ponte; col binocolo: la costa |

**Niente titoli sui riquadri.** In alto una **barra menu** in stile anni '90: *Spedizione* (tendina: torna al menu principale, nuova spedizione, suoni), *Diario*, *Suoni*; a destra il nome dell'esploratore e la **versione** del gioco. In partita **Esc** apre la tendina invece di uscire, per non perdere il viaggio per sbaglio.

**La spedizione si salva da sola** nel browser (localStorage), ogni paio di secondi e quando chiudi o ricarichi la pagina. Al refresh si riparte da dove eri: in mare nello stesso punto, in città in porto, a terra **di nuovo sulla nave della stessa zona** (la battlemap si rigenera, animali compresi). Dal menu principale *Continua la spedizione*; a fine spedizione il salvataggio si cancella. Il globo non si salva: nasce dal seed.

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
| Pomeriggio | l'**orso**: quasi sempre se c'è un fiume, meno spesso altrimenti |
| Notte | i **lupi**, in branco da 2 (3 nella taiga e sui ghiacci) |

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

### 9.5 Risorse
Piume cadute, erbe, funghi, legno pregiato, conchiglie, pelli, tesori. Hanno **peso** e lo zaino ha un limite: decidere cosa portare a bordo fa parte del gioco.

## 10. Le città

Due città per globo, sempre presenti.

| | **Il Forte** (città grande) | **Il Porto del fiordo** (città piccola) |
|---|---|---|
| Atmosfera | Mura di pietra sul mare, torri, porta ad arco, vicoli acciottolati e bancarelle | Molo di legno nella nebbia, case di legno grigio-azzurro, boe rosse, nasse, pini |
| Palette | pietra grigia, ardesia, legno caldo, mare | grigio-azzurro nebbia, legno scuro, **un solo accento rosso** |
| Mercato | ricco, compra tutto a buon prezzo | povero, prezzi bassi |
| Voci | precise e care | vaghe e economiche, dai pescatori |
| Cure | guaritore completo | solo cure di base |
| Strumenti | tutti, binocolo migliorabile | pochi |
| Posizione | sull'isola grande | in un fiordo, vicino alle zone fredde e selvagge |

Anche le città hanno la loro **cartolina** in D. In città la battlemap è sostituita da un menu: *Mercato · Taverna (voci) · Guaritore · Bottega · Salpa*. **Per ora c'è solo il guaritore** (5 monete per punto vita); il resto arriverà.

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

Sotto la mappa c'è il **bordo del diario**: carta vecchia, macchiata ai bordi, senza righe, con le **ultime 3 note** e la firma dell'esploratore in corsivo barocco. Dall'alto spuntano le **linguette rosse biforcute** (passandoci sopra si scuriscono).

Una linguetta, **Tab** o *Diario* nella barra aprono il **taccuino**: un libro aperto con due pagine e la piega in mezzo, **sempre della stessa misura** (si rimpicciolisce solo su schermi troppo piccoli). Le linguette dei capitoli escono da sotto il libro a sinistra, con la coda biforcuta verso fuori. **← →** sfogliano le pagine (finito un capitolo si passa al successivo), **↑ ↓** cambiano capitolo, **Esc** o Tab chiudono. Col mouse: clic sulla pagina sinistra o destra.

Il diario è un diario, non un manuale: niente spiegazioni, se un capitolo è vuoto è vuoto.
- **Note**: tutto ciò che è stato annotato, con giorno e momento.
- **Uccelli**: per specie, ogni uccello in uno di tre stati: **sconosciuto** (un "?"), **traccia** (la sagoma della specie e un indizio sull'habitat, non sull'ora), **osservato** (a colori, con habitat, ore, curiosità e dove l'hai visto).
- **Voci**: le note delle voci sentite in taverna (al massimo 2 per spedizione).
- **Ciurma**: in alto a destra, a penna e di sbieco, *8 monete al giorno*; sotto il registro **pagamenti** a tre colonne (chi · giorno · −monete) con le righe vuote che si riempiono man mano.
- **Zaino**: la lista degli oggetti (per ora il binocolo).
- **Stiva**: le cose da vendere (in arrivo con il mercato).

**Le tracce.** Se sbarchi in una zona all'ora sbagliata, o se l'uccello ti vola via per sempre, trovi le sue tracce: diventa una sagoma nel diario. Gli uccelli **rari** non lasciano tracce: di loro si sa solo dalle voci.

## 13. Gli uccelli

**Specie e varianti.** Ogni specie ha **una sola icona**; le sue varianti si distinguono per colore e nome (*Gabbiano comune*, *Gabbiano ala nera*, *Gabbiano becco blu*…). Obiettivo finale: **20 specie × 3 varianti = 60 uccelli**. Per ora **6 specie** (gabbiani, gufi, corvi, anatre, tucani, aquile), **18 uccelli**, in `js/uccelli.js`.

Ogni uccello ha: bioma (o "ovunque"), a volte una caratteristica (cascata, lago, castello, vulcano), **i momenti in cui si fa vedere**, un indizio e una curiosità. Gli ID non cambiano mai: il codice del taccuino si baserà su di essi.

**Un uccello per zona, deciso all'attracco.** Al primo sbarco in una zona si sceglie il suo uccello tra quelli adatti al bioma e alle caratteristiche (chi vuole una caratteristica ha la precedenza); da lì in poi è sempre quello. Se l'ora è sbagliata non si fa vedere: puoi aspettare a bordo e riprovare. Una volta osservato, la zona è segnata con la ✓ e lì non compare più niente.

**Gli uccelli rari** (Gabbiano becco blu, Corvo delle mura, Tucano delle oasi, Aquila di fuoco) non escono mai a caso: li lega a una zona precisa **solo una voce di taverna**, al massimo **2 voci per spedizione**.

## 14. Fine partita, attestato e codice

**Resoconto** (fatto): una schermata con la causa della fine, giorni di viaggio, sbarchi, zone esplorate, isole toccate, passi, ferite, uccelli osservati, e la griglia del taccuino (a colori gli osservati, sagome le tracce, "?" il resto).

**Attestato** (fatto, come immagine PNG): nome dell'esploratore, causa della fine, resoconto, la griglia degli uccelli per specie, il codice. *(Più avanti: PDF con QR code.)*

**Codice del taccuino**: per ora mostrato come `????-????-????-????` *prossimamente*.

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
- **Animali per momento:** alba cinghiale, pomeriggio orso (più spesso col fiume), notte lupi (§ 9.3).
- **Un uccello per zona**, deciso al primo attracco; i rari solo con le voci, al massimo 2 (§ 13).
- **Un'icona per specie**, le varianti cambiano colore.
- **Cosa sopravvive al viaggio:** solo il taccuino. Strumenti, soldi e binocolo migliorato si perdono.
- **Ciurma:** per ora è solo un costo giornaliero, senza eventi.
- **Audio:** niente musica, suoni d'ambiente ed effetti sintetizzati; le proposte del § 16 sono approvate come base.
