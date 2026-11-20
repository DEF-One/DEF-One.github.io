/* ===== Speicher ===== */
const KEY = 'dtt_v1';
const MIN = 60e3, DAY = 864e5;
const INT = [0, 10 * MIN, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 40 * DAY];
const MAXBOX = INT.length - 1;
let S = load();
function fresh() { return { sk: {}, intro: [], queue: [], n: 0, days: {}, ok: 0, bad: 0, seenWelcome: false }; }
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.sk) return Object.assign(fresh(), s); } catch (e) { } return fresh(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
const today = () => new Date().toISOString().slice(0, 10);
const st = id => S.sk[id] || (S.sk[id] = { box: 0, due: 0, ok: 0, bad: 0 });

/* ===== Planer (Spaced Repetition) ===== */
let filter = null, lastId = null;
const inF = id => !filter || SKILLS[id].mod === filter;
function pickNext() {
  const now = Date.now();
  // 1) Fehler aus dieser Sitzung kommen nach ein paar Aufgaben wieder
  const qi = S.queue.findIndex(q => q.at <= S.n && inF(q.id) && q.id !== lastId);
  if (qi >= 0) { const id = S.queue[qi].id; S.queue.splice(qi, 1); return { id }; }
  // 2) Fällige Wiederholungen
  const due = S.intro.filter(id => inF(id) && S.sk[id].box >= 1 && S.sk[id].due <= now && id !== lastId).sort((a, b) => S.sk[a].due - S.sk[b].due);
  if (due.length) return { id: due[0] };
  // 3) Neues lernen, wenn wenig gerade in der Lernphase ist
  const learning = S.intro.filter(id => inF(id) && S.sk[id].box <= 1).length;
  const nextNew = ORDER.find(id => inF(id) && !S.intro.includes(id));
  if (nextNew && (learning < 4 || !S.intro.some(inF))) { S.intro.push(nextNew); st(nextNew); return { id: nextNew, isNew: true }; }
  // 4) Freies Üben: schwächere Skills häufiger
  const pool = S.intro.filter(id => inF(id) && id !== lastId);
  if (!pool.length) return { id: S.intro.find(inF) };
  let tot = 0; const w = pool.map(id => { const x = 1 / Math.pow(S.sk[id].box + 1, 1.6) + (S.sk[id].bad > S.sk[id].ok ? .5 : 0); tot += x; return x; });
  let r = Math.random() * tot; for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return { id: pool[i] }; }
  return { id: pool[0] };
}
function grade(id, result) { // result: 'ok' | 'bad'
  const s = st(id), now = Date.now();
  S.n++; S.days[today()] = (S.days[today()] || 0) + 1;
  if (result === 'ok') { s.ok++; S.ok++; s.box = Math.min(s.box + 1, MAXBOX); s.due = now + INT[s.box]; }
  else {
    s.bad++; S.bad++; s.box = s.box >= 3 ? 1 : 0; s.due = now + INT[Math.max(1, s.box)];
    S.queue = S.queue.filter(q => q.id !== id); S.queue.push({ id, at: S.n + R.int(3, 5) });
  }
  s.last = now; save();
}

/* ===== UI ===== */
const $ = s => document.querySelector(s);
const view = $('#view');
let cur = null, answered = false, sess = { ok: 0, n: 0 };

function setTab(t) {
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  ({ home, lex, prog })[t]();
  window.scrollTo(0, 0);
}
document.querySelectorAll('nav button').forEach(b => b.onclick = () => setTab(b.dataset.t));

function counts(mod) {
  const ids = Object.keys(SKILLS).filter(id => !mod || SKILLS[id].mod === mod);
  const now = Date.now(); let neu = 0, lern = 0, sicher = 0, due = 0;
  ids.forEach(id => { if (!S.intro.includes(id)) neu++; else { const b = S.sk[id].box; if (b >= 3) sicher++; else lern++; if (b >= 1 && S.sk[id].due <= now) due++; } });
  return { total: ids.length, neu, lern, sicher, due: due + S.queue.filter(q => !mod || SKILLS[q.id].mod === mod).length };
}
function bar(c) { const t = c.total; return `<div class="pbar"><i class="g" style="width:${c.sicher / t * 100}%"></i><i class="y" style="width:${c.lern / t * 100}%"></i></div>`; }

function home() {
  filter = null; cur = null;
  if (!S.seenWelcome) return welcome();
  const c = counts(), streak = calcStreak(), td = S.days[today()] || 0;
  view.innerHTML = `
  <section class="card hero">
    <div class="stats">
      <div><b>${td}</b><span>heute geübt</span></div>
      <div><b>${c.due}</b><span>fällig</span></div>
      <div><b>${c.sicher}</b><span>sicher / ${c.total}</span></div>
      <div><b>${streak}🔥</b><span>Tage am Stück</span></div>
    </div>
    ${bar(c)}
    <div class="legend"><span class="g">■ sicher</span><span class="y">■ am Lernen</span><span>■ neu</span></div>
    <button class="big go" id="start">▶ Training starten</button>
    <p class="hint">Der Trainer mischt automatisch: Neues lernen, Fehler wiederholen, Fälliges auffrischen.</p>
  </section>
  <h3>Nur ein Bereich üben</h3>
  <div class="mods">${Object.entries(MODULES).map(([k, m]) => { const cc = counts(k); return `<button class="mod" data-m="${k}"><span class="ic">${m.icon}</span><span class="mn">${m.name}</span><span class="mc">${cc.sicher}/${cc.total} sicher${cc.due ? ` · <b>${cc.due} fällig</b>` : ''}</span>${bar(cc)}</button>`; }).join('')}</div>`;
  $('#start').onclick = () => startSession(null);
  view.querySelectorAll('.mod').forEach(b => b.onclick = () => startSession(b.dataset.m));
}
function welcome() {
  view.innerHTML = `<section class="card welcome">
  <h2>Willkommen beim Day-Trading-Trainer 👋</h2>
  <p>Du startest bei <b>null</b>. Der Trainer bringt dir Schritt für Schritt bei: Begriffe, Kerzen lesen, Muster erkennen, Indikatoren, Risiko berechnen und richtige Entscheidungen in typischen Situationen.</p>
  <ul><li>Bei jedem neuen Thema bekommst du erst eine <b>kurze Erklärung</b>, dann Aufgaben.</li>
  <li>Alle Charts werden <b>zufällig erzeugt</b> – du bekommst nie zweimal genau dieselbe Aufgabe.</li>
  <li><b>Fehler kommen wieder:</b> erst nach ein paar Aufgaben, später nach 10 Min., 1, 3, 7, 16 Tagen …</li>
  <li>Tastatur: <kbd>1</kbd>–<kbd>4</kbd> antworten, <kbd>Enter</kbd> weiter.</li></ul>
  <div class="warn">⚠️ <b>Ehrlich gesagt:</b> Die meisten privaten Day-Trader verlieren Geld. Dieser Trainer vermittelt Wissen, keine Anlageberatung, und Muster funktionieren nie garantiert. Übe danach mindestens einige Wochen in einem <b>Demokonto</b>, bevor du echtes Geld einsetzt – und nur Geld, dessen Verlust du verkraften kannst.</div>
  <button class="big go" id="ok">Los geht's</button></section>`;
  $('#ok').onclick = () => { S.seenWelcome = true; save(); startSession(null); };
}
function calcStreak() { let d = new Date(), n = 0; if (!S.days[today()]) d.setDate(d.getDate() - 1); while (S.days[d.toISOString().slice(0, 10)]) { n++; d.setDate(d.getDate() - 1); } return n; }

/* ===== Sitzung ===== */
function startSession(mod) { filter = mod; sess = { ok: 0, n: 0 }; next(); }
function topbar() {
  return `<div class="sbar"><button class="ghost" id="back">← Übersicht</button><span>${filter ? MODULES[filter].icon + ' ' + MODULES[filter].name : '🔀 Gemischtes Training'}</span><span class="sc">${sess.ok}/${sess.n} ✓</span></div>`;
}
function next() {
  const p = pickNext(); if (!p || !p.id) return home();
  lastId = p.id; save();
  if (p.isNew) return showLesson(p.id);
  showTask(p.id);
}
function showLesson(id) {
  const sk = SKILLS[id];
  view.innerHTML = topbar() + `<section class="card lesson"><div class="tag new">✨ Neu: ${MODULES[sk.mod].icon} ${MODULES[sk.mod].name}</div><h2>${sk.name}</h2>${sk.lesson()}<button class="big go" id="go">Verstanden – Aufgabe starten</button></section>`;
  $('#back').onclick = () => setTab('home');
  $('#go').onclick = () => showTask(id);
  cur = { lesson: true, id };
}
function showTask(id) {
  const sk = SKILLS[id]; let g;
  try { g = sk.gen(); } catch (e) { console.error(id, e); return next(); }
  let opts = null;
  if (g.type !== 'num') {
    opts = g.options.map((t, i) => ({ t, ok: i === g.correct, part: (g.ok || []).includes(i) }));
    if (!g.keepOrder) opts = R.shuffle(opts);
  }
  cur = { id, g, opts }; answered = false;
  const box = S.sk[id]?.box ?? 0;
  view.innerHTML = topbar() + `<section class="card task">
    <div class="tag">${MODULES[sk.mod].icon} ${MODULES[sk.mod].name}<span class="lvl" title="Lernstufe">${'●'.repeat(box)}${'○'.repeat(MAXBOX - box)}</span></div>
    <div class="q">${g.q}</div>
    ${g.visual ? `<div class="vis">${g.visual}</div>` : ''}
    ${g.type === 'num'
      ? `<div class="numrow"><input id="num" inputmode="decimal" autocomplete="off" placeholder="Deine Antwort"><span class="unit">${g.unit || ''}</span><button class="go" id="chk">Prüfen</button></div>`
      : `<div class="opts ${g.small ? 'small' : ''} ${opts.length === 2 ? 'two' : ''}">${opts.map((o, i) => `<button class="opt" data-i="${i}"><kbd>${i + 1}</kbd><span>${o.t}</span></button>`).join('')}</div>`}
    <div id="fb"></div>
  </section>`;
  $('#back').onclick = () => setTab('home');
  if (g.type === 'num') {
    const inp = $('#num'); inp.focus();
    $('#chk').onclick = checkNum; inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (!answered) checkNum(); else next(); } };
  } else view.querySelectorAll('.opt').forEach(b => b.onclick = () => choose(+b.dataset.i));
}
function choose(i) {
  if (answered) return; answered = true;
  const o = cur.opts[i], good = o.ok || o.part;
  view.querySelectorAll('.opt').forEach((b, j) => { b.disabled = true; const x = cur.opts[j]; if (x.ok) b.classList.add('right'); else if (x.part) b.classList.add('part'); if (j === i && !good) b.classList.add('wrong'); });
  feedback(good, o.part && !o.ok ? '🟡 Auch vertretbar' : null);
}
function parseNum(s) { s = String(s).trim().replace(/\s|€|%|R/gi, ''); if (/,/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); return parseFloat(s); }
function checkNum() {
  const v = parseNum($('#num').value); if (isNaN(v)) { $('#num').classList.add('shake'); setTimeout(() => $('#num').classList.remove('shake'), 400); return; }
  answered = true; const g = cur.g, good = Math.abs(v - g.answer) <= (g.tol || 0) + 1e-9;
  $('#num').disabled = true; $('#chk').disabled = true;
  feedback(good, null, `Richtige Antwort: <b>${fmt0(Math.round(g.answer * 100) / 100)} ${g.unit || ''}</b>`);
}
function feedback(good, label, extra = '') {
  grade(cur.id, good ? 'ok' : 'bad'); sess.n++; if (good) sess.ok++;
  $('.sbar .sc').textContent = `${sess.ok}/${sess.n} ✓`;
  const box = S.sk[cur.id].box;
  $('#fb').innerHTML = `<div class="fb ${good ? 'ok' : 'bad'}"><div class="fh">${label || (good ? '✅ Richtig!' : '❌ Leider falsch')}</div>${extra ? `<p>${extra}</p>` : ''}<div class="ex">${cur.g.explain}</div>
    <div class="nx"><button class="ghost" id="lessonBtn">💡 Thema: ${SKILLS[cur.id].name}</button>${good ? `<span>Nächste Wiederholung: ${nextTxt(box)}</span>` : '<span>🔁 Kommt gleich nochmal in neuer Variante dran.</span>'}<button class="go big" id="nextBtn">Weiter →</button></div></div>`;
  $('#lessonBtn').onclick = () => modal(SKILLS[cur.id].name, SKILLS[cur.id].lesson());
  $('#nextBtn').onclick = next; $('#nextBtn').focus({ preventScroll: true });
  $('#fb').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
const nextTxt = b => ['gleich', 'in ~10 Min.', 'morgen', 'in 3 Tagen', 'in 1 Woche', 'in 16 Tagen', 'in ~6 Wochen'][b];

document.addEventListener('keydown', e => {
  if ($('.modal')) { if (e.key === 'Escape') $('.modal').remove(); return; }
  if (!cur) return;
  if (e.target.tagName === 'INPUT') return;
  if (cur.lesson && e.key === 'Enter') { e.preventDefault(); return showTask(cur.id); }
  if (!answered && cur.opts && /^[1-9]$/.test(e.key) && +e.key <= cur.opts.length) choose(+e.key - 1);
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
function openLex(id) {
  const sk = SKILLS[id];
  modal(sk.name, `<div id="lx">${sk.lesson()}</div><div class="row-end">${['c', 'f', 'b', 'i'].includes(sk.mod) ? '<button class="ghost" id="regen">🔄 Neues Beispiel</button>' : ''}<button class="go" id="tryit">Jetzt üben</button></div>`);
  const rg = $('#regen'); if (rg) rg.onclick = () => $('#lx').innerHTML = sk.lesson();
  $('#tryit').onclick = () => { $('.modal').remove(); setTab('home'); filter = sk.mod; sess = { ok: 0, n: 0 }; if (!S.intro.includes(id)) { S.intro.push(id); st(id); save(); } lastId = id; showTask(id); };
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
  <section class="card"><h3>💾 Speichern & auf anderem Gerät weitermachen</h3>
    <p class="hint">Dein Fortschritt wird automatisch in diesem Browser gespeichert. Mit dem Code kannst du ihn auf ein anderes Gerät übertragen.</p>
    <div class="row-end"><button class="ghost" id="exp">Code erzeugen</button><button class="ghost" id="imp">Code laden</button><button class="ghost danger" id="rst">Alles zurücksetzen</button></div>
    <textarea id="code" rows="3" placeholder="Hier erscheint dein Code bzw. hier Code einfügen"></textarea><div id="msg" class="hint"></div></section>`;
  view.querySelectorAll('.chip').forEach(b => b.onclick = () => openLex(b.dataset.id));
  $('#exp').onclick = () => { $('#code').value = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); $('#code').select(); $('#msg').textContent = 'Code kopieren und auf dem anderen Gerät unter „Code laden“ einfügen.'; };
  $('#imp').onclick = () => { try { const d = JSON.parse(decodeURIComponent(escape(atob($('#code').value.trim())))); if (!d.sk) throw 0; S = Object.assign(fresh(), d); save(); $('#msg').textContent = '✅ Fortschritt geladen!'; setTimeout(prog, 600); } catch (e) { $('#msg').textContent = '❌ Ungültiger Code.'; } };
  $('#rst').onclick = () => { const b = $('#rst'); if (b.dataset.c) { S = fresh(); save(); setTab('home'); } else { b.dataset.c = 1; b.textContent = 'Wirklich? Nochmal klicken'; } };
}

setTab('home');
