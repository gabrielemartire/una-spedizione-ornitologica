// Il globo: genera l'arcipelago di una spedizione e lo disegna come sfera in pixel art.
// Il mondo è una texture equirettangolare (1 texel = 1 grado) con altezze, isole e zone;
// il disegno proietta la sfera vista dall'alto della nave, che resta sempre al centro.
// Espone l'oggetto globale `Globo`.
const Globo = (() => {
  const TW = 360;
  const TH = 180;
  const DEG = Math.PI / 180;

  // Tipi di texel: tre profondità di mare, poi la terra (riva, piano, alture) che prende i colori del bioma
  const T = { DEEP: 0, OCEAN: 1, SHALLOW: 2, SHORE: 3, LOW: 4, HIGH: 5, ROCK: 6, SNOW: 7 };
  const LEVEL = { [T.SHORE]: "shore", [T.LOW]: "low", [T.HIGH]: "high" };
  const BIOME_KEYS = Object.keys(BIOMI);

  const BASE = {
    [T.DEEP]: "#1d4a73", [T.OCEAN]: "#2a6896", [T.SHALLOW]: "#4c90b5", [T.ROCK]: "#8a8478", [T.SNOW]: "#eef2f4",
  };
  // Il momento del giorno tinge tutto il globo
  const TINTS = {
    alba: { color: "#f2a35e", amount: 0.22, light: 0.95 },
    pomeriggio: { color: "#ffffff", amount: 0, light: 1 },
    notte: { color: "#1a2a55", amount: 0.45, light: 0.55 },
  };
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((row) => row.map((v) => (v + 0.5) / 16));

  // --- Vettori sulla sfera ---

  const vec = (lat, lon) => [Math.cos(lat * DEG) * Math.cos(lon * DEG), Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG)];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const angle = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) / DEG;
  const toLatLon = (v) => ({ lat: Math.asin(Math.max(-1, Math.min(1, v[2]))) / DEG, lon: Math.atan2(v[1], v[0]) / DEG });
  const texel = (lat, lon) => {
    const tx = ((Math.floor(lon + 180) % TW) + TW) % TW;
    const ty = Math.max(0, Math.min(TH - 1, Math.floor(90 - lat)));
    return ty * TW + tx;
  };
  const texelLatLon = (i) => ({ lat: 90 - (Math.floor(i / TW) + 0.5), lon: -180 + (i % TW) + 0.5 });

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Rumore 3D sui punti della sfera: coste frastagliate senza cuciture
  function noise3(seed) {
    const hash = (x, y, z) => {
      let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ seed;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
    const smooth = (t) => t * t * (3 - 2 * t);
    const n = (x, y, z) => {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
      const u = smooth(x - xi), v = smooth(y - yi), w = smooth(z - zi);
      const lerp = (a, b, t) => a + (b - a) * t;
      const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
      return lerp(
        lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
        lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v), w);
    };
    return (p) => n(p[0] * 5, p[1] * 5, p[2] * 5) * 0.55 + n(p[0] * 11, p[1] * 11, p[2] * 11) * 0.3 + n(p[0] * 23, p[1] * 23, p[2] * 23) * 0.15;
  }

  // --- Generazione del mondo ---

  // tagger(seed, bioma) → { tags, name } decide i tag di ogni zona (lo fa il gioco, così cartolina e mappa coincidono)
  function createWorld(seed, tagger) {
    const r = rng(seed);
    const noise = noise3(seed);

    // Un'isola grande, temperata, e tante isole minori sparse su tutto il globo
    // (il pianeta è piccolo: le isole occupano tanti gradi, e tra l'una e l'altra c'è poco mare)
    const islands = [{ c: vec(22 + r() * 8, r() * 20 - 10), rad: 18 + r() * 4 }];
    for (let tries = 0; islands.length < 12 + Math.floor(r() * 3) && tries < 3000; tries++) {
      const c = vec(-64 + r() * 128, -180 + r() * 360), rad = 7 + r() * 7;
      if (islands.every((is) => angle(is.c, c) > is.rad + rad + 5)) islands.push({ c, rad });
    }

    const height = new Float32Array(TW * TH);
    const owner = new Uint8Array(TW * TH); // l'isola che "domina" ogni texel, anche in mare
    for (let i = 0; i < TW * TH; i++) {
      const { lat, lon } = texelLatLon(i);
      const p = vec(lat, lon);
      let h = -1;
      islands.forEach((is, k) => {
        const v = 1 - angle(p, is.c) / is.rad;
        if (v > h) { h = v; owner[i] = k; }
      });
      height[i] = h + (noise(p) - 0.5) * 0.9;
    }

    // Isole come gruppi di texel di terra collegati
    const island = new Int16Array(TW * TH).fill(-1);
    const neighbors = (i) => {
      const x = i % TW, y = Math.floor(i / TW);
      return [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .map(([dx, dy]) => [((x + dx) % TW + TW) % TW, y + dy])
        .filter(([, ny]) => ny >= 0 && ny < TH).map(([nx, ny]) => ny * TW + nx);
    };
    let islandCount = 0;
    const islandSize = [];
    const islandOwner = []; // da quale isola generata nasce ogni gruppo
    for (let i = 0; i < TW * TH; i++) {
      if (height[i] <= 0 || island[i] >= 0) continue;
      const stack = [i];
      island[i] = islandCount;
      let size = 0;
      while (stack.length) {
        const c = stack.pop();
        size++;
        for (const n of neighbors(c)) if (height[n] > 0 && island[n] < 0) { island[n] = islandCount; stack.push(n); }
      }
      islandSize.push(size);
      islandOwner.push(owner[i]);
      islandCount++;
    }

    // Il bioma è deciso per ogni isola generata, dalla sua latitudine; l'isola grande è la foresta del Forte
    const biomeOf = islands.map((is, k) => (k === 0 ? "foresta" : biomaPerLatitudine(toLatLon(is.c).lat, r)));

    // Zone: punti di terra ben distanziati, ognuno con il suo seed e i suoi tag
    const land = [];
    for (let i = 0; i < TW * TH; i++) if (height[i] > 0 && islandSize[island[i]] >= 6) land.push(i);
    const zones = [];
    const shuffled = land.slice().sort(() => r() - 0.5);
    for (const i of shuffled) {
      const { lat, lon } = texelLatLon(i), p = vec(lat, lon);
      if (zones.every((z) => z.island !== island[i] || angle(z.p, p) > 9)) {
        const zSeed = Math.floor(r() * 1e9);
        const biome = biomeOf[islandOwner[island[i]]];
        zones.push({ id: zones.length, p, lat, lon, island: island[i], seed: zSeed, biome, ...tagger(zSeed, biome) });
      }
    }

    // Ogni texel di terra appartiene alla zona più vicina della sua isola
    const zone = new Int16Array(TW * TH).fill(-1);
    for (const i of land) {
      const { lat, lon } = texelLatLon(i), p = vec(lat, lon);
      let best = -1, bestDot = -2;
      for (const z of zones) {
        if (z.island !== island[i]) continue;
        const d = dot(z.p, p);
        if (d > bestDot) { bestDot = d; best = z.id; }
      }
      zone[i] = best;
    }

    // Tipo e bioma di ogni texel: la profondità del mare, la riva, il piano, le alture
    const type = new Uint8Array(TW * TH);
    const biome = new Uint8Array(TW * TH);
    const border = new Uint8Array(TW * TH);
    const coast = [];
    for (let i = 0; i < TW * TH; i++) {
      const h = height[i];
      const { lat, lon } = texelLatLon(i), p = vec(lat, lon);
      biome[i] = BIOME_KEYS.indexOf(biomeOf[owner[i]]);
      if (zone[i] < 0) {
        type[i] = h > -0.12 ? T.SHALLOW : h > -0.5 ? T.OCEAN : T.DEEP;
        continue;
      }
      const z = zones[zone[i]];
      biome[i] = BIOME_KEYS.indexOf(z.biome);
      const wet = neighbors(i).some((n) => zone[n] < 0);
      if (wet) coast.push({ i, p, zone: zone[i] });
      if (h < 0.08 || wet) type[i] = T.SHORE;
      else if (z.tags.has("montagne") && h > 0.55) type[i] = h > 0.8 ? T.SNOW : T.ROCK;
      else if (h > 0.45) type[i] = T.HIGH;
      else type[i] = noise(p.map((v) => v * 3)) > 0.5 ? T.HIGH : T.LOW;
      border[i] = neighbors(i).some((n) => zone[n] >= 0 && zone[n] !== zone[i]) ? 1 : 0;
    }

    // Le due città: il Forte sull'isola grande, il Porto del fiordo su un'isola minore
    const byIsland = (id) => coast.filter((c) => island[c.i] === id);
    const bigIsland = islandSize.indexOf(Math.max(...islandSize));
    // Il Porto del fiordo sta su un'isola fredda, la più vicina al Forte
    const coldFirst = (id) => (["ghiaccio", "taiga"].includes(zones.find((z) => z.island === id).biome) ? 0 : 1);
    const otherIslands = [...new Set(zones.map((z) => z.island))].filter((id) => id !== bigIsland)
      .sort((a, b) => coldFirst(a) - coldFirst(b));
    const forteSpot = byIsland(bigIsland)[Math.floor(r() * byIsland(bigIsland).length)];
    const colds = otherIslands.filter((id) => coldFirst(id) === 0);
    const pool = colds.length ? colds : otherIslands;
    const portoIsland = pool.length ? pool.sort((a, b) => angle(zones.find((z) => z.island === a).p, forteSpot.p) - angle(zones.find((z) => z.island === b).p, forteSpot.p))[0] : bigIsland;
    const portoCandidates = byIsland(portoIsland).filter((c) => angle(c.p, forteSpot.p) > 10);
    const portoSpot = portoCandidates[Math.floor(r() * portoCandidates.length)] || byIsland(portoIsland)[0];
    const cities = [
      { id: "forte", name: "Il Forte", p: forteSpot.p, zone: forteSpot.zone },
      { id: "porto", name: "Il Porto del fiordo", p: portoSpot.p, zone: portoSpot.zone },
    ];

    // La nave parte in mare, poco fuori dal Forte
    const start = startAtSea(forteSpot.p, type);
    return { seed, height, type, biome, zone, border, zones, coast, cities, start };
  }

  // Cerca un punto di mare aperto vicino alla città di partenza
  function startAtSea(p, type) {
    const { lat, lon } = toLatLon(p);
    for (let d = 2; d < 20; d++) {
      for (let a = 0; a < 360; a += 15) {
        const la = lat + Math.sin(a * DEG) * d, lo = lon + Math.cos(a * DEG) * d;
        if (type[texel(la, lo)] <= T.SHALLOW && type[texel(la + 1, lo)] <= T.SHALLOW && type[texel(la - 1, lo)] <= T.SHALLOW) {
          // a è misurato da est; la rotta da nord, in senso orario: la prua guarda lontano dalla città
          return { lat: la, lon: lo, heading: (90 - a + 360) % 360 };
        }
      }
    }
    return { lat, lon: lon + 5, heading: 270 };
  }

  // --- Interrogare il mondo ---

  function isWater(world, lat, lon) {
    return world.type[texel(lat, lon)] <= T.SHALLOW;
  }

  // Il punto di costa più vicino entro `maxDeg` gradi, con la sua zona
  function nearestCoast(world, lat, lon, maxDeg) {
    const p = vec(lat, lon);
    const minDot = Math.cos(maxDeg * DEG);
    let best = null, bestDot = minDot;
    for (const c of world.coast) {
      const d = dot(c.p, p);
      if (d > bestDot) { bestDot = d; best = c; }
    }
    return best && { zone: world.zones[best.zone], distance: angle(best.p, p) };
  }

  function nearestCity(world, lat, lon, maxDeg) {
    const p = vec(lat, lon);
    return world.cities.find((c) => angle(c.p, p) <= maxDeg) || null;
  }

  // La base locale in un punto: verso est e verso nord
  function basis(lat, lon) {
    return {
      east: [-Math.sin(lon * DEG), Math.cos(lon * DEG), 0],
      north: [-Math.sin(lat * DEG) * Math.cos(lon * DEG), -Math.sin(lat * DEG) * Math.sin(lon * DEG), Math.cos(lat * DEG)],
    };
  }

  // Un passo di navigazione lungo un cerchio massimo: si può passare sopra i poli, e la rotta
  // si aggiorna da sola (prima la latitudine era bloccata e la nave si fermava andando a nord)
  function advance(lat, lon, heading, deg) {
    const h = heading * DEG, a = deg * DEG;
    const p = vec(lat, lon), { east, north } = basis(lat, lon);
    const d = [0, 1, 2].map((k) => north[k] * Math.cos(h) + east[k] * Math.sin(h));
    const q = [0, 1, 2].map((k) => p[k] * Math.cos(a) + d[k] * Math.sin(a));
    const dq = [0, 1, 2].map((k) => d[k] * Math.cos(a) - p[k] * Math.sin(a));
    const ll = toLatLon(q);
    // Esattamente sul polo la base non esiste: ci si tiene un soffio più in qua
    ll.lat = Math.max(-89.5, Math.min(89.5, ll.lat));
    const b = basis(ll.lat, ll.lon);
    const nh = (Math.atan2(dot(dq, b.east), dot(dq, b.north)) / DEG + 360) % 360;
    return { lat: ll.lat, lon: ll.lon, heading: nh };
  }

  // --- Disegno ---

  const rgbCache = new Map();
  function rgb(hex) {
    if (!rgbCache.has(hex)) rgbCache.set(hex, [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
    return rgbCache.get(hex);
  }
  const blend = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

  // Due tonalità (luce e ombra) per ogni tipo, già tinte dal momento del giorno
  const paletteCache = new Map();
  function palette(time) {
    if (paletteCache.has(time)) return paletteCache.get(time);
    const tint = TINTS[time];
    const tone = (hex) => {
      const lit = blend(rgb(hex), rgb(tint.color), tint.amount).map((v) => v * tint.light);
      return { lit, shade: lit.map((v) => v * 0.62), border: lit.map((v) => v * 0.75) };
    };
    const pal = {};
    for (const [k, hex] of Object.entries(BASE)) pal[k] = tone(hex);
    // pal.biomes[b][tipo]: riva, piano e alture di ogni bioma, più il basso fondale (turchese ai tropici)
    pal.biomes = BIOME_KEYS.map((key) => {
      const g = BIOMI[key].globo;
      return { [T.SHORE]: tone(g.shore), [T.LOW]: tone(g.low), [T.HIGH]: tone(g.high), [T.SHALLOW]: tone(g.shallow || BASE[T.SHALLOW]) };
    });
    pal.rim = blend(rgb("#9fd0e0"), rgb(tint.color), tint.amount).map((v) => v * tint.light);
    paletteCache.set(time, pal);
    return pal;
  }

  const buffers = new Map();

  // view = { lat, lon, heading }; opts = { res, time, wake: [{lat,lon}], highlight: zoneId, markers: true, marks: trip.zones }
  function draw(canvas, world, view, opts) {
    const N = opts.res;
    if (!buffers.has(N)) {
      const small = document.createElement("canvas");
      small.width = N;
      small.height = N;
      buffers.set(N, { small, ctx: small.getContext("2d"), img: small.getContext("2d").createImageData(N, N) });
    }
    const { small, ctx, img } = buffers.get(N);
    const data = img.data;
    const pal = palette(opts.time);
    const c = N / 2, R = N / 2 - 1;

    // La base della vista: il centro è la nave, il nord in alto
    const center = vec(view.lat, view.lon);
    const { east, north } = basis(view.lat, view.lon);
    const L = [-0.45, 0.5, 0.74]; // la luce arriva da nord-ovest

    data.fill(0);
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const x = (i + 0.5 - c) / R, y = (c - j - 0.5) / R, rr = x * x + y * y;
        if (rr > 1) continue;
        const z = Math.sqrt(1 - rr);
        const p = [0, 1, 2].map((k) => z * center[k] + x * east[k] + y * north[k]);
        const { lat, lon } = toLatLon(p);
        const t = texel(lat, lon);
        const kind = world.type[t];
        const lightness = x * L[0] + y * L[1] + z * L[2];
        const tone = pal.biomes[world.biome[t]][kind] || pal[kind];
        let col = lightness > 0.35 + BAYER[j & 3][i & 3] * 0.3 ? tone.lit : tone.shade;
        if (world.border[t]) col = tone.border;
        if (opts.highlight != null && world.zone[t] === opts.highlight && (i + j) % 2 === 0) col = blend(col, [255, 240, 180], 0.45);
        if (z < 0.22 && BAYER[j & 3][i & 3] > z * 4) col = pal.rim; // l'atmosfera sul bordo
        const o = (j * N + i) * 4;
        data[o] = col[0]; data[o + 1] = col[1]; data[o + 2] = col[2]; data[o + 3] = 255;
      }
    }

    // Proietta un punto del mondo sullo schermo, se è sulla faccia visibile
    const project = (lat, lon) => {
      const p = vec(lat, lon);
      const z = dot(p, center);
      if (z <= 0.05) return null;
      return { x: Math.round(c + dot(p, east) * R), y: Math.round(c - dot(p, north) * R) };
    };
    const put = (x, y, col) => {
      if (x < 0 || y < 0 || x >= N || y >= N) return;
      const o = (y * N + x) * 4;
      if (!data[o + 3]) return;
      data[o] = col[0]; data[o + 1] = col[1]; data[o + 2] = col[2];
    };

    // La scia della nave
    (opts.wake || []).forEach((w, k) => {
      const s = project(w.lat, w.lon);
      if (s && k % 2 === 0) put(s.x, s.y, blend(pal[T.OCEAN].lit, [255, 255, 255], 0.55));
    });

    // Le città: una torre per il Forte, una casetta per il Porto
    if (opts.markers) {
      for (const city of world.cities) {
        const ll = toLatLon(city.p), s = project(ll.lat, ll.lon);
        if (!s) continue;
        const roof = city.id === "forte" ? [222, 214, 196] : [200, 90, 60];
        [[0, 0], [1, 0], [0, 1], [1, 1], [0, -1], [1, -1]].forEach(([dx, dy]) => put(s.x + dx, s.y + dy, roof));
        [[-1, -1], [2, -1], [-1, 1], [2, 1], [-1, 0], [2, 0], [0, 2], [1, 2], [0, -2], [1, -2]].forEach(([dx, dy]) => put(s.x + dx, s.y + dy, [30, 24, 20]));
      }
    }

    // Il vulcano: un cono scuro con la bocca rossa, visibile da lontano
    if (opts.markers) {
      for (const z of world.zones) {
        if (!z.tags.has("vulcano")) continue;
        const s = project(z.lat, z.lon);
        if (!s) continue;
        [[-1, 1], [0, 1], [1, 1], [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2], [0, 0]].forEach(([dx, dy]) => put(s.x + dx, s.y + dy, [46, 36, 34]));
        put(s.x, s.y - 1, [240, 96, 40]);
        put(s.x, s.y, [255, 150, 60]);
      }
    }

    // I segni del diario sulle zone visitate: ✓ uccello osservato, ? visitata senza vederlo, ✗ volato via
    const MARKS = {
      done: { color: [16, 14, 12], px: [[-2, 0], [-1, 1], [0, 2], [1, 1], [2, 0], [3, -1], [4, -2]] },
      seen: { color: [250, 244, 220], px: [[-1, -2], [0, -2], [1, -2], [2, -1], [1, 0], [0, 1], [0, 3]] },
      gone: { color: [200, 70, 50], px: [[-2, -2], [-1, -1], [0, 0], [1, 1], [2, 2], [2, -2], [1, -1], [-1, 1], [-2, 2]] },
    };
    if (opts.marks) {
      for (const [id, m] of Object.entries(opts.marks)) {
        if (!m.visited) continue;
        const z = world.zones[id], s = project(z.lat, z.lon);
        if (!s) continue;
        const mark = MARKS[m.done ? "done" : m.gone ? "gone" : "seen"];
        const halo = mark === MARKS.done ? [250, 244, 220] : [16, 14, 12];
        // un bordo di contrasto, poi il segno
        for (const [dx, dy] of mark.px) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (!mark.px.some(([x, y]) => x === dx + ox && y === dy + oy)) put(s.x + dx + ox, s.y + dy + oy, halo);
        }
        for (const [dx, dy] of mark.px) put(s.x + dx, s.y + dy, mark.color);
      }
    }

    // La nave al centro, orientata secondo la rotta
    if (opts.ship) {
      const h = view.heading * DEG, fx = Math.sin(h), fy = -Math.cos(h);
      const hull = [255, 244, 214], dark = [40, 28, 20];
      for (let k = -3; k <= 3; k++) {
        const half = k >= 2 ? 0 : k >= 0 ? 1 : 1.4;
        for (let w = -half; w <= half; w += 0.5) {
          put(Math.round(c + fx * k - fy * w), Math.round(c + fy * k + fx * w), Math.abs(w) >= half && half > 0 ? dark : hull);
        }
      }
    }

    ctx.putImageData(img, 0, 0);
    const out = canvas.getContext("2d");
    out.imageSmoothingEnabled = false;
    out.clearRect(0, 0, canvas.width, canvas.height);
    out.drawImage(small, 0, 0, canvas.width, canvas.height);
  }

  return { createWorld, draw, isWater, nearestCoast, nearestCity, advance };
})();
