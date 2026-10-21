// Il diario di viaggio: in basso le ultime cose annotate, con le linguette rosse che aprono il
// taccuino intero (note, uccelli, voci, ciurma, zaino, stiva). Qui anche il resoconto di fine
// spedizione e l'attestato da scaricare.
// Espone l'oggetto globale `Diario`.
const Diario = (() => {
  const TABS = [
    ["note", "Note", "quill"], ["uccelli", "Uccelli", "bird"], ["voci", "Voci", "tankard"],
    ["ciurma", "Ciurma", "pay"], ["zaino", "Zaino", "backpack"], ["stiva", "Stiva", "crate"],
  ];
  const STRIP_NOTES = 3;
  const MAX_RUMORS = 2;
  let current = null; // la scheda aperta, se il taccuino è aperto

  const trip = () => Gioco.trip;
  const icon = (name) => Gioco.iconHtml(name);
  const when = (n) => `<em>G${n.day} · ${n.time}</em>`;
  const tabsHtml = (cls) => TABS.map(([id, label]) =>
    `<button class="ribbon ${cls}${current === id ? " is-open" : ""}" data-diary-tab="${id}" title="${label}">${label}</button>`).join("");

  // --- La striscia sotto la mappa ---

  function renderStrip() {
    const box = document.getElementById("diary-strip");
    const t = trip();
    if (!box || !t) return;
    const notes = t.notes.slice(0, STRIP_NOTES);
    const html = `
      <div class="ds-tabs">${tabsHtml("")}</div>
      <div class="ds-page">
        <div class="ds-head">Taccuino di ${escapeHtml(t.explorer)}</div>
        <ul class="ds-notes">${notes.map((n, i) => `<li${i ? "" : ' class="is-new"'}>${when(n)} ${n.msg}</li>`).join("")}</ul>
      </div>`;
    if (box._html !== html) { box.innerHTML = html; box._html = html; }
  }

  // --- Il taccuino aperto ---

  function open(tab = "note") {
    current = tab;
    const box = document.getElementById("diary-popup");
    const [, label] = TABS.find(([id]) => id === tab);
    box.innerHTML = `
      <div class="book" role="dialog" aria-label="Diario: ${label}">
        <nav class="book-tabs">${tabsHtml("is-side")}</nav>
        <div class="book-page">
          <button class="book-close" data-diary-close aria-label="Chiudi">✕</button>
          <h3>${label}</h3>
          <div class="book-body">${PAGES[tab]()}</div>
          <p class="book-keys">← → cambia scheda · Tab o Esc chiude</p>
        </div>
      </div>`;
    box.hidden = false;
    renderStrip();
    Suoni.play("pagina");
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
      const t = trip();
      if (!t.notes.length) return "<p class=\"muted\">Ancora nessuna nota.</p>";
      return `<ul class="book-notes">${t.notes.map((n) => `<li>${n.icon ? icon(n.icon) : "<i></i>"}<span>${when(n)} ${n.msg}</span></li>`).join("")}</ul>`;
    },

    // Ogni uccello: sconosciuto (?), una traccia (sagoma e indizio), osservato (a colori)
    uccelli() {
      const t = trip();
      const seen = UCCELLI.filter((u) => t.birds[u.id]?.level === "visto").length;
      const rows = Object.entries(SPECIE).map(([sp, info]) => {
        const cards = UCCELLI.filter((u) => u.specie === sp).map((u) => birdCard(u, t.birds[u.id])).join("");
        return `<div class="bird-row"><h4>${info.nome}</h4><div class="bird-cards">${cards}</div></div>`;
      }).join("");
      return `<p class="muted">Osservati ${seen} su ${UCCELLI.length}.</p>${rows}`;
    },

    voci() {
      const t = trip();
      const rumors = t.rumors || [];
      return `<p class="muted">Voci sentite: ${rumors.length} su ${MAX_RUMORS} per spedizione.</p>
        ${rumors.length ? "" : `<p>Nessuna voce, per ora.</p>
        <p class="muted">Nelle taverne del Forte e del Porto si raccontano storie di uccelli rari e di tesori:
        ogni voce lega un uccello raro a una zona precisa del globo. Le taverne apriranno presto.</p>`}`;
    },

    ciurma() {
      const t = trip();
      const total = t.payments.reduce((sum, p) => sum + p.amount, 0);
      return `<p>La ciurma costa <b>${Gioco.CREW_PAY} monete al giorno</b>, pagate a ogni alba. Se non puoi pagare, ti lascia a terra.</p>
        <p class="muted">In cassa: ${t.money} monete · spese finora: ${total}</p>
        ${t.payments.length ? `<ul class="book-ledger">${t.payments.map((p) => `<li>${when(p)}<span>${p.what}</span><b>−${p.amount}</b></li>`).join("")}</ul>`
          : "<p class=\"muted\">Ancora nessuna spesa.</p>"}`;
    },

    zaino() {
      return `<ul class="book-ledger">
          <li>${icon("binoculars")}<span>Binocolo <small>osservi fino a 3,5 caselle</small></span><b>sempre con te</b></li>
        </ul>
        <p class="muted">Tagliole, esche, petardi e mantelle si compreranno in bottega.</p>`;
    },

    stiva() {
      return `<p>Vuota.</p>
        <p class="muted">Qui finirà quello che raccogli a terra (piume, erbe, legni pregiati, tesori) da vendere al mercato.</p>`;
    },
  };

  function birdCard(u, known) {
    const level = known?.level;
    const habitat = [u.bioma ? BIOMI[u.bioma].nome : "ovunque", u.tratto].filter(Boolean).join(", ");
    if (level === "visto") {
      return `<div class="bird-card is-seen" style="--bird-color:${u.colore}">
        <div class="bird-pic">${icon(iconaUccello(u))}</div>
        <div><b>${u.nome}</b><small>${habitat} · ${u.ore.join(" e ")}</small><small>${u.curiosita}</small>
        <small class="where">visto: ${known.zone}, G${known.day} ${known.time}</small></div></div>`;
    }
    if (level === "traccia") {
      return `<div class="bird-card is-trace"><div class="bird-pic">${icon(iconaUccello(u))}</div>
        <div><b>???</b><small>${u.indizio}</small></div></div>`;
    }
    return `<div class="bird-card is-unknown"><div class="bird-pic">?</div>
      <div><b>???</b><small>${u.rara ? "Raro: se ne parla solo nelle taverne." : "Ancora nessuna traccia."}</small></div></div>`;
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
          <p class="end-name">Il taccuino di <b>${escapeHtml(t.explorer)}</b></p>
          <div class="end-grid">${grid}</div>
        </div>
      </div>
      <p class="end-code">Codice del taccuino: <b>????-????-????-????</b> <span class="tag">prossimamente</span></p>`;
  }

  // L'attestato: un'immagine con il nome, il resoconto e gli uccelli del taccuino
  async function downloadCertificate() {
    const t = trip();
    if (!t) return;
    try { await document.fonts.load("32px VT323"); } catch (e) { /* va bene anche il carattere di riserva */ }
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
    text(`rilasciato a ${t.explorer}`, W / 2, 172, 38);
    text(`${t.cause.title}: ${t.cause.text}`, W / 2, 206, 22, red);

    // Il resoconto a sinistra
    stats(t).forEach(([k, v], i) => {
      text(k, 70, 270 + i * 34, 26, dark, "left");
      text(String(v), 380, 270 + i * 34, 26, ink, "right");
    });

    // Gli uccelli: una riga per specie, tre varianti
    const x0 = 440, y0 = 240, cw = 180, ch = 64;
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
    if (e.target.closest("[data-diary-close]") || e.target.id === "diary-popup") close();
    if (e.target.closest("[data-game-action=\"diary\"]")) isOpen() ? close() : open();
    if (e.target.closest("[data-end-action=\"download\"]")) downloadCertificate();
  });

  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("in-game") || !trip() || trip().over) return;
    if (e.key === "Tab") {
      e.preventDefault();
      isOpen() ? close() : open();
    } else if (isOpen() && e.key === "Escape") {
      close();
    } else if (isOpen() && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown")) {
      const i = TABS.findIndex(([id]) => id === current);
      const step = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
      open(TABS[(i + step + TABS.length) % TABS.length][0]);
    } else return;
    e.stopImmediatePropagation();
  });

  return { renderStrip, open, close, isOpen, renderEnd, downloadCertificate };
})();
