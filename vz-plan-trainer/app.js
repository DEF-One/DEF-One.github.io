"use strict";
/* ==========================================================================
   VZ-Plan-Trainer · Ablauf, Auftrag, Analyse, Prüfung
   ========================================================================== */
LESSONS.push({t:'9 · Vollsperrung Hauptstraße mit Busverkehr + Umleitungsplan', p:{gN:2.0,pN:0,F:5.5,pS:0,gS:2.5,speed:50,vol:'hoch',oneway:false,len:18,wy1:4.8}});

function renderBrief() {
  const s = S;
  let where;
  if (s.wy1 <= s.gN + 0.001) where = `auf dem Gehweg vor dem Gebäude: <b>${fmt(s.len, 1)} m lang</b> und <b>${fmt(s.wy1)} m breit</b> (ab Hauswand)`;
  else if (s.pN && s.wy1 <= s.r0 + 0.001) where = `über den ganzen Gehweg bis in den Parkstreifen: <b>${fmt(s.len, 1)} m lang</b>, <b>${fmt(s.wy1)} m breit</b> ab Hauswand`;
  else where = `vom Gebäude über den Gehweg${s.pN ? ' und den Parkstreifen' : ''} bis <b>${fmt(Math.max(0, s.wy1 - s.r0))} m in die Fahrbahn</b>: <b>${fmt(s.len, 1)} m lang</b>, <b>${fmt(s.wy1)} m breit</b> ab Hauswand`;
  $('#brief').innerHTML = `<div class="ticket"><span>Auftrag VAO</span><b>${s.street} ${s.nr}</b>, ${s.city}</div>
  <p><b>Maßnahme:</b> ${s.reason}. Dauer ca. ${s.days} Arbeitstage, die Grube bleibt über Nacht offen (<b>AlD</b>).</p>
  <p><b>Arbeitsbereich:</b> ${where}.</p>
  <p>Erstelle einen RSA-21-konformen Verkehrszeichenplan mit Fußgänger- und Fahrzeugführung, Verkehrszeichen, Absperrgeräten und Warnleuchten.${R.veh === 'voll' ? ' <b>Wenn eine Vollsperrung nötig ist, gehört auch ein Umleitungsplan dazu.</b>' : ''}</p>`;
  const rows = [
    ['Verkehr', s.oneway ? 'Einbahnstraße (Fahrtrichtung Osten →)' : 'Zweirichtungsverkehr'],
    ['Zul. Höchstgeschwindigkeit', `${s.speed} km/h`],
    ['Verkehrsstärke', s.vol === 'hoch' ? 'hoch (Linienbus, Lieferverkehr)' : 'gering (Wohnstraße)'],
    ['Gehweg Nord (Baustellenseite)', fmt(s.gN) + ' m'],
    ['Parkstreifen Nord', s.pN ? fmt(s.pN) + ' m (Längsparken)' : '–'],
    ['Fahrbahn', fmt(s.F) + ' m'],
    ['Parkstreifen Süd', s.pS ? fmt(s.pS) + ' m' : '–'],
    ['Gehweg Süd', fmt(s.gS) + ' m'],
    ['Arbeitsbereich (L × B ab Hauswand)', `${fmt(s.len, 1)} × ${fmt(s.wy1)} m`],
  ];
  $('#facts').innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td><b>${r[1]}</b></td></tr>`).join('');
}

let QUIZ = [];
function renderQuiz() {
  const r = R;
  QUIZ = [
    {id:'restG', type:'num', q:'Restgehwegbreite neben dem Arbeitsbereich (m)', ans:r.restG, ex:r.ex.restG},
    {id:'ped', type:'sel', q:'Wie werden die Fußgänger geführt?', opts:PED_OPTS, ans:r.ped, ex:r.ex.ped},
    {id:'restF', type:'num', q:'Restfahrbahnbreite für den Fahrverkehr (m)', ans:r.rest, ex:r.ex.restF, tol:0.15},
    {id:'veh', type:'sel', q:'Wie wird der Fahrverkehr geführt?', opts:VEH_OPTS, ans:r.veh, ex:r.ex.veh},
    {id:'hv', type:'sel', q:'Ist ein Haltverbot (Z 283) nötig?', opts:{ja:'Ja', nein:'Nein'}, ans:r.needHV ? 'ja' : 'nein', ex:r.ex.hv},
    {id:'size', type:'sel', q:'Welche Verkehrszeichengrößen gelten hier?', opts:{'1':'Alles Größe 1 – Ronde 420 / Dreieck 630 mm','mix':'Dreiecke Größe 1 (630 mm), Ronden Größe 2 (600 mm)','2':'Alles Größe 2 – Ronde 600 / Dreieck 900 mm','3':'Alles Größe 3 – Ronde 750 / Dreieck 1260 mm'}, ans:r.size, ex:r.ex.size},
    {id:'z123', type:'sel', q:'In welchem Abstand vor der Arbeitsstelle steht Z 123 hier?', opts:{a:'10–30 m', b:'30–50 m', c:'50–70 m', d:'70–100 m'}, ans:{10:'a',30:'b',50:'c'}[r.z.a], ex:r.ex.z123},
  ];
  if (r.veh === 'voll') QUIZ.push({id:'uml', type:'sel', q:'Mit welchem Zeichen wird eine Umleitung angekündigt, und wie endet sie?', opts:{a:'Z 457.1 Umleitungsankündigung … Z 457.2 Ende der Umleitung', b:'Z 454 Umleitungswegweiser … Z 455.1', c:'Z 123 … Z 250', d:'Z 458 Planskizze … Z 455.1-30'}, ans:'a', ex:'Z 457.1 kündigt die Umleitung vor ihrem Beginn an. An jedem Abbiegepunkt folgt Z 455.1 bzw. Z 454 mit Pfeil, an Kreuzungen ohne Abbiegen Z 455.1-30 als Fortsetzung. Nach dem Wiedereinmünden steht Z 457.2. Alle Umleitungszeichen sind gelb mit schwarzer Schrift.'});
  $('#quiz').innerHTML = QUIZ.map(q => {
    let inp;
    if (q.type === 'num') inp = `<input type="number" step="0.05" id="q_${q.id}" placeholder="z. B. 1,30">`;
    else inp = `<select id="q_${q.id}"><option value="">– bitte wählen –</option>${Object.keys(q.opts).map(k => `<option value="${k}">${q.opts[k]}</option>`).join('')}</select>`;
    return `<div class="q" id="qq_${q.id}"><label>${q.q}</label>${inp}<div class="fb"></div></div>`;
  }).join('');
  $('#quizScore').textContent = '';
}
function checkQuiz() {
  let ok = 0;
  for (const q of QUIZ) {
    const el = $('#qq_' + q.id), v = $('#q_' + q.id).value;
    const good = q.type === 'num' ? (v !== '' && Math.abs(parseFloat(v.replace(',', '.')) - q.ans) <= (q.tol || 0.06)) : v === q.ans;
    el.classList.toggle('ok', good); el.classList.toggle('bad', !good);
    const right = q.type === 'num' ? `Richtig: <b>${fmt(q.ans)} m</b>. ` : (good ? '' : `Richtig: <b>${q.opts[q.ans]}</b>. `);
    el.querySelector('.fb').innerHTML = (good ? '✓ ' : '✗ ') + right + q.ex;
    if (good) ok++;
  }
  $('#quizScore').innerHTML = `<b>${ok} / ${QUIZ.length}</b> richtig`;
}

function showChecks() {
  let C = runChecks();
  if (R.veh === 'voll') C = C.concat(netChecks());
  const req = C.filter(c => !c.opt);
  const passed = req.filter(c => c.ok).length;
  const pct = Math.round(100 * passed / Math.max(1, req.length));
  const col = pct >= 90 ? 'var(--ok)' : pct >= 60 ? 'var(--warn)' : 'var(--bad)';
  $('#checks').innerHTML = `<div class="scorebox"><div class="score" style="color:${col}">${pct} %</div><div>${passed} von ${req.length} Anforderungen erfüllt${pct === 100 ? '<br><b>So könnte der Plan zur Behörde.</b>' : ''}</div></div>` +
    C.map(c => `<div class="chk ${c.opt ? 'opt' : (c.ok ? 'ok' : 'bad')}"><b>${c.opt ? 'ℹ' : (c.ok ? '✓' : '✗')} ${c.title}</b><small>${c.detail}</small></div>`).join('');
  $('#scoreBadge').textContent = `Letzte Prüfung: ${pct} %`;
}

function load(p) {
  S = makeScenario(p); R = solve(S);
  items = []; undoStack = []; sel = null; nextId = 1;
  N = null; ROUTES = {WE:[], EW:[]}; USIGNS = {WE:{}, EW:{}}; netDir = 'WE'; netShowSol = false;
  if (R.veh === 'voll') buildNetwork(S);
  baseSVG = drawBase();
  renderBrief(); renderQuiz(); render(); showInfo(null);
  $('#checks').innerHTML = '<p class="hint">Noch nicht geprüft.</p>';
  $('#solution').innerHTML = '';
  $('#showSol').checked = false;
  $('#scoreBadge').textContent = '';
  $('#netCard').classList.toggle('hidden', R.veh !== 'voll');
  $('#netSolChk').checked = false;
  closeSignPop();
  setNetUI();
  if (R.veh === 'voll') renderNet();
}
function setNetUI() {
  document.querySelectorAll('[data-ndir]').forEach(b => b.classList.toggle('on', b.dataset.ndir === netDir));
  document.querySelectorAll('[data-ntool]').forEach(b => b.classList.toggle('on', b.dataset.ntool === netTool));
}

function renderCatalog() {
  const list = [
    ['z123','Z 123','Arbeitsstelle'],['z121','Z 121','Einseitig verengte Fahrbahn'],['z208','Z 208','Vorrang des Gegenverkehrs'],['z308','Z 308','Vorrang vor dem Gegenverkehr'],
    ['z283','Z 283','Absolutes Haltverbot'],['z250','Z 250','Verbot für Fahrzeuge aller Art'],['z274','Z 274','Zul. Höchstgeschwindigkeit'],['zz1000','Zz 1000-12','Fußgänger Gehweg gegenüber benutzen'],
    ['u4571','Z 457.1','Umleitungsankündigung'],['u455.1-11','Z 455.1-11','Umleitung hier links'],['u455.1-21','Z 455.1-21','Umleitung hier rechts'],['u455.1-30','Z 455.1-30','Umleitung geradeaus'],
    ['u454-10','Z 454-10','Umleitungswegweiser links'],['u454-20','Z 454-20','Umleitungswegweiser rechts'],['u4572','Z 457.2','Ende der Umleitung'],['u458','Z 458','Planskizze'],
    ['bake','Z 605','Leitbake'],['bakewl','Z 605 + WL','Leitbake mit Warnleuchte'],['g100','Z 600','Absperrschrankengitter 100 mm'],['g250','Z 600','Absperrschrankengitter 250 mm'],
    ['lsa','LSA','Baustellen-Signalgeber'],['wlg','WL gelb','Warnleuchte gelb'],['wlr','WL rot','Warnleuchte rot'],
  ];
  $('#catalog').innerHTML = list.map(([c, n, t]) => `<div class="cat">${signIcon(c, 76)}<b>${n}</b><span>${t}</span></div>`).join('');
}

function init() {
  $('#lessonSel').innerHTML = LESSONS.map((l, i) => `<option value="${i}">${l.t}</option>`).join('') + '<option value="rand">Zufallssituation</option>';
  $('#lessonSel').onchange = e => { if (e.target.value === 'rand') load(randomParams()); else load(LESSONS[+e.target.value].p); };
  $('#btnRandom').onclick = () => { $('#lessonSel').value = 'rand'; load(randomParams()); };
  $('#btnQuiz').onclick = checkQuiz;
  $('#btnCheck').onclick = () => { showChecks(); $('#checks').scrollIntoView({behavior:'smooth', block:'start'}); };
  $('#btnSol').onclick = () => {
    $('#solution').innerHTML = '<h3>Musterlösung erklärt</h3>' + solutionText(S, R).replace('<h3 style="margin:0 0 6px">Musterlösung erklärt</h3>', '') + (R.veh === 'voll' ? '<h3>Umleitungsplan</h3>' + netSolutionText() : '');
    $('#showSol').checked = true; render();
    if (R.veh === 'voll') { netShowSol = true; $('#netSolChk').checked = true; renderNet(); }
  };
  $('#btnUndo').onclick = undo;
  $('#btnClear').onclick = () => { if (items.length) { snapshot(); items = []; render(); } };
  $('#showSol').onchange = () => render();
  $('#zoom').oninput = e => { zoom = +e.target.value; render(); };
  $('#nightChk').onchange = e => { night = e.target.checked; $('#mapwrap').classList.toggle('night', night); render(); };
  document.querySelectorAll('[data-ndir]').forEach(b => b.onclick = () => { netDir = b.dataset.ndir; closeSignPop(); setNetUI(); renderNet(); });
  document.querySelectorAll('[data-ntool]').forEach(b => b.onclick = () => { netTool = b.dataset.ntool; closeSignPop(); setNetUI(); renderNet(); });
  $('#netClear').onclick = () => { ROUTES[netDir] = []; USIGNS[netDir] = {}; closeSignPop(); renderNet(); };
  $('#netSolChk').onchange = e => { netShowSol = e.target.checked; renderNet(); };
  document.querySelectorAll('nav button').forEach(b => b.onclick = () => {
    document.querySelectorAll('nav button').forEach(x => x.classList.toggle('on', x === b));
    ['trainer','wissen','hilfe'].forEach(v => $('#v-' + v).classList.toggle('hidden', v !== b.dataset.view));
  });
  document.addEventListener('keydown', e => {
    if (['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { snapshot(); items = items.filter(i => i.id !== sel); sel = null; render(); e.preventDefault(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { undo(); e.preventDefault(); }
  });
  buildPalette(); initMapEvents(); renderCatalog();
  load(LESSONS[0].p);
}
init();
