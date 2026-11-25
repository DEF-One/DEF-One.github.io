/* =========================================================
   Intensiv-Modi: ⚡ Blitz-Runde und 🕹️ Chart-Simulator
   ========================================================= */
let BL = null, SIMS = null;
function stopModes() {
  if (BL) { clearInterval(BL.t); BL = null; }
  if (SIMS && SIMS.anim) clearInterval(SIMS.anim);
  SIMS = null;
}

/* ---------------- ⚡ Blitz-Runde ---------------- */
function blitzPool() {
  const vis = Object.keys(SKILLS).filter(id => ['c', 'f', 'b', 'i'].includes(SKILLS[id].mod));
  const learned = vis.filter(id => S.intro.includes(id));
  return learned.length >= 6 ? learned : vis;
}
function blitzGen(pool) {
  for (let t = 0; t < 25; t++) {
    const id = R.pick(pool); let g;
    try { g = SKILLS[id].gen(); } catch (e) { continue; }
    if (g.type || (!g.visual && !g.img)) continue;
    return { id, g };
  }
  return { id: 'b:trend', g: SKILLS['b:trend'].gen() };
}
function blitzStart() {
  stopModes(); cur = null; filter = null;
  BL = { pool: blitzPool(), score: 0, wrong: 0, wrongIds: [], end: Date.now() + 60000, lock: false };
  BL.t = setInterval(() => {
    if (!BL) return;
    const l = BL.end - Date.now(), el = $('#bltime'), bar = $('.blbar i');
    if (el) el.textContent = Math.max(0, Math.ceil(l / 1000)) + ' s';
    if (bar) bar.style.width = Math.max(0, l / 600) + '%';
    if (l <= 0) blitzEnd();
  }, 200);
  blitzNext();
}
function blitzNext() {
  if (!BL) return;
  const { id, g } = blitzGen(BL.pool);
  let opts = g.options.map((t, i) => ({ t, ok: i === g.correct || (g.ok || []).includes(i) }));
  if (!g.keepOrder) opts = R.shuffle(opts);
  BL.cur = { id, g, opts }; BL.lock = false;
  const sk = SKILLS[id];
  const ans = g.img
    ? `<div class="imgopts n${opts.length}">${opts.map((o, i) => `<button class="opt imgopt" data-i="${i}"><kbd>${i + 1}</kbd>${o.t}</button>`).join('')}</div>`
    : `<div class="opts ${opts.length === 2 ? 'two' : ''}">${opts.map((o, i) => `<button class="opt" data-i="${i}"><kbd>${i + 1}</kbd><span>${o.t}</span></button>`).join('')}</div>`;
  view.innerHTML = `<div class="sbar"><button class="ghost" id="back">✕</button><span class="mode">⚡ Blitz-Runde</span><span class="sc">✅ ${BL.score} · ❌ ${BL.wrong}</span><span class="sc bl" id="bltime">${Math.ceil((BL.end - Date.now()) / 1000)} s</span></div>
  <div class="rbar blbar"><i style="width:${(BL.end - Date.now()) / 600}%"></i></div>
  <section class="card task blitz ${g.visual ? 'has-vis' : 'no-vis'} ${g.img ? 'is-img' : ''}"><div class="tag">${MODULES[sk.mod].icon} ${MODULES[sk.mod].name}</div>
  <div class="tmain"><div class="q">${g.q}</div>${g.visual ? `<div class="vis">${g.visual}</div>` : ''}</div><div class="tside">${ans}</div></section>`;
  $('#back').onclick = () => { stopModes(); setTab('home'); };
  view.querySelectorAll('.opt').forEach(b => b.onclick = () => blitzAnswer(+b.dataset.i));
}
function blitzAnswer(i) {
  if (!BL || BL.lock) return; BL.lock = true;
  const o = BL.cur.opts[i];
  view.querySelectorAll('.opt').forEach((b, j) => { b.disabled = true; if (BL.cur.opts[j].ok) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
  if (o.ok) BL.score++; else { BL.wrong++; BL.wrongIds.push(BL.cur.id); if (S.intro.includes(BL.cur.id)) grade(BL.cur.id, 'bad'); }
  setTimeout(() => { if (BL && Date.now() < BL.end) blitzNext(); }, o.ok ? 250 : 1100);
}
function blitzEnd() {
  const B = BL; clearInterval(B.t); BL = null;
  const rec = B.score > (S.blitzBest || 0); if (rec) S.blitzBest = B.score;
  S.blitzHist = (S.blitzHist || []).concat([{ d: today(), s: B.score, w: B.wrong }]).slice(-30); save();
  const wrong = [...new Set(B.wrongIds)];
  const acc = B.score + B.wrong ? Math.round(B.score / (B.score + B.wrong) * 100) : 0;
  view.innerHTML = `<section class="card summary"><h2>⚡ Zeit um!</h2>
    <div class="big-pct">${B.score}</div><p class="hint">richtig erkannt in 60 Sekunden · ${B.wrong} falsch · ${acc} % Treffer</p>
    ${rec ? '<p class="rec">🏆 Neuer Rekord!</p>' : `<p class="hint">Dein Rekord: ${S.blitzBest}</p>`}
    ${B.wrong && acc < 80 ? '<p class="tip">Tipp: Lieber eine Sekunde genauer hinschauen – Fehler kosten in echt Geld.</p>' : ''}
    ${wrong.length ? `<h3>Verwechselt</h3><div class="chips">${wrong.map(id => `<button class="chip y" data-id="${id}">${SKILLS[id].name}</button>`).join('')}</div>` : ''}
    <div class="row-end"><button class="ghost" id="bh">Übersicht</button><button class="go big" id="ba">⚡ Nochmal</button></div></section>`;
  view.querySelectorAll('.chip').forEach(b => b.onclick = () => openLex(b.dataset.id, true));
  $('#bh').onclick = () => setTab('home'); $('#ba').onclick = blitzStart;
}

/* ---------------- 🕹️ Chart-Simulator ---------------- */
const SIM_TYPES = {
  bo: { n: 'Ausbruch mit Volumen', best: 'long', why: 'Schluss über einem mehrfach getesteten Widerstand mit deutlich erhöhtem Volumen → klassisches Long-Setup, Stop unter die Ausbruchszone.' },
  bo_weak: { n: 'Ausbruch ohne Volumen', best: 'wait', why: 'Der Ausbruch hat kaum Volumen → wenig Überzeugung, hohe Fehlausbruch-Gefahr. Abwarten.' },
  bullflag: { f: 'bullflag', best: 'long' }, bearflag: { f: 'bearflag', best: 'short' },
  doubletop: { f: 'doubletop', best: 'short' }, doublebottom: { f: 'doublebottom', best: 'long' },
  asctri: { f: 'asctri', best: 'long' }, desctri: { f: 'desctri', best: 'short' },
  hs: { f: 'hs', best: 'short' }, ihs: { f: 'ihs', best: 'long' },
  cuphandle: { f: 'cuphandle', best: 'long' }, triplebottom: { f: 'triplebottom', best: 'long' }, tripletop: { f: 'tripletop', best: 'short' },
  range: { n: 'Mitten in der Range', best: 'wait', why: 'Kurs steht in der Mitte einer Seitwärtsphase → kein sinnvoller Stop, schlechtes CRV. Abwarten.' },
  fomo: { n: 'Senkrechter Anstieg (FOMO)', best: 'wait', why: 'Kurs ist schon extrem gelaufen, RSI überkauft, kein Stop in der Nähe → nicht hinterherspringen.' },
  knife: { n: 'Fallendes Messer', best: 'wait', why: 'Steiler Abverkauf ohne Umkehrsignal. Weder kaufen („ist doch billig“) noch hinterher shorten (überverkauft).' },
  chop: { n: 'Kein Trend, kein Setup', best: 'wait', why: 'Der Kurs pendelt ohne Struktur. Kein Setup = kein Trade.' }
};
function simScenario() {
  const t = R.pick(Object.keys(SIM_TYPES)), T = SIM_TYPES[t];
  let cs, lines = [], rsi = null, name = T.n, why = T.why;
  if (t === 'bo' || t === 'bo_weak') { const b = breakoutChart(t === 'bo'); cs = b.cs; lines = [{ y: b.line, color: TV.lineLvl, label: 'Widerstand' }]; }
  else if (T.f) { cs = buildForm(T.f); const F = FORMS[T.f]; name = F.name; why = `${F.name}: ${F.mean}`; }
  else if (t === 'range') { cs = pathCandles(jitter([[0, .5], [.12, .8], [.25, .22], [.4, .8], [.55, .22], [.7, .78], [.85, .25], [1, .5]], .01, .015), R.int(40, 55), { noise: .018 }); lines = [{ y: cs.base + cs.range * .8, color: TV.lineLvl, label: 'Widerstand' }, { y: cs.base + cs.range * .22, color: TV.lineLvl, label: 'Unterstützung' }]; }
  else if (t === 'fomo') { cs = pathCandles(jitter([[0, .1], [.45, .18], [.65, .32], [1, 1]], .02, .03), 55, { noise: .025, range: R.rand(14, 22) }); rsi = true; }
  else if (t === 'knife') { cs = pathCandles(jitter(flipA([[0, .1], [.4, .25], [.6, .4], [1, 1]]), .02, .03), 50, { noise: .025, range: R.rand(12, 20) }); rsi = true; }
  else cs = pathCandles(jitter([[0, .5], [.15, .62], [.3, .42], [.45, .58], [.6, .45], [.75, .55], [.9, .47], [1, .52]], .03, .05), R.int(40, 55), { noise: .04 });
  if (!cs[0].v) addVolume(cs);
  return { t, cs, lines, rsi, best: T.best, name, why };
}
function simStats() { return S.sim || (S.sim = { R: 0, trades: 0, wins: 0, dec: 0, decPts: 0 }); }
function simHeader() { return `<div class="sbar"><button class="ghost" id="back">✕</button><span class="mode">🕹️ Chart-Simulator</span></div>` + simStatsHtml(); }
function simStatsHtml() {
  const s = simStats(), wr = s.trades ? Math.round(s.wins / s.trades * 100) : 0, q = s.dec ? Math.round(s.decPts / s.dec * 100) : 0;
  return `<div class="simstats"><div><b class="${s.R >= 0 ? 'pos' : 'neg'}">${s.R >= 0 ? '+' : ''}${fmt0(s.R)} R</b><span>Übungskonto</span></div><div><b>${s.trades}</b><span>Trades</span></div><div><b>${wr} %</b><span>Trefferquote</span></div><div><b>${q} %</b><span>gute Entscheidungen</span></div></div>`;
}
function simStart() {
  stopModes(); cur = null; filter = null;
  const sc = simScenario(), full = sc.cs, n = full.length, startN = Math.floor(n * .55);
  SIMS = { sc, shown: startN, phase: 'play' };
  let lo = Infinity, hi = -Infinity; full.forEach(k => { lo = Math.min(lo, k.l); hi = Math.max(hi, k.h); }); sc.lines.forEach(l => { lo = Math.min(lo, l.y); hi = Math.max(hi, l.y); });
  SIMS.yr = [lo, hi];
  view.innerHTML = simHeader() + `<section class="card task has-vis sim"><div class="tag">🕹️ Live-Chart · ${R.pick(['M1', 'M5', 'M15'])}</div>
    <div class="tmain"><div class="q" id="simq">Beobachte den Chart … gleich musst du entscheiden.</div><div class="vis" id="simvis"></div></div>
    <div class="tside"><div class="opts" id="simbtn">${['🟢 Long kaufen', '🔴 Short gehen', '⏸️ Abwarten / nichts tun'].map((t, i) => `<button class="opt" data-i="${i}" disabled><kbd>${i + 1}</kbd><span>${t}</span></button>`).join('')}</div>
    <p class="hint">Bei Long/Short setzt der Simulator automatisch: Stop = 1,5 × durchschnittliche Kerzengröße, Ziel = 2 × Stop-Abstand (CRV 2).</p><div id="fb"></div></div></section>`;
  $('#back').onclick = () => { stopModes(); setTab('home'); };
  simDraw();
  SIMS.anim = setInterval(() => {
    if (!SIMS) return;
    SIMS.shown++; simDraw();
    if (SIMS.shown >= n) { clearInterval(SIMS.anim); SIMS.anim = null; SIMS.phase = 'decide'; $('#simq').innerHTML = '<b>Jetzt entscheiden:</b> Was machst du an der aktuellen (rechten) Kerze?'; view.querySelectorAll('#simbtn .opt').forEach(b => { b.disabled = false; b.onclick = () => simDecide(+b.dataset.i); }); }
  }, 140);
}
function simDraw(extra) {
  const sc = SIMS.sc, cs = extra ? extra.cs : sc.cs.slice(0, SIMS.shown);
  const rsi = sc.rsi ? RSI(cs.map(x => x.c)) : null;
  $('#simvis').innerHTML = renderChart({ candles: cs, lines: (extra ? extra.lines : []).concat(sc.lines), volume: true, rsi, height: DEV === 'phone' ? 250 : undefined, yr: extra ? null : SIMS.yr, padRight: extra ? 0 : sc.cs.length - SIMS.shown, highlight: extra && extra.from != null ? [extra.from, cs.length - 1] : null });
}
function simDecide(i) {
  if (!SIMS || SIMS.phase !== 'decide') return; SIMS.phase = 'result';
  const sc = SIMS.sc, choice = ['long', 'short', 'wait'][i], cs = sc.cs, n = cs.length, last = cs[n - 1];
  view.querySelectorAll('#simbtn .opt').forEach((b, j) => { b.disabled = true; if (j === i) b.classList.add('sel'); });
  const atr = cs.slice(-14).reduce((s, k) => s + (k.h - k.l), 0) / 14, dist = 1.5 * atr, E = last.c;
  const tradeDir = choice === 'long' ? 1 : choice === 'short' ? -1 : 0, bestDir = sc.best === 'long' ? 1 : sc.best === 'short' ? -1 : 0;
  const simDir = tradeDir || bestDir || (R.chance(.5) ? 1 : -1); // was beim Nichtstun gezeigt wird
  let p = tradeDir ? (sc.best === 'wait' ? .42 : tradeDir === bestDir ? .65 : .3) : (bestDir ? .65 : .5);
  const success = Math.random() < p, drift = (success ? simDir : -simDir);
  const stop = E - simDir * dist, target = E + simDir * 2 * dist;
  const out = cs.map(k => ({ ...k })); let q = E, res = null;
  for (let k = 0; k < 30 && !res; k++) {
    const o = q + R.gauss() * atr * .15, c = o + drift * dist * R.rand(.1, .45) + R.gauss() * atr * .35;
    const h = Math.max(o, c) + Math.abs(R.gauss()) * atr * .3, l = Math.min(o, c) - Math.abs(R.gauss()) * atr * .3;
    out.push({ o, h, l, c, v: R.rand(800, 1600) }); q = c;
    const hitStop = simDir > 0 ? l <= stop : h >= stop, hitTgt = simDir > 0 ? h >= target : l <= target;
    if (hitStop) res = -1; else if (hitTgt) res = 2;
  }
  if (res === null) res = Math.round((q - E) / dist * simDir * 10) / 10;
  const lines = [{ y: E, color: TV.lineEntry, label: tradeDir ? 'Einstieg' : 'Hier', dash: false }, { y: stop, color: TV.lineStop, label: 'Stop' }, { y: target, color: TV.lineTarget, label: 'Ziel' }];
  // Animation der Auflösung
  let k = n;
  SIMS.anim = setInterval(() => {
    if (!SIMS) return;
    k++; simDraw({ cs: out.slice(0, k), lines, from: n });
    if (k >= out.length) { clearInterval(SIMS.anim); SIMS.anim = null; simResult(choice, tradeDir, res); }
  }, 120);
}
function simResult(choice, tradeDir, res) {
  const sc = SIMS.sc, s = simStats();
  const goodDec = choice === sc.best, okDec = choice === 'wait' && sc.best !== 'wait';
  s.dec++; s.decPts += goodDec ? 1 : okDec ? .5 : 0;
  if (tradeDir) { s.trades++; s.R = Math.round((s.R + res) * 10) / 10; if (res > 0) s.wins++; }
  save();
  const bestTxt = { long: '🟢 Long', short: '🔴 Short', wait: '⏸️ Abwarten' }[sc.best];
  const resTxt = tradeDir ? (res >= 2 ? '🎯 Ziel erreicht: <b>+2 R</b>' : res <= -1 ? '🛑 Stop ausgelöst: <b>−1 R</b>' : `⏹️ Nach 30 Kerzen geschlossen: <b>${res >= 0 ? '+' : ''}${fmt0(res)} R</b>`)
    : `Du hast nicht gehandelt: <b>0 R</b>. ${sc.best !== 'wait' ? `Mit ${bestTxt} wärst du bei <b>${res >= 0 ? '+' : ''}${fmt0(res)} R</b> gelandet.` : `Ein Trade in Richtung der Bewegung hätte ${res >= 0 ? '+' : ''}${fmt0(res)} R gebracht – aber ohne Setup war das reines Glücksspiel.`}`;
  let lesson;
  if (goodDec && tradeDir && res < 0) lesson = '💡 <b>Richtige Entscheidung, trotzdem verloren.</b> Auch gute Setups scheitern oft (hier ca. jedes dritte). Genau dafür gibt es den Stop – auf lange Sicht zahlt sich der Prozess aus.';
  else if (!goodDec && !okDec && tradeDir && res > 0) lesson = '🍀 <b>Glück gehabt.</b> Das Ergebnis war gut, die Entscheidung nicht. Wer so weiter handelt, verliert langfristig – bewerte deine Entscheidung, nicht das Ergebnis.';
  else if (goodDec) lesson = '👍 <b>Lehrbuch-Entscheidung.</b>';
  else if (okDec) lesson = '🟡 <b>Vertretbar.</b> Abwarten ist nie ein Fehler – aber hier gab es ein sauberes Setup.';
  else lesson = `❌ <b>Nicht nach Lehrbuch.</b> Besser wäre: ${bestTxt}.`;
  $('#fb').innerHTML = `<div class="fb ${goodDec ? 'ok' : okDec ? 'part' : 'bad'}"><div class="fh">${resTxt}</div><p>${lesson}</p>
    <p><b>Situation: ${sc.name}</b> → Lehrbuch: ${bestTxt}<br><span class="hint">${sc.why}</span></p></div>
    <button class="go big nextbtn" id="simnext">Nächster Chart →</button>`;
  $('#simnext').onclick = simStart; $('#simnext').focus({ preventScroll: true });
  const st = $('.simstats'); if (st) st.outerHTML = simStatsHtml();
  if (DEV === 'phone') $('#fb').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('keydown', e => {
  if (document.querySelector('.modal')) return;
  if (BL && /^[1-4]$/.test(e.key)) { const b = view.querySelectorAll('.opt')[+e.key - 1]; if (b && !b.disabled) blitzAnswer(+e.key - 1); }
  if (SIMS) {
    if (SIMS.phase === 'decide' && /^[1-3]$/.test(e.key)) simDecide(+e.key - 1);
    else if (SIMS.phase === 'result' && e.key === 'Enter' && $('#simnext')) { e.preventDefault(); simStart(); }
  }
});
