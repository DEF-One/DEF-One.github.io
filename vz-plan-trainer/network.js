"use strict";
/* ==========================================================================
   VZ-Plan-Trainer · Umleitungsplan (Straßennetz, Routen, Beschilderung)
   ========================================================================== */
const NET = {cols:5, rows:4, dx:180, dy:125, ox:70, oy:62};
let N = null;
let ROUTES = {WE:[], EW:[]}, USIGNS = {WE:{}, EW:{}}, netDir = 'WE', netTool = 'route', netShowSol = false, netPopNode = null;
const DIRNAME = {WE:'West → Ost', EW:'Ost → West'};
const DIRCOL = {WE:'#0b62d6', EW:'#a1239c'};

function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const nid = (c, r) => c + ',' + r;
const H_NAMES = ['Kirchstraße','Am Stadtgarten','Bismarckstraße','Friedrichstraße','Schützenstraße','Ringstraße','Neckarstraße','Poststraße'];
const V_NAMES = ['Goethestraße','Lessingweg','Herderstraße','Kantstraße','Brunnenweg','Hölderlinstraße','Wilhelmstraße','Ulmer Straße','Mörikeweg'];
const ETYPE = {
  haupt:{name:'Hauptverkehrsstraße', w:24, fill:'#ffe08a', casing:'#b8902a', cost:1.0},
  neben:{name:'Wohnstraße (Tempo 30)', w:17, fill:'#ffffff', casing:'#a9a9a9', cost:1.35},
  einbahn:{name:'Einbahnstraße', w:17, fill:'#ffffff', casing:'#a9a9a9', cost:1.35},
  eng:{name:'Enge Straße (Fahrbahn 3,80 m)', w:10, fill:'#ffffff', casing:'#a9a9a9', cost:1.6},
  gewicht:{name:'Z 262 – Verbot über 7,5 t', w:17, fill:'#ffffff', casing:'#a9a9a9', cost:1.35},
  fuz:{name:'Fußgängerzone (Z 242.1)', w:17, fill:'#efe1c6', casing:'#c8b48a', cost:99},
  spiel:{name:'Verkehrsberuhigter Bereich (Z 325.1)', w:15, fill:'#d9efd2', casing:'#8fbf83', cost:99},
};

function buildNetwork(s) {
  const rng = mulberry(hashStr(s.street + '|' + s.nr + '|' + s.city + '|' + s.len));
  const pk = a => a[Math.floor(rng() * a.length)];
  const shuf = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const requireLkw = s.vol === 'hoch';
  for (let attempt = 0; attempt < 400; attempt++) {
    const nodes = {}, edges = {};
    const hn = shuf(H_NAMES), vn = shuf(V_NAMES);
    const rowName = [hn[0], s.street, hn[1], hn[2]];
    const colName = [vn[0], vn[1], vn[2], vn[3], vn[4]];
    for (let c = 0; c < NET.cols; c++) for (let r = 0; r < NET.rows; r++)
      nodes[nid(c, r)] = {id:nid(c, r), c, r, x:NET.ox + c * NET.dx, y:NET.oy + r * NET.dy};
    const addE = (a, b, name, len) => { const id = a + '|' + b; edges[id] = {id, a, b, name, len, type:'neben', dir:null}; };
    for (let r = 0; r < NET.rows; r++) for (let c = 0; c < NET.cols - 1; c++) addE(nid(c, r), nid(c + 1, r), rowName[r], 140);
    for (let c = 0; c < NET.cols; c++) for (let r = 0; r < NET.rows - 1; r++) addE(nid(c, r), nid(c, r + 1), colName[c], 95);
    const A = nid(1, 1), B = nid(2, 1);
    const closed = A + '|' + B;
    const row1 = Object.values(edges).filter(e => nodes[e.a].r === 1 && nodes[e.b].r === 1);
    row1.forEach(e => e.type = s.vol === 'hoch' ? 'haupt' : 'neben');
    const hRow = pk([0, 3, 3]);
    Object.values(edges).filter(e => nodes[e.a].r === hRow && nodes[e.b].r === hRow).forEach(e => e.type = 'haupt');
    const hCol = pk([0, 4, 3]);
    Object.values(edges).filter(e => nodes[e.a].c === hCol && nodes[e.b].c === hCol).forEach(e => e.type = 'haupt');
    // fehlende Straßen (Blockinnenbereiche)
    const removable = Object.values(edges).filter(e => !(nodes[e.a].r === 1 && nodes[e.b].r === 1) && e.type !== 'haupt');
    const nRem = Math.floor(rng() * 3);
    for (let i = 0; i < nRem; i++) { const e = pk(removable); delete edges[e.id]; }
    // Hindernisse
    const cand = Object.values(edges).filter(e => e.id !== closed && !(nodes[e.a].r === 1 && nodes[e.b].r === 1) && e.type !== 'haupt');
    const nObs = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < nObs && cand.length; i++) {
      const e = cand.splice(Math.floor(rng() * cand.length), 1)[0];
      e.type = pk(['einbahn','einbahn','einbahn','fuz','eng','gewicht','spiel']);
      if (e.type === 'einbahn') e.dir = rng() < 0.5 ? [e.a, e.b] : [e.b, e.a];
    }
    const net = {nodes, edges, A, B, closed, pre:{WE:nid(0, 1), EW:nid(3, 1)}, goals:{WE:[B, nid(3, 1), nid(4, 1)], EW:[A, nid(0, 1)]}, rowName, colName, requireLkw};
    N = net;
    const bWE = bestRoute('WE'), bEW = bestRoute('EW');
    if (!bWE || !bEW) continue;
    // Lernwert: die kürzeste Wegeverbindung ohne Regeln soll mind. einmal unzulässig sein
    N.goals = net.goals;
    const naive = shortestIgnoringRules(A, B);
    const naiveOk = !routeProblems(naive, 'WE').length;
    if (naiveOk && rng() < 0.7) continue;
    net.best = {WE:bWE, EW:bEW};
    return net;
  }
  return N;
}

function edgeBetween(u, v) { return N.edges[u + '|' + v] || N.edges[v + '|' + u] || null; }
function neighbors(u) { const out = []; for (const e of Object.values(N.edges)) { if (e.a === u) out.push(e.b); else if (e.b === u) out.push(e.a); } return out; }
function degree(u) { return neighbors(u).length; }
function edgeProblem(e, u, v) {
  if (!e) return 'Hier gibt es keine Straßenverbindung.';
  if (e.id === N.closed) return `Das ist der <b>gesperrte Abschnitt</b> (${e.name}, Arbeitsstelle).`;
  if (e.type === 'fuz') return `<b>${e.name}</b> ist Fußgängerzone (Z 242.1). Kein Durchgangsverkehr.`;
  if (e.type === 'spiel') return `<b>${e.name}</b> ist ein verkehrsberuhigter Bereich (Schrittgeschwindigkeit). Für Umleitungsverkehr ungeeignet.`;
  if (e.type === 'einbahn' && !(e.dir[0] === u && e.dir[1] === v)) return `<b>${e.name}</b> ist Einbahnstraße. Die Route fährt <b>entgegen</b> der Fahrtrichtung.`;
  if (N.requireLkw && e.type === 'eng') return `<b>${e.name}</b> hat nur 3,80 m Fahrbahn. Für den umzuleitenden Bus- und Lkw-Verkehr ungeeignet.`;
  if (N.requireLkw && e.type === 'gewicht') return `<b>${e.name}</b> hat ein Verbot für Fahrzeuge über 7,5 t (Z 262). Der Lkw- und Busverkehr darf dort nicht fahren.`;
  return null;
}
function postOf(dir, goal) { const n = N.nodes[goal]; const c = n.c + (dir === 'WE' ? 1 : -1); return (n.r === 1 && c >= 0 && c < NET.cols) ? nid(c, 1) : null; }
function residual(dir, goal) { const n = N.nodes[goal]; const far = dir === 'WE' ? NET.cols - 1 : 0; const e = edgeBetween(nid(0, 1), nid(1, 1)); return Math.abs(far - n.c) * 140 * ETYPE[e.type].cost; }
function routeScore(route, dir) { return routeCost(route) + residual(dir, route[route.length - 1]); }
function routeCost(route) { let c = 0; for (let i = 1; i < route.length; i++) { const e = edgeBetween(route[i - 1], route[i]); c += e ? e.len * ETYPE[e.type].cost : 999; } return c; }
function routeLen(route) { let c = 0; for (let i = 1; i < route.length; i++) { const e = edgeBetween(route[i - 1], route[i]); c += e ? e.len : 0; } return c; }
function bestRoute(dir) {
  const start = dir === 'WE' ? N.A : N.B;
  const dist = {[start]:0}, prev = {}, done = new Set();
  while (true) {
    let u = null, du = Infinity;
    for (const k in dist) if (!done.has(k) && dist[k] < du) { du = dist[k]; u = k; }
    if (u == null) break;
    done.add(u);
    for (const v of neighbors(u)) {
      const e = edgeBetween(u, v);
      if (edgeProblem(e, u, v)) continue;
      const nd = du + e.len * ETYPE[e.type].cost;
      if (nd < (dist[v] ?? Infinity)) { dist[v] = nd; prev[v] = u; }
    }
  }
  let goal = null, gb = Infinity;
  for (const g of N.goals[dir]) if (g !== start && dist[g] != null && dist[g] + residual(dir, g) < gb) { gb = dist[g] + residual(dir, g); goal = g; }
  if (!goal) return null;
  const path = [goal]; while (path[0] !== start) path.unshift(prev[path[0]]);
  return path;
}
function shortestIgnoringRules(a, b) {
  const q = [[a]], seen = new Set([a]);
  while (q.length) { const p = q.shift(), u = p[p.length - 1]; if (u === b) return p;
    for (const v of neighbors(u)) { if (seen.has(v) || (u + '|' + v) === N.closed || (v + '|' + u) === N.closed) continue; seen.add(v); q.push([...p, v]); } }
  return [a];
}
function routeProblems(route, dir) {
  const P = [];
  for (let i = 1; i < route.length; i++) { const pr = edgeProblem(edgeBetween(route[i - 1], route[i]), route[i - 1], route[i]); if (pr) P.push(pr); }
  return P;
}
function heading(u, v) { const a = N.nodes[u], b = N.nodes[v]; return {x:Math.sign(b.c - a.c), y:Math.sign(b.r - a.r)}; }
function turnH(h1, h2) {
  const cr = h1.x * h2.y - h1.y * h2.x, dot = h1.x * h2.x + h1.y * h2.y;
  if (cr < 0) return 'L'; if (cr > 0) return 'R'; return dot > 0 ? 'S' : 'U';
}
const ACCEPT = {L:['u455.1-11','u454-10'], R:['u455.1-21','u454-20'], S:['u455.1-30']};
const TURNTXT = {L:'hier links (Z 455.1-11 oder Z 454-10)', R:'hier rechts (Z 455.1-21 oder Z 454-20)', S:'geradeaus (Z 455.1-30, Fortsetzung)'};
function requiredSigns(dir, route) {
  const req = [];
  if (!route.length) return req;
  const pre = N.pre[dir], goal = route[route.length - 1], post = postOf(dir, goal);
  const along = {x: dir === 'WE' ? 1 : -1, y: 0};
  req.push({node:pre, accept:['u4571'], kind:'ank', txt:'Umleitungsankündigung Z 457.1 vor dem Beginn der Umleitung'});
  for (let i = 0; i < route.length; i++) {
    if (i > 0 && !edgeBetween(route[i - 1], route[i])) continue;
    if (i < route.length - 1 && !edgeBetween(route[i], route[i + 1])) continue;
    const h1 = i === 0 ? along : heading(route[i - 1], route[i]);
    const h2 = i === route.length - 1 ? along : heading(route[i], route[i + 1]);
    const t = turnH(h1, h2);
    if (t === 'U') continue;
    if (t === 'S' && degree(route[i]) < 3) continue;
    req.push({node:route[i], accept:ACCEPT[t], kind:t, txt:TURNTXT[t]});
  }
  req.push({node:post || goal, accept:['u4572'], kind:'end', txt:'Ende der Umleitung Z 457.2 nach dem Wiedereinmünden'});
  return req;
}
function nodeLabel(id) {
  const n = N.nodes[id];
  const h = N.rowName[n.r], v = N.colName[n.c];
  return `${h} / ${v}`;
}

/* ---------- Prüfung ---------- */
function netChecks() {
  const C = [];
  const add = (ok, title, detail) => C.push({ok, title, detail});
  for (const dir of ['WE','EW']) {
    const route = ROUTES[dir], start = dir === 'WE' ? N.A : N.B;
    const goalTxt = N.goals[dir].map(nodeLabel).join(' oder ');
    const T = `Umleitung ${DIRNAME[dir]}`;
    if (route.length < 2) { add(false, `${T}: Strecke`, `Fehlt. Zeichne die Umleitung von <b>${nodeLabel(start)}</b> zurück auf die ${S.street} hinter der Sperrung (${goalTxt}).`); continue; }
    let ok = route[0] === start && N.goals[dir].includes(route[route.length - 1]) && route[route.length - 1] !== start;
    const probs = routeProblems(route, dir);
    if (!ok) add(false, `${T}: Strecke`, `Die Route muss am letzten Knoten vor der Sperrung beginnen (${nodeLabel(start)}) und hinter der Sperrung wieder auf die ${S.street} führen (${goalTxt}).`);
    else if (probs.length) add(false, `${T}: Strecke befahrbar?`, 'Nicht zulässig: ' + [...new Set(probs)].join(' '));
    else {
      const best = N.best[dir], c = routeScore(route, dir), cb = routeScore(best, dir);
      const good = c <= cb * 1.3 + 1;
      add(good, `${T}: Strecke befahrbar und sinnvoll`, good
        ? `Zulässig, ${routeLen(route)} m lang (Optimum ${routeLen(best)} m).${N.requireLkw ? ' Lkw- und bustauglich.' : ''}`
        : `Zulässig, aber mit ${routeLen(route)} m deutlich länger oder mehr über Wohnstraßen als nötig (Optimum ${routeLen(best)} m). Umleitungen sollen möglichst kurz sein und über leistungsfähige Straßen führen.`);
    }
    // Beschilderung
    const req = requiredSigns(dir, route);
    const have = USIGNS[dir];
    const used = new Set();
    let miss = [], wrong = [];
    for (const q of req) {
      const hs = have[q.node] || [];
      const m = hs.find(c => q.accept.includes(c));
      if (m) used.add(q.node + ':' + m);
      else {
        const anyTurn = hs.find(c => ['u455.1-11','u455.1-21','u455.1-30','u454-10','u454-20'].includes(c));
        if (anyTurn && ['L','R','S'].includes(q.kind)) wrong.push(`${nodeLabel(q.node)}: falscher Pfeil, richtig wäre ${q.txt}`);
        else miss.push(`${nodeLabel(q.node)}: ${q.txt}`);
      }
    }
    const extra = [];
    for (const [node, list] of Object.entries(have)) for (const c of list) if (!used.has(node + ':' + c) && c !== 'u458') extra.push(`${nodeLabel(node)}: ${UMENU.find(m => m.c === c).t}`);
    add(!miss.length && !wrong.length, `${T}: Umleitungsbeschilderung (${req.length} Standorte)`,
      (!miss.length && !wrong.length) ? 'Vollständig: Ankündigung, jeder Abbiegepunkt, Fortsetzung an Kreuzungen und Ende.'
      : [wrong.length ? '<b>Falsch:</b> ' + wrong.join('; ') : '', miss.length ? '<b>Fehlt:</b> ' + miss.join('; ') : ''].filter(Boolean).join('<br>'));
    if (extra.length) add(false, `${T}: überflüssige Umleitungszeichen`, 'Nicht zur Route passend: ' + extra.join('; ') + '. Falsche Umleitungsschilder führen Ortsfremde in die Irre.');
  }
  return C;
}

/* ---------- Darstellung ---------- */
const UMENU = [
  {c:'u4571', t:'Z 457.1 Umleitungsankündigung'},
  {c:'u455.1-11', t:'Z 455.1-11 Umleitung hier links'},
  {c:'u455.1-21', t:'Z 455.1-21 Umleitung hier rechts'},
  {c:'u455.1-30', t:'Z 455.1-30 Umleitung geradeaus'},
  {c:'u454-10', t:'Z 454-10 Umleitungswegweiser links'},
  {c:'u454-20', t:'Z 454-20 Umleitungswegweiser rechts'},
  {c:'u4572', t:'Z 457.2 Ende der Umleitung'},
  {c:'u458', t:'Z 458 Planskizze (optional)'},
];

function netSVG() {
  const W = NET.ox * 2 + (NET.cols - 1) * NET.dx, H = NET.oy * 2 + (NET.rows - 1) * NET.dy + 30;
  let o = `<defs><marker id="arWE" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="${DIRCOL.WE}"/></marker>
  <marker id="arEW" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="${DIRCOL.EW}"/></marker>
  <marker id="arSOL" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#18794e"/></marker>
  <pattern id="nhatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#ffd9d9"/><line x1="0" y1="0" x2="0" y2="8" stroke="#d40000" stroke-width="3"/></pattern></defs>`;
  o += `<rect width="${W}" height="${H}" fill="#e9ecdf"/>`;
  // Baublöcke
  for (let c = 0; c < NET.cols - 1; c++) for (let r = 0; r < NET.rows - 1; r++) {
    const x = NET.ox + c * NET.dx + 18, y = NET.oy + r * NET.dy + 18, w = NET.dx - 36, h = NET.dy - 36;
    o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#ddd6c8" stroke="#c3baa8"/>`;
    for (let k = 0; k < 4; k++) o += `<rect x="${x + 6 + k * (w - 12) / 4}" y="${y + 6}" width="${(w - 12) / 4 - 6}" height="${h * 0.32}" fill="#c9bfae"/><rect x="${x + 6 + k * (w - 12) / 4}" y="${y + h - 6 - h * 0.32}" width="${(w - 12) / 4 - 6}" height="${h * 0.32}" fill="#c9bfae"/>`;
  }
  // Außenränder (Anschluss ans Netz)
  const E = Object.values(N.edges);
  const order = ['fuz','spiel','neben','eng','gewicht','einbahn','haupt'];
  E.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  for (const e of E) {
    const a = N.nodes[e.a], b = N.nodes[e.b], T = ETYPE[e.type];
    o += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${T.casing}" stroke-width="${T.w + 4}" stroke-linecap="round"/>`;
  }
  for (const e of E) {
    const a = N.nodes[e.a], b = N.nodes[e.b], T = ETYPE[e.type];
    o += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${e.id === N.closed ? 'url(#nhatch)' : T.fill}" stroke-width="${T.w}" stroke-linecap="round"/>`;
  }
  // Durchgangsstraßen über den Rand hinaus
  for (let r = 0; r < NET.rows; r++) for (const side of [-1, 1]) {
    const n = N.nodes[nid(side < 0 ? 0 : NET.cols - 1, r)];
    const e = edgeBetween(n.id, nid(side < 0 ? 1 : NET.cols - 2, r)); const T = ETYPE[e ? (e.type === 'haupt' ? 'haupt' : 'neben') : 'neben'];
    o += `<line x1="${n.x}" y1="${n.y}" x2="${n.x + side * 50}" y2="${n.y}" stroke="${T.casing}" stroke-width="${T.w + 4}"/><line x1="${n.x}" y1="${n.y}" x2="${n.x + side * 52}" y2="${n.y}" stroke="${T.fill}" stroke-width="${T.w}"/>`;
  }
  // Symbole auf Kanten
  for (const e of E) {
    const a = N.nodes[e.a], b = N.nodes[e.b], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, hor = a.r === b.r;
    if (e.id === N.closed) {
      o += `<g transform="translate(${mx},${my - 24})">${signSVG('z123', 26)}</g>`;
      for (const p of [a, b]) { const dx = hor ? (p === a ? 24 : -24) : 0; o += `<g transform="translate(${p.x + dx},${p.y})"><rect x="-3" y="-13" width="6" height="26" fill="url(#rw)" stroke="#700"/><circle cx="0" cy="-16" r="3.5" fill="#e31b1b"/></g>`; }
      o += `<text x="${mx}" y="${my + 30}" text-anchor="middle" font-size="11" font-weight="700" fill="#b00000">VOLLSPERRUNG</text>`;
      continue;
    }
    if (e.type === 'einbahn') {
      const [u, v] = e.dir, A2 = N.nodes[u], B2 = N.nodes[v];
      for (const f of [0.32, 0.68]) { const x = A2.x + (B2.x - A2.x) * f, y = A2.y + (B2.y - A2.y) * f, ang = Math.atan2(B2.y - A2.y, B2.x - A2.x) * 180 / Math.PI;
        o += `<g transform="translate(${x},${y}) rotate(${ang})"><rect x="-13" y="-6" width="26" height="12" rx="2" fill="${BLUE}"/><path d="M-9,0 H6 M2,-4 L8,0 L2,4" stroke="#fff" stroke-width="2.2" fill="none"/></g>`; }
    }
    if (e.type === 'fuz') o += `<g transform="translate(${mx},${my})"><rect x="-13" y="-13" width="26" height="26" rx="2" fill="#fff" stroke="${BLUE}" stroke-width="3"/><circle cx="-3" cy="-5" r="2.4" fill="${BLUE}"/><path d="M-3,-2 V5 M-3,5 L-6,10 M-3,5 L0,10 M4,-4 V8 M7,-4 V8" stroke="${BLUE}" stroke-width="2" fill="none"/></g>`;
    if (e.type === 'spiel') o += `<g transform="translate(${mx},${my})"><rect x="-15" y="-11" width="30" height="22" rx="2" fill="${BLUE}"/><path d="M-10,8 L-4,-4 L2,8 M5,8 V0 L9,-3" stroke="#fff" stroke-width="2" fill="none"/><circle cx="-4" cy="-7" r="2" fill="#fff"/></g>`;
    if (e.type === 'gewicht') o += `<g transform="translate(${mx},${my})"><circle r="13" fill="#fff" stroke="${RED}" stroke-width="3.5"/><text y="4" text-anchor="middle" font-size="9.5" font-weight="700" font-family="Arial">7,5t</text></g>`;
    if (e.type === 'eng') o += `<g transform="translate(${mx},${my - (hor ? 14 : 0)}) ${hor ? '' : 'translate(16,0)'}"><rect x="-16" y="-8" width="32" height="15" rx="3" fill="#fff" stroke="#555"/><text y="3.5" text-anchor="middle" font-size="9.5" font-weight="700">3,80 m</text></g>`;
  }
  // Straßennamen
  for (let r = 0; r < NET.rows; r++) { const n = N.nodes[nid(0, r)]; o += `<text x="${n.x + NET.dx / 2}" y="${n.y - 15}" text-anchor="middle" font-size="11.5" font-weight="${r === 1 ? 800 : 600}" fill="#333" paint-order="stroke" stroke="#e9ecdf" stroke-width="4">${N.rowName[r]}</text>`; }
  for (let c = 0; c < NET.cols; c++) { const n = N.nodes[nid(c, 0)]; const y = n.y + NET.dy * 2.5; o += `<text x="${n.x - 15}" y="${y}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#333" paint-order="stroke" stroke="#e9ecdf" stroke-width="4" transform="rotate(-90 ${n.x - 15} ${y})">${N.colName[c]}</text>`; }
  // Routen
  const routePath = (route, dir, col, mk, off, dash = '') => {
    if (route.length < 2) return '';
    const full = route;
    let d = '';
    for (let i = 0; i < full.length; i++) {
      const n = N.nodes[full[i]];
      const hIn = i > 0 ? heading(full[i - 1], full[i]) : null, hOut = i < full.length - 1 ? heading(full[i], full[i + 1]) : null;
      const h = hOut || hIn, h2 = hIn || hOut;
      const nx = -(h.y + h2.y) / 2, ny = (h.x + h2.x) / 2;
      d += (i ? ' L' : 'M') + (n.x + nx * off).toFixed(1) + ',' + (n.y + ny * off).toFixed(1);
    }
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="5" stroke-linejoin="round" ${dash ? `stroke-dasharray="${dash}"` : ''} marker-mid="url(#${mk})" marker-end="url(#${mk})" opacity=".92"/>`;
  };
  if (netShowSol) for (const dir of ['WE','EW']) o += routePath(N.best[dir], dir, '#18794e', 'arSOL', dir === 'WE' ? 10 : -10, '10 6');
  for (const dir of ['WE','EW']) o += routePath(ROUTES[dir], dir, DIRCOL[dir], 'ar' + dir, dir === 'WE' ? 6 : -6);
  // Knoten
  for (const n of Object.values(N.nodes)) {
    const isA = n.id === N.A, isB = n.id === N.B;
    const inR = ROUTES[netDir].includes(n.id);
    if (n.id === netPopNode) o += `<circle cx="${n.x}" cy="${n.y}" r="17" fill="none" stroke="#e20074" stroke-width="3" stroke-dasharray="4 3"/>`;
    o += `<g class="nnode" data-n="${n.id}" style="cursor:pointer"><circle cx="${n.x}" cy="${n.y}" r="${isA || isB ? 12 : 9}" fill="${isA || isB ? '#e20074' : (inR ? DIRCOL[netDir] : '#fff')}" stroke="#333" stroke-width="2"/>${isA || isB ? `<text x="${n.x}" y="${n.y + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">${isA ? 'A' : 'B'}</text>` : ''}<circle cx="${n.x}" cy="${n.y}" r="20" fill="transparent"/></g>`;
  }
  // Schilder je Richtung
  const drawSigns = (dir, signs, ghost) => {
    let g = '';
    for (const [node, list] of Object.entries(signs)) {
      const n = N.nodes[node]; if (!n) continue;
      list.forEach((code, k) => {
        const ox = (dir === 'WE' ? 16 : -16) + (dir === 'WE' ? 1 : -1) * k * 30, oy = dir === 'WE' ? 22 : -22;
        g += `<g transform="translate(${n.x + ox},${n.y + oy})" ${ghost ? 'opacity=".75"' : ''}><rect x="-14" y="-14" width="28" height="28" rx="4" fill="${ghost ? '#d7f2e3' : '#fff'}" stroke="${ghost ? '#18794e' : DIRCOL[dir]}" stroke-width="2"/>${signSVG(code, 22)}</g>`;
      });
    }
    return g;
  };
  if (netShowSol) for (const dir of ['WE','EW']) { const sol = {}; for (const q of requiredSigns(dir, N.best[dir])) (sol[q.node] = sol[q.node] || []).push(q.accept[0]); o += drawSigns(dir, sol, true); }
  else for (const dir of ['WE','EW']) o += drawSigns(dir, USIGNS[dir], false);
  // Legende
  o += `<text x="${NET.ox - 50}" y="${H - 8}" font-size="11" fill="#444">Nordpfeil ↑ · A = letzter Knoten vor der Sperrung (Westseite), B = Ostseite · Maße schematisch</text>`;
  return {svg:o, W, H};
}

function renderNet() {
  if (!N) return;
  const {svg, W, H} = netSVG();
  const el = document.getElementById('net');
  el.setAttribute('viewBox', `0 0 ${W} ${H}`); el.setAttribute('width', W); el.setAttribute('height', H);
  el.innerHTML = `<defs><pattern id="rw" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="3" height="6" fill="#e30613"/><rect x="3" width="3" height="6" fill="#fff"/></pattern></defs>` + svg;
  el.querySelectorAll('.nnode').forEach(g => g.addEventListener('click', ev => netClick(g.dataset.n, ev)));
  const r = ROUTES[netDir];
  document.getElementById('netInfo').innerHTML = r.length
    ? `Route ${DIRNAME[netDir]}: ${r.map(nodeLabel).join(' → ')}`
    : (netTool === 'route' ? `Klicke auf <b>${netDir === 'WE' ? 'A' : 'B'}</b> und dann Knoten für Knoten, bis die Route ${netDir === 'WE' ? 'östlich' : 'westlich'} der Sperrung wieder auf die ${S.street} trifft.` : 'Klicke auf einen Knoten, um dort Umleitungszeichen für die gewählte Richtung zu setzen.');
}

function netClick(node, ev) {
  if (netTool === 'route') {
    const r = ROUTES[netDir], start = netDir === 'WE' ? N.A : N.B;
    if (!r.length) { if (node !== start) { flashNet(`Die Umleitung ${DIRNAME[netDir]} beginnt am Knoten <b>${netDir === 'WE' ? 'A' : 'B'}</b>, dem letzten Knoten vor der Sperrung.`); return; } r.push(node); }
    else if (node === r[r.length - 1]) r.pop();
    else if (r.includes(node)) r.splice(r.indexOf(node) + 1);
    else if (edgeBetween(r[r.length - 1], node)) {
      const pr = edgeProblem(edgeBetween(r[r.length - 1], node), r[r.length - 1], node);
      r.push(node);
      if (pr) flashNet('⚠ ' + pr);
    } else { flashNet('Nur direkt benachbarte Knoten über eine vorhandene Straße anklicken.'); return; }
    renderNet();
  } else if (netTool === 'signs') openSignPop(node, ev);
}
function flashNet(msg) { const el = document.getElementById('netInfo'); el.innerHTML = msg; el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 600); }
function openSignPop(node, ev) {
  netPopNode = node;
  const pop = document.getElementById('netPop');
  const have = USIGNS[netDir][node] || [];
  pop.innerHTML = `<div class="pophead"><span>📍 ${nodeLabel(node)}<br><small>Richtung ${DIRNAME[netDir]}</small></span><button class="btn" onclick="closeSignPop()">✕</button></div><p class="hint" style="margin:0 0 6px">Zeichen anklicken zum Setzen oder Entfernen:</p>` +
    UMENU.map(m => `<button class="tool ${have.includes(m.c) ? 'on' : ''}" onclick="toggleUSign('${m.c}')">${signIcon(m.c, 30)}<span>${m.t}</span></button>`).join('');
  renderNet();
}
function closeSignPop() { netPopNode = null; const p = document.getElementById('netPop'); if (p) p.innerHTML = '<p class="hint">' + (netTool === 'signs' ? 'Klicke im Plan auf einen Knoten. Hier erscheinen dann die Umleitungszeichen für die gewählte Richtung.' : 'Wähle „Schilder setzen“ und klicke auf einen Knoten, um Umleitungszeichen zu setzen.') + '</p>'; }
function toggleUSign(code) {
  const m = USIGNS[netDir]; const l = m[netPopNode] = m[netPopNode] || [];
  const i = l.indexOf(code); if (i >= 0) l.splice(i, 1); else l.push(code);
  if (!l.length) delete m[netPopNode];
  openSignPop(netPopNode);
}
function netSolutionText() {
  const L = [];
  L.push(`<b>Warum eine Umleitung?</b> Die ${S.street} wird zwischen ${N.colName[1]} (A) und ${N.colName[2]} (B) voll gesperrt. Der Verkehr muss in <b>beiden</b> Richtungen über zulässige Straßen geführt und lückenlos beschildert werden.`);
  if (N.requireLkw) L.push('<b>Lkw-/Bustauglich:</b> Wegen der hohen Verkehrsstärke (Linienbus, Lieferverkehr) scheiden enge Straßen (3,80 m) und Straßen mit Z 262 (7,5 t) aus.');
  L.push('<b>Nicht zulässig:</b> Fußgängerzone, verkehrsberuhigte Bereiche und Einbahnstraßen entgegen der Fahrtrichtung. Vorrang haben Hauptverkehrsstraßen statt Wohnstraßen.');
  for (const dir of ['WE','EW']) {
    const r = N.best[dir];
    L.push(`<b>${DIRNAME[dir]}:</b> ${r.map(nodeLabel).join(' → ')} (${routeLen(r)} m)<br><small>` + requiredSigns(dir, r).map(q => `${nodeLabel(q.node)}: ${UMENU.find(m => m.c === q.accept[0]).t}`).join('<br>') + '</small>');
  }
  L.push('<b>Außerdem im Antrag:</b> Z 123 aus allen Richtungen, Z 250 an der Sperrstelle (ggf. „Anlieger bis Baustelle frei“), bei längeren Umleitungen Z 458 Planskizze an der Hauptzufahrt. Umleitungsstrecke vorher abfahren und mit Bus- und Entsorgungsbetrieben abstimmen.');
  return '<ol>' + L.map(x => `<li>${x}</li>`).join('') + '</ol>';
}
