// Il diario di viaggio: in basso le ultime cose annotate, con le linguette che aprono il
// taccuino intero: un solo libro a due pagine, numerate di seguito, con un capitolo per
// linguetta (note, uccelli, voci, ciurma, zaino, stiva). Qui anche il resoconto di fine
// spedizione e l'attestato da scaricare.
// Espone l'oggetto globale `Diario`.
const Diario = (() => {
  const TABS = [
    ["note", "Note"], ["uccelli", "Uccelli"], ["voci", "Voci"],
    ["ciurma", "Ciurma"], ["zaino", "Zaino"], ["stiva", "Stiva"],
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
    const html = `
      <div class="ds-tabs">${tabsHtml("")}</div>
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
        return `<h4>${info.nome} <small>${info.latino} · ${seen}/${birds.length}</small></h4>
          ${birds.map((u) => birdCard(u, t.birds[u.id])).join("")}`;
      }).join("");
    },

    voci() {
      return `<ul class="book-notes">${(trip().rumors || []).map((n) => `<li>${when(n)} ${n.msg}</li>`).join("")}</ul>`;
    },

    // Il registro dei pagamenti: si compila riga dopo riga
    ciurma() {
      const rows = [...trip().payments].reverse().map((p) => `<tr><td>${p.what}</td><td>giorno ${p.day}</td><td>−${p.amount} m.o.</td></tr>`);
      while (rows.length < LEDGER_ROWS) rows.push("<tr><td></td><td></td><td></td></tr>");
      return `<p class="pen-note">${Gioco.CREW_PAY} m.o. al giorno</p>
        <table class="ledger"><caption>pagamenti</caption>${rows.join("")}</table>`;
    },

    zaino() {
      return `<ul class="book-items"><li>${icon("binoculars")}Binocolo</li></ul>`;
    },

    stiva() {
      return `<ul class="book-items">${trip().hold.map((it) => `<li>${icon(OGGETTI[it.kind].icona)}${OGGETTI[it.kind].nome}</li>`).join("")}</ul>`;
    },
  };

  // Le righe della scheda: vuote finché non sai niente; con una traccia o una voce solo qualcosa; visto, tutto
  function birdCard(u, known = {}) {
    const level = known.level;
    const seen = level === "visto";
    const lines = ["", "", "", ""];
    if (seen) {
      lines[0] = `<b>${u.nome}</b>${u.latino ? ` <i>${u.latino}</i>` : ""}`;
      lines[1] = `${habitatUccello(u)} · ${u.ore.join(" e ")}`;
      lines[2] = u.curiosita;
      lines[3] = `<span class="where">visto: ${known.zone}, G${known.day} ${known.time}</span>`;
    } else {
      if (known.voce) { lines[0] = `<b>${u.nome}</b>`; lines[3] = `<span class="where">voce: ${known.voce}</span>`; }
      if (level === "traccia") lines[1] = u.indizio;
    }
    return `<div class="bird-card${seen ? " is-seen" : ""}" style="--bird-color:${u.colore}">
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
      return `<div class="end-bird ${cls}" style="--bird-color:${u.colore}" title="${level === "visto" ? u.nome : "???"}">
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
      <p class="end-code">Codice del taccuino: <b>????-????-????-????</b> <span class="tag">prossimamente</span></p>`;
  }

  // L'attestato: un'immagine con il nome, il resoconto e gli uccelli del taccuino
  async function downloadCertificate() {
    const t = trip();
    if (!t) return;
    try { await Promise.all([document.fonts.load("32px VT323"), document.fonts.load("48px 'Pinyon Script'")]); } catch (e) { /* va bene anche il carattere di riserva */ }
    const W = 1000, H = 800;
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

    // Gli uccelli: una riga per specie, a colori quelli visti, in grigio quelli di cui hai una traccia
    const x0 = 440, y0 = 262, cw = 72, ch = 60;
    Object.entries(SPECIE).forEach(([sp, info], row) => {
      const y = y0 + row * ch;
      text(info.nome, x0, y - 4, 18, dark, "left");
      UCCELLI.filter((u) => u.specie === sp).forEach((u, col) => {
        const x = x0 + col * cw;
        const level = t.birds[u.id]?.level;
        g.fillStyle = ink;
        g.fillRect(x, y, 40, 40);
        if (level) {
          const path = new Path2D(ICONS[iconaUccello(u)]);
          g.save();
          g.translate(x + 4, y + 4);
          g.scale(32 / 512, 32 / 512);
          g.fillStyle = level === "visto" ? u.colore : "#4e5a4a";
          g.fill(path);
          g.restore();
        } else {
          text("?", x + 20, y + 30, 28, "#7aa35a");
        }
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
