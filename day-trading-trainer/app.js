/* ===== Speicher ===== */
const KEY = 'dtt_v1', DEVKEY = 'dtt_device';
const MIN = 60e3, DAY = 864e5;
const INT = [0, 10 * MIN, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 40 * DAY];
const MAXBOX = INT.length - 1, ROUND = 15;
let S = load();
function fresh() { return { sk: {}, intro: [], queue: [], n: 0, days: {}, ok: 0, bad: 0, seenWelcome: false, goal: 30, exams: [] }; }
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.sk) return Object.assign(fresh(), s); } catch (e) { } return fresh(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
const today = () => new Date().toISOString().slice(0, 10);
const st = id => S.sk[id] || (S.sk[id] = { box: 0, due: 0, ok: 0, bad: 0 });
const isVis = id => ['b', 'c', 'f', 'i'].includes(SKILLS[id].mod);
const MOD_HINT = { t: 'Denk an das Beispiel aus der Erklärung. Schließe zuerst Antworten aus, die sicher falsch sind.', b: 'Schau dir zuerst die grobe Richtung an, dann die Details.', c: 'Achte auf Körpergröße, Docht-Länge, Farbe – und auf den Trend VOR dem Muster.', f: 'Zähle Hochs und Tiefs. Sind die Linien waagerecht, steigend, fallend – oder laufen sie zusammen?', i: 'Lies den Indikator zuerst ganz rechts ab – dort ist „jetzt“.', r: 'Schreib dir die Zahlen kurz auf und rechne Schritt für Schritt (Formel steht in der Erklärung).', s: 'Frag dich: Gibt es ein klares Setup, einen sinnvollen Stop und ein gutes CRV? Wenn nicht → eher abwarten.' };

/* ===== Gerät: Handy oder PC ===== */
let DEV = null; try { DEV = localStorage.getItem(DEVKEY); } catch (e) { }
function applyDevice() {
  document.body.classList.toggle('m-phone', DEV === 'phone');
  document.body.classList.toggle('m-pc', DEV !== 'phone');
  CHART_W = DEV === 'phone' ? 420 : 640;
  const b = document.getElementById('devBtn'); if (b) b.textContent = DEV === 'phone' ? '📱' : '🖥️';
}
function setDevice(d) { DEV = d; try { localStorage.setItem(DEVKEY, d); } catch (e) { } applyDevice(); }
function devicePicker(after) {
  const guess = Math.min(screen.width, window.innerWidth) < 760 ? 'phone' : 'pc';
  view.innerHTML = `<section class="card devpick"><h2>Wo lernst du gerade?</h2><p class="hint">Die Ansicht wird daran angepasst. Du kannst jederzeit oben rechts umschalten.</p>
    <div class="devbtns"><button class="devb ${guess === 'phone' ? 'sug' : ''}" data-d="phone"><span>📱</span><b>Handy</b><small>Große Charts, große Tasten, Bedienung mit dem Daumen</small></button>
    <button class="devb ${guess === 'pc' ? 'sug' : ''}" data-d="pc"><span>🖥️</span><b>PC / Laptop</b><small>Chart links groß, Antworten rechts, Tastatur-Kürzel</small></button></div></section>`;
  view.querySelectorAll('.devb').forEach(b => b.onclick = () => { setDevice(b.dataset.d); after(); });
}

/* ===== Planer (Spaced Repetition) ===== */
let filter = null, lastId = null;
const isWeak = id => S.intro.includes(id) && S.sk[id] && S.sk[id].bad > 0 && (S.sk[id].box < 3 || S.sk[id].bad > S.sk[id].ok);
const inF = id => !filter || (filter === 'vis' ? isVis(id) : filter === 'weak' ? isWeak(id) : SKILLS[id].mod === filter);
function pickNext() {
  const now = Date.now();
  const qi = S.queue.findIndex(q => q.at <= S.n && inF(q.id) && q.id !== lastId);
  if (qi >= 0) { const id = S.queue[qi].id; S.queue.splice(qi, 1); return { id }; }
  const due = S.intro.filter(id => inF(id) && S.sk[id].box >= 1 && S.sk[id].due <= now && id !== lastId).sort((a, b) => S.sk[a].due - S.sk[b].due);
  if (due.length) return { id: due[0] };
  const learning = S.intro.filter(id => inF(id) && S.sk[id].box <= 1).length;
  const nextNew = pickNew();
  if (nextNew && (learning < (filter && filter !== 'vis' ? 4 : 7) || !S.intro.some(inF))) { S.intro.push(nextNew); st(nextNew); return { id: nextNew, isNew: true }; }
  const pool = S.intro.filter(id => inF(id) && id !== lastId);
  if (!pool.length) return S.intro.find(inF) ? { id: S.intro.find(inF) } : null;
  let tot = 0; const w = pool.map(id => {
    let x = 1 / Math.pow(S.sk[id].box + 1, 1.6) + (S.sk[id].bad > S.sk[id].ok ? .5 : 0);
    if (lastId && SKILLS[id].mod === SKILLS[lastId].mod) x *= .35;
    if (!filter && isVis(id)) x *= 1.7; // im Mix mehr Bild-Aufgaben
    tot += x; return x;
  });
  let r = Math.random() * tot; for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return { id: pool[i] }; }
  return { id: pool[0] };
}
// Neue Themen reihum aus allen (passenden) Bereichen
function pickNew() {
  if (filter === 'weak') return null;
  if (filter && filter !== 'vis') return ORDER.find(id => inF(id) && !S.intro.includes(id));
  const lastMod = lastId && SKILLS[lastId] ? SKILLS[lastId].mod : null;
  const cand = Object.keys(MODULES).filter(m => filter !== 'vis' || ['b', 'c', 'f', 'i'].includes(m)).map(m => {
    const all = ORDER.filter(id => SKILLS[id].mod === m), next = all.find(id => !S.intro.includes(id));
    // Bild-Bereiche bekommen einen kleinen Vorsprung, damit Muster früh auftauchen
    const bonus = ['c', 'f'].includes(m) ? -.6 : 0;
    return next ? { next, share: all.filter(id => S.intro.includes(id)).length + bonus + (m === lastMod ? .5 : 0) + Math.random() * .4 } : null;
  }).filter(Boolean).sort((x, y) => x.share - y.share);
  return cand.length ? cand[0].next : null;
}
const MULTI = ['t', 'c', 'f'];
function grade(id, result, fmt) {
  const s = st(id), now = Date.now();
  S.n++; S.days[today()] = (S.days[today()] || 0) + 1;
  if (result === 'ok') {
    s.ok++; S.ok++; if (fmt) { s.f = s.f || {}; s.f[fmt] = 1; }
    s.box = Math.min(s.box + 1, MAXBOX);
    // „sicher“ erst, wenn in mindestens 2 verschiedenen Aufgabenformaten richtig
    if (MULTI.includes(SKILLS[id].mod) && Object.keys(s.f || {}).length < 2) s.box = Math.min(s.box, 2);
    s.due = now + INT[s.box];
  } else if (result === 'guess') {
    s.ok++; S.ok++; s.due = now + INT[1];
    S.queue = S.queue.filter(q => q.id !== id); S.queue.push({ id, at: S.n + R.int(3, 5) });
  }
  else {
    s.bad++; S.bad++; s.box = s.box >= 3 ? 1 : 0; s.due = now + INT[Math.max(1, s.box)];
    S.queue = S.queue.filter(q => q.id !== id); S.queue.push({ id, at: S.n + 2 }, { id, at: S.n + R.int(5, 8) }); // Drill: 2× in neuen Varianten
  }
  s.last = now; save();
}

/* ===== UI ===== */
const $ = s => document.querySelector(s);
const view = $('#view');
let cur = null, answered = false, sess = { ok: 0, n: 0, wrong: [] };

function setTab(t) {
  if (EX) examStop();
  if (typeof stopModes === 'function') stopModes();
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  ({ home, lex, prog, live })[t]();
  window.scrollTo(0, 0);
}
document.querySelectorAll('nav button').forEach(b => b.onclick = () => setTab(b.dataset.t));
$('#devBtn').onclick = () => { setDevice(DEV === 'phone' ? 'pc' : 'phone'); if (cur && cur.id && !cur.lesson) showTask(cur.id); else setTab('home'); };

function counts(mod) {
  const ids = Object.keys(SKILLS).filter(id => !mod || (mod === 'vis' ? isVis(id) : SKILLS[id].mod === mod));
  const now = Date.now(); let neu = 0, lern = 0, sicher = 0, due = 0;
  ids.forEach(id => { if (!S.intro.includes(id)) neu++; else { const b = S.sk[id].box; if (b >= 3) sicher++; else lern++; if (b >= 1 && S.sk[id].due <= now) due++; } });
  return { total: ids.length, neu, lern, sicher, due: due + S.queue.filter(q => ids.includes(q.id)).length };
}
function bar(c) { const t = c.total; return `<div class="pbar"><i class="g" style="width:${c.sicher / t * 100}%"></i><i class="y" style="width:${c.lern / t * 100}%"></i></div>`; }

function home() {
  filter = null; cur = null;
  if (!DEV) return devicePicker(home);
  if (!S.seenWelcome) return welcome();
  const c = counts(), streak = calcStreak(), td = S.days[today()] || 0, goal = S.goal || 30, gp = Math.min(1, td / goal);
  const cv = counts('vis'), nWeak = Object.keys(SKILLS).filter(isWeak).length;
  view.innerHTML = `
  <section class="card hero">
    <div class="goal"><div class="ring" style="--p:${gp * 360}deg"><span>${td}<small>/${goal}</small></span></div>
      <div><b>${gp >= 1 ? '🎉 Tagesziel geschafft!' : 'Tagesziel'}</b><p class="hint">${gp >= 1 ? 'Stark! Jede weitere Aufgabe festigt dein Wissen.' : `Noch ${goal - td} Aufgaben bis zum Ziel.`}</p></div></div>
    <div class="stats">
      <div><b>${c.due}</b><span>fällig</span></div>
      <div><b>${c.sicher}</b><span>sicher / ${c.total}</span></div>
      <div><b>${c.lern}</b><span>am Lernen</span></div>
      <div><b>${streak}🔥</b><span>Tage am Stück</span></div>
    </div>
    ${bar(c)}
    <div class="legend"><span class="g">■ sicher</span><span class="y">■ am Lernen</span><span>■ neu</span></div>
    <button class="big go" id="start">▶ Training starten <small>(alles gemischt)</small></button>
  </section>
  <h3>Intensiv trainieren</h3>
  <div class="modes">
    <button class="mode-t" id="sim"><span>🕹️</span><b>Chart-Simulator</b><small>Live-Chart Kerze für Kerze – du entscheidest. Konto: ${fmt0((S.sim && S.sim.R) || 0)} R</small></button>
    <button class="mode-t" id="blitz"><span>⚡</span><b>Blitz-Runde</b><small>60 Sek. Muster erkennen · Rekord: ${S.blitzBest || 0}</small></button>
    <button class="mode-t" id="vis"><span>📸</span><b>Bilder-Training</b><small>nur Charts &amp; Muster (${cv.sicher}/${cv.total} sicher)</small></button>
    <button class="mode-t" id="weak" ${nWeak ? '' : 'disabled'}><span>🎯</span><b>Schwächen</b><small>${nWeak ? `${nWeak} Themen mit Fehlern` : 'noch keine Fehler'}</small></button>
    <button class="mode-t" id="exam"><span>📝</span><b>Klausur</b><small>alles gemischt, ohne Hilfe, mit Note</small></button>
  </div>
  <h3>Nur einen Bereich üben</h3>
  <div class="mods">${Object.entries(MODULES).map(([k, m]) => { const cc = counts(k); return `<button class="mod" data-m="${k}"><span class="ic">${m.icon}</span><span class="mn">${m.name}</span><span class="mc">${cc.sicher}/${cc.total} sicher${cc.due ? ` · <b>${cc.due} fällig</b>` : ''}</span>${bar(cc)}</button>`; }).join('')}</div>`;
  $('#start').onclick = () => startSession(null);
  $('#vis').onclick = () => startSession('vis');
  $('#weak').onclick = () => startSession('weak');
  $('#exam').onclick = examSetup;
  $('#blitz').onclick = () => blitzStart();
  $('#sim').onclick = () => simStart();
  view.querySelectorAll('.mod').forEach(b => b.onclick = () => startSession(b.dataset.m));
}
function welcome() {
  view.innerHTML = `<section class="card welcome">
  <h2>Willkommen beim Day-Trading-Trainer 👋</h2>
  <p>Du startest bei <b>null</b>. Der Trainer bringt dir Schritt für Schritt bei: Begriffe, Kerzen lesen, Muster erkennen, Indikatoren, Risiko berechnen und richtige Entscheidungen in typischen Situationen.</p>
  <ul><li>Bei jedem neuen Thema bekommst du erst eine <b>kurze Erklärung</b>, dann Aufgaben.</li>
  <li>Viele Aufgaben sind <b>Bild-Aufgaben</b>: Muster antippen, richtiges Bild wählen, Verlauf vorhersagen.</li>
  <li>Alle Charts werden <b>zufällig erzeugt</b> – keine Aufgabe ist doppelt.</li>
  <li><b>Fehler kommen wieder:</b> erst nach ein paar Aufgaben, später nach 10 Min., 1, 3, 7, 16 Tagen …</li>
  <li class="pc-only">Tastatur: <kbd>1</kbd>–<kbd>4</kbd> antworten, <kbd>H</kbd> Tipp, <kbd>Enter</kbd> weiter.</li></ul>
  <div class="warn">⚠️ <b>Ehrlich gesagt:</b> Die meisten privaten Day-Trader verlieren Geld. Dieser Trainer vermittelt Wissen, keine Anlageberatung, und Muster funktionieren nie garantiert. Übe danach mindestens einige Wochen in einem <b>Demokonto</b>, bevor du echtes Geld einsetzt – und nur Geld, dessen Verlust du verkraften kannst.</div>
  <button class="big go" id="ok">Los geht's</button></section>`;
  $('#ok').onclick = () => { S.seenWelcome = true; save(); startSession(null); };
}
function calcStreak() { let d = new Date(), n = 0; if (!S.days[today()]) d.setDate(d.getDate() - 1); while (S.days[d.toISOString().slice(0, 10)]) { n++; d.setDate(d.getDate() - 1); } return n; }

/* ===== Sitzung ===== */
const modeName = () => filter === 'weak' ? '🎯 Schwächen-Training' : filter === 'vis' ? '📸 Bilder-Training' : filter ? MODULES[filter].icon + ' ' + MODULES[filter].name : '🔀 Gemischt';
function startSession(mod) { filter = mod; sess = { ok: 0, n: 0, wrong: [] }; next(); }
function topbar() {
  if (EX) return `<div class="sbar"><button class="ghost" id="back">✕</button><span class="mode">📝 Klausur · Frage ${EX.i + 1}/${EX.list.length}</span><span class="sc" id="extime">${EX.limit ? fmtT(EX.limit - (Date.now() - EX.start)) : ''}</span></div><div class="rbar ex"><i style="width:${EX.i / EX.list.length * 100}%"></i></div>`;
  const p = (sess.n % ROUND) / ROUND * 100;
  return `<div class="sbar"><button class="ghost" id="back">←</button><span class="mode">${modeName()}</span><span class="sc">${sess.ok}/${sess.n} ✓</span></div><div class="rbar"><i style="width:${p}%"></i></div>`;
}
function bindBack() { $('#back').onclick = () => { if (EX) { const b = $('#back'); if (!b.dataset.c) { b.dataset.c = 1; b.textContent = 'Abbrechen?'; return; } examStop(); } setTab('home'); }; }
function next() {
  if (sess.n > 0 && sess.n % ROUND === 0 && !sess.shown) { sess.shown = true; return roundSummary(); }
  sess.shown = false;
  const p = pickNext(); if (!p || !p.id) { if (filter === 'weak') { setTab('home'); return modal('🎯 Alles aufgeholt!', '<p>Du hast gerade keine offenen Schwachstellen. Trainiere normal weiter – neue Fehler landen automatisch hier.</p>'); } return home(); }
  lastId = p.id; save();
  if (p.isNew) return showLesson(p.id);
  showTask(p.id);
}
function roundSummary() {
  cur = { summary: true };
  const last = sess.lastRound || { ok: 0, n: 0 }, rn = sess.n - last.n, rok = sess.ok - last.ok, pct = Math.round(rok / rn * 100);
  sess.lastRound = { ok: sess.ok, n: sess.n };
  const wrong = [...new Set(sess.wrong.slice(-rn))];
  sess.wrong = [];
  view.innerHTML = topbar() + `<section class="card summary"><h2>${pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '💪'} Runde geschafft!</h2>
    <div class="big-pct">${pct} %</div><p class="hint">${rok} von ${rn} richtig</p>
    ${wrong.length ? `<h3>Das solltest du dir nochmal ansehen</h3><div class="chips">${wrong.map(id => `<button class="chip y" data-id="${id}">${SKILLS[id].name}</button>`).join('')}</div><p class="hint">Keine Sorge: Diese Themen kommen automatisch wieder dran.</p>` : '<p>Keine Fehler in dieser Runde – sehr stark! 🎉</p>'}
    <div class="row-end"><button class="ghost" id="stop">Pause machen</button><button class="go big" id="goon">Nächste Runde →</button></div></section>`;
  bindBack();
  view.querySelectorAll('.chip').forEach(b => b.onclick = () => openLex(b.dataset.id, true));
  $('#stop').onclick = () => setTab('home'); $('#goon').onclick = next;
}
function showLesson(id) {
  const sk = SKILLS[id];
  view.innerHTML = topbar() + `<section class="card lesson"><div class="tag new">✨ Neu: ${MODULES[sk.mod].icon} ${MODULES[sk.mod].name}</div><h2>${sk.name}</h2><div class="lbody">${sk.lesson()}</div><button class="big go sticky-go" id="go">Verstanden – Aufgabe starten</button></section>`;
  bindBack();
  $('#go').onclick = () => showTask(id);
  cur = { lesson: true, id };
}
function showTask(id) {
  const sk = SKILLS[id]; let g;
  try { g = sk.gen(); } catch (e) { console.error(id, e); return next(); }
  let opts = null;
  if (g.type !== 'num' && g.type !== 'tap') {
    opts = g.options.map((t, i) => ({ t, oi: i, ok: i === g.correct, part: (g.ok || []).includes(i) }));
    if (!g.keepOrder) opts = R.shuffle(opts);
  }
  cur = { id, g, opts }; answered = false;
  const box = S.sk[id]?.box ?? 0;
  let answerHtml;
  if (g.type === 'num') answerHtml = `<div class="numrow"><input id="num" inputmode="decimal" autocomplete="off" placeholder="Deine Antwort"><span class="unit">${g.unit || ''}</span><button class="go" id="chk">Prüfen</button></div>`;
  else if (g.type === 'tap') answerHtml = `<div class="tapinfo">👆 Tippe direkt in den Chart</div>`;
  else if (g.img) answerHtml = `<div class="imgopts n${opts.length}">${opts.map((o, i) => `<button class="opt imgopt" data-i="${i}"><kbd>${i + 1}</kbd>${o.t}</button>`).join('')}</div>`;
  else answerHtml = `<div class="opts ${g.small ? 'small' : ''} ${opts.length === 2 ? 'two' : ''}">${opts.map((o, i) => `<button class="opt" data-i="${i}"><kbd>${i + 1}</kbd><span>${o.t}</span></button>`).join('')}</div>`;
  const visual = g.type === 'tap' ? renderChart(g.spec) : g.visual;
  view.innerHTML = topbar() + `<section class="card task ${visual ? 'has-vis' : 'no-vis'} ${g.img ? 'is-img' : ''}">
    <div class="tag">${MODULES[sk.mod].icon} ${MODULES[sk.mod].name}<span class="lvl" title="Lernstufe">${'●'.repeat(box)}${'○'.repeat(MAXBOX - box)}</span></div>
    <div class="tmain"><div class="q">${g.q}</div>${visual ? `<div class="vis" id="vis">${visual}</div>` : ''}</div>
    <div class="tside">${answerHtml}
      ${EX ? '' : '<div class="hintrow"><button class="ghost small" id="hintBtn">💡 Tipp</button><button class="ghost small" id="guessBtn" title="Wenn du nur rätst: richtig zählt dann nicht als gelernt">🤔 Ich rate nur</button><div id="hint"></div></div>'}
      <div id="fb"></div></div>
  </section>`;
  bindBack();
  if ($('#hintBtn')) $('#hintBtn').onclick = showHint;
  if ($('#guessBtn')) $('#guessBtn').onclick = () => { cur.guess = !cur.guess; $('#guessBtn').classList.toggle('sel', cur.guess); };
  if (g.type === 'num') {
    const inp = $('#num'); if (DEV !== 'phone') inp.focus();
    $('#chk').onclick = checkNum; inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (!answered) checkNum(); else next(); } };
  } else if (g.type === 'tap') {
    $('#vis').onclick = e => { const h = e.target.closest('.hit'); if (h) tap(+h.dataset.i); };
  } else view.querySelectorAll('.opt').forEach(b => b.onclick = () => choose(+b.dataset.i));
}
function showHint() { $('#hint').innerHTML = `<div class="hintbox">${cur.g.hint || MOD_HINT[SKILLS[cur.id].mod]}</div>`; $('#hintBtn').disabled = true; }
function tap(i) {
  if (answered) return; answered = true;
  const g = cur.g, good = g.okIdx ? g.okIdx.includes(i) : i >= g.range[0] && i <= g.range[1];
  const spec = { ...g.spec, ...(g.solved || {}), clickable: false, tapped: i };
  if (g.okIdx) spec.hlIdx = g.okIdx; else spec.highlight = g.range;
  if (EX) return examAnswer(good, '', renderChart(spec), true);
  $('#vis').innerHTML = renderChart(spec);
  $('.tapinfo').textContent = good ? '👆 Richtig getippt!' : '👆 Das gelb markierte war gesucht (weißer Rahmen = dein Tipp)';
  feedback(good, null, good ? '' : more());
}
const more = () => cur.g.more ? `<div class="morebox">${cur.g.more()}</div>` : '';
function choose(i) {
  if (answered) return; answered = true;
  const o = cur.opts[i], good = o.ok || o.part;
  if (EX) return examAnswer(good, o.t, cur.opts.find(x => x.ok).t);
  view.querySelectorAll('.opt').forEach((b, j) => { b.disabled = true; const x = cur.opts[j]; if (x.ok) b.classList.add('right'); else if (x.part) b.classList.add('part'); if (j === i && !good) b.classList.add('wrong'); });
  let extra = '';
  const cmp = cur.g.cmp;
  if (!good && cmp) {
    const k = cmp.keys[o.oi], D = cmp.kind === 'c' ? CANDLES[k] : FORMS[k];
    const pic = cmp.kind === 'c' ? renderChart({ ...buildPattern(k, { trail: 'none' }), mini: true }) : renderChart({ candles: buildForm(k), mini: true });
    extra = `<div class="cmp"><div class="cmpimg">${pic}</div><div><b>Dein Tipp: ${D.name}</b><br><span class="hint">So sieht das aus: ${D.look}</span></div></div>`;
  }
  feedback(good, o.part && !o.ok ? '🟡 Auch vertretbar' : null, extra + (good ? '' : more()));
}
function parseNum(s) { s = String(s).trim().replace(/\s|€|%|R|stück/gi, ''); if (/,/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); return parseFloat(s); }
function checkNum() {
  const v = parseNum($('#num').value); if (isNaN(v)) { $('#num').classList.add('shake'); setTimeout(() => $('#num').classList.remove('shake'), 400); return; }
  answered = true; const g = cur.g, good = Math.abs(v - g.answer) <= (g.tol || 0) + 1e-9;
  if (EX) return examAnswer(good, fmt0(v) + ' ' + (g.unit || ''), fmt0(Math.round(g.answer * 100) / 100) + ' ' + (g.unit || ''));
  $('#num').disabled = true; $('#chk').disabled = true;
  feedback(good, null, `<p>Richtige Antwort: <b>${fmt0(Math.round(g.answer * 100) / 100)} ${g.unit || ''}</b></p>`);
}
function feedback(good, label, extra = '') {
  const guessed = good && cur.guess;
  grade(cur.id, good ? (guessed ? 'guess' : 'ok') : 'bad', cur.g.fmt);
  if (guessed) label = '🤔 Richtig geraten – zählt noch nicht als gelernt, kommt bald wieder'; sess.n++; if (good) sess.ok++; else sess.wrong.push(cur.id);
  $('.sbar .sc').textContent = `${sess.ok}/${sess.n} ✓`;
  const rb = $('.rbar i'); if (rb) rb.style.width = ((sess.n % ROUND) || ROUND) / ROUND * 100 + '%';
  const hb = $('#hintBtn'); if (hb) hb.parentElement.remove();
  const box = S.sk[cur.id].box;
  $('#fb').innerHTML = `<div class="fb ${good ? 'ok' : 'bad'}"><div class="fh">${label || (good ? '✅ Richtig!' : '❌ Leider falsch')}</div>${extra}<div class="ex">${cur.g.explain}</div>${good && !guessed && cur.g.why && Math.random() < .65 ? whyHtml(cur.g.why) : ''}
    <div class="nx"><button class="ghost small" id="lessonBtn">📖 ${SKILLS[cur.id].name}</button><span>${good ? `Nächste Wiederholung: ${nextTxt(box)}` : '🔁 Kommt gleich nochmal dran.'}</span></div></div>
    <button class="go big nextbtn" id="nextBtn">Weiter →</button>`;
  $('#lessonBtn').onclick = () => modal(SKILLS[cur.id].name, SKILLS[cur.id].lesson());
  view.querySelectorAll('.whyopt').forEach(b => b.onclick = () => answerWhy(+b.dataset.i));
  $('#nextBtn').onclick = next; $('#nextBtn').focus({ preventScroll: true });
  if (DEV === 'phone') setTimeout(() => $('#fb').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  else $('#fb').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function whyHtml(w) {
  const o = R.shuffle(w.options.map((t, i) => ({ t, ok: i === w.correct })));
  cur.whyOpts = o;
  return `<div class="why"><div class="wq">${w.q}</div>${o.map((x, i) => `<button class="opt whyopt" data-i="${i}"><span>${x.t}</span></button>`).join('')}</div>`;
}
function answerWhy(i) {
  if (cur.whyDone) return; cur.whyDone = true;
  const o = cur.whyOpts[i];
  view.querySelectorAll('.whyopt').forEach((b, j) => { b.disabled = true; if (cur.whyOpts[j].ok) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
  const s = S.sk[cur.id];
  if (!o.ok) { s.box = Math.max(0, s.box - 1); s.due = Date.now() + INT[1]; S.queue.push({ id: cur.id, at: S.n + R.int(3, 5) }); save(); }
  $('.why').insertAdjacentHTML('beforeend', `<p class="${o.ok ? 'wok' : 'wbad'}">${o.ok ? '✅ Genau – du hast es wirklich verstanden.' : '❌ Das Bild war richtig, aber das Merkmal nicht. Das Thema kommt nochmal dran.'}</p>`);
}
const nextTxt = b => ['gleich', 'in ~10 Min.', 'morgen', 'in 3 Tagen', 'in 1 Woche', 'in 16 Tagen', 'in ~6 Wochen'][b];

document.addEventListener('keydown', e => {
  if ($('.modal')) { if (e.key === 'Escape') $('.modal').remove(); return; }
  if (!cur || (EX && answered)) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (cur.summary && e.key === 'Enter') { e.preventDefault(); return next(); }
  if (cur.lesson && e.key === 'Enter') { e.preventDefault(); return showTask(cur.id); }
  if (!cur.g) return;
  if (!answered && (e.key === 'h' || e.key === 'H') && $('#hintBtn')) showHint();
  else if (!answered && cur.opts && /^[1-9]$/.test(e.key) && +e.key <= cur.opts.length) choose(+e.key - 1);
  else if (answered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); next(); }
});

function modal(title, html) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="mbox"><button class="x">✕</button><h2>${title}</h2>${html}</div>`;
  m.onclick = e => { if (e.target === m || e.target.classList.contains('x')) m.remove(); };
  document.body.appendChild(m);
}

/* ===== Lexikon ===== */
function lex() {
  cur = null;
  view.innerHTML = `<section class="card"><input id="q" class="search" placeholder="🔎 Begriff oder Muster suchen …"><div id="lexlist"></div></section>`;
  const draw = () => {
    const q = $('#q').value.trim().toLowerCase();
    $('#lexlist').innerHTML = Object.entries(MODULES).map(([k, m]) => {
      const items = ORDER.filter(id => SKILLS[id].mod === k && (!q || SKILLS[id].name.toLowerCase().includes(q) || (k === 't' && TERMS.find(t => 't:' + t.id === id).d.toLowerCase().includes(q))));
      if (!items.length) return '';
      return `<h3>${m.icon} ${m.name}</h3><div class="chips">${items.map(id => { const s = S.sk[id], cls = !S.intro.includes(id) ? '' : s.box >= 3 ? 'g' : 'y'; return `<button class="chip ${cls}" data-id="${id}">${SKILLS[id].name}</button>`; }).join('')}</div>`;
    }).join('') || '<p>Nichts gefunden.</p>';
    view.querySelectorAll('.chip').forEach(b => b.onclick = () => openLex(b.dataset.id));
  };
  $('#q').oninput = draw; draw();
}
function openLex(id, readOnly) {
  const sk = SKILLS[id];
  modal(sk.name, `<div id="lx">${sk.lesson()}</div><div class="row-end">${['c', 'f', 'b', 'i'].includes(sk.mod) ? '<button class="ghost" id="regen">🔄 Neues Beispiel</button>' : ''}${readOnly ? '' : '<button class="go" id="tryit">Jetzt üben</button>'}</div>`);
  const rg = $('#regen'); if (rg) rg.onclick = () => $('#lx').innerHTML = sk.lesson();
  const tr = $('#tryit'); if (tr) tr.onclick = () => { $('.modal').remove(); filter = sk.mod; sess = { ok: 0, n: 0, wrong: [] }; if (!S.intro.includes(id)) { S.intro.push(id); st(id); save(); } lastId = id; document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === 'home')); showTask(id); };
}

/* ===== Fortschritt ===== */
function prog() {
  cur = null;
  const total = S.ok + S.bad, acc = total ? Math.round(S.ok / total * 100) : 0;
  const weak = S.intro.filter(id => S.sk[id].bad > 0).sort((a, b) => (S.sk[b].bad - S.sk[b].ok * .5) - (S.sk[a].bad - S.sk[a].ok * .5)).slice(0, 10);
  const last14 = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); const k = d.toISOString().slice(0, 10); return [k.slice(8) + '.', S.days[k] || 0]; });
  const mx = Math.max(1, ...last14.map(x => x[1]));
  view.innerHTML = `<section class="card"><h2>📊 Dein Fortschritt</h2>
    <div class="stats"><div><b>${total}</b><span>Aufgaben</span></div><div><b>${acc} %</b><span>richtig</span></div><div><b>${S.intro.length}/${Object.keys(SKILLS).length}</b><span>Themen begonnen</span></div><div><b>${calcStreak()}🔥</b><span>Serie</span></div></div>
    <h3>Letzte 14 Tage</h3><div class="days">${last14.map(([d, v]) => `<div><i style="height:${v / mx * 70 + 2}px" title="${v}"></i><span>${d}</span></div>`).join('')}</div>
    <h3>Bereiche</h3>${Object.entries(MODULES).map(([k, m]) => { const c = counts(k); return `<div class="mrow"><span>${m.icon} ${m.name}</span><span>${c.sicher}/${c.total}</span>${bar(c)}</div>`; }).join('')}
    <h3>Deine Schwachstellen</h3>${weak.length ? `<div class="chips">${weak.map(id => `<button class="chip y" data-id="${id}">${SKILLS[id].name} <small>✗${S.sk[id].bad} ✓${S.sk[id].ok}</small></button>`).join('')}</div>` : '<p class="hint">Noch keine Fehler – weiter so!</p>'}
  </section>
  <section class="card"><h3>⚙️ Einstellungen</h3>
    <div class="setrow"><span>Ansicht</span><div><button class="ghost ${DEV === 'phone' ? 'sel' : ''}" data-dev="phone">📱 Handy</button><button class="ghost ${DEV !== 'phone' ? 'sel' : ''}" data-dev="pc">🖥️ PC</button></div></div>
    <div class="setrow"><span>Tagesziel</span><div>${[15, 30, 50, 100].map(v => `<button class="ghost ${S.goal === v ? 'sel' : ''}" data-goal="${v}">${v}</button>`).join('')}</div></div>
  </section>
  <section class="card"><h3>💾 Speichern & auf anderem Gerät weitermachen</h3>
    <p class="hint">Dein Fortschritt wird automatisch in diesem Browser gespeichert. Mit dem Code kannst du ihn z. B. vom PC aufs Handy übertragen.</p>
    <div class="row-end"><button class="ghost" id="exp">Code erzeugen</button><button class="ghost" id="imp">Code laden</button><button class="ghost danger" id="rst">Alles zurücksetzen</button></div>
    <textarea id="code" rows="3" placeholder="Hier erscheint dein Code bzw. hier Code einfügen"></textarea><div id="msg" class="hint"></div></section>`;
  view.querySelectorAll('.chip').forEach(b => b.onclick = () => openLex(b.dataset.id));
  view.querySelectorAll('[data-dev]').forEach(b => b.onclick = () => { setDevice(b.dataset.dev); prog(); });
  view.querySelectorAll('[data-goal]').forEach(b => b.onclick = () => { S.goal = +b.dataset.goal; save(); prog(); });
  $('#exp').onclick = () => { $('#code').value = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); $('#code').select(); $('#msg').textContent = 'Code kopieren und auf dem anderen Gerät unter „Code laden“ einfügen.'; };
  $('#imp').onclick = () => { try { const d = JSON.parse(decodeURIComponent(escape(atob($('#code').value.trim())))); if (!d.sk) throw 0; S = Object.assign(fresh(), d); save(); $('#msg').textContent = '✅ Fortschritt geladen!'; setTimeout(prog, 600); } catch (e) { $('#msg').textContent = '❌ Ungültiger Code.'; } };
  $('#rst').onclick = () => { const b = $('#rst'); if (b.dataset.c) { S = fresh(); save(); setTab('home'); } else { b.dataset.c = 1; b.textContent = 'Wirklich? Nochmal klicken'; } };
}

/* ===== Galerie: neue Beispiele ===== */
document.addEventListener('click', e => {
  const b = e.target.closest('.regal'); if (!b) return;
  const w = b.closest('h4').nextElementSibling; if (w) w.innerHTML = gallery(b.dataset.kind, b.dataset.key);
});

/* ===== Klausur-Modus ===== */
let EX = null;
const fmtT = ms => { ms = Math.max(0, ms); const s = Math.ceil(ms / 1000); return `⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const NOTE = p => p >= 92 ? [1, 'sehr gut'] : p >= 81 ? [2, 'gut'] : p >= 67 ? [3, 'befriedigend'] : p >= 50 ? [4, 'ausreichend'] : p >= 30 ? [5, 'mangelhaft'] : [6, 'ungenügend'];
let exOpt = { n: 30, scope: 'all', timed: false };
function examSetup() {
  cur = null; filter = null;
  const hist = (S.exams || []).slice(-8).reverse();
  const learned = S.intro.length;
  const grp = (k, vals) => vals.map(([v, l]) => `<button class="ghost ${exOpt[k] === v ? 'sel' : ''}" data-k="${k}" data-v="${v}">${l}</button>`).join('');
  view.innerHTML = `<section class="card examset"><h2>📝 Klausur-Modus</h2>
    <p>Kunterbunt aus allen Bereichen: Begriffe, Bilder, Muster, Indikatoren, Rechnen, Situationen. <b>Keine Erklärungen, keine Tipps, kein Richtig/Falsch</b> während der Klausur – die Auswertung mit Note kommt am Ende.</p>
    <div class="setrow"><span>Anzahl Fragen</span><div>${grp('n', [[20, '20'], [30, '30'], [50, '50'], [80, '80']])}</div></div>
    <div class="setrow"><span>Themen</span><div>${grp('scope', [['all', 'Alles (auch Neues)'], ['learned', `Nur Gelerntes (${learned})`]])}</div></div>
    <div class="setrow"><span>Zeitlimit</span><div>${grp('timed', [[false, 'Ohne'], [true, 'Mit (45 Sek./Frage)']])}</div></div>
    <button class="big go" id="exgo">Klausur starten</button>
    <p class="hint">Fehler aus der Klausur landen automatisch in deinem Training und in „Schwächen“.</p>
    ${hist.length ? `<h3>Letzte Klausuren</h3><div class="exhist">${hist.map(x => `<div><span>${x.d.split('-').reverse().join('.')}</span><span>${x.ok}/${x.n}</span><b class="n${x.note}">Note ${x.note}</b></div>`).join('')}</div>` : ''}
  </section>`;
  view.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k; exOpt[k] = k === 'n' ? +b.dataset.v : k === 'timed' ? b.dataset.v === 'true' : b.dataset.v; examSetup(); });
  $('#exgo').onclick = () => examStart();
}
function examStart() {
  let pool = Object.keys(SKILLS);
  if (exOpt.scope === 'learned' && S.intro.length >= 8) pool = S.intro.slice();
  const byMod = {}; pool.forEach(id => (byMod[SKILLS[id].mod] = byMod[SKILLS[id].mod] || []).push(id));
  Object.keys(byMod).forEach(m => byMod[m] = R.shuffle(byMod[m]));
  const mods = Object.keys(byMod), list = []; let last = null;
  while (list.length < exOpt.n) {
    const m = R.pick(mods.filter(x => x !== last).length ? mods.filter(x => x !== last) : mods);
    if (!byMod[m].length) byMod[m] = R.shuffle(pool.filter(id => SKILLS[id].mod === m));
    list.push(byMod[m].pop()); last = m;
  }
  EX = { list, i: 0, res: [], start: Date.now(), limit: exOpt.timed ? exOpt.n * 45e3 : 0 };
  if (EX.limit) EX.timer = setInterval(() => { const left = EX.limit - (Date.now() - EX.start); const t = $('#extime'); if (t) t.textContent = fmtT(left); if (left <= 0) examEnd(true); }, 500);
  examNext();
}
function examNext() { if (EX.i >= EX.list.length) return examEnd(); lastId = EX.list[EX.i]; showTask(EX.list[EX.i]); }
function examAnswer(good, your, correct, isTap) {
  const id = cur.id, g = cur.g;
  EX.res.push({ id, good, q: g.q, visual: isTap ? correct : g.visual, your, correct: isTap ? '' : correct, explain: g.explain, img: !!g.img });
  if (!S.intro.includes(id)) { S.intro.push(id); st(id); }
  grade(id, good ? 'ok' : 'bad', g.fmt);
  EX.i++;
  const t = $('.task'); if (t) t.classList.add('saved');
  setTimeout(examNext, 220);
}
function examStop() { if (EX && EX.timer) clearInterval(EX.timer); EX = null; }
function examEnd(timeUp) {
  const E = EX; examStop(); cur = null;
  const n = E.list.length, ok = E.res.filter(r => r.good).length, pct = Math.round(ok / n * 100), [note, nt] = NOTE(pct);
  S.exams = S.exams || []; S.exams.push({ d: today(), n, ok, pct, note }); save();
  const per = {}; E.res.forEach(r => { const m = SKILLS[r.id].mod; per[m] = per[m] || [0, 0]; per[m][1]++; if (r.good) per[m][0]++; });
  const unanswered = n - E.res.length;
  const item = (r, i) => `<details class="rev ${r.good ? 'ok' : 'bad'}" ${r.good ? '' : 'open'}><summary>${r.good ? '✅' : '❌'} <b>${i + 1}.</b> ${MODULES[SKILLS[r.id].mod].icon} ${SKILLS[r.id].name}</summary>
    <div class="q">${r.q}</div>${r.visual ? `<div class="vis">${r.visual}</div>` : ''}
    ${r.correct ? `<div class="ans"><div><small>Deine Antwort</small>${r.img ? `<div class="mini">${r.your}</div>` : `<b>${r.your}</b>`}</div><div><small>Richtig</small>${r.img ? `<div class="mini">${r.correct}</div>` : `<b>${r.correct}</b>`}</div></div>` : '<p class="hint">Gelb markiert = richtig, weißer Rahmen = dein Tipp.</p>'}
    <div class="ex">${r.explain}</div></details>`;
  view.innerHTML = `<section class="card summary"><h2>📝 Klausur-Ergebnis${timeUp ? ' <small>(Zeit abgelaufen)</small>' : ''}</h2>
    <div class="note n${note}">Note ${note}<small>${nt}</small></div>
    <div class="big-pct">${pct} %</div><p class="hint">${ok} von ${n} richtig${unanswered ? ` · ${unanswered} nicht beantwortet` : ''}</p>
    <div class="permod">${Object.entries(per).map(([m, [a, b]]) => `<div><span>${MODULES[m].icon} ${MODULES[m].name}</span><b>${a}/${b}</b><div class="pbar"><i class="${a / b >= .67 ? 'g' : 'y'}" style="width:${a / b * 100}%"></i></div></div>`).join('')}</div>
    <div class="row-end"><button class="ghost" id="exhome">Zur Übersicht</button><button class="ghost" id="exweak">🎯 Fehler trainieren</button><button class="go" id="exagain">Neue Klausur</button></div></section>
    <section class="card"><h3>Auswertung</h3><div class="row-end" style="justify-content:flex-start;margin:0 0 10px"><button class="ghost small sel" data-f="bad">Nur Fehler</button><button class="ghost small" data-f="all">Alle Fragen</button></div><div id="revlist"></div></section>`;
  const draw = f => { $('#revlist').innerHTML = E.res.map((r, i) => (f === 'all' || !r.good) ? item(r, i) : '').join('') || '<p>Keine Fehler – perfekt! 🏆</p>'; view.querySelectorAll('[data-f]').forEach(b => b.classList.toggle('sel', b.dataset.f === f)); };
  view.querySelectorAll('[data-f]').forEach(b => b.onclick = () => draw(b.dataset.f)); draw('bad');
  $('#exhome').onclick = () => setTab('home'); $('#exagain').onclick = examSetup; $('#exweak').onclick = () => startSession('weak');
  window.scrollTo(0, 0);
}

applyDevice();
setTab('home');
