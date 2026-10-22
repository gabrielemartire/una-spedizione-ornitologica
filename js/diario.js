// Il diario di viaggio: in basso le ultime cose annotate, con una linguetta che apre il
// taccuino intero: un solo libro a due pagine, numerate di seguito, con un capitolo per
// linguetta (note, uccelli, voci, finanze, zaino, stiva). Qui anche il resoconto di fine
// spedizione e l'attestato da scaricare: un libretto A5 in PDF, col codice del taccuino e il QR.
// Espone l'oggetto globale `Diario`.
const Diario = (() => {
  const TABS = [
    ["note", "Note"], ["uccelli", "Uccelli"], ["voci", "Voci"],
    ["finanze", "Finanze"], ["zaino", "Zaino"], ["stiva", "Stiva"],
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
        </div>
        <p class="book-keys">← → sfoglia · ↑ ↓ capitoli · Esc chiude</p>
      </div>`;
    box.hidden = false;
    fitBook();
    // in quale pagina cade l'inizio di ogni capitolo, e la fine del libro
    const flow = box.querySelector(".book-flow");
    const gap = parseFloat(getComputedStyle(flow).columnGap);
    const col = (flow.offsetWidth + gap) / 2;
    const left = flow.getBoundingClientRect().left;
    const pageOf = (node) => Math.round((node.getBoundingClientRect().left - left) / scale() / col);
    // ogni capitolo comincia su una pagina di sinistra: se cadrebbe a destra, una pagina bianca prima
    starts = {};
    box.querySelectorAll(".chapter").forEach((ch) => {
      if (pageOf(ch.querySelector("h3")) % 2) ch.insertAdjacentHTML("beforebegin", '<div class="blank-page"></div>');
      starts[ch.dataset.chapter] = pageOf(ch.querySelector("h3")) / 2;
    });
    spreads = Math.floor(pageOf(box.querySelector(".book-end")) / 2) + 1;
    turnTo(starts[tab]);
    Suoni.play("pagina");
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
      return `<ul class="book-notes">${trip().notes.map((n) => `<li>${when(n)} ${n.msg}</li>`).join("")}</ul>`;
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

    voci() {
      return `<ul class="book-notes">${(trip().rumors || []).map((n) => `<li>${when(n)} ${n.msg}</li>`).join("")}</ul>`;
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
      const extra = (it) => it.kind === "uovo" ? ` <small>(si schiude fra ${Math.max(1, Gioco.EGG_DAYS - (Gioco.day() - (it.day || 1)))} giorni)</small>` : "";
      return `<ul class="book-items"><li>${icon("binoculars")}Binocolo</li>${trip().pack.map((it) => `<li>${icon(OGGETTI_SPECIALI[it.kind].icona)}${OGGETTI_SPECIALI[it.kind].nome}${extra(it)}</li>`).join("")}</ul>`;
    },

    stiva() {
      const w = trip().wanted;
      const prisoner = w && w.state === "caught" ? `<li>${icon("prisoner")}${w.name}, legato <small>(alla gendarmeria del Forte)</small></li>` : "";
      return `<ul class="book-items">${prisoner}${trip().hold.map((it) => `<li>${icon(OGGETTI[it.kind].icona)}${OGGETTI[it.kind].nome}</li>`).join("")}</ul>`;
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
      <p class="end-code">Codice del taccuino: <b>${Gioco.code()}</b> <span>· annotalo, o scarica il libretto: c'è anche il QR</span></p>`;
  }

  // --- L'attestato: un libretto A5 ---
  // Un PDF di due pagine A4 orizzontali, da stampare fronte e retro (girando sul lato corto) e piegare
  // a metà: diventa un libretto A5. Fuori: a destra la copertina con lo stemma della Società
  // ornitologica, il nome e qualche notizia del viaggio; a sinistra il retro col QR per riprendere il
  // taccuino. Dentro: in cima il codice, scritto bene, poi tutti gli uccelli, specie per specie.
  const PAGE_W = 1754, PAGE_H = 1240, HALF = PAGE_W / 2, MARGIN = 64;   // A4 orizzontale a 150 dpi
  const INK = "#1e2418", SEPIA = "#6a4a2c", RED = "#8a2a1a", GOLD = "#b8862a", PAPER = "#f2ead2";
  const SERIF = "'IM Fell English', Georgia, serif", MONO = "'Courier New', Courier, monospace";

  function page() {
    const c = document.createElement("canvas");
    c.width = PAGE_W;
    c.height = PAGE_H;
    const g = c.getContext("2d");
    g.fillStyle = PAPER;
    g.fillRect(0, 0, PAGE_W, PAGE_H);
    // una cornice per ogni facciata, e i segni della piega in mezzo
    for (const x0 of [0, HALF]) {
      g.strokeStyle = SEPIA;
      g.lineWidth = 3;
      g.strokeRect(x0 + 34, 34, HALF - 68, PAGE_H - 68);
      g.lineWidth = 1;
      g.strokeRect(x0 + 44, 44, HALF - 88, PAGE_H - 88);
    }
    g.strokeStyle = "rgba(106, 74, 44, 0.5)";
    g.setLineDash([8, 8]);
    for (const [y0, y1] of [[0, 26], [PAGE_H - 26, PAGE_H]]) { g.beginPath(); g.moveTo(HALF, y0); g.lineTo(HALF, y1); g.stroke(); }
    g.setLineDash([]);
    return { c, g };
  }

  function write(g, str, x, y, { size = 24, font = SERIF, color = INK, align = "left", weight = "", italic = false } = {}) {
    g.font = `${italic ? "italic " : ""}${weight} ${size}px ${font}`;
    g.fillStyle = color;
    g.textAlign = align;
    g.fillText(str, x, y);
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

  // Fuori: il retro col QR (a sinistra) e la copertina (a destra)
  function outside(t, code) {
    const { c, g } = page();
    // la copertina: lo stemma della Società, il nome, il viaggio
    const cx = HALF + HALF / 2;
    write(g, "Società Ornitologica", cx, 150, { size: 64, align: "center" });
    write(g, "dell'Arcipelago senza nome · fondata nel 1500", cx, 196, { size: 26, color: SEPIA, align: "center", italic: true });
    g.strokeStyle = GOLD;
    g.lineWidth = 6;
    g.beginPath(); g.arc(cx, 420, 170, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2;
    g.beginPath(); g.arc(cx, 420, 152, 0, Math.PI * 2); g.stroke();
    drawIcon(g, "birdhouse", cx - 110, 310, 220, "#2f4a2a");
    write(g, "Taccuino di viaggio di", cx, 680, { size: 34, color: SEPIA, align: "center", italic: true });
    write(g, t.explorer, cx, 770, { size: 92, font: "'Pinyon Script', cursive", align: "center" });
    // le notizie del viaggio, scritte a penna
    const seen = UCCELLI.filter((u) => t.birds[u.id]?.level === "visto").length;
    const zones = Object.values(t.zones).filter((z) => z.visited).length;
    const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
    const lines = [
      `${n(Gioco.day(), "giorno", "giorni")} di viaggio`,
      `${n(t.stats.islands.size, "isola toccata", "isole toccate")}, ${n(zones, "zona esplorata", "zone esplorate")}`,
      `${n(seen, "uccello osservato", "uccelli osservati")} su ${UCCELLI.length}`,
    ];
    lines.forEach((l, i) => write(g, l, cx, 880 + i * 62, { size: 50, font: "'Pinyon Script', cursive", color: "#23305a", align: "center" }));
    write(g, new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }), cx, PAGE_H - 90, { size: 26, color: SEPIA, align: "center", italic: true });

    // il retro: il QR che apre il gioco col codice già scritto
    const bx = HALF / 2, size = 440;
    write(g, "Per riprendere il taccuino", bx, 200, { size: 44, align: "center" });
    if (typeof qrcode === "function") {
      const qr = qrcode(0, "M");
      qr.addData(Taccuino.link(code));
      qr.make();
      const n = qr.getModuleCount(), cell = Math.floor(size / (n + 8));
      const x0 = Math.round(bx - (cell * n) / 2), y0 = 260;
      g.fillStyle = "#fff";
      g.fillRect(x0 - cell * 4, y0 - cell * 4, cell * (n + 8), cell * (n + 8));
      g.fillStyle = INK;
      for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) g.fillRect(x0 + k * cell, y0 + r * cell, cell, cell);
    } else {
      write(g, "(il QR non si è potuto disegnare: serve la connessione)", bx, 480, { size: 24, color: SEPIA, align: "center", italic: true });
    }
    write(g, "inquadra il codice col telefono, oppure scrivilo", bx, 780, { size: 28, color: SEPIA, align: "center", italic: true });
    write(g, "nel menu, alla voce «Riprendi un taccuino»:", bx, 818, { size: 28, color: SEPIA, align: "center", italic: true });
    write(g, code, bx, 890, { size: 52, font: MONO, weight: "bold", align: "center" });
    write(g, "Una spedizione ornitologica", bx, PAGE_H - 130, { size: 32, align: "center" });
    write(g, "gabrielemartire.github.io/una-spedizione-ornitologica", bx, PAGE_H - 90, { size: 22, color: SEPIA, align: "center" });
    return c;
  }

  // Dentro: il codice in cima, il resoconto, poi gli uccelli specie per specie, su due facciate
  function inside(t, code) {
    const { c, g } = page();
    let x = MARGIN + 20, y = 120;
    const colW = HALF - 2 * (MARGIN + 20);
    write(g, "Codice del taccuino", x, y, { size: 26, color: SEPIA, italic: true });
    write(g, code, x, y + 64, { size: 62, font: MONO, weight: "bold" });
    y += 96;
    g.strokeStyle = SEPIA; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + colW, y); g.stroke();
    y += 44;

    const ROW = 24, bottom = PAGE_H - 64;
    // si va a capo sulla facciata di destra quando non c'è più posto; una specie può continuare di là
    const room = (h) => {
      if (y + h <= bottom) return false;
      x = HALF + MARGIN + 20;
      y = 110;
      return true;
    };
    const heading = (info, birds, more) => {
      const seen = birds.filter((u) => t.birds[u.id]?.level === "visto").length;
      write(g, info.nome + (more ? " (segue)" : ""), x, y + 26, { size: 28, weight: "bold" });
      write(g, `${info.latino} · ${seen}/${birds.length}`, x + colW, y + 26, { size: 19, color: SEPIA, align: "right", italic: true });
      y += 38;
    };
    Object.entries(SPECIE).forEach(([sp, info]) => {
      const birds = UCCELLI.filter((u) => u.specie === sp);
      room(38 + ROW * 2);   // il titolo non resta mai da solo in fondo
      heading(info, birds, false);
      for (const u of birds) {
        if (room(ROW)) heading(info, birds, true);
        const known = t.birds[u.id] || {};
        const level = known.level;
        // osservato: il disegno a colori e il nome; altrimenti un riquadro chiaro vuoto e la riga per il nome
        // (se l'hai incrociato, il nome a matita sulla riga)
        if (level === "visto") {
          g.fillStyle = "#2a2014";
          g.fillRect(x, y, 20, 20);
          if (u.rara) { g.strokeStyle = GOLD; g.lineWidth = 3; g.strokeRect(x - 2, y - 2, 24, 24); }
          drawIcon(g, iconaUccello(u), x + 2, y + 2, 16, u.colore);
          write(g, u.nome + (u.rara ? "  ✦" : ""), x + 32, y + 17, { size: 21 });
        } else {
          g.strokeStyle = "rgba(106, 74, 44, 0.35)";
          g.lineWidth = 1.5;
          g.strokeRect(x + 0.5, y + 0.5, 19, 19);
          g.beginPath(); g.moveTo(x + 32, y + 20); g.lineTo(x + colW * 0.62, y + 20); g.stroke();
          if (level === "traccia") write(g, u.nome, x + 32, y + 16, { size: 20, color: "#8a7a64", italic: true });
        }
        y += ROW;
      }
      y += 16;
    });
    return c;
  }

  async function downloadCertificate() {
    const t = trip();
    if (!t) return;
    try {
      await Promise.all(["48px 'Pinyon Script'", "32px 'IM Fell English'", "italic 32px 'IM Fell English'"].map((f) => document.fonts.load(f)));
    } catch (e) { /* va bene anche il carattere di riserva */ }
    const code = Gioco.code();
    const blob = pdfFromCanvases([outside(t, code), inside(t, code)]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `taccuino-${t.explorer.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "esploratore"}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // Un PDF con una pagina A4 orizzontale per canvas, ognuna con dentro l'immagine in JPEG: niente
  // librerie, il formato regge un'immagine per pagina con pochi oggetti
  function pdfFromCanvases(canvases) {
    const pw = 842, ph = 595;
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
