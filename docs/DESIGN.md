# Una spedizione ornitologica · Documento di design

> Versione 0.1 · ottobre 2026 · documento vivo, cambia mentre il gioco prende forma.

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

```
┌─────────────────────────────────────┬───────────────┐
│                                     │               │
│                                     │   B · GLOBO   │
│          A · BATTLEMAP              │               │
│     (il riquadro più grande)        ├───────────────┤
│                                     │  data · soldi │
│                                     │  vita · ciurma│
├──────────────────────────┬──────────┴───────────────┤
│  C · TACCUINO /          │  D · CARTOLINA           │
│      INVENTARIO          │      (ASCII a layer)     │
└──────────────────────────┴──────────────────────────┘
```

| Riquadro | Contenuto | Note |
|---|---|---|
| **A** Battlemap | La zona in cui sei sbarcato, a griglia, con icone | Più alta possibile. In mare mostra il ponte della nave o il mare |
| **B** Globo | Sfera ASCII che ruota, la nave, i puntatori delle voci | Sotto, la barra di stato: data, soldi, vita, costo giornaliero |
| **C** Taccuino | Due schede: **Taccuino** (uccelli visti e mancanti) e **Inventario** | Ricorda il libro delle quest di Pioneers |
| **D** Cartolina | Il panorama ASCII della zona, visto da una persona in piedi | Composta a layer; è informazione, non decorazione |

Barra menu in stile anni '90: `Spedizione · Taccuino · Inventario · Ciurma · Aiuto`.

## 6. Il globo

**Generazione.** Ogni partita genera un arcipelago: **un'isola grande e 3–6 isole minori**, da un seed. Ogni isola è divisa in **zone**; ogni zona ha un bioma e alcune caratteristiche (§ 7). **Non tutti i biomi sono presenti in ogni partita**: alcuni uccelli in certi viaggi semplicemente non ci sono.

**Navigazione (tempo reale).**
- ← → sterzano, ↑ ↓ regolano le vele (velocità).
- Indicatori come in Pioneers: velocità in nodi, rotta in gradi.
- La sfera ruota sotto la nave, in ASCII ombreggiato (`.:-=+*#%@`).
- Avvicinandoti alla costa compare l'opzione **Attracca**: entri nella battlemap di quella zona.

**Puntatori.** Le voci comprate in città compaiono sul globo come segni: un cerchio largo per le voci vaghe, una croce precisa per quelle care.

**Tempo.** In mare **un giorno passa ogni ~20 secondi** di navigazione (valore da tarare). A fine giornata suona la campana di bordo e paghi la ciurma.

**Momenti del giorno.** Ogni giorno ha tre momenti: **alba**, **pomeriggio** e **notte**. Sbarchi nel momento in cui arrivi, e il momento resta fisso per tutta la visita a terra.
- La cartolina cambia cielo e luce; la palette della zona si scurisce di notte.
- Alcuni uccelli compaiono solo in certi momenti (*mattinieri* all'alba, *notturni* di notte).
- Di notte la visione si accorcia per tutti e alcune creature sono più attive.
- Tornare in una zona già visitata in un altro momento può valerne la pena.

## 7. Zone, biomi e caratteristiche

Ogni zona ha **un bioma** e **0–3 caratteristiche**. Insieme formano i **tag** della zona.

**Biomi** (lista iniziale, realistici con qualche tocco fantastico):

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

**Caratteristiche:** `cascata`, `fiume`, `lago`, `rovine`, `castello`, `villaggio`, `grotta`, `faro`, `albero secolare`.

Ogni uccello richiede un bioma e, a volte, una caratteristica (es. *Becco Blu* = foresta temperata + cascata). Un uccello può comparire **solo** in una zona che ha tutti i suoi tag.

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

**Dimensioni:** circa **64 × 22 caratteri**, quanto una schermata di Game Boy: abbastanza per leggere le forme, abbastanza piccolo da restare "vintage".

**Colore:** **3–4 colori per bioma**, applicati per profondità: il fondo più chiaro e desaturato, il primo piano più scuro. La nebbia schiarisce tutto.

## 9. La battlemap (A)

Una griglia (indicativamente **24 × 16 caselle**) generata dallo stesso seed della cartolina.

**Grafica:** icone monocromatiche da [game-icons.net](https://game-icons.net), colorate con la palette della zona. Una casella, un'icona leggibile.

**Contenuto:** terreno (erba, erba alta, cespugli, alberi, rocce, acqua bassa, acqua profonda), la **casella nave** (punto di arrivo e di partenza), uccelli, mostri, risorse, a volte un tesoro.

**Turni.** Il giocatore fa **un'azione**: muoversi di una casella, usare uno strumento, osservare, raccogliere, aspettare. Poi agiscono tutte le creature.

**Tempo a terra.** Ogni sbarco costa **1 giorno**; restare oltre i **40 turni** ne costa un altro.

### 9.1 Rumore e visione
Un unico sistema regola uccelli e mostri.

| Azione | Rumore (caselle) |
|---|---|
| Aspettare / osservare | 0 |
| Camminare | 1 |
| Camminare nell'acqua o nei rami secchi | 2 |
| Raccogliere / piazzare una trappola | 2 |
| Petardo | 6, nel punto in cui esplode |

- Il rumore **attira i mostri** e **fa fuggire gli uccelli** nel raggio.
- **Cespugli ed erba alta** ti nascondono: sei visibile solo da una casella adiacente.
- **Alberi e rocce** bloccano la linea di vista.

### 9.2 Osservare un uccello
Ogni uccello ha **due anelli**:
- **anello di fuga** (es. 2 caselle): se lo attraversi, vola via;
- **anello di osservazione** (es. 5 caselle, ampliato dal binocolo).

Devi restare **nella fascia tra i due**, con l'uccello in linea di vista, **senza fare rumore** per N turni. Una barra si riempie; al termine l'uccello entra nel taccuino.

Comportamenti possibili: *timido* (fuga ampia), *curioso* (si avvicina se stai fermo), *nomade* (cambia posatoio), *notturno*, *mattiniero*, *ghiotto* (attirato dai semi).

### 9.3 Creature
Ogni creatura mostra la sua **intenzione** per il turno successivo (freccia, `!` ti ha visto, `?` ha sentito qualcosa): non si viene mai colpiti a sorpresa.

| Creatura | Comportamento | Come la gestisci |
|---|---|---|
| Orso | Se ti vede carica in linea retta finché non sbatte | Fallo schiantare contro un albero o una roccia: stordito 3 turni |
| Lupi | In branco, cercano di circondarti | Separali con l'acqua; il petardo li mette in fuga |
| Cinghiale | Ti insegue, 2 caselle a turno, solo in linea retta | Portalo nella tagliola |
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

Anche le città hanno la loro **cartolina** in D. In città la battlemap è sostituita da un menu: *Mercato · Taverna (voci) · Guaritore · Bottega · Salpa*.

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

## 12. Il taccuino (C)

- Una pagina per uccello: ASCII art, nome, habitat, comportamento, curiosità.
- Gli uccelli non ancora visti mostrano una **sagoma** e un indizio sull'habitat ("si dice che ami le acque che cadono").
- I visti in **questo** viaggio sono evidenziati rispetto a quelli dei viaggi precedenti.
- Seconda scheda: **inventario** con peso e valore.

## 13. Gli uccelli

**60 uccelli**, organizzati in **20 famiglie × 3 varianti** (comune · raro · leggendario). Un mix di inventati buffi, inventati seri e alcuni reali.

Vivono in un file di dati modificabile senza toccare il codice:

```json
{
  "id": 17,
  "nome": "Becco Blu Maggiore",
  "famiglia": "beccoblu",
  "variante": 2,
  "bioma": "foresta",
  "caratteristica": "cascata",
  "rarita": 2,
  "comportamento": "timido",
  "anello_fuga": 3,
  "turni_osservazione": 4,
  "ascii": ["  __ ", " (o>", " /)) ", " ^^ "],
  "curiosita": "Si dice che canti solo quando piove."
}
```

Gli ID vanno da 0 a 59 e **non cambiano mai**: il codice del taccuino si basa su di essi.

## 14. Fine partita, attestato e codice

**Resoconto:** giorni di viaggio, zone visitate, uccelli nuovi, totale del taccuino, causa della fine.

**Attestato PDF** (generato nel browser):
- intestazione con il logo e "Una spedizione ornitologica";
- nome dell'esploratore, data, numero di spedizioni;
- la griglia dei 60 uccelli: visti in ASCII, mancanti come sagome;
- il **codice** in grande e un **QR code** con lo stesso codice.

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

- **Nome del giocatore:** si sceglie all'inizio della partita.
- **Momenti del giorno:** alba, pomeriggio e notte, che cambiano con il passare dei giorni (§ 6).
- **Cosa sopravvive al viaggio:** solo il taccuino. Strumenti, soldi e binocolo migliorato si perdono.
- **Ciurma:** per ora è solo un costo giornaliero, senza eventi.
- **Audio:** niente musica, suoni d'ambiente ed effetti sintetizzati; le proposte del § 16 sono approvate come base.
