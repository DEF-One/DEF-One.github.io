/* ===== Zufall & Mathe ===== */
const R = {
  rand: (a, b) => a + Math.random() * (b - a),
  int: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: a => a[Math.floor(Math.random() * a.length)],
  chance: p => Math.random() < p,
  shuffle: a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  gauss: () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
};
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const fmt = (x, d = 2) => Number(x).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmt0 = x => Number(x).toLocaleString('de-DE', { maximumFractionDigits: 2 });

function interp(anchors, t) {
  if (t <= anchors[0][0]) return anchors[0][1];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [x0, y0] = anchors[i], [x1, y1] = anchors[i + 1];
    if (t <= x1) return y0 + (y1 - y0) * ((t - x0) / (x1 - x0 || 1));
  }
  return anchors[anchors.length - 1][1];
}
function jitter(anchors, jx = 0.015, jy = 0.03) {
  return anchors.map(([x, y], i) => [i === 0 || i === anchors.length - 1 ? x : clamp(x + R.rand(-jx, jx), 0, 1), y + R.rand(-jy, jy)]);
}
const flipA = anchors => anchors.map(([x, y]) => [x, 1 - y]);

/* Kerzen entlang eines Pfades (anchors: [[t,y]] mit t,y in 0..1) */
function pathCandles(anchors, n, opt = {}) {
  const base = opt.base ?? R.rand(30, 180), range = opt.range ?? base * R.rand(0.08, 0.14);
  const noise = opt.noise ?? 0.03, wick = opt.wick ?? 0.025;
  const out = []; let prev = base + interp(anchors, 0) * range;
  for (let i = 0; i < n; i++) {
    const t = (i + 1) / n;
    const target = base + interp(anchors, t) * range;
    const o = prev + R.gauss() * range * noise * 0.25;
    const c = target + R.gauss() * range * noise;
    const h = Math.max(o, c) + Math.abs(R.gauss()) * range * wick;
    const l = Math.min(o, c) - Math.abs(R.gauss()) * range * wick;
    out.push({ o, h, l, c });
    prev = c;
  }
  out.base = base; out.range = range;
  return out;
}
function addVolume(cs, unit) {
  const u = unit || avgBody(cs) || 1;
  cs.forEach(k => { k.v = R.rand(800, 1200) * (1 + Math.abs(k.c - k.o) / u * 0.25); });
  return cs;
}
function avgBody(cs) { return cs.reduce((s, k) => s + Math.abs(k.c - k.o), 0) / cs.length; }
function avgVol(cs, from, to) { const a = cs.slice(from, to); return a.reduce((s, k) => s + k.v, 0) / a.length; }
const mk = (o, c, up, lo) => ({ o, c, h: Math.max(o, c) + up, l: Math.min(o, c) - lo });
function flipCandles(cs, p) { return cs.map(k => ({ o: 2 * p - k.o, c: 2 * p - k.c, h: 2 * p - k.l, l: 2 * p - k.h, v: k.v })); }

/* ===== Indikatoren ===== */
function SMA(v, n) { return v.map((_, i) => i < n - 1 ? null : v.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n); }
function EMA(v, n) { const k = 2 / (n + 1); let e = null; return v.map((x, i) => { e = e === null ? x : x * k + e * (1 - k); return i < n - 1 ? null : e; }); }
function RSI(v, n = 14) {
  const out = v.map(() => null); let g = 0, l = 0;
  for (let i = 1; i < v.length; i++) {
    const d = v[i] - v[i - 1], up = Math.max(d, 0), dn = Math.max(-d, 0);
    if (i <= n) { g += up; l += dn; if (i === n) { g /= n; l /= n; out[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); } }
    else { g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n; out[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); }
  }
  return out;
}

/* ===== SVG-Renderer =====
  spec: { candles, highlight:[i0,i1], lines:[{y,label,color,dash}], overlays:[{values,color,label}],
          volume:bool, rsi:array|null, markers:[{i,y,label,color}], hideLastN }
*/
function renderChart(spec) {
  const cs = spec.candles, n = cs.length;
  const W = 640, PR = 62, PL = 8, plotW = W - PR - PL;
  const mainH = spec.height || 270, volH = spec.volume ? 64 : 0, rsiH = spec.rsi ? 92 : 0, gap = 8;
  const H = mainH + (volH ? volH + gap : 0) + (rsiH ? rsiH + gap : 0) + 6;
  let lo = Infinity, hi = -Infinity;
  cs.forEach(k => { lo = Math.min(lo, k.l); hi = Math.max(hi, k.h); });
  (spec.lines || []).forEach(L => { lo = Math.min(lo, L.y); hi = Math.max(hi, L.y); });
  (spec.overlays || []).forEach(o => o.values.forEach(v => { if (v != null) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }));
  const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
  const step = plotW / (n + 1), cw = Math.max(2, Math.min(16, step * 0.62));
  const X = i => PL + step * (i + 1);
  const Y = p => 8 + (hi - p) / (hi - lo) * (mainH - 16);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" xmlns="http://www.w3.org/2000/svg">`;
  s += `<rect x="0" y="0" width="${W}" height="${mainH}" class="cbg"/>`;
  // Gitter + Preisachse
  for (let g = 0; g <= 4; g++) {
    const p = lo + (hi - lo) * g / 4, y = Y(p);
    s += `<line x1="${PL}" x2="${W - PR}" y1="${y}" y2="${y}" class="grid"/><text x="${W - PR + 6}" y="${y + 4}" class="axis">${fmt(p)}</text>`;
  }
  if (spec.highlight) {
    const [a, b] = spec.highlight;
    s += `<rect x="${X(a) - step / 2}" y="2" width="${step * (b - a + 1)}" height="${mainH - 4}" class="hl" rx="6"/>`;
  }
  (spec.lines || []).forEach(L => {
    const y = Y(L.y);
    s += `<line x1="${PL}" x2="${W - PR}" y1="${y}" y2="${y}" stroke="${L.color || '#f5c542'}" stroke-width="1.6" ${L.dash !== false ? 'stroke-dasharray="6 4"' : ''}/>`;
    if (L.label) s += `<rect x="${PL + 4}" y="${y - 19}" width="${L.label.length * 7.4 + 10}" height="16" rx="4" fill="${L.color || '#f5c542'}" opacity=".9"/><text x="${PL + 9}" y="${y - 7}" class="lbl">${L.label}</text>`;
  });
  (spec.overlays || []).forEach(o => {
    let d = ''; o.values.forEach((v, i) => { if (v != null) d += (d ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); });
    s += `<path d="${d}" fill="none" stroke="${o.color}" stroke-width="2" opacity=".95"/>`;
  });
  cs.forEach((k, i) => {
    const up = k.c >= k.o, x = X(i), col = up ? 'var(--up)' : 'var(--dn)';
    const yb = Y(Math.max(k.o, k.c)), bh = Math.max(1.2, Math.abs(Y(k.o) - Y(k.c)));
    s += `<line x1="${x}" x2="${x}" y1="${Y(k.h)}" y2="${Y(k.l)}" stroke="${col}" stroke-width="1.4"/>`;
    s += `<rect x="${x - cw / 2}" y="${yb}" width="${cw}" height="${bh}" fill="${col}" rx="1"/>`;
  });
  (spec.markers || []).forEach(m => {
    s += `<circle cx="${X(m.i)}" cy="${Y(m.y)}" r="13" fill="none" stroke="${m.color || '#fff'}" stroke-width="2.4"/>`;
    if (m.label) s += `<text x="${X(m.i)}" y="${Y(m.y) - 18}" text-anchor="middle" class="mk">${m.label}</text>`;
  });
  if (spec.overlays && spec.overlays.some(o => o.label)) {
    let lx = PL + 8;
    spec.overlays.forEach(o => { if (!o.label) return; s += `<rect x="${lx}" y="${mainH - 20}" width="12" height="4" fill="${o.color}"/><text x="${lx + 16}" y="${mainH - 14}" class="axis">${o.label}</text>`; lx += o.label.length * 7 + 36; });
  }
  let y0 = mainH + gap;
  if (spec.volume) {
    const mv = Math.max(...cs.map(k => k.v || 0));
    s += `<rect x="0" y="${y0}" width="${W}" height="${volH}" class="cbg"/><text x="${W - PR + 6}" y="${y0 + 14}" class="axis">Volumen</text>`;
    cs.forEach((k, i) => { const h = (k.v / mv) * (volH - 8); s += `<rect x="${X(i) - cw / 2}" y="${y0 + volH - h}" width="${cw}" height="${h}" fill="${k.c >= k.o ? 'var(--up)' : 'var(--dn)'}" opacity=".55"/>`; });
    y0 += volH + gap;
  }
  if (spec.rsi) {
    const YR = v => y0 + 6 + (100 - v) / 100 * (rsiH - 12);
    s += `<rect x="0" y="${y0}" width="${W}" height="${rsiH}" class="cbg"/>`;
    s += `<rect x="${PL}" y="${YR(70)}" width="${plotW}" height="${YR(30) - YR(70)}" fill="#8b7cf6" opacity=".08"/>`;
    [70, 30].forEach(v => s += `<line x1="${PL}" x2="${W - PR}" y1="${YR(v)}" y2="${YR(v)}" stroke="#8b7cf6" stroke-dasharray="4 4"/><text x="${W - PR + 6}" y="${YR(v) + 4}" class="axis">${v}</text>`);
    s += `<text x="${PL + 6}" y="${y0 + 16}" class="axis">RSI (14)</text>`;
    let d = ''; spec.rsi.forEach((v, i) => { if (v != null) d += (d ? 'L' : 'M') + X(i).toFixed(1) + ' ' + YR(v).toFixed(1); });
    s += `<path d="${d}" fill="none" stroke="#a78bfa" stroke-width="2"/>`;
    const last = spec.rsi[spec.rsi.length - 1];
    if (last != null) s += `<text x="${W - PR + 6}" y="${YR(last) + 4}" class="axis" fill="#c4b5fd">${fmt(last, 0)}</text>`;
  }
  return s + '</svg>';
}

/* Einzelne große Kerze mit Beschriftung A–D */
function renderSingleCandle(up, labels) {
  const W = 360, H = 300, x = 150;
  const hiY = 30, loY = 270, top = up ? 95 : 95, bot = 200;
  const col = up ? 'var(--up)' : 'var(--dn)';
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart single" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" class="cbg"/>`;
  s += `<line x1="${x}" x2="${x}" y1="${hiY}" y2="${loY}" stroke="${col}" stroke-width="4"/>`;
  s += `<rect x="${x - 34}" y="${top}" width="68" height="${bot - top}" fill="${col}" rx="3"/>`;
  const pos = { high: hiY, low: loY, top, bot };
  Object.entries(labels).forEach(([k, L]) => {
    const y = pos[k];
    s += `<line x1="${x + 40}" x2="${x + 100}" y1="${y}" y2="${y}" stroke="#9aa4b2" stroke-dasharray="4 3"/>`;
    s += `<circle cx="${x + 120}" cy="${y}" r="15" fill="#2b3441" stroke="#f5c542" stroke-width="2"/><text x="${x + 120}" y="${y + 6}" text-anchor="middle" class="mkbig">${L}</text>`;
  });
  return s + '</svg>';
}
