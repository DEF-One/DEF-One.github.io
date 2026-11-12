"use strict";
/* ==========================================================================
   VZ-Plan-Trainer · Lageplan (Darstellung & Bedienung)
   ========================================================================== */
const SX = 7.5, SY = 27, PADX = 12, YTOP = -7;
let svgH = 0, svgW = 0, zoom = 1, night = false, baseSVG = '';
const px = x => PADX + x * SX;
const py = y => (y - YTOP) * SY;
const wx = X => (X - PADX) / SX;
const wy = Y => Y / SY + YTOP;

function zoneName(y) {
  const s = S;
  if (y < 0) return 'Gebäude Nord';
  if (y < s.gN) return 'Gehweg Nord';
  if (y < s.r0) return 'Parkstreifen Nord';
  if (y < s.r1) return s.oneway ? 'Fahrbahn (Einbahn → Osten)' : (y < (s.r0 + s.r1) / 2 ? 'Fahrbahn, Fahrstreifen ← Westen' : 'Fahrbahn, Fahrstreifen → Osten');
  if (y < s.r1 + s.pS) return 'Parkstreifen Süd';
  if (y < s.yEnd) return 'Gehweg Süd';
  return 'Gebäude Süd';
}

function carSVG(x, y, len, wid, col, rot = 0) {
  return `<g transform="translate(${x},${y}) rotate(${rot})"><rect x="${-len / 2}" y="${-wid / 2}" width="${len}" height="${wid}" rx="${wid * 0.35}" fill="${col}" stroke="rgba(0,0,0,.45)" stroke-width="1"/>
    <rect x="${-len * 0.18}" y="${-wid / 2 + 2}" width="${len * 0.38}" height="${wid - 4}" rx="2.5" fill="rgba(20,30,45,.55)"/>
    <rect x="${len * 0.24}" y="${-wid / 2 + 2.5}" width="${len * 0.12}" height="${wid - 5}" rx="2" fill="rgba(20,30,45,.4)"/></g>`;
}

function drawBase() {
  const s = S;
  const rng = mulberry(hashStr(s.street + s.nr));
  svgW = px(s.L) + PADX; const mapH = py(s.yEnd + 7);
  svgH = mapH + 96;
  const W = svgW;
  let o = `<defs>
    <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#f3c27e"/><line x1="0" y1="0" x2="0" y2="9" stroke="#b86a10" stroke-width="3"/></pattern>
    <pattern id="paving" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#d6d2c8"/><path d="M0 0H10M0 5H10M5 0V5M0 5V10" stroke="#c4bfb2" stroke-width=".8"/></pattern>
    <pattern id="asph" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#7d8187"/><circle cx="7" cy="9" r=".8" fill="#8b9096"/><circle cx="27" cy="17" r=".7" fill="#71757b"/><circle cx="15" cy="31" r=".9" fill="#888c92"/><circle cx="34" cy="4" r=".6" fill="#71757b"/></pattern>
    <pattern id="park" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#8e9197"/><circle cx="12" cy="20" r=".8" fill="#9a9da3"/></pattern>
    <pattern id="roof" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#b9ad9a"/><path d="M0 8L8 0" stroke="#a99c87" stroke-width="1"/></pattern>
    <radialGradient id="glowY"><stop offset="0" stop-color="#ffd84a" stop-opacity=".95"/><stop offset=".35" stop-color="#ffb800" stop-opacity=".45"/><stop offset="1" stop-color="#ff9a00" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowR"><stop offset="0" stop-color="#ff4a4a" stop-opacity=".95"/><stop offset=".35" stop-color="#ff1a1a" stop-opacity=".45"/><stop offset="1" stop-color="#ff0000" stop-opacity="0"/></radialGradient>
    <radialGradient id="lamp"><stop offset="0" stop-color="#fff7d6" stop-opacity=".55"/><stop offset="1" stop-color="#fff7d6" stop-opacity="0"/></radialGradient>
  </defs>`;
  o += `<g id="baseG">`;
  o += `<rect width="${W}" height="${mapH}" fill="#dfe5d3"/>`;
  const band = (y0, y1, fill) => `<rect x="${px(0)}" y="${py(y0)}" width="${px(s.L) - px(0)}" height="${py(y1) - py(y0)}" fill="${fill}"/>`;
  // Gebäudezeilen
  o += `<rect x="${px(0)}" y="${py(-6.5)}" width="${px(s.L) - px(0)}" height="${py(0) - py(-6.5)}" fill="#e6e1d6"/>`;
  o += `<rect x="${px(0)}" y="${py(s.yEnd)}" width="${px(s.L) - px(0)}" height="${py(s.yEnd + 6.5) - py(s.yEnd)}" fill="#e6e1d6"/>`;
  const hx0 = s.x0 - 4, hw = s.len + 8;
  let nrL = s.nr - 2, nrR = s.nr + 2;
  for (let x = hx0 - 16; x > 20; x -= 16) { o += house(x, 14, -6, nrL > 0 ? nrL : ''); nrL -= 2; }
  for (let x = hx0 + hw + 2; x < s.L - 32; x += 16) { o += house(x, 14, -6, nrR); nrR += 2; }
  let nS = s.nr + 1;
  for (let x = 22; x < s.L - 34; x += 16) { o += houseS(x, 14, nS); nS += 2; }
  // Zielgebäude
  o += `<rect x="${px(hx0)}" y="${py(-6.2)}" width="${hw * SX}" height="${py(-0.08) - py(-6.2)}" fill="#9db3d6" stroke="#2f4a7a" stroke-width="2"/>`;
  o += `<text x="${px(hx0 + hw / 2)}" y="${py(-3.4)}" text-anchor="middle" font-size="14" font-weight="800" fill="#10213f">${s.street} ${s.nr}</text>`;
  o += `<text x="${px(hx0 + hw / 2)}" y="${py(-1.6)}" text-anchor="middle" font-size="10.5" fill="#10213f">Baustelle · Hausanschluss</text>`;
  // Gehwege, Parkstreifen, Fahrbahn
  o += band(0, s.gN, 'url(#paving)');
  if (s.pN) o += band(s.gN, s.r0, 'url(#park)');
  o += band(s.r0, s.r1, 'url(#asph)');
  if (s.pS) o += band(s.r1, s.r1 + s.pS, 'url(#park)');
  o += band(s.r1 + s.pS, s.yEnd, 'url(#paving)');
  // Bordsteine
  const curb = y => `<rect x="${px(0)}" y="${py(y) - 2.5}" width="${px(s.L) - px(0)}" height="5" fill="#bdbab2"/><line x1="${px(0)}" x2="${px(s.L)}" y1="${py(y) - 2.5}" y2="${py(y) - 2.5}" stroke="#f5f3ee" stroke-width="1"/>`;
  o += curb(s.gN) + curb(s.r1 + s.pS);
  // Parkstreifen-Markierung
  const parkLine = y => `<line x1="${px(0)}" x2="${px(s.L)}" y1="${py(y)}" y2="${py(y)}" stroke="#fff" stroke-width="2" stroke-dasharray="2 8"/>`;
  if (s.pN) o += parkLine(s.r0);
  if (s.pS) o += parkLine(s.r1);
  // Fahrbahnrand + Leitlinie
  if (!s.oneway && s.F >= 5.5) o += `<line x1="${px(0)}" x2="${px(s.L)}" y1="${py((s.r0 + s.r1) / 2)}" y2="${py((s.r0 + s.r1) / 2)}" stroke="#fff" stroke-width="2.4" stroke-dasharray="${3 * SX} ${6 * SX}"/>`;
  // Querstraßen
  for (const cx of [11, s.L - 11]) {
    o += `<rect x="${px(cx - 5)}" y="0" width="${10 * SX}" height="${mapH}" fill="url(#asph)"/>`;
    o += `<rect x="${px(cx - 7.2)}" y="0" width="${2.2 * SX}" height="${py(s.gN)}" fill="url(#paving)"/><rect x="${px(cx + 5)}" y="0" width="${2.2 * SX}" height="${py(s.gN)}" fill="url(#paving)"/>`;
    o += `<rect x="${px(cx - 7.2)}" y="${py(s.r1 + s.pS)}" width="${2.2 * SX}" height="${mapH - py(s.r1 + s.pS)}" fill="url(#paving)"/><rect x="${px(cx + 5)}" y="${py(s.r1 + s.pS)}" width="${2.2 * SX}" height="${mapH - py(s.r1 + s.pS)}" fill="url(#paving)"/>`;
    o += `<line x1="${px(cx - 5)}" x2="${px(cx - 5)}" y1="${py(s.r0)}" y2="${py(s.r1)}" stroke="#fff" stroke-width="3" opacity=".8"/><line x1="${px(cx + 5)}" x2="${px(cx + 5)}" y1="${py(s.r0)}" y2="${py(s.r1)}" stroke="#fff" stroke-width="3" opacity=".8"/>`;
    const name = N ? (cx < 30 ? N.colName[1] : N.colName[2]) : (cx < 30 ? 'Querstraße West' : 'Querstraße Ost');
    o += `<text x="${px(cx) + 4}" y="${py(-2.5)}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#fff" transform="rotate(-90 ${px(cx) + 4} ${py(-2.5)})">${name}</text>`;
  }
  // Straßenname
  o += `<text x="${px(s.x0 - 40)}" y="${py(s.r0 + s.F * (s.oneway ? 0.3 : 0.5)) + 5}" text-anchor="middle" font-size="13" font-weight="800" fill="#fff" opacity=".85" letter-spacing="2" paint-order="stroke" stroke="#7d8187" stroke-width="6">${s.street.toUpperCase()}</text>`;
  // Richtungspfeile
  const arrow = (x, y, dir) => { const d = dir * 26; return `<path d="M${px(x) - d} ${py(y)} H${px(x) + d} M${px(x) + d - dir * 9} ${py(y) - 6} L${px(x) + d} ${py(y)} L${px(x) + d - dir * 9} ${py(y) + 6}" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`; };
  for (const x of [s.L - 34]) { if (s.oneway) o += arrow(x, (s.r0 + s.r1) / 2, 1); else { o += arrow(x, s.r0 + s.F * 0.25, -1); o += arrow(x, s.r0 + s.F * 0.75, 1); } }
  if (s.oneway) { o += `<g transform="translate(${px(24)},${py(s.r1 + s.pS + 0.6)})"><rect x="-16" y="-7" width="32" height="14" fill="${BLUE}" stroke="#fff"/><path d="M-11,0 H8 M3,-4 L9,0 L3,4" stroke="#fff" stroke-width="2.2" fill="none"/></g>`; }
  // Parkende Autos
  const cols = ['#c8ccd2','#2b3a55','#8a1c1c','#e9e9e9','#3d3d3d','#4f6f52','#b7a27a','#1d4f91'];
  const parkCars = (y0, w, side) => {
    let g = '';
    for (let x = 26; x < s.L - 26; x += 6.2) {
      if (x > s.x0 - 3 && x < s.x1 + 3 && side === 'N' && S.wy1 > S.gN) continue;
      if (rng() < 0.25) continue;
      g += carSVG(px(x), py(y0 + w / 2), 4.4 * SX, Math.min(1.8, w - 0.2) * SY * 0.92, cols[Math.floor(rng() * cols.length)]);
    }
    return g;
  };
  if (s.pN) o += parkCars(s.gN, s.pN, 'N');
  if (s.pS) o += parkCars(s.r1, s.pS, 'S');
  // Bäume (Süd)
  if (s.gS >= 2.4) for (let x = 30; x < s.L - 30; x += 18) o += `<circle cx="${px(x)}" cy="${py(s.r1 + s.pS + 0.9)}" r="${Math.min(15, s.gS * 5)}" fill="#6f9b5a" opacity=".85" stroke="#4f7a3d"/><circle cx="${px(x) - 3}" cy="${py(s.r1 + s.pS + 0.9) - 3}" r="5" fill="#86b06f" opacity=".7"/>`;
  // Straßenlaternen (Nord)
  for (let x = 30; x < s.L - 26; x += 30) o += `<g class="lamp"><circle cx="${px(x)}" cy="${py(Math.min(s.gN - 0.35, 0.4 + s.gN * 0.85))}" r="3" fill="#444"/></g>`;
  // Grundstückszufahrt
  const zx = s.x1 + 8;
  o += `<rect x="${px(zx)}" y="${py(0)}" width="${3.5 * SX}" height="${py(s.gN) - py(0)}" fill="#c9c4b7" opacity=".9"/><text x="${px(zx + 1.75)}" y="${py(s.gN * 0.5) + 3}" text-anchor="middle" font-size="8.5" fill="#555">Zufahrt</text>`;
  // Arbeitsbereich
  o += `<rect x="${px(s.x0)}" y="${py(0)}" width="${s.len * SX}" height="${py(s.wy1) - py(0)}" fill="url(#hatch)" stroke="#8a4b00" stroke-width="1.6"/>`;
  o += `<text x="${px(s.x0 + s.len / 2)}" y="${py(s.wy1 / 2) + 4}" text-anchor="middle" font-size="11.5" font-weight="800" fill="#4a2600" paint-order="stroke" stroke="#f3c27e" stroke-width="3">Arbeitsbereich ${fmt(s.len, 1)} × ${fmt(s.wy1)} m</text>`;
  o += `</g>`;
  // Bemaßung (bleibt in Nachtansicht lesbar)
  o += `<g id="dimG">`;
  const dimX = 21;
  const dim = (y0, y1, label) => {
    if (y1 - y0 < 0.05) return '';
    const X = px(dimX);
    return `<g font-size="11" fill="#111"><line x1="${X}" x2="${X}" y1="${py(y0) + 1}" y2="${py(y1) - 1}" stroke="#111" stroke-width="1.2"/><path d="M${X - 4},${py(y0) + 5} L${X},${py(y0) + 1} L${X + 4},${py(y0) + 5} M${X - 4},${py(y1) - 5} L${X},${py(y1) - 1} L${X + 4},${py(y1) - 5}" stroke="#111" fill="none"/>
      <text x="${X + 6}" y="${(py(y0) + py(y1)) / 2 + 4}" paint-order="stroke" stroke="#fff" stroke-width="3.5" font-weight="600">${label} ${fmt(y1 - y0)} m</text></g>`;
  };
  o += dim(0, s.gN, 'Gehweg');
  if (s.pN) o += dim(s.gN, s.r0, 'Parkstreifen');
  o += dim(s.r0, s.r1, 'Fahrbahn');
  if (s.pS) o += dim(s.r1, s.r1 + s.pS, 'Parkstreifen');
  o += dim(s.r1 + s.pS, s.yEnd, 'Gehweg');
  // Längenmaß Arbeitsstelle
  const ly = py(-0.4);
  o += `<line x1="${px(s.x0)}" x2="${px(s.x1)}" y1="${ly}" y2="${ly}" stroke="#111"/><path d="M${px(s.x0)},${ly - 4} V${ly + 4} M${px(s.x1)},${ly - 4} V${ly + 4}" stroke="#111"/>`;
  // Skala
  const sy = py(s.yEnd + 6.3);
  o += `<rect x="${px(0)}" y="${sy - 16}" width="${px(s.L) - px(0)}" height="26" fill="rgba(255,255,255,.85)"/>`;
  o += `<line x1="${px(0)}" x2="${px(s.L)}" y1="${sy}" y2="${sy}" stroke="#333"/>`;
  for (let d = 0; d <= 90; d += 10) for (const x of [s.x0 - d, s.x1 + d]) {
    if (x < 0 || x > s.L) continue;
    o += `<line x1="${px(x)}" x2="${px(x)}" y1="${sy - 4}" y2="${sy + 4}" stroke="#333"/><text x="${px(x)}" y="${sy - 6}" text-anchor="middle" font-size="10" fill="#222">${d} m</text>`;
  }
  o += `<text x="${px(4)}" y="${py(-5.6)}" font-size="13" font-weight="800" fill="#222">N ↑</text>`;
  o += `</g>`;
  // Plankopf
  o += plankopf(mapH);
  return o;

  function house(x, w, y0, nr) {
    return `<rect x="${px(x)}" y="${py(y0)}" width="${w * SX}" height="${py(-0.08) - py(y0)}" fill="url(#roof)" stroke="#8d8270"/>${nr !== '' ? `<text x="${px(x + w / 2)}" y="${py(-1.2)}" text-anchor="middle" font-size="10" fill="#4a4338">${nr}</text>` : ''}`;
  }
  function houseS(x, w, nr) {
    return `<rect x="${px(x)}" y="${py(s.yEnd + 0.08)}" width="${w * SX}" height="${py(s.yEnd + 6) - py(s.yEnd + 0.08)}" fill="url(#roof)" stroke="#8d8270"/><text x="${px(x + w / 2)}" y="${py(s.yEnd + 1.6)}" text-anchor="middle" font-size="10" fill="#4a4338">${nr}</text>`;
  }
}

function plankopf(y) {
  const s = S, W = svgW, h = 88;
  const d = new Date().toLocaleDateString('de-DE');
  const cells = [
    ['Verkehrszeichenplan (Übung)', `${s.street} ${s.nr}, ${s.city}`],
    ['Maßnahme', `${s.reason} · AlD, ca. ${s.days} AT`],
    ['Grundlage', 'RSA 21, Teil B (innerorts) · StVO / VwV-StVO'],
    ['Maßstab', 'schematisch, quer überhöht · Maße in m'],
    ['Erstellt', `${d} · VZ-Plan-Trainer`],
  ];
  let o = `<g font-family="Arial,Helvetica,sans-serif"><rect x="0" y="${y}" width="${W}" height="${h}" fill="#fff" stroke="#222" stroke-width="1.5"/>`;
  o += `<rect x="0" y="${y}" width="10" height="${h}" fill="#e20074"/>`;
  const cw = (W - 10) / cells.length;
  cells.forEach((c, i) => {
    const x = 10 + i * cw;
    o += `<line x1="${x}" x2="${x}" y1="${y}" y2="${y + h}" stroke="#bbb"/><text x="${x + 10}" y="${y + 24}" font-size="10.5" fill="#666" font-weight="700" letter-spacing=".5">${c[0].toUpperCase()}</text>`;
    o += `<foreignObject x="${x + 8}" y="${y + 30}" width="${cw - 16}" height="${h - 34}"><div xmlns="http://www.w3.org/1999/xhtml" style="font:600 12.5px/1.3 Arial,sans-serif;color:#111">${c[1]}</div></foreignObject>`;
  });
  return o + '</g>';
}

/* ---------- Elemente ---------- */
function drawItem(it, cls = '') {
  const isSol = cls === 'sol';
  const selC = sel === it.id ? '#0a66ff' : null;
  if (it.x1 != null) {
    const hor = Math.abs(it.y1 - it.y2) < 0.01;
    const x1 = px(it.x1), y1 = py(it.y1), x2 = px(it.x2), y2 = py(it.y2);
    const th = it.t === 'g250' ? 7 : 5;
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (isSol) return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#18a058" stroke-width="${th + 3}" opacity=".55" stroke-linecap="round"/>`;
    const feet = [];
    const n = Math.max(1, Math.round(len / (2.5 * (hor ? SX : SY))));
    for (let i = 0; i <= n; i++) { const t = i / n; feet.push(`<rect x="${x1 + (x2 - x1) * t - 2.5}" y="${y1 + (y2 - y1) * t - 2.5}" width="5" height="5" fill="#2a2a2a"/>`); }
    return `<g class="it" data-id="${it.id}">${selC ? `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${selC}" stroke-width="${th + 7}" opacity=".4" stroke-linecap="round"/>` : ''}
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#5a0000" stroke-width="${th + 2}"/>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="${th}"/>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e30613" stroke-width="${th}" stroke-dasharray="7 7"/>
      ${it.t === 'g100' ? `<line x1="${x1 + (hor ? 0 : th / 2 + 2)}" y1="${y1 + (hor ? th / 2 + 2 : 0)}" x2="${x2 + (hor ? 0 : th / 2 + 2)}" y2="${y2 + (hor ? th / 2 + 2 : 0)}" stroke="#111" stroke-width="1.6"/>` : ''}${feet.join('')}</g>`;
  }
  const T = TYPES[it.t]; if (!T) return '';
  const X = px(it.x), Y = py(it.y);
  let body = '';
  const glow = night && !isSol ? (it.t === 'wlg' || it.t === 'bakewl' ? `<circle cy="${it.t === 'bakewl' ? -19 : 0}" r="22" fill="url(#glowY)"/>` : it.t === 'wlr' ? `<circle r="22" fill="url(#glowR)"/>` : '') : '';
  if (['bake','bakewl'].includes(it.t)) body = `${glow}<g transform="translate(0,${it.t === 'bakewl' ? -3 : 0})">${signSVG(T.sign, it.t === 'bakewl' ? 30 : 22)}</g>`;
  else if (['wlg','wlr'].includes(it.t)) body = `${glow}${signSVG(T.sign, 11)}`;
  else {
    const h = it.t === 'lsa' || it.t === 'flsa' ? 28 : (it.t === 'z259' ? 18 : 27);
    const lab = T.no ? `<text y="13" text-anchor="middle" font-size="9.5" font-weight="800" fill="${isSol ? '#0b5d36' : '#111'}" paint-order="stroke" stroke="#fff" stroke-width="3">${T.no}</text>` : '';
    body = `<circle r="2.6" fill="#222"/><line x1="0" y1="0" x2="0" y2="-7" stroke="#333" stroke-width="2"/><g transform="translate(0,${-7 - h / 2})">${signSVG(T.sign, h)}</g>${lab}`;
  }
  const ring = selC ? `<circle cy="-8" r="21" fill="none" stroke="${selC}" stroke-width="2.5"/>` : '';
  const solBg = isSol ? `<circle cy="-8" r="19" fill="#2fa36b" opacity=".2" stroke="#0b5d36" stroke-dasharray="3 2"/>` : '';
  return `<g class="it ${cls}" data-id="${it.id || ''}" transform="translate(${X} ${Y})" ${isSol ? 'opacity=".85"' : ''}>${solBg}${body}${ring}</g>`;
}

function render(preview) {
  const svg = $('#map');
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svg.setAttribute('width', svgW * zoom);
  svg.setAttribute('height', svgH * zoom);
  let o = baseSVG;
  if (night) o = o.replace('<g id="baseG">', '<g id="baseG" style="filter:brightness(.3) saturate(.55) hue-rotate(10deg)">') ;
  if (night) {
    for (let x = 30; x < S.L - 26; x += 30) o += `<circle cx="${px(x)}" cy="${py(Math.min(S.gN - 0.35, 0.4 + S.gN * 0.85))}" r="60" fill="url(#lamp)"/>`;
  }
  if ($('#showSol').checked) o += `<g>${buildSolution(S, R).map(i => drawItem(i, 'sol')).join('')}</g>`;
  const ls = items.filter(i => i.x1 != null), ps = items.filter(i => i.x1 == null);
  const ord = t => ['bake','bakewl','wlg','wlr'].includes(t) ? 0 : 1;
  ps.sort((a, b) => ord(a.t) - ord(b.t));
  o += ls.map(i => drawItem(i)).join('') + ps.map(i => drawItem(i)).join('');
  if (preview) o += `<g opacity=".6">${drawItem(preview)}</g>`;
  svg.innerHTML = o;
}

/* ---------- Bedienung ---------- */
let nextId = 1, drag = null;
function snapshot() { undoStack.push(JSON.stringify(items)); if (undoStack.length > 80) undoStack.shift(); }
function toWorld(e) {
  const svg = $('#map'); const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  return {x: Math.round(wx(p.x) * 2) / 2, y: Math.round(wy(p.y) * 10) / 10, X: p.x, Y: p.y};
}
function hit(X, Y) {
  let best = null, bd = 16;
  for (const it of items) {
    let d;
    if (it.x1 != null) {
      const hor = Math.abs(it.y1 - it.y2) < 0.01;
      if (hor) { const xa = Math.min(px(it.x1), px(it.x2)), xb = Math.max(px(it.x1), px(it.x2)); d = (X >= xa - 4 && X <= xb + 4) ? Math.abs(Y - py(it.y1)) : 99; }
      else { const ya = Math.min(py(it.y1), py(it.y2)), yb = Math.max(py(it.y1), py(it.y2)); d = (Y >= ya - 4 && Y <= yb + 4) ? Math.abs(X - px(it.x1)) : 99; }
    } else {
      const isSign = TYPES[it.t] && TYPES[it.t].no;
      d = Math.min(Math.hypot(X - px(it.x), Y - py(it.y)), isSign ? Math.hypot(X - px(it.x), Y - (py(it.y) - 20)) : 99);
    }
    if (d < bd) { bd = d; best = it; }
  }
  return best;
}
function hoverInfo(w) {
  const s = S;
  let rel;
  if (w.x < s.x0) rel = `<b>${fmt(s.x0 - w.x, 1)} m</b> westlich vor der Arbeitsstelle`;
  else if (w.x > s.x1) rel = `<b>${fmt(w.x - s.x1, 1)} m</b> östlich hinter der Arbeitsstelle`;
  else rel = `im Bereich der Arbeitsstelle (${fmt(w.x - s.x0, 1)} m ab Westende)`;
  $('#hover').innerHTML = `📍 ${rel} · <b>${fmt(Math.max(0, w.y), 2)} m</b> ab Hauswand Nord · ${zoneName(w.y)}`;
}
function initMapEvents() {
  const svg = $('#map');
  svg.addEventListener('pointerdown', e => {
    const w = toWorld(e);
    svg.setPointerCapture(e.pointerId);
    if (tool === 'move') {
      const h = hit(w.X, w.Y);
      sel = h ? h.id : null;
      showInfo(h ? h.t : null);
      if (h) { snapshot(); drag = {mode:'move', it:h, sx:w.x, sy:w.y, orig: JSON.parse(JSON.stringify(h))}; }
      render(); return;
    }
    if (tool === 'erase') { const h = hit(w.X, w.Y); if (h) { snapshot(); items = items.filter(i => i !== h); render(); } return; }
    if (TYPES[tool].line) { drag = {mode:'line', x1:w.x, y1:w.y}; return; }
    snapshot();
    items.push({id: nextId++, t: tool, x: w.x, y: w.y});
    render();
  });
  svg.addEventListener('pointermove', e => {
    const w = toWorld(e);
    hoverInfo(w);
    if (!drag) return;
    if (drag.mode === 'move') {
      const dx = w.x - drag.sx, dy = w.y - drag.sy, o = drag.orig, it = drag.it;
      if (it.x1 != null) { it.x1 = o.x1 + dx; it.x2 = o.x2 + dx; it.y1 = +(o.y1 + dy).toFixed(2); it.y2 = +(o.y2 + dy).toFixed(2); }
      else { it.x = o.x + dx; it.y = +(o.y + dy).toFixed(2); }
      render();
    } else if (drag.mode === 'line') render(lineFrom(drag, w));
  });
  svg.addEventListener('pointerup', e => {
    if (!drag) return;
    const w = toWorld(e);
    if (drag.mode === 'line') {
      const l = lineFrom(drag, w);
      if (Math.abs(l.x2 - l.x1) + Math.abs(l.y2 - l.y1) >= 0.3) { snapshot(); l.id = nextId++; items.push(l); }
    }
    drag = null; render();
  });
}
function lineFrom(d, w) {
  const hor = Math.abs(w.x - d.x1) * SX >= Math.abs(w.y - d.y1) * SY;
  return hor ? {t: tool, x1: d.x1, y1: d.y1, x2: w.x, y2: d.y1} : {t: tool, x1: d.x1, y1: d.y1, x2: d.x1, y2: w.y};
}
function undo() { if (undoStack.length) { items = JSON.parse(undoStack.pop()); sel = null; render(); } }

function buildPalette() {
  let o = '', grp = '';
  for (const [k, v] of Object.entries(TYPES)) {
    if (v.grp !== grp) { grp = v.grp; o += `<div class="grp">${grp}</div>`; }
    const ic = v.sign ? signIcon(v.sign, 34) : `<svg width="34" height="34" viewBox="-17 -17 34 34">${k === 'move' ? '<path d="M-6-9 L7 3 L1.5 3.5 L5 10 L2 11 L-1.5 4.5 L-6 9Z" fill="#333"/>' : '<path d="M-9 4 L2-8 L10 0 L-1 11 H-6Z" fill="#f48" stroke="#333"/>'}</svg>`;
    o += `<button class="tool ${k === tool ? 'on' : ''}" data-t="${k}" title="${v.label}">${ic}<span>${v.label}</span></button>`;
  }
  $('#palette').innerHTML = o;
  $('#palette').querySelectorAll('.tool').forEach(b => {
    b.onclick = () => { tool = b.dataset.t; buildPalette(); showInfo(INFO[tool] ? tool : null); };
  });
}
function showInfo(t) {
  const el = $('#infocard');
  if (!t || !INFO[t]) { el.innerHTML = '<span class="hint">Wähle ein Zeichen oder Gerät aus, um Bedeutung, Größe und Aufstellort zu sehen.</span>'; return; }
  const I = INFO[t], T = TYPES[t];
  el.innerHTML = `<div class="ic-sign">${signIcon(T.sign, 110)}</div><div><h3>${I.t}</h3><p>${I.d}</p>
    <table class="kv"><tr><td>Größe in dieser Situation</td><td><b>${I.size(S)}</b></td></tr><tr><td>Aufstellung</td><td><b>${I.pos(S)}</b></td></tr></table></div>`;
}
