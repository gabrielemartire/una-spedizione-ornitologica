// Il codice del taccuino: 16 caratteri (80 bit) che dicono quali uccelli hai osservato, così la
// collezione si riprende in una spedizione nuova, anche su un altro computer. Niente server.
//   4 bit  versione del formato
//  60 bit  un bit per uccello, per ID (gli ID non cambiano mai: js/uccelli.js)
//  16 bit  controllo (CRC-16), che scopre gli errori di battitura
// Si scrive in base32 di Crockford, che non ha lettere ambigue: K7QF-2MXA-9PLD-R4TB.
// Espone l'oggetto globale `Taccuino`.
const Taccuino = (() => {
  const VERSION = 1;
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

  // Gli ID degli uccelli osservati → "XXXX-XXXX-XXXX-XXXX"
  function encode(ids) {
    const birds = Array(BIRD_BITS).fill(0);
    for (const id of ids) if (id >= 0 && id < BIRD_BITS) birds[id] = 1;
    const body = [...toBits(VERSION, 4), ...birds];
    const bits = [...body, ...toBits(crc16(body), 16)];
    let out = "";
    for (let i = 0; i < bits.length; i += 5) out += ALPHABET[fromBits(bits.slice(i, i + 5))];
    return out.match(/.{4}/g).join("-");
  }

  // "xxxx-xxxx…" → gli ID, oppure null se il codice è sbagliato. Si perdonano minuscole, spazi,
  // trattini, e le lettere che si confondono con i numeri (I e L come 1, O come 0)
  function decode(text) {
    const clean = String(text || "").toUpperCase().replace(/[\s-]/g, "").replace(/[IL]/g, "1").replace(/O/g, "0");
    if (clean.length !== 16 || [...clean].some((ch) => !ALPHABET.includes(ch))) return null;
    const bits = [...clean].flatMap((ch) => toBits(ALPHABET.indexOf(ch), 5));
    const body = bits.slice(0, 64);
    if (fromBits(body.slice(0, 4)) !== VERSION || fromBits(bits.slice(64)) !== crc16(body)) return null;
    return body.slice(4).flatMap((b, id) => (b ? [id] : []));
  }

  // Il link che apre il gioco con il codice già scritto: è quello del QR sull'attestato
  const link = (code) => `${SITE}?taccuino=${code}`;

  return { encode, decode, link };
})();
