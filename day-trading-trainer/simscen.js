/* =========================================================
   Chart-Simulator: viele zusätzliche Live-Situationen
   Jede Situation: { n, best, ok?, why, build() → { cs, lines?, ov?, rsi?, info? } }
   ========================================================= */
const SP = (an, n, opt = {}) => { const cs = pathCandles(jitter(an, opt.jx ?? .015, opt.jy ?? .03), n, { noise: opt.noise ?? R.rand(.018, .03), wick: opt.wick, range: opt.range }); addVolume(cs); return cs; };
const LV = (y, label, color = TV.lineLvl) => ({ y, color, label });
const lvl = (cs, f) => cs.base + cs.range * f;
const uOf = cs => avgBody(cs) * 1.4 || cs.range * .06;
function volSpike(cs, k, m) { const av = avgVol(cs, 0, cs.length - k); for (let i = cs.length - k; i < cs.length; i++) cs[i].v = av * m * R.rand(.85, 1.15); return cs; }
function volFade(cs, k, m) { for (let i = cs.length - k; i < cs.length; i++) cs[i].v *= m; return cs; }
function push(cs, o, c, up, lo, v) { cs.push({ o, c, h: Math.max(o, c) + up, l: Math.min(o, c) - lo, v: v ?? avgVol(cs, 0, cs.length) }); return cs; }
function addHammer(cs, bull = true) { const u = uOf(cs), p = cs[cs.length - 1].c, b = u * .35; const o = p - (bull ? u * .1 : -u * .1), c = o + (bull ? b : -b); return bull ? push(cs, o, c, b * .1, b * 3) : push(cs, o, c, b * 3, b * .1); }
function addConfirm(cs, dir) { const u = uOf(cs), p = cs[cs.length - 1].c; return push(cs, p, p + dir * u * R.rand(.7, 1.1), u * .1, u * .1); }
const timeInfo = t => `🕐 ${t}`;

const SIM2 = {
  vwap_long: { n: 'Rücksetzer an den VWAP im Aufwärtstrend', best: 'long', ok: ['wait'], why: 'Über dem VWAP sind Käufer am Drücker. Ein Rücksetzer an den VWAP mit Bestätigungskerze ist ein klassischer Long-Einstieg (Stop knapp unter VWAP).',
    build() { const cs = SP([[0, .15], [.25, .55], [.4, .45], [.6, .9], [.85, .62], [1, .6]], 48); addHammer(cs, true); addConfirm(cs, 1); return { cs, ov: 'vwap', info: 'Lila Linie = VWAP (Durchschnittspreis des Tages)' }; } },
  vwap_short: { n: 'Erholung an den VWAP im Abwärtstrend', best: 'short', ok: ['wait'], why: 'Unter dem VWAP dominieren Verkäufer. Die Erholung prallt am VWAP ab → Short mit Stop knapp darüber.',
    build() { const cs = SP(flipA([[0, .15], [.25, .55], [.4, .45], [.6, .9], [.85, .62], [1, .6]]), 48); addHammer(cs, false); addConfirm(cs, -1); return { cs, ov: 'vwap', info: 'Lila Linie = VWAP (Durchschnittspreis des Tages)' }; } },
  vwap_chop: { n: 'Kurs tanzt um den VWAP', best: 'wait', why: 'Der Kurs kreuzt den VWAP ständig – weder Käufer noch Verkäufer haben die Kontrolle. Kein Setup.',
    build() { return { cs: SP([[0, .5], [.1, .65], [.2, .4], [.32, .6], [.45, .38], [.58, .62], [.7, .42], [.84, .58], [1, .48]], 50, { noise: .04 }), ov: 'vwap', info: 'Lila Linie = VWAP' }; } },
  ema_pullback: { n: 'Rücksetzer an den EMA 20 im Trend', best: 'long', ok: ['wait'], why: 'Im intakten Aufwärtstrend wirkt der EMA 20 oft als dynamische Unterstützung. Bounce mit grüner Kerze → Long.',
    build() { const cs = SP([[0, .05], [.3, .4], [.4, .33], [.65, .75], [.75, .66], [.92, .95], [1, .82]], 52, { noise: .02 }); addConfirm(cs, 1); return { cs, ov: 'ema20' }; } },
  ema_short: { n: 'Abprall am EMA 20 im Abwärtstrend', best: 'short', ok: ['wait'], why: 'Im Abwärtstrend wirkt der fallende EMA 20 als Deckel. Abprall nach unten → Short.',
    build() { const cs = SP(flipA([[0, .05], [.3, .4], [.4, .33], [.65, .75], [.75, .66], [.92, .95], [1, .82]]), 52, { noise: .02 }); addConfirm(cs, -1); return { cs, ov: 'ema20' }; } },
  ema_chop: { n: 'Flacher EMA, kein Trend', best: 'wait', why: 'Der EMA ist flach und der Kurs kreuzt ihn ständig. Trendsignale sind hier Zufall.',
    build() { return { cs: SP(A.side, 50, { noise: .04 }), ov: 'ema20' }; } },
  orb_long: { n: 'Opening-Range-Breakout nach oben', best: 'long', ok: ['wait'], why: 'Die Spanne der ersten 30 Minuten wird mit hohem Volumen nach oben verlassen → beliebtes Day-Trading-Setup, Stop unter die Range-Mitte.',
    build() { const cs = SP([[0, .5], [.1, .8], [.2, .3], [.35, .78], [.5, .32], [.65, .75], [.8, .4], [.95, .72], [1, .7]], 30, { noise: .02 }); const hi = lvl(cs, .82), lo = lvl(cs, .28), u = uOf(cs); cs.forEach(k => { k.h = Math.min(k.h, hi); k.l = Math.max(k.l, lo); k.o = clamp(k.o, lo, hi); k.c = clamp(k.c, lo, hi); }); const p = cs[cs.length - 1].c; push(cs, p, hi + u * R.rand(.6, 1), u * .15, u * .1); volSpike(cs, 1, 3); return { cs, lines: [LV(hi, 'Range-Hoch'), LV(lo, 'Range-Tief')], info: timeInfo('10:02 – erste 30 Min. Handelsspanne (gelb) wurde gerade verlassen') }; } },
  orb_short: { n: 'Opening-Range-Breakout nach unten', best: 'short', ok: ['wait'], why: 'Die Spanne der ersten 30 Minuten wird mit Volumen nach unten verlassen → Short, Stop in die Range.',
    build() { const cs = SP([[0, .5], [.1, .8], [.2, .3], [.35, .78], [.5, .32], [.65, .75], [.8, .4], [.95, .35], [1, .32]], 30, { noise: .02 }); const hi = lvl(cs, .82), lo = lvl(cs, .28), u = uOf(cs); cs.forEach(k => { k.h = Math.min(k.h, hi); k.l = Math.max(k.l, lo); k.o = clamp(k.o, lo, hi); k.c = clamp(k.c, lo, hi); }); const p = cs[cs.length - 1].c; push(cs, p, lo - u * R.rand(.6, 1), u * .1, u * .15); volSpike(cs, 1, 3); return { cs, lines: [LV(hi, 'Range-Hoch'), LV(lo, 'Range-Tief')], info: timeInfo('10:01 – erste 30 Min. Handelsspanne (gelb) wurde gerade verlassen') }; } },
  open_chaos: { n: 'Chaos direkt nach Börseneröffnung', best: 'wait', why: 'In den ersten Minuten sind Spreads breit und Kerzen riesig. Für Anfänger: die ersten 5–15 Minuten nur beobachten.',
    build() { return { cs: SP([[0, .5], [.2, .9], [.35, .2], [.5, .85], [.7, .15], [.85, .7], [1, .45]], 12, { noise: .1, wick: .08 }), info: timeInfo('09:33 – Börse hat gerade geöffnet') }; } },
  lunch: { n: 'Mittagsflaute', best: 'wait', why: 'Mittags ist das Volumen oft sehr gering, Bewegungen sind zufällig und Ausbrüche scheitern häufig.',
    build() { const cs = SP([[0, .48], [.2, .55], [.4, .45], [.6, .53], [.8, .47], [1, .52]], 45, { noise: .03 }); volFade(cs, 45, .3); return { cs, info: timeInfo('12:40 – Mittagspause in den USA, kaum Volumen') }; } },
  gap_go: { n: 'Gap & Go nach guten Zahlen', best: 'long', ok: ['wait'], why: 'Gap nach oben mit Nachricht, der Kurs hält über der Eröffnung und bricht das Hoch der ersten Kerzen → Momentum-Long, Stop unter das Tagestief.',
    build() { const pre = SP([[0, .3], [.3, .5], [.6, .35], [1, .45]], 20, { noise: .03 }); const u = uOf(pre), gap = u * R.rand(3.5, 5.5); let p = pre[pre.length - 1].c + gap; const cs = pre.slice(); for (let i = 0; i < 8; i++) { const c = p + R.rand(-.3, .5) * u; push(cs, p, c, u * .3, u * .3, avgVol(pre, 0, 20) * 3); p = c; } push(cs, p, p + u * 1.2, u * .2, u * .1, avgVol(pre, 0, 20) * 4); return { cs, info: '📰 Aktie eröffnet mit Gap +6 % nach starken Quartalszahlen' }; } },
  gap_fill: { n: 'Gap wird geschlossen', best: 'short', ok: ['wait'], why: 'Das Gap nach oben hält nicht: Der Kurs fällt mit Volumen unter den Eröffnungskurs → Gap-Fill-Short Richtung Vortagesschluss.',
    build() { const pre = SP([[0, .3], [.3, .5], [.6, .35], [1, .45]], 20, { noise: .03 }); const u = uOf(pre), gap = u * R.rand(3, 4.5); let p = pre[pre.length - 1].c + gap; const open = p; const cs = pre.slice(); for (let i = 0; i < 7; i++) { const c = p - R.rand(.1, .5) * u; push(cs, p, c, u * .3, u * .3, avgVol(pre, 0, 20) * 2.5); p = c; } push(cs, p, open - u * 1.5, u * .1, u * .2, avgVol(pre, 0, 20) * 4); return { cs, lines: [LV(open, 'Eröffnung'), LV(pre[pre.length - 1].c, 'Vortagesschluss', '#94a3b8')], info: '📰 Gap +4 % ohne echte Nachricht' }; } },
  fakeout_short: { n: 'Fehlausbruch über Widerstand', best: 'short', ok: ['wait'], why: 'Der Kurs war kurz über dem Widerstand, fällt aber mit Volumen zurück in die Range → gefangene Käufer müssen verkaufen. Short mit Stop über dem Fehlausbruch-Hoch.',
    build() { const cs = SP([[0, .3], [.12, .62], [.25, .35], [.4, .62], [.55, .38], [.7, .6], [.82, .78], [.92, .62], [1, .5]], 46, { noise: .018 }); volSpike(cs, 2, 2.5); return { cs, lines: [LV(lvl(cs, .62), 'Widerstand')] }; } },
  breakdown: { n: 'Unterstützung bricht mit Volumen', best: 'short', ok: ['wait'], why: 'Mehrfach getestete Unterstützung bricht mit hohem Volumen → Short, Stop über der Bruchzone.',
    build() { const cs = SP([[0, .7], [.12, .38], [.25, .65], [.4, .38], [.55, .62], [.7, .38], [.85, .55], [.94, .4], [1, .25]], 46, { noise: .018 }); volSpike(cs, 1, 3); return { cs, lines: [LV(lvl(cs, .38), 'Unterstützung')] }; } },
  retest_short: { n: 'Retest einer gebrochenen Unterstützung von unten', best: 'short', ok: ['wait'], why: 'Alte Unterstützung ist jetzt Widerstand (Rollentausch). Der Kurs prallt beim Retest ab → Short.',
    build() { const cs = SP([[0, .75], [.15, .45], [.3, .7], [.45, .45], [.55, .2], [.7, .12], [.85, .43], [1, .38]], 46, { noise: .018 }); addHammer(cs, false); return { cs, lines: [LV(lvl(cs, .45), 'alte Unterstützung')] }; } },
  retest_long: { n: 'Retest eines gebrochenen Widerstands von oben', best: 'long', ok: ['wait'], why: 'Alter Widerstand ist jetzt Unterstützung. Der Kurs prallt beim Retest nach oben ab → Long.',
    build() { const cs = SP(flipA([[0, .75], [.15, .45], [.3, .7], [.45, .45], [.55, .2], [.7, .12], [.85, .43], [1, .38]]), 46, { noise: .018 }); addHammer(cs, true); addConfirm(cs, 1); return { cs, lines: [LV(lvl(cs, .55), 'alter Widerstand')] }; } },
  shooting_res: { n: 'Shooting Star am Widerstand im Abwärtstrend', best: 'short', ok: ['wait'], why: 'Abwärtstrend + Erholung bis zum Widerstand + Shooting Star = Verkäufer übernehmen wieder. Short mit Stop über dem Docht.',
    build() { const cs = SP([[0, .9], [.3, .5], [.45, .65], [.65, .25], [.85, .52], [1, .55]], 44); addHammer(cs, false); return { cs, lines: [LV(lvl(cs, .6), 'Widerstand')] }; } },
  hammer_nowhere: { n: 'Hammer ohne Unterstützung im starken Abwärtstrend', best: 'wait', why: 'Ein einzelner Hammer mitten im freien Fall, ohne Unterstützung und ohne Bestätigung, ist kein Kaufsignal.',
    build() { const cs = SP([[0, .95], [.3, .75], [.6, .45], [1, .1]], 40, { noise: .03 }); addHammer(cs, true); return { cs }; } },
  hammer_support: { n: 'Hammer an Unterstützung im Aufwärtstrend', best: 'long', ok: ['wait'], why: 'Trend aufwärts, Rücksetzer an bekannte Unterstützung, Hammer + grüne Bestätigung → sauberes Long-Setup.',
    build() { const cs = SP([[0, .1], [.2, .45], [.32, .32], [.5, .72], [.7, .45], [.82, .5], [1, .34]], 46); addHammer(cs, true); addConfirm(cs, 1); return { cs, lines: [LV(lvl(cs, .32), 'Unterstützung')] }; } },
  trend_change: { n: 'Abwärtstrend gebrochen, höheres Tief', best: 'long', ok: ['wait'], why: 'Die Abwärtstrendlinie ist gebrochen und es hat sich ein höheres Tief gebildet → mögliche Trendwende, Long mit Stop unter dem höheren Tief.',
    build() { const cs = SP([[0, .95], [.15, .7], [.22, .78], [.4, .35], [.48, .45], [.6, .1], [.72, .45], [.82, .28], [1, .6]], 50); return { cs }; } },
  parabolic: { n: 'Parabolischer Anstieg mit Riesenvolumen', best: 'wait', ok: ['short'], why: 'Senkrechter Anstieg, Klimax-Volumen und erster langer Docht oben. Kaufen ist hier gefährlich; Shorten gegen so ein Momentum ebenso – Profis warten auf Bestätigung.',
    build() { const cs = SP([[0, .05], [.5, .12], [.75, .3], [.9, .7], [1, 1]], 45, { noise: .03 }); volSpike(cs, 4, 4); addHammer(cs, false); return { cs, rsi: true }; } },
  htf: { n: 'Enge Konsolidierung nahe Tageshoch', best: 'long', ok: ['wait'], why: 'Starker Anstieg, danach nur eine sehr enge Pause knapp unter dem Hoch (Käufer geben nichts her). Ausbruch aus der Enge → Long.',
    build() { const cs = SP([[0, .05], [.4, .8], [.45, .78], [.55, .82], [.65, .78], [.75, .82], [.85, .79], [.95, .82], [1, .81]], 46, { noise: .012 }); volFade(cs, 20, .5); const u = uOf(cs), p = cs[cs.length - 1].c; push(cs, p, p + u * 1.6, u * .1, u * .05); volSpike(cs, 1, 2.5); return { cs, lines: [LV(lvl(cs, .84), 'Tageshoch')] }; } },
  dead_cat: { n: 'Kleine Erholung im starken Abwärtstrend', best: 'wait', ok: ['short'], why: 'Ein paar grüne Kerzen machen noch keine Wende („Dead Cat Bounce“). Long wäre gegen den Trend. Abwarten, bis die Erholung endet – dann eher Short.',
    build() { const cs = SP([[0, .95], [.4, .5], [.7, .15], [.8, .1], [1, .3]], 46); return { cs, ov: 'ema20' }; } },
  divergence: { n: 'Neues Hoch, aber RSI schwächer (Divergenz)', best: 'wait', ok: ['short'], why: 'Kurs macht ein höheres Hoch, der RSI nur ein tieferes → die Kraft lässt nach. Kein Long mehr! Short erst mit Bestätigung (Bruch nach unten).',
    build() { const cs = SP([[0, .1], [.35, .8], [.5, .5], [.75, .55], [.9, .7], [1, .92]], 55, { noise: .02 }); return { cs, rsi: true }; } },
  squeeze_wait: { n: 'Sehr enge Konsolidierung – noch kein Ausbruch', best: 'wait', why: 'Der Kurs zieht sich zusammen (Energie baut sich auf). Die Richtung ist aber noch offen – auf den Ausbruch warten.',
    build() { const cs = SP([[0, .3], [.15, .85], [.3, .2], [.45, .7], [.6, .35], [.72, .6], [.84, .45], [.92, .55], [1, .5]], 50, { noise: .015 }); return { cs }; } },
  squeeze_up: { n: 'Ausbruch aus enger Konsolidierung', best: 'long', ok: ['wait'], why: 'Nach dem Zusammenziehen bricht der Kurs mit Volumen nach oben aus → Long, Stop unter die Konsolidierung.',
    build() { const cs = SP([[0, .3], [.15, .85], [.3, .2], [.45, .7], [.6, .35], [.72, .6], [.84, .45], [.92, .55], [1, .52]], 50, { noise: .015 }); const u = uOf(cs), p = cs[cs.length - 1].c; push(cs, p, p + u * 1.8, u * .15, u * .05); volSpike(cs, 1, 3); return { cs }; } },
  squeeze_down: { n: 'Ausbruch aus enger Konsolidierung nach unten', best: 'short', ok: ['wait'], why: 'Nach dem Zusammenziehen bricht der Kurs mit Volumen nach unten aus → Short, Stop über die Konsolidierung.',
    build() { const cs = SP([[0, .7], [.15, .15], [.3, .8], [.45, .3], [.6, .65], [.72, .4], [.84, .55], [.92, .45], [1, .48]], 50, { noise: .015 }); const u = uOf(cs), p = cs[cs.length - 1].c; push(cs, p, p - u * 1.8, u * .05, u * .15); volSpike(cs, 1, 3); return { cs }; } },
  cross_trend: { n: 'Golden Cross nach Bodenbildung', best: 'long', ok: ['wait'], why: 'Nach sauberem Boden kreuzt der schnelle EMA den langsamen nach oben, der Kurs liegt über beiden → Trendwechsel-Long.',
    build() { const cs = SP([[0, .9], [.35, .2], [.5, .25], [.6, .18], [.8, .55], [1, .7]], 60, { noise: .02 }); return { cs, ov: 'ema9_21' }; } },
  cross_chop: { n: 'EMA-Kreuzung in der Seitwärtsphase', best: 'wait', why: 'In Seitwärtsphasen kreuzen sich die EMAs ständig – das sind Fehlsignale.',
    build() { return { cs: SP([[0, .5], [.15, .65], [.3, .4], [.45, .62], [.6, .38], [.75, .6], [.9, .42], [1, .58]], 60, { noise: .035 }), ov: 'ema9_21' }; } },
  lower_high: { n: 'Tieferes Hoch an alter Unterstützung', best: 'short', ok: ['wait'], why: 'Abwärtstrend mit tieferen Hochs; das neue Hoch scheitert genau an der alten Unterstützung (jetzt Widerstand) → Short.',
    build() { const cs = SP([[0, .9], [.15, .55], [.28, .75], [.45, .35], [.6, .58], [.72, .2], [.88, .42], [1, .38]], 50); return { cs, lines: [LV(lvl(cs, .4), 'alte Unterstützung')] }; } },
  overextended: { n: 'Weit vom EMA entfernt, 8 grüne Kerzen in Folge', best: 'wait', why: 'Der Kurs ist weit vom Durchschnitt weggelaufen („überdehnt“). Rücksetzer sind wahrscheinlich, Stop wäre weit weg → nicht hinterherkaufen.',
    build() { const cs = SP([[0, .2], [.6, .3], [.75, .35]], 40, { noise: .02 }); const u = uOf(cs); let p = cs[cs.length - 1].c; for (let i = 0; i < 8; i++) { const c = p + u * R.rand(.6, 1.1); push(cs, p, c, u * .1, u * .05); p = c; } return { cs, ov: 'ema20', rsi: true }; } },
  htf_against: { n: 'Kleiner Ausbruch gegen den großen Trend', best: 'wait', why: 'Im kleinen Zeitrahmen sieht es nach Ausbruch aus, aber im Tageschart herrscht ein klarer Abwärtstrend. Trades gegen den übergeordneten Trend scheitern häufiger.',
    build() { const b = breakoutChart(true); return { cs: b.cs, lines: [LV(b.line, 'Widerstand')], info: '📉 Tageschart: klarer Abwärtstrend seit Wochen, Kurs unter allen Durchschnitten' }; } },
  news_spike: { n: 'Eilmeldung – riesige Kerze', best: 'wait', why: 'Bei Eilmeldungen springen Kurse unkontrolliert, Spreads werden breit, Stops rutschen. Erst beruhigen lassen.',
    build() { const cs = SP([[0, .3], [1, .35]], 40, { noise: .02 }); const u = uOf(cs), p = cs[cs.length - 1].c, dir = R.chance(.5) ? 1 : -1; push(cs, p, p + dir * u * 6, u * 1.5, u * 1.5); volSpike(cs, 1, 8); return { cs, info: '🚨 Eilmeldung vor 30 Sekunden: Übernahmegerüchte' }; } },
  double_bottom_vol: { n: 'Doppelboden mit Volumen-Ausbruch', best: 'long', ok: ['wait'], why: 'Zwei Tiefs an derselben Unterstützung, jetzt Bruch der Nackenlinie mit Volumen → Long, Stop unter das zweite Tief.',
    build() { const cs = SP(A.doublebottom, 50, { noise: .016 }); volSpike(cs, 2, 2.8); return { cs, lines: [LV(lvl(cs, .55), 'Nackenlinie')] }; } },
  bull_flag_novol: { n: 'Flagge bricht aus – aber ohne Volumen', best: 'wait', why: 'Form passt, aber der Ausbruch hat kein Volumen. Lieber abwarten, ob Käufer nachkommen.',
    build() { const cs = buildForm('bullflag'); addVolume(cs); volFade(cs, 3, .35); return { cs }; } }
};

// Störfaktoren: machen aus einem guten Setup ein „Abwarten“
const SPOILERS = [
  { info: '🕐 15:52 – in 8 Minuten schließt die Börse', why: 'Day-Trader eröffnen kurz vor Handelsschluss keine neuen Positionen – keine Zeit mehr, der Trade müsste über Nacht gehalten werden.' },
  { info: '📅 In 2 Minuten kommen die US-Inflationsdaten (CPI)', why: 'Kurz vor wichtigen Wirtschaftsdaten springen Kurse unkontrolliert. Das schönste Chartbild ist dann egal.' },
  { info: '⚠️ Spread gerade 0,45 € statt sonst 0,02 €', why: 'Der Spread frisst einen großen Teil deines Risikos auf. Bei so breitem Spread nicht handeln.' },
  { info: '🛑 Du hast heute schon −2 % – dein Tageslimit ist erreicht', why: 'Tageslimit erreicht heißt: Feierabend. Egal wie gut das Setup aussieht – genau so schützt du dich vor Revenge Trading.' },
  { info: '😤 Du hattest gerade 3 Verlust-Trades hintereinander und bist wütend', why: 'Mit Wut im Bauch tradest du nicht nach Plan. Erst Pause machen.' }
];
function simScenario2() {
  const keys = Object.keys(SIM2), t = R.pick(keys), T = SIM2[t], b = T.build();
  const sc = { t, cs: b.cs, lines: b.lines || [], rsi: !!b.rsi, ov: b.ov, info: b.info || '', best: T.best, ok: T.ok || [], name: T.n, why: T.why };
  if (sc.best !== 'wait' && R.chance(.15)) { const s = R.pick(SPOILERS); sc.info = s.info + (sc.info ? ' · ' + sc.info : ''); sc.name += ' – aber: ' + s.info.replace(/^\S+\s/, ''); sc.why = s.why + ' (Das Setup an sich: ' + T.why + ')'; sc.origBest = sc.best; sc.best = 'wait'; sc.ok = []; }
  return sc;
}
function vwap(cs) { let pv = 0, v = 0; return cs.map(k => { const tp = (k.h + k.l + k.c) / 3; pv += tp * (k.v || 1); v += (k.v || 1); return pv / v; }); }
function simOverlays(ov, cs) {
  const c = cs.map(x => x.c);
  if (ov === 'vwap') return [{ values: vwap(cs), color: '#c084fc', label: 'VWAP' }];
  if (ov === 'ema20') return [{ values: EMA(c, 20), color: '#60a5fa', label: 'EMA 20' }];
  if (ov === 'ema9_21') return [{ values: EMA(c, 9), color: '#f5c542', label: 'EMA 9' }, { values: EMA(c, 21), color: '#60a5fa', label: 'EMA 21' }];
  return [];
}
