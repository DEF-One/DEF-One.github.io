/* =========================================================
   📈 Live-Chart (TradingView-Widget) + Such-Aufträge zum Üben
   ========================================================= */
const LIVE_SYMBOLS = [['KRAKEN:BTCEUR', 'BTC/EUR'], ['KRAKEN:ETHEUR', 'ETH/EUR'], ['KRAKEN:SOLEUR', 'SOL/EUR'], ['KRAKEN:XRPEUR', 'XRP/EUR'], ['BITSTAMP:BTCUSD', 'BTC/USD']];
const LIVE_TF = [['1', '1 Min'], ['5', '5 Min'], ['15', '15 Min'], ['60', '1 Std'], ['D', '1 Tag']];
const LIVE_IND = [['vwap', 'VWAP', 'VWAP@tv-basicstudies'], ['ema', 'EMA', 'MAExp@tv-basicstudies'], ['rsi', 'RSI', 'RSI@tv-basicstudies']];
const LIVE_TASKS = [
  ['c:hammer', 'Suche einen Hammer nach einem Rücksetzer.'], ['c:doji', 'Finde einen Doji – wo zögert der Markt?'], ['c:bullengulf', 'Suche ein Bullish Engulfing.'], ['c:bearengulf', 'Suche ein Bearish Engulfing.'],
  ['c:shootingstar', 'Finde einen Shooting Star nach einem Anstieg.'], ['b:sr', 'Zeichne gedanklich die nächste Unterstützung und den nächsten Widerstand ein. Wie oft wurden sie getestet?'],
  ['b:trend', 'Welcher Trend herrscht gerade in 5 Min – und welcher im 1-Stunden-Chart? Stimmen sie überein?'], ['b:break', 'Suche einen Ausbruch. War es ein echter Ausbruch oder ein Fehlausbruch?'],
  ['i:rsi', 'Schalte den RSI ein: Wann war er zuletzt über 70 oder unter 30 – und was passierte danach?'], ['i:volume', 'Schau aufs Volumen: Bei welchen großen Kerzen war das Volumen hoch?'],
  ['i:matrend', 'Schalte den EMA ein: Liegt der Kurs darüber oder darunter? Was sagt das über den Trend?'], ['f:doubletop', 'Gibt es in der letzten Zeit ein Doppeltop oder einen Doppelboden?'],
  ['f:bullflag', 'Suche eine Flagge nach einer starken Bewegung.'], ['f:symtri', 'Siehst du ein Dreieck, in dem sich der Kurs zusammenzieht?'], ['s:range_mid', 'Steht der Kurs gerade mitten in einer Range? Dann wäre jetzt „Abwarten“ richtig.']
];
let liveTask = null;
function liveCfg() { return S.live || (S.live = { sym: 'KRAKEN:BTCEUR', tf: '5', ind: [] }); }
function live() {
  cur = null; filter = null;
  const c = liveCfg(); c.ind = c.ind.filter(k => LIVE_IND.some(x => x[0] === k));
  if (!liveTask) liveTask = R.pick(LIVE_TASKS);
  const chip = (attr, val, label, on) => `<button class="ghost small ${on ? 'sel' : ''}" data-${attr}="${val}">${label}</button>`;
  view.innerHTML = `<section class="card live">
    <div class="liverow"><span class="lbl2">Markt</span>${LIVE_SYMBOLS.map(([v, l]) => chip('sym', v, l, c.sym === v)).join('')}</div>
    <div class="liverow"><span class="lbl2">Zeit</span>${LIVE_TF.map(([v, l]) => chip('tf', v, l, c.tf === v)).join('')}</div>
    <div class="liverow"><span class="lbl2">Indikatoren</span>${LIVE_IND.map(([k, l]) => chip('ind', k, l, c.ind.includes(k))).join('')}</div>
    <div id="tvbox" class="tvbox"></div>
    <div class="livetask"><div><b>🔎 Such-Auftrag:</b> ${liveTask[1]}</div><div class="row-end" style="margin-top:6px"><button class="ghost small" id="ltLesson">📖 ${SKILLS[liveTask[0]].name}</button><button class="ghost small" id="ltNext">🔄 Anderer Auftrag</button></div></div>
    <p class="hint">Live-Kurse von TradingView (Kryptobörse Kraken bzw. Bitstamp). Krypto wird rund um die Uhr gehandelt – ideal, um die Muster aus dem Trainer im echten Chart zu suchen. Nur zum Anschauen und Lernen, keine Anlageberatung.</p>
  </section>`;
  view.querySelectorAll('[data-sym]').forEach(b => b.onclick = () => { c.sym = b.dataset.sym; save(); live(); });
  view.querySelectorAll('[data-tf]').forEach(b => b.onclick = () => { c.tf = b.dataset.tf; save(); live(); });
  view.querySelectorAll('[data-ind]').forEach(b => b.onclick = () => { const k = b.dataset.ind; c.ind = c.ind.includes(k) ? c.ind.filter(x => x !== k) : c.ind.concat(k); save(); live(); });
  $('#ltLesson').onclick = () => openLex(liveTask[0], true);
  $('#ltNext').onclick = () => { let t; do { t = R.pick(LIVE_TASKS); } while (t === liveTask); liveTask = t; live(); };
  tvMount(c);
}
function tvMount(c) {
  const box = $('#tvbox'); if (!box) return;
  box.innerHTML = `<div class="tradingview-widget-container" style="height:100%;width:100%"><div class="tradingview-widget-container__widget" style="height:calc(100% - 24px);width:100%"></div>
    <div class="tradingview-widget-copyright"><a href="https://de.tradingview.com/" rel="noopener nofollow" target="_blank">Charts von TradingView</a></div></div>`;
  const s = document.createElement('script');
  s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
  s.async = true; s.type = 'text/javascript';
  s.textContent = JSON.stringify({
    autosize: true, symbol: c.sym, interval: c.tf, timezone: 'Europe/Berlin', theme: 'dark', style: '1', locale: 'de_DE',
    backgroundColor: 'rgba(15,21,28,1)', allow_symbol_change: true, hide_side_toolbar: DEV === 'phone', calendar: false,
    studies: LIVE_IND.filter(([k]) => c.ind.includes(k)).map(x => x[2]), support_host: 'https://www.tradingview.com'
  });
  box.querySelector('.tradingview-widget-container').appendChild(s);
}
