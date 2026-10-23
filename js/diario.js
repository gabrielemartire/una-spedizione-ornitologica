// Il diario di viaggio: in basso le ultime cose annotate, con una linguetta che apre il
// taccuino intero: un solo libro a due pagine, numerate di seguito, con un capitolo per
// linguetta (note, uccelli, voci, finanze, zaino, stiva). Qui anche il resoconto di fine
// spedizione e l'attestato da scaricare: un foglio A4 da piegare in quattro, col codice e il QR.
// Espone l'oggetto globale `Diario`.
const Diario = (() => {
  const TABS = [
    ["note", "Note"], ["uccelli", "Uccelli"], ["voci", "Voci"],
    ["finanze", "Finanze"], ["zaino", "Zaino"], ["stiva", "Stiva"], ["taglie", "Taglie"],
  ];
  const STRIP_NOTES = 3;
  const LEDGER_ROWS = 14;   // le righe del registro dei pagamenti, anche vuote
  const BOOK_W = 920, BOOK_H = 560;
  const PIXEL = 4;          // la carta del libro è disegnata a pixel grandi così
  let current = null;       // il capitolo aperto, se il taccuino è aperto
  let spread = 0;           // la doppia pagina che si sta guardando
  let spreads = 1;
  let starts = {};          // la doppia pagina in cui comincia ogni capitolo

  const trip = () => Gioco.trip;
  const icon = (name) => Gioco.iconHtml(name);
  const when = (n) => `<em>G${n.day} · ${n.time}</em>`;
  const tabsHtml = (cls) => TABS.map(([id, label]) =>
    `<button class="ribbon ${cls}${current === id ? " is-open" : ""}" data-diary-tab="${id}" tabindex="-1">${label}</button>`).join("");

  // --- La pagina sotto la mappa ---

  function renderStrip() {
    const box = document.getElementById("diary-strip");
    const t = trip();
    if (!box || !t) return;
    const notes = t.notes.slice(0, STRIP_NOTES);
    // una sola linguetta, sopra la firma: il testo delle note non le finisce mai dietro
    const html = `
      <div class="ds-tabs"><button class="ribbon${current ? " is-open" : ""}" data-diary-tab="note" tabindex="-1">Diario</button></div>
      <div class="ds-page paper">
        <ul class="ds-notes">${notes.map((n, i) => `<li${i ? "" : ' class="is-new"'}>${when(n)} ${n.msg}</li>`).join("")}</ul>
        <span class="ds-sign signature">${escapeHtml(t.explorer)}</span>
      </div>`;
    if (box._html !== html) { box.innerHTML = html; box._html = html; }
  }

  // --- La carta, in pixel art: grana, macchie, bordi bruniti e la piega in mezzo ---

  let paperUrl = null;
  function paper() {
    if (paperUrl) return paperUrl;
    const w = BOOK_W / PIXEL, h = BOOK_H / PIXEL;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    const img = g.createImageData(w, h);
    const r = rngPaper(7);
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const stains = Array.from({ length: 7 }, () => ({ x: r() * w, y: r() * h, rad: 4 + r() * 12 }));
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const page = x < w / 2 ? x / (w / 2) : (x - w / 2) / (w / 2);    // 0..1 dentro la pagina
        const edge = Math.min(page, 1 - page, y / h, 1 - y / h);         // vicinanza al bordo
        const spine = Math.abs(x - w / 2 + 0.5);
        let dark = Math.max(0, 0.12 - edge) * 3.2 + (spine < 5 ? (5 - spine) / 5 * 0.45 : 0);
        for (const st of stains) {
          const d = Math.hypot(x - st.x, y - st.y);
          if (d < st.rad) dark += 0.07 * (1 - d / st.rad);
        }
        dark += (r() - 0.5) * 0.05;
        // il dithering ordinato a 3 toni: carta, carta brunita, bruciatura
        const t = BAYER[(y % 4) * 4 + (x % 4)] / 16;
        const level = dark * 3 > 2 + t ? 3 : dark * 3 > 1 + t ? 2 : dark * 3 > t * 0.6 ? 1 : 0;
        const col = [[232, 220, 184], [222, 206, 164], [200, 176, 128], [150, 118, 74]][level];
        const i = (y * w + x) * 4;
        img.data.set([col[0], col[1], col[2], 255], i);
      }
    }
    g.putImageData(img, 0, 0);
    paperUrl = c.toDataURL();
    return paperUrl;
  }

  function rngPaper(seed) {
    let a = seed;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // --- Il taccuino aperto: un solo libro, le linguette dei capitoli a sinistra ---

  function open(tab = "note") {
    const box = document.getElementById("diary-popup");
    box.innerHTML = `
      <div class="book-wrap">
        <div class="book" role="dialog" aria-label="Diario">
          <nav class="book-tabs"></nav>
          <div class="book-pages" style="background-image:url(${paper()})"></div>
          <div class="book-spread"><div class="book-flow">${TABS.map(([id, label]) =>
            `<section class="chapter" data-chapter="${id}"><h3>${label}</h3>${PAGES[id]()}</section>`).join("")}<i class="book-end"></i></div></div>
          <span class="book-folio is-left"></span><span class="book-folio is-right"></span>
          <div class="book-cells"></div>
        </div>
        <p class="book-keys">← → sfoglia · ↑ ↓ capitoli · Esc chiude</p>
      </div>`;
    box.hidden = false;
    fitBook();
    paginate();
    turnTo(starts[tab]);
    Suoni.play("pagina");
    // se i caratteri del libro arrivano dopo, il testo si allarga: si rifà l'impaginazione e si resta sul capitolo
    if (document.fonts.status !== "loaded") document.fonts.ready.then(() => {
      if (!isOpen()) return;
      const here = current;
      paginate();
      turnTo(starts[here]);
    });
  }

  // In quale pagina cade l'inizio di ogni capitolo, e la fine del libro. Ogni capitolo comincia su una
  // pagina di sinistra: se cadrebbe a destra, prima ci va una pagina bianca
  function paginate() {
    const box = document.getElementById("diary-popup");
    const flow = box.querySelector(".book-flow");
    flow.querySelectorAll(".blank-page").forEach((b) => b.remove());
    const transform = flow.style.transform;
    flow.style.transform = "";
    const gap = parseFloat(getComputedStyle(flow).columnGap);
    const col = (flow.offsetWidth + gap) / 2;
    const left = flow.getBoundingClientRect().left;
    const pageOf = (node) => Math.round((node.getBoundingClientRect().left - left) / scale() / col);
    starts = {};
    box.querySelectorAll(".chapter").forEach((ch) => {
      if (pageOf(ch.querySelector("h3")) % 2) ch.insertAdjacentHTML("beforebegin", '<div class="blank-page"></div>');
      starts[ch.dataset.chapter] = pageOf(ch.querySelector("h3")) / 2;
    });
    spreads = Math.floor(pageOf(box.querySelector(".book-end")) / 2) + 1;
    flow.style.transform = transform;
  }

  function turnTo(n) {
    const box = document.getElementById("diary-popup");
    const flow = box.querySelector(".book-flow");
    spread = Math.max(0, Math.min(spreads - 1, n));
    flow.style.transform = `translateX(${-spread * (flow.offsetWidth + parseFloat(getComputedStyle(flow).columnGap))}px)`;
    box.querySelector(".book-folio.is-left").textContent = spread * 2 + 1;
    box.querySelector(".book-folio.is-right").textContent = spread * 2 + 2;
    // il capitolo è quello cominciato per ultimo entro questa doppia pagina
    current = TABS.filter(([id]) => starts[id] <= spread).pop()[0];
    box.querySelector(".book-tabs").innerHTML = tabsHtml("is-side");
    // i ricercati in stiva, cioè presi e non ancora consegnati: nella doppia pagina della stiva, in basso
    // a destra, ognuno nella sua cella. Quelli consegnati restano solo nel capitolo delle taglie
    const caught = (trip().captured || []).filter((p) => !p.delivered);
    const cells = box.querySelector(".book-cells");
    cells.hidden = spread !== starts.stiva || !caught.length;
    cells.innerHTML = caught.map((p) => `<figure class="jail"><div class="jail-bars"><span>${escapeHtml(p.name)}</span></div>
      <figcaption>da consegnare · G${p.day}</figcaption></figure>`).join("");
    renderStrip();
  }

  function flip(dir) {
    if (spread + dir < 0 || spread + dir >= spreads) return;
    turnTo(spread + dir);
    Suoni.play("pagina");
  }

  function chapter(dir) {
    const i = TABS.findIndex(([id]) => id === current);
    const next = TABS[(i + dir + TABS.length) % TABS.length][0];
    turnTo(starts[next]);
    Suoni.play("pagina");
  }

  // Il libro ha sempre la stessa misura: solo su uno schermo piccolo si rimpicciolisce tutto insieme
  const scale = () => Math.min(1, (window.innerWidth - 120) / BOOK_W, (window.innerHeight - 80) / (BOOK_H + 30));
  function fitBook() {
    const wrap = document.querySelector("#diary-popup .book-wrap");
    if (wrap) wrap.style.transform = `scale(${scale()})`;
  }

  function close() {
    current = null;
    const box = document.getElementById("diary-popup");
    if (box) box.hidden = true;
    renderStrip();
  }

  const isOpen = () => current !== null;

  const PAGES = {
    note() {
      return `<p class="pen-note">viaggio n. ${trip().voyage || 1}</p><ul class="book-notes">${trip().notes.map((n) => `<li>${when(n)} ${n.msg}</li>`).join("")}</ul>`;
    },

    // Per specie; ogni uccello è una scheda: vuota, qualche riga (tracce o voci), completa col disegno
    uccelli() {
      const t = trip();
      return Object.entries(SPECIE).map(([sp, info]) => {
        const birds = UCCELLI.filter((u) => u.specie === sp);
        const seen = birds.filter((u) => t.birds[u.id]?.level === "visto").length;
        // dove cercarli: i posti dei comuni, così si può partire a caccia di una specie intera
        const where = [...new Set(birds.filter((u) => !u.rara && !u.uovo).map((u) => habitatUccello(u).toLowerCase()))].join(" · ");
        const paid = (t.society || []).includes(sp);
        return `<h4>${info.nome} <small>${info.latino} · ${seen}/${birds.length}</small></h4>
          <p class="sp-where">Si trovano: ${where}.${paid ? " <b>Premio della Società riscosso.</b>" : ""}</p>
          ${birds.map((u) => birdCard(u, t.birds[u.id])).join("")}`;
      }).join("");
    },

    // le voci su un uccello si barrano quando l'hai osservato
    voci() {
      const t = trip();
      return `<ul class="book-notes">${(t.rumors || []).map((n) => {
        const done = n.bird != null && t.birds[n.bird]?.level === "visto";
        return `<li${done ? ' class="is-done"' : ""}>${when(n)} ${done ? `<s>${n.msg}</s>` : n.msg}</li>`;
      }).join("")}</ul>`;
    },

    // Il registro delle finanze: quello che esce (la ciurma, le botteghe) e quello che entra (vendite, premi, taglie)
    finanze() {
      const rows = [...trip().payments].reverse().map((p) =>
        `<tr><td>${p.what}</td><td>giorno ${p.day}</td><td class="${p.in ? "is-in" : ""}">${p.in ? "+" : "−"}${p.amount} m.o.</td></tr>`);
      while (rows.length < LEDGER_ROWS) rows.push("<tr><td></td><td></td><td></td></tr>");
      return `<p class="pen-note">ciurma: ${Gioco.CREW_PAY} m.o. al giorno</p>
        <table class="ledger"><caption>entrate e uscite</caption>${rows.join("")}</table>`;
    },

    zaino() {
      // l'uovo dice quanto manca; la chiave resta per tutta la spedizione
      const extra = (it) => it.kind === "uovo" ? " <small>(potrebbe schiudersi)</small>" : "";
      return `<ul class="book-items"><li>${icon("binoculars")}Binocolo</li>${trip().pack.map((it) => `<li>${icon(OGGETTI_SPECIALI[it.kind].icona)}${OGGETTI_SPECIALI[it.kind].nome}${extra(it)}</li>`).join("")}</ul>`;
    },

    stiva() {
      return `<ul class="book-items">${trip().hold.map((it) => `<li>${icon(OGGETTI[it.kind].icona)}${OGGETTI[it.kind].nome}</li>`).join("")}</ul>`;
    },

    // Una pagina per ogni avviso accettato, con l'insegna WANTED; consegnato il ricercato, il timbro CATTURATO
    taglie() {
      const list = trip().bounties || [];
      if (!list.length) return `<p class="book-empty">Nessun avviso accettato. Le bacheche dei ricercati sono sulle banchine.</p>`;
      const stamp = { delivered: '<span class="poster-stamp">catturato</span>', escaped: '<span class="poster-stamp is-gone">sfuggito</span>' };
      return list.map((b) => `<div class="poster">
          <div class="poster-head">${icon("wanted")}<b>Wanted</b></div>
          <p class="poster-name">${escapeHtml(b.name)}</p>
          ${b.crime ? `<p class="poster-crime">che ${b.crime}</p>` : ""}
          <p class="poster-prize">taglia: ${Gioco.BOUNTY} m.o.</p>
          <p class="poster-day">avviso accettato il giorno ${b.day}${b.state === "caught" ? " · in stiva" : ""}</p>
          ${stamp[b.state] || ""}
        </div>`).join("");
    },
  };

  // Le righe della scheda: vuote finché non sai niente; incrociato (traccia) il nome e dove e quando
  // vive, senza il disegno; visto, tutto. I rari, visti, hanno una cornice d'oro
  function birdCard(u, known = {}) {
    const level = known.level;
    const seen = level === "visto";
    const lines = ["", "", "", ""];
    if (seen) {
      lines[0] = `<b>${u.nome}</b>${u.latino ? ` <i>${u.latino}</i>` : ""}${u.rara ? ' <span class="rare-tag">✦ raro</span>' : ""}`;
      lines[1] = `${habitatUccello(u)} · ${u.ore.join(" e ")}`;
      lines[2] = u.curiosita;
      lines[3] = `<span class="where">${known.day ? `visto: ${known.zone}, G${known.day} ${known.time}` : "visto in una spedizione precedente"}</span>`;
    } else {
      if (level === "traccia" || known.voce) lines[0] = `<b>${u.nome}</b>`;
      if (level === "traccia") lines[1] = `${habitatUccello(u)} · ${u.ore.join(" e ")}`;
      if (known.voce) lines[3] = `<span class="where">voce: ${known.voce}</span>`;
    }
    return `<div class="bird-card${seen ? " is-seen" : ""}${seen && u.rara ? " is-rare" : ""}" style="--bird-color:${u.colore}">
      <div class="bird-pic">${seen ? icon(iconaUccello(u)) : ""}</div>
      <div class="bird-lines">${lines.map((l) => `<p>${l}</p>`).join("")}</div>
    </div>`;
  }

  // --- Fine spedizione ---

  function stats(t) {
    const zones = Object.values(t.zones).filter((z) => z.visited).length;
    const seen = UCCELLI.filter((u) => t.birds[u.id]?.level === "visto");
    return [
      ["Viaggio", `n. ${t.voyage || 1}`],
      ["Giorni di viaggio", Gioco.day()],
      ["Sbarchi", t.stats.landings],
      ["Zone esplorate", zones],
      ["Isole toccate", t.stats.islands.size],
      ["Passi a terra", t.stats.steps],
      ["Ferite", t.stats.hits],
      ["Uccelli osservati", `${seen.length} su ${UCCELLI.length}`],
    ];
  }

  function renderEnd() {
    const t = trip();
    if (!t || !t.cause) return;
    const grid = Object.keys(SPECIE).map((sp) => `<div class="end-row">${UCCELLI.filter((u) => u.specie === sp).map((u) => {
      const level = t.birds[u.id]?.level;
      const cls = level === "visto" ? "is-seen" : level === "traccia" ? "is-trace" : "is-unknown";
      return `<div class="end-bird ${cls}${u.rara && level === "visto" ? " is-rare" : ""}" style="--bird-color:${u.colore}" title="${level === "visto" ? u.nome : "???"}">
        ${level ? icon(iconaUccello(u)) : "?"}</div>`;
    }).join("")}</div>`).join("");
    document.getElementById("end-body").innerHTML = `
      <h2 class="heading">~ ${t.cause.title} ~</h2>
      <p class="subtitle">${t.cause.text}</p>
      <div class="end-cols">
        <dl class="end-stats">${stats(t).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
        <div>
          <p class="end-name">Il taccuino di <b class="signature">${escapeHtml(t.explorer)}</b></p>
          <div class="end-grid">${grid}</div>
        </div>
      </div>
      <p class="end-code">Codice del taccuino: <b>${Gioco.code()}</b> <span>· annotalo, o scarica il libretto: si stampa da un lato e si piega in quattro</span></p>`;
  }

  // --- L'attestato: un libretto da un foglio solo ---
  // Un PDF di una pagina A4 verticale, stampata da un lato solo e piegata in quattro: prima a metà in
  // orizzontale (la stampa resta fuori), poi a metà in verticale. Diventa un libretto A6:
  //   metà in basso, dritta:   a sinistra il retro (il QR), a destra la copertina
  //   metà in alto, capovolta: l'interno, due facciate con gli uccelli (dopo le pieghe si legge dritto)
  // Le cose scritte a penna stanno su una riga, come negli spazi di un modulo; il nome resta in corsivo barocco.
  const PAGE_W = 1654, PAGE_H = 2339;                 // A4 verticale a 200 dpi
  const PW = PAGE_W / 2, PH = PAGE_H / 2;             // una facciata del libretto (A6)
  const INK = "#1e2418", SEPIA = "#6a4a2c", GOLD = "#b8862a", PAPER = "#f2ead2", PEN = "#23305a";
  const SERIF = "'IM Fell English', Georgia, serif", MONO = "'Courier New', Courier, monospace";
  const HAND = "'Cedarville Cursive', cursive", BAROQUE = "'Pinyon Script', cursive";

  function canvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.fillStyle = PAPER;
    g.fillRect(0, 0, w, h);
    return { c, g };
  }

  // la cornice di una facciata
  function frame(g, ox, oy) {
    g.strokeStyle = SEPIA;
    g.lineWidth = 3;
    g.strokeRect(ox + 34, oy + 34, PW - 68, PH - 68);
    g.lineWidth = 1;
    g.strokeRect(ox + 44, oy + 44, PW - 88, PH - 88);
  }

  function write(g, str, x, y, { size = 24, font = SERIF, color = INK, align = "left", weight = "", italic = false } = {}) {
    g.font = `${italic ? "italic " : ""}${weight} ${size}px ${font}`;
    g.fillStyle = color;
    g.textAlign = align;
    g.fillText(str, x, y);
  }

  // scritto a penna su una riga, come nello spazio apposito di un modulo
  function penLine(g, str, x, y, w, { size = 40, font = HAND, align = "left" } = {}) {
    g.strokeStyle = "rgba(106, 74, 44, 0.55)";
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x, y + 8); g.lineTo(x + w, y + 8); g.stroke();
    write(g, str, align === "center" ? x + w / 2 : x + 6, y, { size, font, color: PEN, align });
  }

  function drawIcon(g, name, x, y, size, color) {
    const path = new Path2D(ICONS[name]);
    g.save();
    g.translate(x, y);
    g.scale(size / 512, size / 512);
    g.fillStyle = color;
    g.fill(path);
    g.restore();
  }

  // La copertina: lo stemma della Società, il nome, i giorni di viaggio e la data a penna
  function cover(g, ox, oy, t) {
    frame(g, ox, oy);
    const cx = ox + PW / 2;
    write(g, "Società Ornitologica", cx, oy + 160, { size: 62, align: "center" });
    g.strokeStyle = GOLD;
    g.lineWidth = 6;
    g.beginPath(); g.arc(cx, oy + 400, 160, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2;
    g.beginPath(); g.arc(cx, oy + 400, 142, 0, Math.PI * 2); g.stroke();
    drawIcon(g, "birdhouse", cx - 104, oy + 296, 208, "#2f4a2a");
    write(g, "Taccuino di viaggio di", cx, oy + 660, { size: 32, color: SEPIA, align: "center", italic: true });
    penLine(g, t.explorer, ox + 110, oy + 760, PW - 220, { size: 88, font: BAROQUE, align: "center" });
    const days = Gioco.day();
    write(g, "giorni di viaggio", ox + 110, oy + 880, { size: 26, color: SEPIA, italic: true });
    penLine(g, `${days} ${days === 1 ? "giorno" : "giorni"}`, ox + 330, oy + 880, PW - 440);
    write(g, "data", ox + 110, oy + 960, { size: 26, color: SEPIA, italic: true });
    penLine(g, new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }), ox + 330, oy + 960, PW - 440);
    write(g, "viaggio n.", ox + 110, oy + 1040, { size: 26, color: SEPIA, italic: true });
    penLine(g, String(t.voyage || 1), ox + 330, oy + 1040, PW - 440);
  }

  // Il retro: il QR (color sabbia) che apre il gioco col codice già scritto, e il codice
  function back(g, ox, oy, code) {
    frame(g, ox, oy);
    const bx = ox + PW / 2;
    write(g, "Per riprendere il taccuino", bx, oy + 170, { size: 44, align: "center" });
    if (typeof qrcode === "function") {
      const qr = qrcode(0, "M");
      qr.addData(Taccuino.link(code));
      qr.make();
      const n = qr.getModuleCount(), cell = Math.floor(440 / (n + 8));
      const x0 = Math.round(bx - (cell * n) / 2), y0 = oy + 250;
      g.fillStyle = "#efe2bc";
      g.fillRect(x0 - cell * 4, y0 - cell * 4, cell * (n + 8), cell * (n + 8));
      g.fillStyle = "#4a3a22";
      for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) g.fillRect(x0 + k * cell, y0 + r * cell, cell, cell);
    } else {
      write(g, "(il QR non si è potuto disegnare: serve la connessione)", bx, oy + 460, { size: 24, color: SEPIA, align: "center", italic: true });
    }
    write(g, "inquadra il codice col telefono, oppure scrivilo", bx, oy + 780, { size: 28, color: SEPIA, align: "center", italic: true });
    write(g, "nel menu, alla voce «Riprendi un taccuino»", bx, oy + 818, { size: 28, color: SEPIA, align: "center", italic: true });
    write(g, code, bx, oy + 900, { size: 54, font: MONO, weight: "bold", align: "center" });
    write(g, "Una spedizione ornitologica", bx, oy + PH - 130, { size: 32, align: "center" });
    write(g, "gabrielemartire.github.io/una-spedizione-ornitologica", bx, oy + PH - 90, { size: 22, color: SEPIA, align: "center" });
  }

  // L'interno: due facciate. In cima, a penna, isole, zone e uccelli; poi gli uccelli specie per specie
  function insideSpread(t) {
    const { c, g } = canvas(PAGE_W, PH);
    frame(g, 0, 0);
    frame(g, PW, 0);
    const colW = PW - 2 * 82;
    let x = 82, y = 100;
    const seen = UCCELLI.filter((u) => t.birds[u.id]?.level === "visto").length;
    const zones = Object.values(t.zones).filter((z) => z.visited).length;
    for (const [label, value] of [["isole toccate", t.stats.islands.size], ["zone esplorate", zones], ["uccelli osservati", `${seen} su ${UCCELLI.length}`]]) {
      write(g, label, x, y, { size: 24, color: SEPIA, italic: true });
      penLine(g, String(value), x + 220, y, colW - 220, { size: 36 });
      y += 54;
    }
    y += 4;
    g.strokeStyle = SEPIA; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + colW, y); g.stroke();
    y += 14;

    const ROW = 22, bottom = PH - 62;
    // si va sulla facciata di destra quando non c'è più posto; una specie può continuare di là
    const room = (h) => {
      if (y + h <= bottom) return false;
      x = PW + 82;
      y = 80;
      return true;
    };
    const heading = (info, birds, more) => {
      const n = birds.filter((u) => t.birds[u.id]?.level === "visto").length;
      write(g, info.nome + (more ? " (segue)" : ""), x, y + 26, { size: 26, weight: "bold" });
      write(g, `${info.latino} · ${n}/${birds.length}`, x + colW, y + 26, { size: 18, color: SEPIA, align: "right", italic: true });
      y += 36;
    };
    Object.entries(SPECIE).forEach(([sp, info]) => {
      const birds = UCCELLI.filter((u) => u.specie === sp);
      room(36 + ROW * 2);   // il titolo non resta mai da solo in fondo
      heading(info, birds, false);
      for (const u of birds) {
        if (room(ROW)) heading(info, birds, true);
        const level = t.birds[u.id]?.level;
        // osservato: il disegno a colori e il nome; altrimenti un riquadro chiaro vuoto e la riga per il nome
        // (se l'hai incrociato, il nome a penna sulla riga)
        if (level === "visto") {
          g.fillStyle = "#2a2014";
          g.fillRect(x, y, 18, 18);
          if (u.rara) { g.strokeStyle = GOLD; g.lineWidth = 3; g.strokeRect(x - 2, y - 2, 22, 22); }
          drawIcon(g, iconaUccello(u), x + 2, y + 2, 14, u.colore);
          write(g, u.nome + (u.rara ? "  ✦" : ""), x + 30, y + 16, { size: 20 });
        } else {
          g.strokeStyle = "rgba(106, 74, 44, 0.35)";
          g.lineWidth = 1.5;
          g.strokeRect(x + 0.5, y + 0.5, 17, 17);
          g.beginPath(); g.moveTo(x + 30, y + 18); g.lineTo(x + colW * 0.7, y + 18); g.stroke();
          if (level === "traccia") write(g, u.nome, x + 34, y + 15, { size: 20, font: HAND, color: PEN });
        }
        y += ROW;
      }
      y += 12;
    });
    return c;
  }

  // Il foglio: in basso retro e copertina dritti, in alto l'interno capovolto; i segni delle pieghe
  function sheet(t, code) {
    const { c, g } = canvas(PAGE_W, PAGE_H);
    back(g, 0, PH, code);
    cover(g, PW, PH, t);
    g.save();
    g.translate(PAGE_W, PH);
    g.rotate(Math.PI);
    g.drawImage(insideSpread(t), 0, 0);
    g.restore();
    g.strokeStyle = "rgba(106, 74, 44, 0.45)";
    g.setLineDash([10, 10]);
    for (const [x0, y0, x1, y1] of [[PW, 0, PW, 26], [PW, PAGE_H - 26, PW, PAGE_H], [0, PH, 26, PH], [PAGE_W - 26, PH, PAGE_W, PH]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
    g.setLineDash([]);
    return c;
  }

  async function downloadCertificate() {
    const t = trip();
    if (!t) return;
    try {
      await Promise.all(["48px 'Pinyon Script'", "40px 'Cedarville Cursive'", "32px 'IM Fell English'", "italic 32px 'IM Fell English'"].map((f) => document.fonts.load(f)));
    } catch (e) { /* va bene anche il carattere di riserva */ }
    const blob = pdfFromCanvases([sheet(t, Gioco.code())]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `taccuino-${t.explorer.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "esploratore"}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // Un PDF con una pagina A4 per canvas (verticale o orizzontale come il canvas), ognuna con dentro
  // l'immagine in JPEG: niente librerie, il formato regge un'immagine per pagina con pochi oggetti
  function pdfFromCanvases(canvases) {
    const [pw, ph] = canvases[0].width < canvases[0].height ? [595, 842] : [842, 595];
    const enc = new TextEncoder();
    const parts = [];
    const offsets = [];
    let size = 0;
    const add = (chunk) => { const b = typeof chunk === "string" ? enc.encode(chunk) : chunk; parts.push(b); size += b.length; };
    const obj = (n, body) => { offsets[n] = size; add(`${n} 0 obj\n`); body.forEach(add); add("\nendobj\n"); };
    const n = canvases.length;
    const pageId = (i) => 3 + i * 3;   // pagina, immagine, contenuto: tre oggetti per pagina
    add("%PDF-1.4\n");
    obj(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
    obj(2, [`<< /Type /Pages /Kids [${canvases.map((_, i) => `${pageId(i)} 0 R`).join(" ")}] /Count ${n} >>`]);
    canvases.forEach((canvas, i) => {
      const jpeg = Uint8Array.from(atob(canvas.toDataURL("image/jpeg", 0.9).split(",")[1]), (ch) => ch.charCodeAt(0));
      const id = pageId(i);
      const draw = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
      obj(id, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${id + 1} 0 R >> >> /Contents ${id + 2} 0 R >>`]);
      obj(id + 1, [`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, "\nendstream"]);
      obj(id + 2, [`<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`]);
    });
    const total = 3 + n * 3;
    const xref = size;
    add(`xref\n0 ${total}\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`);
    add(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(parts, { type: "application/pdf" });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  }

  // --- Comandi ---

  document.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-diary-tab]")?.dataset.diaryTab;
    if (tab) {
      if (!isOpen()) open(tab);
      else if (tab === current) close();
      else { turnTo(starts[tab]); Suoni.play("pagina"); }
      return;
    }
    if (e.target.id === "diary-popup") { close(); return; }
    // un clic sulla pagina di sinistra torna indietro, su quella di destra va avanti
    const book = e.target.closest(".book");
    if (book && isOpen()) {
      const r = book.getBoundingClientRect();
      flip(e.clientX < r.left + r.width / 2 ? -1 : 1);
      return;
    }
    if (e.target.closest("[data-game-action=\"diary\"]")) isOpen() ? close() : open();
    if (e.target.closest("[data-end-action=\"download\"]")) downloadCertificate();
  });

  const ARROWS = { ArrowLeft: () => flip(-1), ArrowRight: () => flip(1), ArrowUp: () => chapter(-1), ArrowDown: () => chapter(1) };

  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("in-game") || !trip() || trip().over) return;
    if (e.key === "Tab") {
      e.preventDefault();
      isOpen() ? close() : open("note");
    } else if (isOpen() && e.key === "Escape") {
      close();
    } else if (isOpen() && ARROWS[e.key]) {
      e.preventDefault();
      ARROWS[e.key]();
    } else if (isOpen()) {
      return e.preventDefault(); // a taccuino aperto il resto della tastiera tace
    } else return;
    e.stopImmediatePropagation();
  });

  window.addEventListener("resize", fitBook);

  return { renderStrip, open, close, isOpen, renderEnd, downloadCertificate };
})();
