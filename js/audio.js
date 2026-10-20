// Suoni sintetizzati con Web Audio: nessun file audio, tutto generato al volo.
// Espone l'oggetto globale `Suoni`.
const Suoni = (() => {
  const STORAGE_KEY = "spedizione.audio";
  const settings = { on: true, vol: 3 };

  try {
    Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY)) || {});
  } catch (_) { /* storage non disponibile: si usano i valori predefiniti */ }

  let ctx = null;
  let master = null;
  let noiseBuf = null;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) {}
  }

  function masterLevel() {
    return settings.on ? (settings.vol / 5) * 0.8 : 0;
  }

  // Il contesto audio si può creare solo dopo un gesto dell'utente
  function ready() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = masterLevel();
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function applyLevel() {
    if (master) master.gain.setTargetAtTime(masterLevel(), ctx.currentTime, 0.02);
  }

  // --- Mattoncini ---

  function envelope(gain, t, vol, attack, dur) {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  function tone({ freq, to = freq, dur = 0.1, type = "sine", vol = 0.2, at = 0, attack = 0.005, out = master }) {
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to !== freq) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    envelope(g, t, vol, attack, dur);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.05);
    return osc;
  }

  function noise({ dur = 0.1, filter = "bandpass", freq = 1000, to = freq, q = 1, vol = 0.2, at = 0, attack = 0.005 }) {
    const t = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = noiseBuf;
    f.type = filter;
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (to !== freq) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    envelope(g, t, vol, attack, dur);
    src.connect(f).connect(g).connect(master);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  }

  function lfo(param, rate, depth) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = rate;
    g.gain.value = depth;
    osc.connect(g).connect(param);
    osc.start();
    return osc;
  }

  // Rumore continuo filtrato, per i suoni d'ambiente
  function noiseLoop(filter, freq, q, vol) {
    const src = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = noiseBuf;
    src.loop = true;
    f.type = filter;
    f.frequency.value = freq;
    f.Q.value = q;
    g.gain.value = vol;
    src.connect(f).connect(g).connect(master);
    src.start();
    return { src, f, g };
  }

  // Un generatore pseudo-casuale con seed: lo stesso uccello canta sempre uguale
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  // --- Catalogo dei suoni ---

  const effects = {
    // Interfaccia
    blip: () => tone({ freq: 880, dur: 0.05, type: "square", vol: 0.06 }),
    conferma: () => {
      tone({ freq: 660, dur: 0.07, type: "square", vol: 0.06 });
      tone({ freq: 990, dur: 0.1, type: "square", vol: 0.06, at: 0.07 });
    },
    pagina: () => noise({ dur: 0.28, freq: 1800, to: 4500, q: 0.8, vol: 0.25, attack: 0.04 }),
    monete: () => {
      [0, 0.09, 0.2].forEach((at, i) => {
        tone({ freq: 1568 + i * 220, dur: 0.12, type: "triangle", vol: 0.12, at });
        tone({ freq: 2093 + i * 220, dur: 0.18, type: "triangle", vol: 0.08, at: at + 0.03 });
      });
    },

    // Battlemap
    passoErba: () => noise({ dur: 0.08, freq: 3500, q: 1.5, vol: 0.3 }),
    passoAcqua: () => {
      noise({ dur: 0.25, filter: "lowpass", freq: 1400, to: 300, vol: 0.35 });
      tone({ freq: 280, to: 700, dur: 0.08, vol: 0.08, at: 0.05 });
    },
    cespuglio: () => {
      for (let i = 0; i < 5; i++) noise({ dur: 0.07, freq: 4200, q: 2, vol: 0.18, at: i * 0.05 });
    },
    tagliola: () => {
      noise({ dur: 0.05, filter: "highpass", freq: 2000, vol: 0.5 });
      tone({ freq: 140, to: 60, dur: 0.1, type: "square", vol: 0.15 });
      tone({ freq: 1870, dur: 0.6, type: "triangle", vol: 0.06, at: 0.01 });
      tone({ freq: 2630, dur: 0.4, type: "triangle", vol: 0.04, at: 0.01 });
    },
    petardo: () => {
      tone({ freq: 2400, to: 900, dur: 0.6, type: "square", vol: 0.02 }); // la miccia
      noise({ dur: 0.9, filter: "lowpass", freq: 1600, to: 120, vol: 0.9, at: 0.6, attack: 0.002 });
      tone({ freq: 90, to: 35, dur: 0.6, vol: 0.5, at: 0.6 });
    },
    orso: () => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(75, t);
      osc.frequency.linearRampToValueAtTime(95, t + 0.5);
      osc.frequency.linearRampToValueAtTime(60, t + 1.3);
      f.type = "lowpass";
      f.frequency.value = 420;
      envelope(g, t, 0.35, 0.15, 1.3);
      const wobble = lfo(osc.frequency, 13, 8);
      osc.connect(f).connect(g).connect(master);
      osc.start(t);
      osc.stop(t + 1.4);
      wobble.stop(t + 1.4);
      noise({ dur: 1.2, filter: "lowpass", freq: 500, vol: 0.12, attack: 0.2 });
    },
    passoOrso: () => {
      noise({ dur: 0.16, filter: "lowpass", freq: 260, to: 90, vol: 0.55, attack: 0.004 });
      tone({ freq: 70, to: 45, dur: 0.14, vol: 0.25 });
    },
    turnoAnimali: () => {
      tone({ freq: 196, dur: 0.22, type: "triangle", vol: 0.16 });
      tone({ freq: 147, dur: 0.4, type: "triangle", vol: 0.16, at: 0.2 });
      noise({ dur: 0.3, filter: "lowpass", freq: 300, vol: 0.2, at: 0.2 });
    },
    tuoTurno: () => {
      tone({ freq: 523, dur: 0.1, type: "triangle", vol: 0.1 });
      tone({ freq: 784, dur: 0.18, type: "triangle", vol: 0.1, at: 0.09 });
    },
    tonfo: () => {
      noise({ dur: 0.35, filter: "lowpass", freq: 400, to: 80, vol: 0.8, attack: 0.002 });
      tone({ freq: 110, to: 40, dur: 0.3, vol: 0.5, attack: 0.002 });
    },
    lupo: () => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(720, t + 0.6);
      osc.frequency.linearRampToValueAtTime(690, t + 1.5);
      osc.frequency.exponentialRampToValueAtTime(420, t + 2.2);
      envelope(g, t, 0.15, 0.3, 2.2);
      const vibrato = lfo(osc.frequency, 5, 6);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + 2.3);
      vibrato.stop(t + 2.3);
    },
    osservato: () => {
      [523, 659, 784, 1047].forEach((freq, i) =>
        tone({ freq, dur: 0.35, type: "triangle", vol: 0.1, at: i * 0.09 }));
    },
    cinguettio: (seed = Math.floor(Math.random() * 60)) => {
      const r = rng(seed * 7919 + 13);
      const notes = 3 + Math.floor(r() * 4);
      const base = 2200 + r() * 2200;
      let at = 0;
      for (let i = 0; i < notes; i++) {
        const dur = 0.04 + r() * 0.1;
        const from = base * (0.8 + r() * 0.5);
        tone({ freq: from, to: from * (r() > 0.5 ? 1.4 : 0.7), dur, vol: 0.1, at });
        at += dur + 0.02 + r() * 0.06;
      }
    },

    // Mare
    campana: () => {
      [[520, 0.2, 2.8], [1250, 0.08, 1.6], [1690, 0.06, 1.2], [2600, 0.03, 0.6]].forEach(([freq, vol, dur]) =>
        tone({ freq, dur, vol, attack: 0.002 }));
    },
    gabbiano: () => {
      [0, 0.32, 0.6].forEach((at) => {
        tone({ freq: 1500, to: 900, dur: 0.22, type: "triangle", vol: 0.09, at });
        tone({ freq: 3000, to: 1800, dur: 0.18, vol: 0.02, at });
      });
    },
    legno: () => {
      tone({ freq: 180, to: 150, dur: 0.5, type: "sawtooth", vol: 0.03, attack: 0.15 });
      noise({ dur: 0.5, freq: 900, q: 6, vol: 0.06, attack: 0.15 });
    },
  };

  // Suoni d'ambiente: partono e restano accesi finché non si fermano
  const ambients = {
    vento: () => {
      const n = noiseLoop("bandpass", 500, 1.2, 0.35);
      const a = lfo(n.f.frequency, 0.15, 250);
      const b = lfo(n.g.gain, 0.09, 0.2);
      return () => { n.src.stop(); a.stop(); b.stop(); };
    },
    mare: () => {
      const n = noiseLoop("lowpass", 650, 0.5, 0.3);
      const a = lfo(n.g.gain, 0.12, 0.25);
      const b = lfo(n.f.frequency, 0.12, 300);
      return () => { n.src.stop(); a.stop(); b.stop(); };
    },
    notte: () => {
      const id = setInterval(() => {
        for (let i = 0; i < 3; i++) tone({ freq: 4300, dur: 0.025, vol: 0.03, at: i * 0.05 });
      }, 700);
      const n = noiseLoop("lowpass", 300, 0.5, 0.06);
      return () => { clearInterval(id); n.src.stop(); };
    },
    foresta: () => {
      const n = noiseLoop("bandpass", 1200, 0.6, 0.05);
      const id = setInterval(() => {
        if (Math.random() < 0.6) effects.cinguettio(Math.floor(Math.random() * 60));
      }, 1400);
      return () => { clearInterval(id); n.src.stop(); };
    },
  };

  const running = {};

  return {
    get on() { return settings.on; },
    get vol() { return settings.vol; },

    setOn(on) {
      settings.on = on;
      save();
      if (ctx) applyLevel();
      if (!on) Object.keys(running).forEach((k) => this.stopAmbient(k));
    },

    setVol(vol) {
      settings.vol = Math.min(5, Math.max(1, vol));
      save();
      if (ctx) applyLevel();
    },

    play(name, ...args) {
      if (!settings.on || !effects[name]) return;
      ready();
      effects[name](...args);
    },

    toggleAmbient(name) {
      if (running[name]) {
        this.stopAmbient(name);
        return false;
      }
      if (!settings.on || !ambients[name]) return false;
      ready();
      running[name] = ambients[name]();
      return true;
    },

    stopAmbient(name) {
      running[name]?.();
      delete running[name];
    },

    stopAll() {
      Object.keys(running).forEach((k) => this.stopAmbient(k));
    },
  };
})();
