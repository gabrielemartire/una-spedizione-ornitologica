// Il diario di viaggio: in basso le ultime cose annotate, con le linguette rosse che aprono il
// taccuino intero, un libro a due pagine con un capitolo per linguetta (note, uccelli, voci,
// ciurma, zaino, stiva). Qui anche il resoconto di fine spedizione e l'attestato da scaricare.
// Espone l'oggetto globale `Diario`.
const Diario = (() => {
  const TABS = [
    ["note", "Note"], ["uccelli", "Uccelli"], ["voci", "Voci"],
    ["ciurma", "Ciurma"], ["zaino", "Zaino"], ["stiva", "Stiva"],
  ];
  const STRIP_NOTES = 3;
  const LEDGER_ROWS = 14;   // le righe del registro dei pagamenti, anche vuote
  const BOOK_W = 920, BOOK_H = 560;
  let current = null;       // il capitolo aperto, se il taccuino è aperto
  let spread = 0;           // la doppia pagina che si sta guardando
  let spreads = 1;

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
    const html = `
      <div class="ds-tabs">${tabsHtml("")}</div>
      <div class="ds-page paper">
        <ul class="ds-notes">${notes.map((n, i) => `<li${i ? "" : ' class="is-new"'}>${when(n)} ${n.msg}</li>`).join("")}</ul>
        <span class="ds-sign signature">${escapeHtml(t.explorer)}</span>
      </div>`;
    if (box._html !== html) { box.innerHTML = html; box._html = html; }
  }

  // --- Il taccuino aperto: due pagine, i capitoli sono le linguette a sinistra ---

  function open(tab = current || "note", { last = false } = {}) {
    current = tab;
    const box = document.getElementById("diary-popup");
    const [, label] = TABS.find(([id]) => id === tab);
    box.innerHTML = `
      <div class="book-wrap">
        <div class="book" role="dialog" aria-label="Diario: ${label}">
          <nav class="book-tabs">${tabsHtml("is-side")}</nav>
          <div class="book-pages paper"></div>
          <div class="book-spread"><div class="book-flow"><h3>${label}</h3>${PAGES[tab]()}<i class="book-end"></i></div></div>
          <span class="book-folio is-left"></span><span class="book-folio is-right"></span>
        </div>
        <p class="book-keys">← → sfoglia · ↑ ↓ capitoli · Esc chiude</p>
      </div>`;
    box.hidden = false;
    fitBook();
    const flow = box.querySelector(".book-flow");
    const end = box.querySelector(".book-end");
    // la colonna in cui cade la fine del capitolo dice quante doppie pagine servono
    const step = flow.offsetWidth + parseFloat(getComputedStyle(flow).columnGap);
    const offset = (end.getBoundingClientRect().left - flow.getBoundingClientRect().left) / scale();
    spreads = Math.max(1, Math.floor(offset / step) + 1);
    turnTo(last ? spreads - 1 : 0);
    Suoni.play("pagina");
  }

  function turnTo(n) {
    const box = document.getElementById("diary-popup");
    const flow = box.querySelector(".book-flow");
    spread = n;
    const step = flow.offsetWidth + parseFloat(getComputedStyle(flow).columnGap);
    flow.style.transform = `translateX(${-spread * step}px)`;
    box.querySelector(".book-folio.is-left").textContent = spread * 2 + 1;
    box.querySelector(".book-folio.is-right").textContent = spread * 2 + 2;
  }

  // Sfogliare: finito un capitolo si passa al successivo, come in un quaderno vero
  function flip(dir) {
    const i = TABS.findIndex(([id]) => id === current);
    if (spread + dir >= 0 && spread + dir < spreads) {
      turnTo(spread + dir);
      Suoni.play("pagina");
    } else if (TABS[i + dir]) {
      open(TABS[i + dir][0], { last: dir < 0 });
    }
  }

  function chapter(dir) {
    const i = TABS.findIndex(([id]) => id === current);
    open(TABS[(i + dir + TABS.length) % TABS.length][0]);
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

    // Ogni uccello: sconosciuto (?), una traccia (sagoma e indizio), osservato (a colori)
    uccelli() {
      const t = trip();
      return Object.entries(SPECIE).map(([sp, info]) => {
        const cards = UCCELLI.filter((u) => u.specie === sp).map((u) => birdCard(u, t.birds[u.id])).join("");
        return `<h4>${info.nome}</h4>${cards}`;
      }).join("");
    },

    voci() {
      return `<ul class="book-notes">${(trip().rumors || []).map((n) => `<li>${when(n)} ${n.msg}</li>`).join("")}</ul>`;
    },

    // Il registro dei pagamenti: si compila riga dopo riga
    ciurma() {
      const rows = [...trip().payments].reverse().map((p) => `<tr><td>${p.what}</td><td>giorno ${p.day}</td><td>−${p.amount}</td></tr>`);
      while (rows.length < LEDGER_ROWS) rows.push("<tr><td></td><td></td><td></td></tr>");
      return `<p class="pen-note">${Gioco.CREW_PAY} monete al giorno</p>
        <table class="ledger"><caption>pagamenti</caption>${rows.join("")}</table>`;
    },

    zaino() {
      return `<ul class="book-items"><li>${icon("binoculars")}Binocolo</li></ul>`;
    },

    stiva() {
      return "";
    },
  };

  function birdCard(u, known) {
    const level = known?.level;
    if (level === "visto") {
      const habitat = [u.bioma ? BIOMI[u.bioma].nome : null, u.tratto].filter(Boolean).join(", ");
      return `<div class="bird-card is-seen" style="--bird-color:${u.colore}">
        <div class="bird-pic">${icon(iconaUccello(u))}</div>
        <div><b>${u.nome}</b><small>${[habitat, u.ore.join(" e ")].filter(Boolean).join(" · ")}</small><small>${u.curiosita}</small>
        <small class="where">${known.zone}, G${known.day} ${known.time}</small></div></div>`;
    }
    if (level === "traccia") {
      return `<div class="bird-card is-trace"><div class="bird-pic">${icon(iconaUccello(u))}</div>
        <div><b>???</b><small>${u.indizio}</small></div></div>`;
    }
    return `<div class="bird-card is-unknown"><div class="bird-pic">?</div><div><b>???</b></div></div>`;
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
    const grid = UCCELLI.map((u) => {
      const level = t.birds[u.id]?.level;
      const cls = level === "visto" ? "is-seen" : level === "traccia" ? "is-trace" : "is-unknown";
      return `<div class="end-bird ${cls}" style="--bird-color:${u.colore}" title="${level === "visto" ? u.nome : "???"}">
        ${level ? icon(iconaUccello(u)) : "?"}</div>`;
    }).join("");
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
      <p class="end-code">Codice del taccuino: <b>????-????-????-????</b> <span class="tag">prossimamente</span></p>`;
  }

  // L'attestato: un'immagine con il nome, il resoconto e gli uccelli del taccuino
  async function downloadCertificate() {
    const t = trip();
    if (!t) return;
    try { await Promise.all([document.fonts.load("32px VT323"), document.fonts.load("48px 'Pinyon Script'")]); } catch (e) { /* va bene anche il carattere di riserva */ }
    const W = 1000, H = 720;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    const ink = "#0f1a12", paper = "#e8e4c9", dark = "#2f4a2a", red = "#9a2a1e";
    g.fillStyle = paper;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = ink;
    g.lineWidth = 4;
    g.strokeRect(18, 18, W - 36, H - 36);
    g.lineWidth = 1.5;
    g.strokeRect(28, 28, W - 56, H - 56);
    const text = (str, x, y, size, color = ink, align = "center") => {
      g.font = `${size}px VT323, monospace`;
      g.fillStyle = color;
      g.textAlign = align;
      g.fillText(str, x, y);
    };
    text("Una spedizione ornitologica", W / 2, 90, 54);
    text("~ attestato di viaggio ~", W / 2, 124, 28, dark);
    text("rilasciato a", W / 2, 160, 26, dark);
    g.font = "54px 'Pinyon Script', cursive";
    g.fillStyle = ink;
    g.fillText(t.explorer, W / 2, 196);
    text(`${t.cause.title}: ${t.cause.text}`, W / 2, 228, 22, red);

    // Il resoconto a sinistra
    stats(t).forEach(([k, v], i) => {
      text(k, 70, 292 + i * 34, 26, dark, "left");
      text(String(v), 380, 292 + i * 34, 26, ink, "right");
    });

    // Gli uccelli: una riga per specie, tre varianti
    const x0 = 440, y0 = 262, cw = 180, ch = 62;
    Object.keys(SPECIE).forEach((sp, row) => {
      UCCELLI.filter((u) => u.specie === sp).forEach((u, col) => {
        const x = x0 + col * cw, y = y0 + row * ch;
        const level = t.birds[u.id]?.level;
        g.fillStyle = ink;
        g.fillRect(x, y, 48, 48);
        if (level) {
          const path = new Path2D(ICONS[iconaUccello(u)]);
          g.save();
          g.translate(x + 4, y + 4);
          g.scale(40 / 512, 40 / 512);
          g.fillStyle = level === "visto" ? u.colore : "#4e5a4a";
          g.fill(path);
          g.restore();
        } else {
          text("?", x + 24, y + 36, 34, "#7aa35a");
        }
        const name = level === "visto" ? u.nome : "???";
        text(name.length > 15 ? `${name.slice(0, 14)}…` : name, x + 54, y + 30, 20, level === "visto" ? ink : dark, "left");
      });
    });

    text("Codice del taccuino: ????-????-????-????  (prossimamente)", W / 2, H - 70, 24, dark);
    text(`${VERSIONE} · occhi al cielo`, W / 2, H - 42, 20, dark);

    c.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `attestato-${t.explorer.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "esploratore"}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  }

  // --- Comandi ---

  document.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-diary-tab]")?.dataset.diaryTab;
    if (tab) { tab === current ? close() : open(tab); return; }
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
