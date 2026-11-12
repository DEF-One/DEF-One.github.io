/* ==========================================================================
   VZ-Plan-Trainer · Zeichenbibliothek (SVG, nach Vorbild StVO / VzKat)
   Alle Zeichen werden in einem 100er-Koordinatensystem um (0,0) gezeichnet.
   ========================================================================== */
"use strict";
const RED = '#c1121c', BLUE = '#1f5aa6', YEL = '#f6c600', BLK = '#111';

const SIGNS = {};

/* ---------- Grundformen ---------- */
const triBase = inner => `
  <path d="M0,-52 L57,46 L-57,46 Z" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>
  <path d="M0,-46 L50,40 L-50,40 Z" fill="${RED}" stroke="${RED}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M0,-25 L32,31 L-32,31 Z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
  ${inner}`;
const ringBase = (fill = '#fff') => `<circle r="50" fill="#fff"/><circle r="47.5" fill="${RED}"/><circle r="37" fill="${fill}"/>`;
const yRect = (w, h, inner) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="3" fill="${YEL}" stroke="${BLK}" stroke-width="3"/>${inner}`;

/* ---------- Gefahrzeichen ---------- */
SIGNS.z123 = {w:100, h:100, svg: triBase(`
  <circle cx="-7" cy="-5" r="3.8" fill="${BLK}"/>
  <path d="M-9,0 L-2,11" stroke="${BLK}" stroke-width="5" stroke-linecap="round"/>
  <path d="M-2,11 L-9,23 M-2,11 L5,23" stroke="${BLK}" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M-8,2 L5,8" stroke="${BLK}" stroke-width="3" stroke-linecap="round"/>
  <path d="M-11,-3 L11,17" stroke="${BLK}" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M8,14 L16,20 L12,25 L5,18 Z" fill="${BLK}"/>
  <path d="M11,27 Q19,13 27,27 Z" fill="${BLK}"/>`)};
SIGNS.z121 = {w:100, h:100, svg: triBase(`
  <path d="M-8,27 V-10" stroke="${BLK}" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M10,27 V10 L3,0 V-10" stroke="${BLK}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`)};

/* ---------- Vorschriftzeichen ---------- */
SIGNS.z208 = {w:100, h:100, svg: ringBase() + `
  <path d="M-13,-29 L-23,-12 L-16.5,-12 L-16.5,26 L-9.5,26 L-9.5,-12 L-3,-12 Z" fill="${RED}"/>
  <path d="M13,29 L3,12 L9.5,12 L9.5,-26 L16.5,-26 L16.5,12 L23,12 Z" fill="${BLK}"/>`};
SIGNS.z308 = {w:100, h:100, svg: `
  <rect x="-50" y="-50" width="100" height="100" rx="9" fill="#fff"/>
  <rect x="-46" y="-46" width="92" height="92" rx="7" fill="${BLUE}"/>
  <path d="M-11,-36 L-27,-12 L-17,-12 L-17,36 L-5,36 L-5,-12 L5,-12 Z" fill="#fff"/>
  <path d="M20,30 L12,17 L17,17 L17,-16 L23,-16 L23,17 L28,17 Z" fill="${RED}"/>`};
SIGNS.z283 = {w:100, h:100, svg: ringBase(BLUE) + `<path d="M-26,-26 L26,26 M26,-26 L-26,26" stroke="${RED}" stroke-width="10"/>`};
SIGNS.z250 = {w:100, h:100, svg: ringBase()};
SIGNS.z274 = {w:100, h:100, svg: ringBase() + `<text y="15" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="44" fill="${BLK}">30</text>`};

/* ---------- Zusatzzeichen ---------- */
SIGNS.zz1000 = {w:100, h:56, svg: `
  <rect x="-50" y="-28" width="100" height="56" rx="3" fill="#fff" stroke="${BLK}" stroke-width="3"/>
  <circle cx="-26" cy="-14" r="4.2" fill="${BLK}"/>
  <path d="M-26,-9 V6 M-26,6 L-32,19 M-26,6 L-20,19 M-33,-2 H-19" stroke="${BLK}" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M-6,16 H18 Q28,16 28,6 V-10" stroke="${BLK}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M20,-6 L28,-20 L36,-6 Z" fill="${BLK}"/>`};

/* ---------- Umleitung ---------- */
SIGNS.u4571 = {w:100, h:34, svg: yRect(100, 34, `<text y="6" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="17" fill="${BLK}">Umleitung</text>`)};
SIGNS.u4572 = {w:100, h:34, svg: yRect(100, 34, `<text y="6" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="17" fill="${BLK}">Umleitung</text><path d="M-44,13 L44,-13" stroke="${RED}" stroke-width="6"/>`)};
const u455 = arrow => yRect(80, 90, `<text x="0" y="-8" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="42" fill="${BLK}">U</text>${arrow}`);
SIGNS['u455.1-11'] = {w:80, h:90, svg: u455(`<path d="M24,30 H-14" stroke="${BLK}" stroke-width="7"/><path d="M-12,19 L-28,30 L-12,41 Z" fill="${BLK}" transform="translate(0,0)"/>`)};
SIGNS['u455.1-21'] = {w:80, h:90, svg: u455(`<path d="M-24,30 H14" stroke="${BLK}" stroke-width="7"/><path d="M12,19 L28,30 L12,41 Z" fill="${BLK}"/>`)};
SIGNS['u455.1-30'] = {w:80, h:90, svg: u455(`<path d="M0,40 V22" stroke="${BLK}" stroke-width="7"/><path d="M-10,24 L0,12 L10,24 Z" fill="${BLK}"/>`)};
SIGNS['u454-10'] = {w:100, h:34, svg: `<path d="M-50,-16 L-34,0 L-50,16 Z" fill="none"/><path d="M50,-16 H-32 L-50,0 L-32,16 H50 Z" fill="${YEL}" stroke="${BLK}" stroke-width="3" stroke-linejoin="round"/><text x="8" y="6" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="16" fill="${BLK}">Umleitung</text>`};
SIGNS['u454-20'] = {w:100, h:34, svg: `<path d="M-50,-16 H32 L50,0 L32,16 H-50 Z" fill="${YEL}" stroke="${BLK}" stroke-width="3" stroke-linejoin="round"/><text x="-8" y="6" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="16" fill="${BLK}">Umleitung</text>`};
SIGNS.u458 = {w:100, h:80, svg: yRect(100, 80, `<path d="M-38,10 H38" stroke="${BLK}" stroke-width="7"/><path d="M-10,10 V-26 H18 V10" stroke="${BLK}" stroke-width="4" fill="none"/><path d="M6,-2 L18,10 L30,-2" fill="none" stroke="${BLK}" stroke-width="3"/><path d="M-6,4 L6,16 M6,4 L-6,16" stroke="${RED}" stroke-width="4"/><text x="0" y="34" text-anchor="middle" font-family="Arial" font-weight="700" font-size="13">Umleitung</text>`)};

/* ---------- Lichtsignale ---------- */
SIGNS.lsa = {w:40, h:100, svg: `
  <rect x="-17" y="-50" width="34" height="100" rx="5" fill="${YEL}" stroke="${BLK}" stroke-width="2.5"/>
  <rect x="-12" y="-45" width="24" height="90" rx="4" fill="#161616"/>
  <circle cy="-28" r="9" fill="#e5251f"/><circle cy="0" r="9" fill="#f2a900"/><circle cy="28" r="9" fill="#1fae4b"/>`};
SIGNS.flsa = {w:40, h:100, svg: `
  <rect x="-15" y="-50" width="30" height="80" rx="5" fill="#161616" stroke="${BLK}" stroke-width="2"/>
  <circle cy="-30" r="10" fill="#e5251f"/><circle cy="2" r="10" fill="#1fae4b"/>
  <path d="M-3,-36 h6 v8 h-6z M-1.5,-39 a1.8,1.8 0 1,0 0.1,0" fill="#300"/>
  <path d="M-22,40 H22 M-22,46 H22" stroke="#fff" stroke-width="3.5" stroke-dasharray="5 4"/>`};

/* ---------- Absperrgeräte ---------- */
const bakeBody = `<rect x="-13" y="-50" width="26" height="100" fill="#fff" stroke="#8a0000" stroke-width="2"/>
  <path d="M-13,-30 L13,-50 L13,-35 L-13,-15 Z M-13,5 L13,-15 L13,0 L-13,20 Z M-13,40 L13,20 L13,35 L-11,50 L-13,50 Z" fill="${RED}"/>`;
SIGNS.bake = {w:30, h:100, svg: bakeBody};
SIGNS.bakewl = {w:30, h:126, svg: `<g transform="translate(0,13)">${bakeBody}<rect x="-3" y="-60" width="6" height="12" fill="#333"/><circle cy="-66" r="11" fill="#ffc400" stroke="#6b5000" stroke-width="2.5"/></g>`};
SIGNS.wlg = {w:30, h:30, svg: `<circle r="13" fill="#ffc400" stroke="#6b5000" stroke-width="3"/><circle r="6" fill="#fff6b0"/>`};
SIGNS.wlr = {w:30, h:30, svg: `<circle r="13" fill="#e31b1b" stroke="#600" stroke-width="3"/><circle r="6" fill="#ffb0b0"/>`};
SIGNS.g100 = {w:100, h:40, svg: `<rect x="-50" y="-14" width="100" height="14" fill="#fff" stroke="${BLK}" stroke-width="1.5"/><path d="M-50,-14 h12.5 v14 h-12.5z M-25,-14 h12.5 v14 h-12.5z M0,-14 h12.5 v14 h-12.5z M25,-14 h12.5 v14 h-12.5z" fill="${RED}"/><path d="M-46,0 V18 M46,0 V18" stroke="#444" stroke-width="3"/><rect x="-50" y="12" width="100" height="5" fill="#222"/>`};
SIGNS.g250 = {w:100, h:40, svg: `<rect x="-50" y="-20" width="100" height="26" fill="#fff" stroke="${BLK}" stroke-width="1.5"/><path d="M-50,-20 h12.5 v26 h-12.5z M-25,-20 h12.5 v26 h-12.5z M0,-20 h12.5 v26 h-12.5z M25,-20 h12.5 v26 h-12.5z" fill="${RED}"/><path d="M-46,6 V20 M46,6 V20" stroke="#444" stroke-width="3"/>`};

function signSVG(code, height) {
  const d = SIGNS[code]; if (!d) return '';
  const s = height / Math.max(d.h, d.w * 0.9);
  return `<g transform="scale(${s.toFixed(4)})">${d.svg}</g>`;
}
function signIcon(code, px = 34) {
  const d = SIGNS[code];
  const vb = Math.max(d.w, d.h) / 2 + 6;
  return `<svg width="${px}" height="${px}" viewBox="${-vb} ${-vb} ${2 * vb} ${2 * vb}" aria-hidden="true">${d.svg}</svg>`;
}
