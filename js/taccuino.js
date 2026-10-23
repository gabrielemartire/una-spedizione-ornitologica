// Il codice del taccuino: 20 caratteri (100 bit) che dicono quali uccelli hai osservato, quanti
// viaggi hai fatto e quali timbri hai, così la collezione si riprende in una spedizione nuova,
// anche su un altro computer. Niente server.
//   4 bit  versione del formato (2; i codici della versione 1, di 16 caratteri, valgono ancora)
//  60 bit  un bit per uccello, per ID (gli ID non cambiano mai: js/uccelli.js)
//   8 bit  i viaggi intrapresi
//   6 bit  i timbri del taccuino, uno per bit (js/diario.js)
//   6 bit  per il futuro
//  16 bit  controllo (CRC-16), che scopre gli errori di battitura
// Si scrive in base32 di Crockford, che non ha lettere ambigue: K7QF-2MXA-9PLD-R4TB-0C3E.
const Taccuino = (() => {
  const VERSION = 2;
  const STAMP_BITS = 6;
  const BIRD_BITS = 60;
  const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const SITE = "https://gabrielemartire.github.io/una-spedizione-ornitologica/";

  // CRC-16/CCITT sui bit, presi a byte
  function crc16(bits) {
    let crc = 0xffff;
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let k = 0; k < 8; k++) byte = (byte << 1) | (bits[i + k] || 0);
      crc ^= byte << 8;
      for (let k = 0; k < 8; k++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
    return crc;
  }

  const toBits = (n, len) => Array.from({ length: len }, (_, i) => (n >> (len - 1 - i)) & 1);
  const fromBits = (bits) => bits.reduce((n, b) => n * 2 + b, 0);

  // { birds: [ID…], voyages, stamps: [n…] } → "XXXX-XXXX-XXXX-XXXX-XXXX"
  function encode({ birds: ids = [], voyages = 1, stamps = [] }) {
    const birds = Array(BIRD_BITS).fill(0);
    for (const id of ids) if (id >= 0 && id < BIRD_BITS) birds[id] = 1;
    const marks = Array(STAMP_BITS).fill(0);
    for (const n of stamps) if (n >= 0 && n < STAMP_BITS) marks[n] = 1;
    const body = [...toBits(VERSION, 4), ...birds, ...toBits(Math.max(0, Math.min(255, voyages)), 8), ...marks, ...Array(6).fill(0)];
    const bits = [...body, ...toBits(crc16(body), 16)];
    let out = "";
    for (let i = 0; i < bits.length; i += 5) out += ALPHABET[fromBits(bits.slice(i, i + 5))];
    return out.match(/.{4}/g).join("-");
  }

  // "xxxx-xxxx…" → { birds, voyages, stamps }, oppure null se il codice è sbagliato. Si perdonano
  // minuscole, spazi, trattini, e le lettere che si confondono con i numeri (I e L come 1, O come 0).
  // I codici vecchi (16 caratteri) hanno solo gli uccelli: un viaggio, nessun timbro
  function decode(text) {
    const clean = String(text || "").toUpperCase().replace(/[\s-]/g, "").replace(/[IL]/g, "1").replace(/O/g, "0");
    if (![16, 20].includes(clean.length) || [...clean].some((ch) => !ALPHABET.includes(ch))) return null;
    const bits = [...clean].flatMap((ch) => toBits(ALPHABET.indexOf(ch), 5));
    const body = bits.slice(0, bits.length - 16);
    if (fromBits(bits.slice(-16)) !== crc16(body)) return null;
    const version = fromBits(body.slice(0, 4));
    const birds = body.slice(4, 4 + BIRD_BITS).flatMap((b, id) => (b ? [id] : []));
    if (version === 1 && clean.length === 16) return { birds, voyages: 1, stamps: [] };
    if (version !== 2 || clean.length !== 20) return null;
    const rest = body.slice(4 + BIRD_BITS);
    return { birds, voyages: fromBits(rest.slice(0, 8)), stamps: rest.slice(8, 8 + STAMP_BITS).flatMap((b, n) => (b ? [n] : [])) };
  }

  // Il link che apre il gioco con il codice già scritto: è quello del QR sull'attestato
  const link = (code) => `${SITE}?taccuino=${code}`;

  return { encode, decode, link };
})();
