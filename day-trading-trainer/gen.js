/* =========================================================
   Aufgaben-Generatoren: jeder Skill erzeugt unendlich viele Varianten
   Rückgabe MC:  { q, visual, options, correct, ok?, explain, keepOrder? }
   Rückgabe Zahl:{ type:'num', q, visual, answer, tol, unit, explain }
   ========================================================= */
const SKILLS = {};
function skill(id, mod, name, lesson, gen) { SKILLS[id] = { id, mod, name, lesson, gen }; }
const TV = { lineEntry: '#60a5fa', lineStop: '#f87171', lineTarget: '#4ade80', lineLvl: '#f5c542' };
const OPT3 = ['🟢 Long kaufen', '🔴 Short gehen', '⏸️ Abwarten / nichts tun'];

/* ---------- Chart-Bausteine ---------- */
const A = {
  down: [[0, .9], [.25, .65], [.38, .72], [.6, .42], [.7, .5], [1, .12]],
  up: [[0, .1], [.15, .35], [.25, .25], [.42, .55], [.52, .45], [.7, .75], [.8, .65], [1, .95]],
  side: [[0, .5], [.12, .68], [.25, .35], [.4, .66], [.55, .36], [.7, .64], [.85, .38], [1, .52]],
  doublebottom: [[0, .9], [.22, .12], [.38, .55], [.58, .12], [.8, .55], [.88, .5], [1, .8]],
  ihs: [[0, .92], [.14, .4], [.25, .62], [.42, .08], [.58, .62], [.72, .4], [.85, .62], [1, .85]],
  asctri: [[0, .1], [.14, .75], [.28, .32], [.42, .75], [.55, .5], [.67, .75], [.77, .62], [.87, .75], [1, .97]],
  symtri: [[0, .5], [.1, .95], [.24, .08], [.38, .82], [.52, .24], [.65, .68], [.77, .38], [.86, .56], [1, .9]],
  bullflag: [[0, .05], [.35, .82], [.45, .7], [.52, .78], [.62, .64], [.7, .72], [.79, .6], [.87, .68], [1, .98]],
  rectangle: [[0, .5], [.1, .8], [.22, .22], [.35, .8], [.48, .22], [.62, .8], [.76, .22], [.9, .78], [1, .55]],
  fallingwedge: [[0, .98], [.12, .5], [.25, .82], [.38, .36], [.5, .62], [.62, .27], [.73, .46], [.83, .24], [1, .62]]
};
function trendChart(kind) {
  const an = kind === 'up' ? A.up : kind === 'down' ? flipA(A.up) : A.side;
  return pathCandles(jitter(an, .02, .04), R.int(40, 55), { noise: .03 });
}

/* Kerzenmuster */
function buildPattern(key) {
  const bearMap = { shootingstar: 'hammer', hangingman: 'invhammer', bearengulf: 'bullengulf', eveningstar: 'morningstar', crows: 'soldiers' };
  const base = bearMap[key] || key, flip = !!bearMap[key];
  let ctxA = jitter(A.down, .02, .04);
  if (key === 'doji' || key === 'spinningtop') ctxA = R.chance(.5) ? ctxA : flipA(ctxA);
  const ctx = pathCandles(ctxA, R.int(16, 22), { noise: .03 });
  const u = ctx.range * R.rand(.075, .1), p = ctx[ctx.length - 1].c;
  let pat = [];
  const body = u * R.rand(.3, .45);
  if (base === 'hammer') {
    const o = p - u * .15, c = R.chance(.6) ? o + body : o - body;
    pat = [{ o, c, h: Math.max(o, c) + body * R.rand(0, .15), l: Math.min(o, c) - body * R.rand(2.6, 3.6) }];
  } else if (base === 'invhammer') {
    const o = p - u * .25, c = R.chance(.5) ? o + body : o - body;
    pat = [{ o, c, h: Math.max(o, c) + body * R.rand(2.6, 3.6), l: Math.min(o, c) - body * R.rand(0, .15) }];
  } else if (base === 'bullengulf') {
    const o1 = p + u * .05, c1 = o1 - u * R.rand(.45, .7), o2 = c1 - u * .1, c2 = o1 + u * R.rand(.35, .7);
    pat = [mk(o1, c1, u * .08, u * .1), mk(o2, c2, u * .1, u * .08)];
  } else if (base === 'morningstar') {
    const o1 = p, c1 = p - u * R.rand(1.4, 1.9), o2 = c1 - u * .3, c2 = o2 + (R.chance(.5) ? 1 : -1) * u * .12;
    const o3 = Math.max(o2, c2) + u * .08, c3 = c1 + (o1 - c1) * R.rand(.6, .9);
    pat = [mk(o1, c1, u * .1, u * .1), mk(o2, c2, u * .2, u * .2), mk(o3, c3, u * .1, u * .08)];
  } else if (base === 'soldiers') {
    let o = p;
    for (let i = 0; i < 3; i++) { const c = o + u * R.rand(1, 1.35); pat.push(mk(o, c, u * .07, u * .07)); o = c - (c - o) * R.rand(.15, .35); }
  } else if (key === 'doji') {
    const o = p + R.rand(-.1, .1) * u, c = o + R.rand(-.025, .025) * u;
    pat = [mk(o, c, u * R.rand(.7, 1.3), u * R.rand(.7, 1.3))];
  } else if (key === 'spinningtop') {
    const o = p, c = o + (R.chance(.5) ? 1 : -1) * u * R.rand(.22, .32);
    pat = [mk(o, c, u * R.rand(.6, .9), u * R.rand(.6, .9))];
  }
  let all = ctx.concat(pat);
  if (flip) all = flipCandles(all, ctx.base + ctx.range / 2);
  return { candles: all, highlight: [ctx.length, all.length - 1] };
}

/* Formationen */
function buildForm(key) {
  const map = { doubletop: ['doublebottom', 1], doublebottom: ['doublebottom', 0], hs: ['ihs', 1], ihs: ['ihs', 0], asctri: ['asctri', 0], desctri: ['asctri', 1], symtri: ['symtri', R.chance(.5)], bullflag: ['bullflag', 0], bearflag: ['bullflag', 1], rectangle: ['rectangle', R.chance(.5)], fallingwedge: ['fallingwedge', 0], risingwedge: ['fallingwedge', 1] };
  const [b, f] = map[key];
  let an = jitter(A[b], .012, .025);
  if (f) an = flipA(an);
  return pathCandles(an, R.int(46, 60), { noise: .022, wick: .018 });
}

/* Range + Ausbruch mit Volumen */
function breakoutChart(strongVol) {
  const cs = pathCandles(jitter([[0, .12], [.12, .55], [.24, .3], [.38, .6], [.5, .35], [.64, .6], [.76, .4], [.9, .56], [1, .52]], .01, .02), R.int(34, 42), { noise: .02 });
  const line = cs.base + cs.range * .62, u = cs.range * .08;
  cs.forEach(k => { const lim = line - u * .08; if (k.c > lim) k.c = lim - R.rand(0, u * .2); if (k.o > lim) k.o = lim - R.rand(0, u * .2); k.h = Math.min(Math.max(k.h, k.o, k.c), line + u * .15); });
  const last = cs[cs.length - 1], o = last.c, c = line + u * R.rand(.9, 1.5);
  cs.push({ o, c, h: c + u * .2, l: o - u * .15 });
  addVolume(cs, u);
  const av = avgVol(cs, 0, cs.length - 1);
  cs[cs.length - 1].v = av * (strongVol ? R.rand(2.6, 4) : R.rand(.45, .75));
  return { cs, line };
}

/* ---------- Begriffe ---------- */
function termLesson(T) { return `<div class="lesson-term"><div class="big">${T.w}</div><p>${T.d}</p><div class="ex"><b>Beispiel:</b> ${T.ex}</div></div>`; }
TERMS.forEach(T => {
  skill('t:' + T.id, 't', T.w, () => termLesson(T), () => {
    const same = TERMS.filter(x => x.cat === T.cat && x.id !== T.id), other = TERMS.filter(x => x.id !== T.id);
    const dis = R.shuffle(same.length >= 3 ? same : other).slice(0, 3);
    if (R.chance(.5)) {
      return { q: `Was bedeutet <b>„${T.w}“</b>?`, options: [T.d, ...dis.map(x => x.d)], correct: 0, explain: termLesson(T), small: true };
    }
    const fw = T.w.split(' ')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hidden = fw.length >= 4 ? T.d.replace(new RegExp(fw, 'gi'), '…') : T.d;
    return { q: `Welcher Begriff passt?<div class="quote">${hidden}</div>`, options: [T.w, ...dis.map(x => x.w)], correct: 0, explain: termLesson(T) };
  });
});

/* ---------- Chart-Basics ---------- */
skill('b:ohlc', 'b', 'Kerze lesen: Open, High, Low, Close',
  () => `<p>Jede Kerze zeigt 4 Preise eines Zeitraums:</p><div class="two">${renderSingleCandle(true, { high: 'H', top: 'C', bot: 'O', low: 'L' })}${renderSingleCandle(false, { high: 'H', top: 'O', bot: 'C', low: 'L' })}</div>
  <ul><li><b>Grün</b> = gestiegen: Open unten, Close oben.</li><li><b>Rot</b> = gefallen: Open oben, Close unten.</li><li><b>High</b> = oberes Docht-Ende, <b>Low</b> = unteres Docht-Ende.</li></ul><p class="tip">Merksatz: Die Kerze „startet“ beim Open und „endet“ beim Close. Grün läuft von unten nach oben, Rot von oben nach unten.</p>`,
  () => {
    const up = R.chance(.5), letters = R.shuffle(['A', 'B', 'C', 'D']);
    const lab = { high: letters[0], top: letters[1], bot: letters[2], low: letters[3] };
    const visual = renderSingleCandle(up, lab);
    if (R.chance(.2)) return { q: 'Ist der Kurs während dieser Kerze gestiegen oder gefallen?', visual, options: ['Gestiegen', 'Gefallen'], correct: up ? 0 : 1, keepOrder: true, explain: up ? 'Grüne Kerze = Schluss über Eröffnung = gestiegen.' : 'Rote Kerze = Schluss unter Eröffnung = gefallen.' };
    const what = R.pick(['open', 'close', 'high', 'low']);
    const pos = what === 'high' ? 'high' : what === 'low' ? 'low' : (what === 'open') === up ? 'bot' : 'top';
    const names = { open: 'Eröffnungskurs (Open)', close: 'Schlusskurs (Close)', high: 'Hoch (High)', low: 'Tief (Low)' };
    const ans = lab[pos];
    return { q: `Wo ist der <b>${names[what]}</b> dieser Kerze?`, visual, options: ['A', 'B', 'C', 'D'], correct: ['A', 'B', 'C', 'D'].indexOf(ans), keepOrder: true,
      explain: `Die Kerze ist <b>${up ? 'grün (gestiegen)' : 'rot (gefallen)'}</b>. ${up ? 'Bei Grün: Open unten am Körper, Close oben.' : 'Bei Rot: Open oben am Körper, Close unten.'} High/Low sind immer die Docht-Enden. Richtig ist <b>${ans}</b>.` };
  });

skill('b:trend', 'b', 'Trend erkennen',
  () => `<p><b>Aufwärtstrend:</b> höhere Hochs und höhere Tiefs (Treppe nach oben).</p>${renderChart({ candles: trendChart('up'), height: 180 })}<p><b>Abwärtstrend:</b> tiefere Hochs und tiefere Tiefs.</p><p><b>Seitwärts:</b> Kurs pendelt ohne Richtung.</p><p class="tip">Regel: Mit dem Trend handeln ist für Anfänger viel einfacher als dagegen.</p>`,
  () => {
    const k = R.pick(['up', 'down', 'side']);
    return { q: 'Welcher Trend ist hier zu sehen?', visual: renderChart({ candles: trendChart(k) }), options: ['📈 Aufwärtstrend', '📉 Abwärtstrend', '↔️ Seitwärts'], correct: ['up', 'down', 'side'].indexOf(k), keepOrder: true,
      explain: { up: 'Höhere Hochs und höhere Tiefs → Aufwärtstrend. Hier sucht man eher Long-Einstiege an Rücksetzern.', down: 'Tiefere Hochs und tiefere Tiefs → Abwärtstrend. Long-Käufe sind hier gegen den Trend.', side: 'Kein klares höheres/tieferes Hoch – der Kurs pendelt in einer Zone → seitwärts. Hier lieber Ausbruch abwarten.' }[k] };
  });

skill('b:sr', 'b', 'Unterstützung & Widerstand finden',
  () => `<p><b>Unterstützung</b> = Boden: hier prallte der Kurs mehrmals nach OBEN ab.</p><p><b>Widerstand</b> = Decke: hier prallte der Kurs mehrmals nach UNTEN ab.</p><p class="tip">Je öfter eine Zone berührt wurde, desto wichtiger ist sie. Sie ist eher eine Zone als eine exakte Linie.</p>`,
  () => {
    const cs = pathCandles(jitter(A.rectangle, .01, .015), R.int(45, 55), { noise: .018, wick: .015 });
    const sup = cs.base + cs.range * .22, res = cs.base + cs.range * .8, mid = cs.base + cs.range * R.pick([.5, 1.02, -.02]);
    const L = R.shuffle(['A', 'B', 'C']);
    const lines = [{ y: res, label: L[0] }, { y: sup, label: L[1] }, { y: mid, label: L[2] }].map(l => ({ ...l, color: TV.lineLvl }));
    const askSup = R.chance(.5), ans = askSup ? L[1] : L[0];
    return { q: `Welche Linie ist die <b>${askSup ? 'Unterstützung (Support)' : 'Widerstand (Resistance)'}</b>?`, visual: renderChart({ candles: cs, lines }), options: ['A', 'B', 'C'], correct: ['A', 'B', 'C'].indexOf(ans), keepOrder: true,
      explain: `Linie <b>${L[1]}</b> ist die Unterstützung (Kurs prallte dort mehrmals nach oben ab), Linie <b>${L[0]}</b> der Widerstand (Kurs scheiterte dort mehrmals). Linie ${L[2]} wurde nicht mehrfach getestet.` };
  });

skill('b:break', 'b', 'Ausbruch, Retest oder Fehlausbruch?',
  () => `<ul><li><b>Ausbruch + Retest:</b> Kurs schließt über dem Widerstand, kommt zurück, die Linie hält als neue Unterstützung → stark.</li><li><b>Fehlausbruch:</b> Kurs sticht kurz drüber, fällt aber zurück in die Range → Falle.</li><li><b>Noch kein Ausbruch:</b> Kurs bleibt unter der Linie.</li></ul><p class="tip">Darum warten Profis oft auf den SCHLUSS der Kerze über der Linie – nicht nur auf einen kurzen Docht.</p>`,
  () => {
    const k = R.pick(['retest', 'fake', 'none']);
    const tail = { retest: [[.66, .88], [.77, .64], [.87, .72], [1, .98]], fake: [[.63, .74], [.68, .58], [.8, .42], [1, .32]], none: [[.66, .4], [.78, .56], [.9, .4], [1, .54]] }[k];
    const an = [[0, .3], [.1, .58], [.2, .35], [.32, .58], [.44, .38], [.56, .58]].concat(tail);
    const cs = pathCandles(an, R.int(46, 56), { noise: .018, wick: .015 });
    const line = cs.base + cs.range * .6;
    return { q: 'Was ist am Widerstand (gelbe Linie) passiert?', visual: renderChart({ candles: cs, lines: [{ y: line, color: TV.lineLvl, label: 'Widerstand' }] }), options: ['Echter Ausbruch mit Retest', 'Fehlausbruch (Falle)', 'Noch kein Ausbruch'], correct: ['retest', 'fake', 'none'].indexOf(k), keepOrder: true,
      explain: { retest: 'Kurs ist klar darüber gelaufen, zurückgekommen und die Linie hat als Unterstützung gehalten (Rollentausch) → echter Ausbruch mit Retest.', fake: 'Kurs war kurz über der Linie, ist aber schnell zurück in die Range gefallen → Fehlausbruch. Wer blind gekauft hat, sitzt im Verlust.', none: 'Der Kurs hat den Widerstand noch nicht überwunden → noch kein Ausbruch, abwarten.' }[k] };
  });

/* ---------- Kerzenmuster ---------- */
Object.entries(CANDLES).forEach(([key, C]) => {
  const lesson = () => { const p = buildPattern(key); return `${renderChart({ ...p, height: 200 })}<p><b>Aussehen:</b> ${C.look}</p><p><b>Wo:</b> ${C.ctx}</p><p><b>Bedeutung:</b> ${C.mean}</p><p class="tip">Signal: ${SIG_TXT[C.sig]}. Kerzenmuster sind Hinweise, keine Garantie – am besten an Unterstützung/Widerstand und mit Bestätigung.</p>`; };
  skill('c:' + key, 'c', C.name, lesson, () => {
    const p = buildPattern(key), visual = renderChart(p);
    const ex = `<b>${C.name}</b>: ${C.look} ${C.mean}`;
    if (R.chance(.3)) return { q: 'Ist das markierte Muster eher bullisch, bärisch oder neutral?', visual, options: ['🟢 Bullisch', '🔴 Bärisch', '⚪ Neutral'], correct: ['bull', 'bear', 'neutral'].indexOf(C.sig), keepOrder: true, explain: ex };
    const keys = Object.keys(CANDLES).filter(k => k !== key);
    const pref = { hammer: ['hangingman', 'invhammer', 'shootingstar'], hangingman: ['hammer', 'shootingstar', 'invhammer'], shootingstar: ['invhammer', 'hangingman', 'hammer'], invhammer: ['shootingstar', 'hammer', 'hangingman'], doji: ['spinningtop'], spinningtop: ['doji'], bullengulf: ['bearengulf', 'morningstar'], bearengulf: ['bullengulf', 'eveningstar'], morningstar: ['eveningstar', 'bullengulf'], eveningstar: ['morningstar', 'bearengulf'], soldiers: ['crows'], crows: ['soldiers'] }[key] || [];
    const dis = R.shuffle(pref).slice(0, 2); R.shuffle(keys).forEach(k => { if (dis.length < 3 && !dis.includes(k)) dis.push(k); });
    return { q: 'Welches Kerzenmuster ist markiert?', visual, options: [C.name, ...dis.map(k => CANDLES[k].name)], correct: 0, explain: ex + (['hammer', 'hangingman', 'shootingstar', 'invhammer'].includes(key) ? '<br><span class="tip">Tipp: Hammer & Hanging Man sehen gleich aus – entscheidend ist, ob vorher ein Abwärts- oder Aufwärtstrend war.</span>' : '') };
  });
});

/* ---------- Formationen ---------- */
Object.entries(FORMS).forEach(([key, F]) => {
  skill('f:' + key, 'f', F.name, () => `${renderChart({ candles: buildForm(key), height: 200 })}<p><b>Aussehen:</b> ${F.look}</p><p><b>Bedeutung:</b> ${F.mean}</p><p class="tip">Erwartung: ${SIG_TXT[F.sig]}. Formationen gelten erst mit Ausbruch als bestätigt.</p>`, () => {
    const visual = renderChart({ candles: buildForm(key) });
    const ex = `<b>${F.name}</b>: ${F.look} ${F.mean}`;
    if (R.chance(.3)) return { q: `Das ist ein(e) <b>${F.name}</b>. Was wird danach typischerweise erwartet?`, visual, options: ['📈 Eher steigende Kurse', '📉 Eher fallende Kurse', '↔️ Offen – Ausbruch abwarten'], correct: ['bull', 'bear', 'neutral'].indexOf(F.sig), keepOrder: true, explain: ex };
    const pref = { doubletop: ['hs', 'doublebottom'], doublebottom: ['ihs', 'doubletop'], hs: ['doubletop', 'ihs'], ihs: ['doublebottom', 'hs'], asctri: ['symtri', 'desctri'], desctri: ['symtri', 'asctri'], symtri: ['asctri', 'rectangle'], bullflag: ['bearflag', 'fallingwedge'], bearflag: ['bullflag', 'risingwedge'], rectangle: ['symtri', 'doubletop'], risingwedge: ['fallingwedge', 'bearflag'], fallingwedge: ['risingwedge', 'bullflag'] }[key];
    const dis = pref.slice(); R.shuffle(Object.keys(FORMS)).forEach(k => { if (k !== key && dis.length < 3 && !dis.includes(k)) dis.push(k); });
    return { q: 'Welche Chartformation siehst du?', visual, options: [F.name, ...dis.map(k => FORMS[k].name)], correct: 0, explain: ex };
  });
});

/* ---------- Indikatoren ---------- */
skill('i:rsi', 'i', 'RSI lesen', () => `<p>Der <b>RSI</b> läuft von 0 bis 100 (unteres Fenster).</p><ul><li>über 70 = <b>überkauft</b> (sehr schnell gestiegen)</li><li>unter 30 = <b>überverkauft</b> (sehr schnell gefallen)</li><li>dazwischen = neutral</li></ul><p class="tip">Überkauft heißt NICHT automatisch „verkaufen“! In starken Trends bleibt der RSI lange extrem. Er warnt nur: nicht hinterherspringen.</p>`, () => {
  const k = R.pick(['over', 'under', 'neutral']); let cs, rsi, v;
  for (let t = 0; t < 60; t++) {
    let an = k === 'neutral' ? jitter(A.side, .02, .04) : jitter([[0, .3], [.3, .42], [.55, .3], [.72, .42], [1, 1]], .02, .03);
    if (k === 'under') an = flipA(an);
    cs = pathCandles(an, 60, { noise: .025 }); rsi = RSI(cs.map(x => x.c)); v = rsi[rsi.length - 1];
    if ((k === 'over' && v > 72) || (k === 'under' && v < 28) || (k === 'neutral' && v > 38 && v < 62)) break;
  }
  return { q: 'Was zeigt der RSI am rechten Rand an?', visual: renderChart({ candles: cs, rsi }), options: ['Überkauft (über 70)', 'Überverkauft (unter 30)', 'Neutral (30–70)'], correct: ['over', 'under', 'neutral'].indexOf(k), keepOrder: true,
    explain: `Der RSI steht bei <b>${fmt(v, 0)}</b>. ${k === 'over' ? 'Über 70 = überkauft: Der Kurs ist sehr schnell gestiegen. Jetzt hinterherzukaufen ist riskant (FOMO).' : k === 'under' ? 'Unter 30 = überverkauft: Der Kurs ist sehr schnell gefallen. Eine Erholung ist möglich, aber kein sicheres Kaufsignal.' : 'Zwischen 30 und 70 = neutral, kein Extrem.'}` };
});
skill('i:matrend', 'i', 'Kurs vs. gleitender Durchschnitt', () => `<p>Ein <b>gleitender Durchschnitt</b> glättet den Kurs.</p><ul><li>Kurs über steigendem Durchschnitt → Aufwärtstrend, eher Long</li><li>Kurs unter fallendem Durchschnitt → Abwärtstrend, eher Short/kein Long</li><li>Kurs kreuzt ständig einen flachen Durchschnitt → kein Trend</li></ul>`, () => {
  const k = R.pick(['up', 'down', 'side']), cs = trendChart(k), ema = EMA(cs.map(x => x.c), 20);
  return { q: 'Kurs und EMA 20 (blau): Was sagt dir das?', visual: renderChart({ candles: cs, overlays: [{ values: ema, color: '#60a5fa', label: 'EMA 20' }] }), options: ['Aufwärtstrend – eher Long suchen', 'Abwärtstrend – keine Longs, eher Short', 'Kein Trend – abwarten'], correct: ['up', 'down', 'side'].indexOf(k), keepOrder: true,
    explain: { up: 'Der Kurs bleibt meist ÜBER dem steigenden EMA → Aufwärtstrend.', down: 'Der Kurs bleibt meist UNTER dem fallenden EMA → Abwärtstrend.', side: 'Der EMA ist flach und der Kurs kreuzt ihn ständig → kein Trend.' }[k] };
});
skill('i:macross', 'i', 'Golden Cross / Death Cross', () => `<p>Zwei Durchschnitte: ein <b>schneller</b> (EMA 9) und ein <b>langsamer</b> (EMA 21).</p><ul><li>Schnell kreuzt langsam <b>nach oben</b> → Golden Cross (bullisch)</li><li>Schnell kreuzt langsam <b>nach unten</b> → Death Cross (bärisch)</li></ul><p class="tip">Kreuzungen kommen immer etwas verspätet und liefern in Seitwärtsphasen viele Fehlsignale.</p>`, () => {
  const golden = R.chance(.5); let cs, f, s, cross = -1;
  for (let t = 0; t < 40 && cross < 0; t++) {
    let an = jitter([[0, .85], [.45, .15], [.55, .2], [1, .95]], .04, .05); if (!golden) an = flipA(an);
    cs = pathCandles(an, 70, { noise: .025 }); const c = cs.map(x => x.c); f = EMA(c, 9); s = EMA(c, 21);
    for (let i = 30; i < 66; i++) if (f[i - 1] != null && s[i - 1] != null && Math.sign(f[i] - s[i]) !== Math.sign(f[i - 1] - s[i - 1])) { if ((f[i] > s[i]) === golden) cross = i; }
  }
  const off = 15, view = cs.slice(off);
  return { q: 'Welches Signal entsteht im Kreis?', visual: renderChart({ candles: view, overlays: [{ values: f.slice(off), color: '#f5c542', label: 'EMA 9 (schnell)' }, { values: s.slice(off), color: '#60a5fa', label: 'EMA 21 (langsam)' }], markers: [{ i: cross - off, y: s[cross], color: '#fff' }] }), options: ['🟢 Golden Cross (bullisch)', '🔴 Death Cross (bärisch)'], correct: golden ? 0 : 1, keepOrder: true,
    explain: golden ? 'Der schnelle (gelbe) EMA kreuzt den langsamen (blauen) von unten nach oben → Golden Cross.' : 'Der schnelle (gelbe) EMA kreuzt den langsamen (blauen) von oben nach unten → Death Cross.' };
});
skill('i:volume', 'i', 'Volumen bestätigt Ausbruch?', () => `<p>Das <b>Volumen</b> (Balken unten) zeigt, wie viel gehandelt wurde.</p><ul><li>Ausbruch mit <b>deutlich höherem</b> Volumen als zuvor → viele machen mit, glaubwürdig</li><li>Ausbruch mit <b>niedrigem</b> Volumen → wenig Interesse, Fehlausbruch-Gefahr</li></ul>`, () => {
  const strong = R.chance(.5), { cs, line } = breakoutChart(strong);
  return { q: 'Der Kurs bricht über den Widerstand. Ist der Ausbruch durch das Volumen bestätigt?', visual: renderChart({ candles: cs, volume: true, lines: [{ y: line, color: TV.lineLvl, label: 'Widerstand' }], highlight: [cs.length - 1, cs.length - 1] }), options: ['✅ Ja – hohes Volumen', '⚠️ Nein – niedriges Volumen, Vorsicht'], correct: strong ? 0 : 1, keepOrder: true,
    explain: strong ? 'Der Volumenbalken der Ausbruchskerze ist mehrfach so hoch wie die vorherigen → viele Marktteilnehmer kaufen mit → bestätigter Ausbruch.' : 'Der Volumenbalken der Ausbruchskerze ist sogar KLEINER als üblich → wenig Interesse, hohes Risiko für einen Fehlausbruch.' };
});

/* ---------- Risiko-Rechnen ---------- */
const num = (q, answer, unit, tol, explain, visual) => ({ type: 'num', q, answer, unit, tol, explain, visual });
skill('r:risk_eur', 'r', 'Max. Verlust pro Trade', () => `<p class="formula">Max. Verlust = Kontogröße × Risiko-%</p><p>Beispiel: 5.000 € × 1 % = <b>50 €</b>.</p><p class="tip">Profis riskieren meist 0,5–1 %, maximal 2 % pro Trade.</p>`, () => {
  const K = R.pick([1000, 2000, 2500, 4000, 5000, 8000, 10000, 15000, 25000]), r = R.pick([0.5, 1, 1, 1, 1.5, 2]), a = K * r / 100;
  return num(`Dein Konto hat <b>${fmt0(K)} €</b>. Du riskierst <b>${fmt0(r)} %</b> pro Trade. Wie viel Euro darfst du maximal verlieren?`, a, '€', 0.01, `${fmt0(K)} € × ${fmt0(r)} % = ${fmt0(K)} × ${fmt0(r / 100)} = <b>${fmt(a)} €</b>`);
});
skill('r:pos_size', 'r', 'Positionsgröße berechnen', () => `<p class="formula">Stückzahl = max. Verlust ÷ Stop-Abstand</p><p>Stop-Abstand = Einstieg − Stop-Loss.</p><p>Beispiel: Risiko 50 €, Einstieg 40 €, Stop 39 € → 50 ÷ 1 = <b>50 Aktien</b>.</p><p class="tip">Immer ABrunden – sonst riskierst du mehr als geplant.</p>`, () => {
  const K = R.pick([2000, 5000, 10000, 20000]), r = R.pick([0.5, 1, 1, 2]), risk = K * r / 100;
  const E = Math.round(R.rand(12, 180) * 10) / 10, d = R.pick([0.25, 0.4, 0.5, 0.8, 1, 1.2, 1.5, 2, 2.5, 3]), S = Math.round((E - d) * 100) / 100;
  const n = Math.floor(risk / d + 1e-9);
  return num(`Konto <b>${fmt0(K)} €</b>, Risiko <b>${fmt0(r)} %</b>. Long-Einstieg bei <b>${fmt(E)} €</b>, Stop-Loss bei <b>${fmt(S)} €</b>. Wie viele Aktien kaufst du maximal?`, n, 'Stück', 0, `1) Max. Verlust: ${fmt0(K)} × ${fmt0(r)} % = ${fmt(risk)} €<br>2) Stop-Abstand: ${fmt(E)} − ${fmt(S)} = ${fmt(d)} €<br>3) ${fmt(risk)} ÷ ${fmt(d)} = ${fmt0(risk / d)} → abgerundet <b>${n} Aktien</b>`);
});
skill('r:crv', 'r', 'CRV berechnen', () => `<p class="formula">CRV = (Ziel − Einstieg) ÷ (Einstieg − Stop)</p><p>Beispiel: Einstieg 50, Stop 49, Ziel 53 → 3 ÷ 1 = <b>CRV 3</b>.</p><p class="tip">Unter 1,5 lohnt sich ein Trade meist nicht. Ab 2 wird es interessant.</p>`, () => {
  const E = Math.round(R.rand(15, 150) * 10) / 10, d = R.pick([0.5, 1, 1.5, 2, 0.8, 1.2]), c = R.pick([1, 1.5, 2, 2.5, 3, 4]);
  const S = E - d, T = E + d * c, short = R.chance(.25);
  if (short) return num(`<b>Short</b>-Einstieg bei <b>${fmt(E)} €</b>, Stop-Loss bei <b>${fmt(E + d)} €</b>, Kursziel <b>${fmt(E - d * c)} €</b>. Wie hoch ist das CRV?`, c, '', 0.05, `Beim Short ist alles gespiegelt: Chance = ${fmt(E)} − ${fmt(E - d * c)} = ${fmt(d * c)} €, Risiko = ${fmt(E + d)} − ${fmt(E)} = ${fmt(d)} € → CRV = <b>${fmt0(c)}</b>`);
  return num(`Long-Einstieg bei <b>${fmt(E)} €</b>, Stop-Loss bei <b>${fmt(S)} €</b>, Kursziel <b>${fmt(T)} €</b>. Wie hoch ist das CRV?`, c, '', 0.05, `Chance = ${fmt(T)} − ${fmt(E)} = ${fmt(d * c)} €<br>Risiko = ${fmt(E)} − ${fmt(S)} = ${fmt(d)} €<br>CRV = ${fmt(d * c)} ÷ ${fmt(d)} = <b>${fmt0(c)}</b> ${c < 1.5 ? '(eher zu niedrig!)' : c >= 2 ? '(gut)' : '(grenzwertig)'}`);
});
skill('r:stop_price', 'r', 'Stop-Loss-Preis berechnen', () => `<p class="formula">Long: Stop = Einstieg × (1 − Stop-%)<br>Short: Stop = Einstieg × (1 + Stop-%)</p><p>Beispiel Long: 80 € mit 2 % Stop → 80 × 0,98 = <b>78,40 €</b>.</p>`, () => {
  const E = Math.round(R.rand(20, 200) * 10) / 10, p = R.pick([1, 1.5, 2, 2.5, 3]), long = R.chance(.7), S = long ? E * (1 - p / 100) : E * (1 + p / 100);
  return num(`${long ? 'Long' : 'Short'}-Einstieg bei <b>${fmt(E)} €</b>. Dein Stop-Loss soll <b>${fmt0(p)} %</b> ${long ? 'darunter' : 'darüber'} liegen. Bei welchem Kurs liegt der Stop?`, S, '€', 0.015, `${fmt(E)} × ${long ? '(1 − ' : '(1 + '}${fmt0(p / 100)}) = ${fmt(E)} × ${fmt0(long ? 1 - p / 100 : 1 + p / 100)} = <b>${fmt(S)} €</b>${long ? '' : '<br>Beim Short liegt der Stop ÜBER dem Einstieg, weil steigende Kurse dein Verlust sind.'}`);
});
skill('r:pnl_long', 'r', 'Gewinn/Verlust Long', () => `<p class="formula">Ergebnis = Stückzahl × (Verkaufskurs − Kaufkurs)</p><p>Beispiel: 30 Aktien, gekauft 20 €, verkauft 21,50 € → 30 × 1,50 = <b>+45 €</b>.</p>`, () => {
  const n = R.pick([10, 20, 25, 40, 50, 80, 100, 150, 200]), b = Math.round(R.rand(10, 120) * 100) / 100, diff = R.pick([-1.5, -0.8, -0.5, -0.3, 0.4, 0.6, 1, 1.25, 2, 2.4]), s = Math.round((b + diff) * 100) / 100, a = n * (s - b);
  return num(`Du kaufst <b>${n} Aktien</b> zu <b>${fmt(b)} €</b> und verkaufst zu <b>${fmt(s)} €</b>. Wie hoch ist dein Gewinn bzw. Verlust (Verlust mit Minus)?`, a, '€', 0.011, `${n} × (${fmt(s)} − ${fmt(b)}) = ${n} × ${fmt(s - b)} = <b>${fmt(a)} €</b> (ohne Gebühren)`);
});
skill('r:pnl_short', 'r', 'Gewinn/Verlust Short', () => `<p class="formula">Short-Ergebnis = Stückzahl × (Verkaufskurs − Rückkaufkurs)</p><p>Beim Short verkaufst du ZUERST. Fällt der Kurs, kaufst du billiger zurück → Gewinn.</p><p>Beispiel: Short 50 Stück bei 30 €, Rückkauf 28 € → 50 × 2 = <b>+100 €</b>.</p>`, () => {
  const n = R.pick([10, 20, 30, 50, 100]), s = Math.round(R.rand(15, 120) * 100) / 100, diff = R.pick([-2, -1, -0.5, 0.5, 1, 1.5, 2.5]), b = Math.round((s + diff) * 100) / 100, a = n * (s - b);
  return num(`Du gehst <b>Short</b> mit <b>${n} Aktien</b> bei <b>${fmt(s)} €</b> und kaufst bei <b>${fmt(b)} €</b> zurück. Ergebnis in € (Verlust mit Minus)?`, a, '€', 0.011, `${n} × (${fmt(s)} − ${fmt(b)}) = <b>${fmt(a)} €</b>. ${a > 0 ? 'Kurs ist gefallen → Short gewinnt.' : 'Kurs ist gestiegen → Short verliert.'}`);
});
skill('r:leverage', 'r', 'Hebel-Wirkung', () => `<p class="formula">Veränderung deines Einsatzes = Hebel × Kursveränderung</p><p>Hebel 10, Kurs −5 % → dein Einsatz −50 %.</p><p class="tip">Ab Kursveränderung = 100 % ÷ Hebel ist dein Einsatz komplett weg (Hebel 20 → schon bei −5 %!).</p>`, () => {
  const h = R.pick([2, 5, 10, 20, 25, 50]), m = R.pick([0.5, 1, 2, 3, 4, 5]), up = R.chance(.4), a = (up ? 1 : -1) * h * m;
  return num(`Du handelst mit <b>Hebel ${h}</b>. Der Kurs ${up ? 'steigt' : 'fällt'} um <b>${fmt0(m)} %</b>. Um wie viel Prozent verändert sich dein Einsatz? (Verlust mit Minus)`, Math.max(a, -100), '%', 0.01, `${h} × ${up ? '+' : '−'}${fmt0(m)} % = <b>${fmt0(Math.max(a, -100))} %</b>${a <= -100 ? ' → Totalverlust (in der Praxis vorher Zwangsschließung).' : ''}`);
});
skill('r:spread', 'r', 'Spread-Kosten', () => `<p class="formula">Spread-Kosten = (Ask − Bid) × Stückzahl</p><p>Du kaufst zum Ask und verkaufst zum Bid – den Unterschied zahlst du immer.</p>`, () => {
  const bid = Math.round(R.rand(5, 150) * 100) / 100, sp = R.pick([0.01, 0.02, 0.03, 0.05, 0.08, 0.1, 0.15]), n = R.pick([50, 100, 200, 300, 500, 1000]), a = sp * n;
  return num(`Bid <b>${fmt(bid)} €</b>, Ask <b>${fmt(bid + sp)} €</b>. Du kaufst <b>${n} Aktien</b> und würdest sofort wieder verkaufen. Wie viel kostet dich allein der Spread?`, a, '€', 0.011, `Spread = ${fmt(bid + sp)} − ${fmt(bid)} = ${fmt(sp)} € × ${n} = <b>${fmt(a)} €</b>. Du startest also direkt mit diesem Minus.`);
});
skill('r:breakeven_wr', 'r', 'Nötige Trefferquote', () => `<p class="formula">Mindest-Trefferquote = 1 ÷ (1 + CRV) × 100 %</p><p>CRV 2 → 1 ÷ 3 = <b>33,3 %</b>. Du kannst also 2 von 3 Trades verlieren und kommst trotzdem auf ±0 (ohne Gebühren).</p>`, () => {
  const c = R.pick([0.5, 1, 1.5, 2, 3, 4]), a = 100 / (1 + c);
  return num(`Deine Trades haben im Schnitt ein <b>CRV von ${fmt0(c)}</b>. Wie viel Prozent deiner Trades musst du mindestens gewinnen, um nicht zu verlieren?`, a, '%', 0.6, `1 ÷ (1 + ${fmt0(c)}) × 100 = <b>${fmt(a, 1)} %</b>. ${c < 1 ? 'Bei schlechtem CRV brauchst du sehr viele Treffer – schwer!' : 'Gutes CRV = du musst nicht oft recht haben.'}`);
});
skill('r:rmult', 'r', 'Ergebnis in R', () => `<p class="formula">R-Ergebnis = Gewinn (oder Verlust) ÷ geplantes Risiko</p><p>Risiko 50 €, Gewinn 125 € → <b>+2,5 R</b>. Stop getroffen → −1 R.</p><p class="tip">In R zu denken macht Trades unabhängig von der Kontogröße vergleichbar.</p>`, () => {
  const r = R.pick([20, 25, 40, 50, 75, 100, 200]), m = R.pick([-1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3, 4]), g = r * m;
  return num(`Du hast <b>${fmt0(r)} €</b> riskiert. Der Trade endet mit <b>${g >= 0 ? '+' : ''}${fmt0(g)} €</b>. Wie viele R sind das?`, m, 'R', 0.01, `${fmt0(g)} ÷ ${fmt0(r)} = <b>${fmt0(m)} R</b>`);
});

/* ---------- Situationen ---------- */
function sit(id, name, rule, gen) { skill('s:' + id, 's', name, () => `<p>${rule}</p>`, () => { const g = gen(); g.explain = g.explain + `<div class="rule">📌 Regel: ${rule}</div>`; return g; }); }
const eur = x => fmt(x) + ' €';

sit('breakout_vol', 'Ausbruch mit Volumen', 'Ein Ausbruch über einen mehrfach getesteten Widerstand mit deutlich erhöhtem Volumen ist ein klassisches Long-Setup. Stop unter die Ausbruchszone.', () => {
  const { cs, line } = breakoutChart(true);
  return { q: 'Seitwärtsphase, Widerstand mehrfach getestet. Jetzt schließt eine Kerze klar darüber – mit hohem Volumen. Was machst du?', visual: renderChart({ candles: cs, volume: true, lines: [{ y: line, color: TV.lineLvl, label: 'Widerstand' }] }), options: OPT3, correct: 0, ok: [2], keepOrder: true, explain: `Lehrbuch-Setup: Schluss über dem Widerstand + hohes Volumen → <b>Long</b> möglich, Stop knapp unter ${eur(line)}. Auf einen Retest zu warten ist auch okay (sicherer, aber man verpasst manchmal den Zug). Short wäre gegen das Signal.` };
});
sit('breakout_novol', 'Ausbruch ohne Volumen', 'Ein Ausbruch mit schwachem Volumen ist verdächtig. Lieber abwarten, ob der Kurs sich über der Linie halten kann.', () => {
  const { cs, line } = breakoutChart(false);
  return { q: 'Der Kurs schließt über dem Widerstand – aber das Volumen ist niedrig. Was machst du?', visual: renderChart({ candles: cs, volume: true, lines: [{ y: line, color: TV.lineLvl, label: 'Widerstand' }] }), options: OPT3, correct: 2, keepOrder: true, explain: 'Wenig Volumen = wenig Überzeugung. Fehlausbrüche sind hier häufig. <b>Abwarten</b>, ob ein Retest hält oder Volumen nachkommt.' };
});
sit('fomo', 'FOMO – dem Kurs hinterherspringen', 'Nach einem steilen Anstieg nicht hinterherkaufen. Warte auf einen Rücksetzer an eine Unterstützung oder ein neues Setup – sonst kaufst du oft das Hoch.', () => {
  let cs, rsi;
  for (let t = 0; t < 40; t++) { cs = pathCandles(jitter([[0, .1], [.45, .18], [.65, .32], [1, 1]], .02, .03), 55, { noise: .025, range: R.rand(14, 22) }); rsi = RSI(cs.map(x => x.c)); if (rsi[rsi.length - 1] > 76) break; }
  const pct = (cs[cs.length - 1].c / cs[0].o - 1) * 100;
  return { q: `Die Aktie ist heute schon <b>+${fmt(pct, 1)} %</b> gestiegen. Im Chat schreiben alle „🚀 to the moon“. Du hast noch keine Position. Was machst du?`, visual: renderChart({ candles: cs, rsi }), options: OPT3, correct: 2, keepOrder: true, explain: `Klassisches <b>FOMO</b>. RSI ${fmt(rsi[rsi.length - 1], 0)} = stark überkauft, kein sinnvoller Stop in der Nähe, schlechtes CRV. <b>Abwarten</b> und auf einen Rücksetzer/neues Setup warten. Short gegen so eine starke Bewegung ist ebenfalls gefährlich.` };
});
sit('pullback', 'Pullback an Unterstützung im Aufwärtstrend', 'Im Aufwärtstrend ist der Rücksetzer an eine Unterstützung (z. B. alter Widerstand) mit bullischem Umkehrsignal ein gutes Long-Setup. Stop unter das Signal-Tief.', () => {
  const an = jitter([[0, .1], [.15, .45], [.27, .3], [.38, .52], [.5, .36], [.6, .52], [.75, .92], [1, .58]], .01, .02);
  const cs = pathCandles(an, R.int(40, 50), { noise: .02 }); const line = cs.base + cs.range * .54, u = cs.range * .08;
  const o = cs[cs.length - 1].c, c = o + u * .35; cs.push({ o, c, h: c + u * .05, l: line - u * .2 });
  return { q: 'Aufwärtstrend. Der alte Widerstand (gelb) wurde durchbrochen. Jetzt kam der Kurs zurück und bildet dort einen Hammer. Was machst du?', visual: renderChart({ candles: cs, lines: [{ y: line, color: TV.lineLvl, label: 'alter Widerstand = Unterstützung?' }], highlight: [cs.length - 1, cs.length - 1] }), options: OPT3, correct: 0, ok: [2], keepOrder: true, explain: 'Trend nach oben + Retest der alten Widerstandszone (Rollentausch) + Hammer = <b>Long</b>-Setup. Stop unter das Hammer-Tief, Ziel z. B. das letzte Hoch. Auf eine grüne Bestätigungskerze zu warten ist ebenfalls okay.' };
});
sit('range_mid', 'Mitten in der Range', 'In der Mitte einer Seitwärtsphase gibt es kein gutes CRV. Entweder an den Rändern handeln oder den Ausbruch abwarten.', () => {
  const cs = pathCandles(jitter([[0, .5], [.12, .8], [.25, .22], [.4, .8], [.55, .22], [.7, .78], [.85, .25], [1, .5]], .01, .015), R.int(45, 55), { noise: .018 });
  return { q: 'Der Kurs pendelt seit Stunden zwischen Unterstützung und Widerstand und steht gerade genau in der Mitte. Was machst du?', visual: renderChart({ candles: cs, lines: [{ y: cs.base + cs.range * .8, color: TV.lineLvl, label: 'Widerstand' }, { y: cs.base + cs.range * .22, color: TV.lineLvl, label: 'Unterstützung' }] }), options: OPT3, correct: 2, keepOrder: true, explain: 'In der Mitte ist der Weg nach oben und unten gleich weit → kein gutes CRV, kein klarer Stop. <b>Abwarten</b>.' };
});
sit('dtop_break', 'Doppeltop bricht nach unten', 'Bricht ein Doppeltop seine Nackenlinie nach unten, ist das ein bärisches Signal: Longs schließen, Short möglich mit Stop über der Nackenlinie.', () => {
  const cs = pathCandles(flipA(jitter(A.doublebottom, .01, .02)), R.int(46, 56), { noise: .02 }); const neck = cs.base + cs.range * .45;
  return { q: 'Zwei gleich hohe Hochs, jetzt fällt der Kurs unter die Nackenlinie (gelb). Was ist nach Lehrbuch das passende Vorgehen?', visual: renderChart({ candles: cs, lines: [{ y: neck, color: TV.lineLvl, label: 'Nackenlinie' }] }), options: OPT3, correct: 1, ok: [2], keepOrder: true, explain: 'Doppeltop mit Bruch der Nackenlinie = bärisch → <b>Short</b> (Stop über der Nackenlinie) bzw. bestehende Longs schließen. Abwarten ist okay, wenn du (noch) nicht shortest. Long kaufen „weil es billiger ist“ wäre gegen das Signal.' };
});
sit('bearflag', 'Bärische Flagge im Abwärtstrend', 'Im Abwärtstrend ist der Bruch einer bärischen Flagge nach unten ein Short-Setup. Long-Käufe gegen den Trend sind riskant.', () => {
  const cs = pathCandles(flipA(jitter(A.bullflag, .01, .02)), R.int(46, 56), { noise: .02 });
  return { q: 'Starker Abfall, danach eine kleine Erholung in einem Kanal. Jetzt bricht der Kurs nach unten aus. Was machst du?', visual: renderChart({ candles: cs }), options: OPT3, correct: 1, ok: [2], keepOrder: true, explain: 'Bärische Flagge = Fortsetzung des Abwärtstrends → <b>Short</b>-Setup, Stop über der Flagge. Abwarten ist okay. Ein Long wäre gegen Trend und Muster.' };
});
sit('news', 'Wichtige Nachrichten stehen an', 'Kurz vor wichtigen Wirtschaftsdaten oder Unternehmenszahlen keine neuen Trades eröffnen – der Kurs kann in Sekunden stark springen, Stops rutschen durch.', () => {
  const { cs, line } = breakoutChart(true); const ev = R.pick(['die US-Arbeitsmarktdaten', 'die Zinsentscheidung der Fed', 'die Quartalszahlen des Unternehmens', 'die US-Inflationsdaten (CPI)']), m = R.int(1, 5);
  return { q: `Schöner Ausbruch mit Volumen. Aber: In <b>${m} Minute${m > 1 ? 'n' : ''}</b> kommen <b>${ev}</b>. Was machst du?`, visual: renderChart({ candles: cs, volume: true, lines: [{ y: line, color: TV.lineLvl }] }), options: OPT3, correct: 2, keepOrder: true, explain: `Bei ${ev} sind riesige Sprünge in beide Richtungen normal, Spreads werden breit und Stops können mit Slippage ausgeführt werden. Das Chartbild ist dann egal. <b>Abwarten</b>, bis sich der Markt beruhigt hat.` };
});
sit('knife', 'Ins fallende Messer greifen', 'Eine stark fallende Aktie ist nicht „billig“. Ohne Umkehrsignal (z. B. Boden, bullisches Muster, Bruch des Abwärtstrends) nicht kaufen.', () => {
  const cs = pathCandles(jitter(flipA([[0, .1], [.4, .25], [.6, .4], [1, 1]]), .02, .03), 50, { noise: .025, range: R.rand(12, 20) }); const pct = (1 - cs[cs.length - 1].c / cs[0].o) * 100;
  return { q: `Die Aktie ist heute schon <b>−${fmt(pct, 1)} %</b> gefallen. Ein Freund sagt: „Jetzt ist sie doch billig, kauf!“ Es gibt noch kein Umkehrsignal. Was machst du?`, visual: renderChart({ candles: cs }), options: OPT3, correct: 2, keepOrder: true, explain: '„Nicht ins fallende Messer greifen.“ Ohne Bodenbildung kann es weiter fallen. Jetzt noch Short hinterher ist ebenfalls schlecht (überverkauft, schlechtes CRV). <b>Abwarten</b>.' };
});
sit('move_stop', 'Stop-Loss verschieben?', 'Einen Stop-Loss NIE in Verlustrichtung verschieben. Der Stop ist die Grenze, an der deine Idee falsch ist. Verluste klein halten!', () => {
  const cs = pathCandles(jitter([[0, .3], [.3, .7], [.55, .62], [1, .2]], .02, .03), 40, { noise: .025 }); const E = cs[16].c, S = cs.base + cs.range * .14;
  return { q: `Du bist Long bei <b>${eur(E)}</b>, Stop-Loss bei <b>${eur(S)}</b>. Der Kurs läuft direkt auf deinen Stop zu. Was machst du?`, visual: renderChart({ candles: cs, lines: [{ y: E, color: TV.lineEntry, label: 'Einstieg' }, { y: S, color: TV.lineStop, label: 'Stop-Loss' }] }), options: ['Stop tiefer setzen, damit er nicht ausgelöst wird', 'Stop lassen – wenn er greift, gehört das zum Plan', 'Nachkaufen, um den Durchschnittspreis zu senken'], correct: 1, explain: 'Stop verschieben oder „verbilligen“ macht aus kleinen Verlusten große. Der Stop bleibt. Ein kleiner geplanter Verlust ist normaler Teil des Tradings.' };
});
sit('trail', 'Gewinn absichern', 'Läuft ein Trade deutlich ins Plus, sichert man Gewinne, indem man den Stop nachzieht (z. B. auf Einstand oder unter das letzte Tief) – nicht entfernen.', () => {
  const cs = pathCandles(jitter([[0, .2], [.3, .25], [.5, .5], [.6, .45], [.8, .8], [.88, .72], [1, .95]], .01, .02), 45, { noise: .02 }); const E = cs[13].c, S = E - (cs.base + cs.range * .95 - E) / 2.2;
  return { q: `Long bei <b>${eur(E)}</b>, ursprünglicher Stop bei <b>${eur(S)}</b>. Der Trade ist jetzt etwa <b>+2R</b> im Plus und der Trend läuft weiter. Was ist sinnvoll?`, visual: renderChart({ candles: cs, lines: [{ y: E, color: TV.lineEntry, label: 'Einstieg' }, { y: S, color: TV.lineStop, label: 'Stop' }] }), options: ['Stop nachziehen (z. B. Einstand / unter letztes Tief)', 'Stop ganz entfernen, damit der Trade Luft hat', 'Position mit hohem Hebel verdreifachen'], correct: 0, explain: 'Stop nachziehen sichert Gewinne und lässt den Trend trotzdem laufen. Ein Gewinner darf nie wieder zum Verlierer werden.' };
});
sit('early_profit', 'Gewinne zu früh mitnehmen', 'Halte dich an deinen Plan: Wenn das Ziel 3R ist, nicht bei der ersten kleinen Schwankung aus Angst schließen. Sonst sind Gewinne klein und Verluste voll – das CRV kippt.', () => {
  const r = R.pick([30, 50, 100]), now = R.pick([0.4, 0.5, 0.6, 0.7]);
  return { q: `Dein Plan: Ziel bei <b>+3R</b>, Stop bei −1R (1R = ${r} €). Jetzt bist du <b>+${fmt0(r * now)} €</b> im Plus, die letzte Kerze ist leicht rot und du wirst nervös. Was machst du?`, options: ['Sofort schließen – lieber kleiner Gewinn als keiner', 'Nach Plan laufen lassen, Stop bleibt', 'Position vergrößern, weil es gut läuft'], correct: 1, explain: `Wer Gewinne bei +${fmt0(now)}R mitnimmt, aber Verluste mit −1R voll kassiert, verliert langfristig. Eine rote Kerze ist normal. <b>Plan einhalten.</b>` };
});
sit('revenge', 'Nach Verlusten weitertraden?', 'Nach mehreren Verlusten am Tag: Pause machen oder den Tag beenden (Tageslimit). Revenge-Trading mit größerer Position zerstört Konten.', () => {
  const l = R.int(3, 5), v = R.pick([80, 120, 150, 240, 300]);
  return { q: `Du hattest heute <b>${l} Verlust-Trades</b> in Folge (−${v} €). Du bist wütend und willst das Geld heute noch zurück. Was machst du?`, options: ['Sofort mit doppelter Positionsgröße weitertraden', 'Pause / Tag beenden und Trades im Journal analysieren', 'Ohne Stop-Loss traden, dann wird man nicht ausgestoppt'], correct: 1, explain: 'Das ist <b>Revenge Trading</b>. Mit Emotionen und größerer Position steigt das Risiko massiv. Profis haben ein Tagesverlust-Limit und hören danach auf.' };
});
sit('risk20', 'Zu viel Risiko pro Trade', 'Pro Trade höchstens ca. 1 % (max. 2 %) des Kontos riskieren. Mit 20 % reichen wenige Verluste, um das Konto zu zerstören.', () => {
  const K = R.pick([1000, 2000, 3000, 5000]), p = R.pick([15, 20, 25, 30]);
  return { q: `Konto: <b>${fmt0(K)} €</b>. Du bist dir „sicher“ und willst <b>${p} %</b> (${fmt0(K * p / 100)} €) auf diesen einen Trade riskieren. Richtig?`, options: ['Ja, wenn ich mir sicher bin, ist das okay', `Nein – max. 1–2 % riskieren (${fmt0(K * 0.01)}–${fmt0(K * 0.02)} €)`, 'Ja, aber nur mit Hebel 10'], correct: 1, explain: `Bei ${p} % Risiko sind nach 4–5 Verlusten (passiert JEDEM) über die Hälfte weg. Von −50 % brauchst du +100 % zurück. „Sicher“ gibt es an der Börse nicht.` };
});
sit('leverage', 'Hoher Hebel bei kleinem Konto', 'Hoher Hebel vervielfacht Verluste. Anfänger sollten ohne oder mit sehr kleinem Hebel üben – am besten im Demokonto.', () => {
  const K = R.pick([300, 500, 800, 1000]), h = R.pick([20, 30, 50, 100]);
  return { q: `Du hast <b>${fmt0(K)} €</b> und der Broker bietet <b>Hebel ${h}</b> an. Damit könntest du ${fmt0(K * h)} € bewegen. Was ist sinnvoll?`, options: [`Hebel ${h} voll nutzen – größere Gewinne`, 'Ohne oder mit sehr kleinem Hebel handeln, Risiko pro Trade begrenzen', 'Hebel nutzen, aber ohne Stop-Loss'], correct: 1, explain: `Bei Hebel ${h} reicht eine Gegenbewegung von nur ${fmt0(100 / h)} %, um alles zu verlieren. Day-Trading-Kurse schwanken oft so stark an EINEM Tag.` };
});
sit('nostop', 'Ohne Stop-Loss handeln', 'Jeder Trade braucht einen Stop-Loss, BEVOR du einsteigst. „Ich passe schon auf“ funktioniert bei schnellen Bewegungen nicht.', () => ({ q: `Du willst einen Trade eröffnen und denkst: „Einen Stop-Loss brauche ich nicht, ich schaue ja auf den Bildschirm.“ Was ist richtig?`, options: ['Stimmt, wer aufpasst, braucht keinen Stop', 'Stop-Loss vor dem Einstieg festlegen und setzen', 'Stop erst setzen, wenn der Trade im Minus ist'], correct: 1, explain: 'Kurse können in Sekunden stark fallen (Nachrichten, Verbindungsabbruch, Zögern). Ohne Stop wird aus einem kleinen schnell ein großer Verlust.' }));
sit('overtrading', 'Zu viele Trades', 'Qualität vor Quantität: Nur Trades nehmen, die ins eigene Setup passen. Ein Tageslimit für Trades schützt vor Overtrading.', () => {
  const n = R.int(11, 25);
  return { q: `Es ist dein <b>${n}. Trade</b> heute. Der Markt ist langweilig, du siehst kein klares Setup, aber du willst „irgendwas machen“. Was machst du?`, options: ['Irgendeinen Trade nehmen, man muss ja dabei sein', 'Nicht traden – kein Setup = kein Trade', 'Größere Position, damit sich der Trade lohnt'], correct: 1, explain: '<b>Overtrading</b> kostet Gebühren, Spread und Nerven. Nichtstun ist auch eine Position. Gute Trader warten auf ihr Setup.' };
});
sit('indicators', 'Zu viele Indikatoren', 'Wenige, verstandene Werkzeuge (z. B. Trend, Unterstützung/Widerstand, Volumen, 1–2 Indikatoren) sind besser als ein überladener Chart.', () => ({ q: 'Auf deinem Chart sind <b>9 Indikatoren</b>. Drei sagen „Kaufen“, vier „Verkaufen“, zwei „neutral“. Was ist der beste Schritt?', options: ['Noch mehr Indikatoren hinzufügen, bis es eindeutig ist', 'Chart vereinfachen: Preis, Unterstützung/Widerstand, Volumen + 1–2 Indikatoren', 'Nach Bauchgefühl entscheiden'], correct: 1, explain: 'Die meisten Indikatoren rechnen aus denselben Kursdaten – sie widersprechen sich und verwirren. Weniger ist mehr.' }));
sit('overconfidence', 'Übermut nach Gewinn', 'Auch nach Gewinnen bleibt die Positionsgröße nach Plan. Ein großer Gewinn ändert nicht die Wahrscheinlichkeiten des nächsten Trades.', () => {
  const g = R.pick([200, 350, 500, 800]);
  return { q: `Dein letzter Trade brachte <b>+${g} €</b> – dein bester Tag! Du fühlst dich unschlagbar und willst die nächste Position <b>verdreifachen</b>. Was ist richtig?`, options: ['Verdreifachen – ich habe gerade einen Lauf', 'Positionsgröße bleibt nach Plan (1-%-Regel)', 'Den Gewinn komplett in einen Trade stecken'], correct: 1, explain: 'Nach Gewinnen wird man leichtsinnig. Ein einziger übergroßer Verlust kann eine ganze Woche Gewinne vernichten. Plan einhalten.' };
});

/* ---------- Lernreihenfolge ---------- */
const ORDER = ('t:aktie t:boerse t:broker t:kurs t:trading t:daytrading t:demokonto t:chart t:kerze t:gruen t:rot b:ohlc t:open t:close t:high t:low ' +
  't:koerper t:docht t:timeframe t:long t:short t:bid t:ask t:spread t:order t:marketorder t:limitorder t:stoploss t:entry t:exit t:takeprofit ' +
  't:einprozent r:risk_eur t:bullisch t:baerisch t:trend t:hhhl t:lllh b:trend t:range t:support t:resistance b:sr t:positionsgroesse r:pos_size ' +
  't:crv r:crv t:breakout t:pullback t:fakeout t:rollentausch b:break t:volumen i:volume s:breakout_vol s:breakout_novol c:hammer c:shootingstar ' +
  'c:doji c:bullengulf c:bearengulf t:fomo s:fomo s:nostop s:move_stop t:rmultiple r:rmult r:stop_price r:pnl_long c:morningstar c:eveningstar ' +
  'f:doubletop f:doublebottom t:indikator t:sma t:ema i:matrend t:rsi t:ueberkauft t:ueberverkauft i:rsi s:pullback s:range_mid t:revenge s:revenge ' +
  'f:hs f:ihs c:hangingman c:invhammer t:goldencross t:deathcross i:macross f:asctri f:desctri f:symtri t:hebel t:margin t:margincall r:leverage ' +
  's:leverage s:risk20 t:trefferquote r:breakeven_wr f:bullflag f:bearflag s:bearflag s:dtop_break t:overtrading s:overtrading t:trailingstop ' +
  't:breakeven s:trail s:early_profit c:soldiers c:crows c:spinningtop f:rectangle f:risingwedge f:fallingwedge t:vwap t:macd t:bollinger t:atr ' +
  't:volatilitaet t:liquiditaet t:stoporder t:slippage t:gap t:premarket s:news s:knife t:position t:glattstellen r:pnl_short t:gebuehren r:spread ' +
  't:drawdown t:tradingplan t:journal s:indicators s:overconfidence t:trendlinie t:ticker').split(' ').filter(id => SKILLS[id]);
Object.keys(SKILLS).forEach(id => { if (!ORDER.includes(id)) ORDER.push(id); });
