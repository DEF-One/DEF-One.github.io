"use strict";
/* ==== VZ-Plan-Trainer · Szenario, Löser, Prüfung ==== */
const $ = s => document.querySelector(s);
const fmt = (v, d = 2) => (Math.round(v * 100) / 100).toFixed(d).replace('.', ',');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
let rnd = Math.random;
const pick = a => a[Math.floor(rnd() * a.length)];
const rr = (a, b, st = 0.1) => Math.round((a + rnd() * (b - a)) / st) * st;

const STREETS = ['Lindenstraße','Bahnhofstraße','Schulstraße','Gartenstraße','Hauptstraße','Kirchweg','Rosenstraße','Mühlweg','Bergstraße','Parkstraße','Ahornweg','Talstraße','Uhlandstraße','Schillerstraße','Kepplerstraße'];
const CITIES = ['70173 Stuttgart','70565 Stuttgart','71032 Böblingen','73728 Esslingen','71634 Ludwigsburg','70806 Kornwestheim','72072 Tübingen'];
const REASONS = ['Glasfaser-Hausanschluss: Kopfloch an der Fassade','Hausanschlussgrube Glasfaser vor dem Gebäude','Leitungsgraben vom Gebäude bis in die Fahrbahn','Glasfaser-Hausanschluss mit Querung bis zur Trasse','Muffengrube für Glasfaserkabel'];

/* ---------- Lektionen ---------- */
const LESSONS = [
 {t:'1 · Gehweg-Teilsperrung (Restgehweg reicht)', p:{gN:3.5,pN:0,F:6.5,pS:0,gS:2.5,speed:50,vol:'gering',oneway:false,len:12,wy1:1.8}},
 {t:'2 · Gehweg voll gesperrt → Notweg auf Parkstreifen', p:{gN:2.2,pN:2.0,F:6.5,pS:0,gS:2.5,speed:50,vol:'gering',oneway:false,len:15,wy1:2.2}},
 {t:'3 · Notweg auf breiter Fahrbahn, Begegnungsverkehr', p:{gN:2.0,pN:0,F:8.5,pS:2.0,gS:2.5,speed:50,vol:'hoch',oneway:false,len:10,wy1:2.0}},
 {t:'4 · Engstelle mit Vorrangregelung Z 208 / Z 308', p:{gN:2.5,pN:0,F:6.0,pS:0,gS:2.0,speed:30,vol:'gering',oneway:false,len:20,wy1:3.5}},
 {t:'5 · Wechselverkehr mit Baustellen-LSA', p:{gN:2.5,pN:0,F:6.5,pS:2.0,gS:2.5,speed:50,vol:'hoch',oneway:false,len:35,wy1:3.3}},
 {t:'6 · Schmale Straße → Vollsperrung + Umleitung', p:{gN:2.0,pN:0,F:5.0,pS:0,gS:2.0,speed:30,vol:'gering',oneway:false,len:14,wy1:4.5}},
 {t:'7 · Schmaler Gehweg, Einbahnstraße → Fußgänger gegenüber', p:{gN:1.6,pN:0,F:4.2,pS:0,gS:2.2,speed:30,vol:'gering',oneway:true,len:12,wy1:1.6}},
 {t:'8 · Einbahnstraße mit Parkstreifen, Graben bis in die Fahrbahn', p:{gN:2.5,pN:2.0,F:5.0,pS:0,gS:2.5,speed:30,vol:'gering',oneway:true,len:9,wy1:5.5}},
];

/* ---------- Elementtypen ---------- */
const TYPES = {
  move:{label:'Auswählen / Verschieben', grp:'Werkzeuge'},
  erase:{label:'Radierer', grp:'Werkzeuge'},
  z123:{label:'Z 123 Arbeitsstelle', grp:'Verkehrszeichen', sign:'z123', no:'123'},
  z121:{label:'Z 121 Einseitig verengte Fahrbahn', grp:'Verkehrszeichen', sign:'z121', no:'121'},
  z208:{label:'Z 208 Vorrang des Gegenverkehrs', grp:'Verkehrszeichen', sign:'z208', no:'208'},
  z308:{label:'Z 308 Vorrang vor dem Gegenverkehr', grp:'Verkehrszeichen', sign:'z308', no:'308'},
  z283:{label:'Z 283 Absolutes Haltverbot (+ Zz Zeitraum, Anfang/Ende)', grp:'Verkehrszeichen', sign:'z283', no:'283'},
  z250:{label:'Z 250 Verbot für Fahrzeuge aller Art', grp:'Verkehrszeichen', sign:'z250', no:'250'},
  z274:{label:'Z 274 Zulässige Höchstgeschwindigkeit', grp:'Verkehrszeichen', sign:'z274', no:'274'},
  z259:{label:'Zz 1000-12/-22 Fußgänger Gehweg gegenüber benutzen', grp:'Verkehrszeichen', sign:'zz1000', no:'1000-12'},
  lsa:{label:'Baustellen-LSA (Signalgeber mit Haltlinie)', grp:'Lichtsignal / Querung', sign:'lsa', no:'LSA'},
  flsa:{label:'Fußgänger-LSA / sichere Querungsstelle', grp:'Lichtsignal / Querung', sign:'flsa', no:'F-LSA'},
  bake:{label:'Leitbake Z 605', grp:'Absperrung', sign:'bake'},
  bakewl:{label:'Leitbake Z 605 mit gelber Warnleuchte', grp:'Absperrung', sign:'bakewl'},
  g100:{label:'Absperrschrankengitter 100 mm + Tastleiste (Gehweg) – Linie ziehen', grp:'Absperrung', sign:'g100', line:true},
  g250:{label:'Absperrschrankengitter 250 mm (Fahrbahn) – Linie ziehen', grp:'Absperrung', sign:'g250', line:true},
  wlg:{label:'Warnleuchte gelb, Dauerlicht', grp:'Leuchten', sign:'wlg'},
  wlr:{label:'Warnleuchte rot, Dauerlicht', grp:'Leuchten', sign:'wlr'},
};

/* ---------- Info-Karten zu jedem Element ---------- */
const INFO = {
  z123:{t:'Zeichen 123 – Arbeitsstelle', d:'Gefahrzeichen. Warnt vor der Arbeitsstelle und ist grundsätzlich anzuordnen, wenn sich die Arbeitsstelle unmittelbar auf den Verkehr auswirkt. Es steht rechts in Fahrtrichtung, für jede Anfahrrichtung, auch für Einbieger aus Seitenstraßen (dort mit Zz 1000-11/-21).', size:s=>s.speed<50?'Dreieck Größe 1: 630 mm (unter 50 km/h)':'Dreieck Größe 2: 900 mm (50–100 km/h)', pos:s=>{const z=z123Range(s);return `${z.a}–${z.b} m vor Beginn der Einengung (${z.why}), ±10 %.`;}},
  z121:{t:'Zeichen 121 – Einseitig verengte Fahrbahn', d:'Gefahrzeichen für die Einengung. Wird in den Regelplänen außerhalb geschwindigkeitsreduzierter Bereiche zusätzlich zu Z 123 gezeigt. Es ist in dieser Übung optional und wird nicht bewertet.', size:s=>s.speed<50?'Dreieck Größe 1: 630 mm':'Dreieck Größe 2: 900 mm', pos:()=>'Laut Tabelle B-1 i. d. R. 30–50 m vor der Engstelle.'},
  z208:{t:'Zeichen 208 – Vorrang des Gegenverkehrs', d:'Wer dieses Zeichen sieht, muss den Gegenverkehr durchlassen. Es steht für die Fahrtrichtung, auf deren Seite das Hindernis liegt. Nur zulässig, wenn die Engstelle höchstens 50 m lang und aus beiden Richtungen überschaubar ist und kein nennenswerter Rückstau entsteht.', size:()=>'Ronde Größe 2: 600 mm', pos:()=>'0–10 m vor der Engstelle (Tabelle B-1), rechts.'},
  z308:{t:'Zeichen 308 – Vorrang vor dem Gegenverkehr', d:'Gegenstück zu Z 208 für die andere Fahrtrichtung. Z 208 und Z 308 werden immer als Paar aufgestellt.', size:()=>'Quadrat Größe 2: 600 mm', pos:()=>'0–10 m vor der Engstelle (Tabelle B-1), rechts.'},
  z283:{t:'Zeichen 283 – Absolutes Haltverbot', d:'Hält den Bereich für Notweg, Verschwenkung oder Arbeitsraum frei. Zwingend mit Zusatzzeichen für den Zeitraum (Datum/Uhrzeit) und mit Anfang/Ende-Pfeilen. Viele Städte verlangen eine Vorlaufzeit von mindestens 72 h.', size:()=>'Ronde Größe 2: 600 mm', pos:()=>'Am Anfang und Ende des freizuhaltenden Bereichs, auf der Seite des Parkstreifens.'},
  z250:{t:'Zeichen 250 – Verbot für Fahrzeuge aller Art', d:'Vollsperrung der Fahrbahn. Bei Bedarf mit Zusatzzeichen, z. B. „Anlieger bis Baustelle frei“. Bei Vollsperrung ist ein Umleitungsplan Pflicht.', size:()=>'Ronde Größe 2: 600 mm', pos:()=>'An der Sperrstelle, auf der Querabsperrung oder unmittelbar davor.'},
  z274:{t:'Zeichen 274 – Zulässige Höchstgeschwindigkeit', d:'Innerorts in der Regel nicht nötig. Optional, wird in der Übung nicht bewertet.', size:()=>'Ronde Größe 2: 600 mm', pos:()=>'Laut Tabelle B-1 bei zweistreifigen Straßen 50–70 m vor der Arbeitsstelle.'},
  z259:{t:'Zusatzzeichen 1000-12 / 1000-22 – Fußgänger Gehweg gegenüber benutzen', d:'Leitet Fußgänger auf den gegenüberliegenden Gehweg, wenn weder Restgehweg noch Notweg möglich sind. 1000-12 ist linksweisend, 1000-22 rechtsweisend. Es wird am Absperrschrankengitter angebracht. Eine Überquerungshilfe ist zu prüfen (RSA 21, B 2.4.5).', size:()=>'Zusatzzeichen 600 × 330 mm (Größe 2)', pos:()=>'An beiden Enden der Gehwegsperrung bzw. am letzten sicheren Querungspunkt.'},
  lsa:{t:'Baustellen-Lichtsignalanlage', d:'Regelt den Wechselverkehr, wenn eine Vorrangregelung nicht ausreicht: Engstelle über 50 m, unübersichtlich oder Rückstau. Je Richtung ein Signalgeber mit Haltlinie. Im Antrag gehören ein Signallageplan und ein Signalzeitenplan dazu. Z 131 ist innerorts nach RSA 21 i. d. R. nicht mehr nötig.', size:()=>'–', pos:()=>'Rechts in Fahrtrichtung vor der Engstelle. Abstand der Haltlinien im Plan angeben.'},
  flsa:{t:'Fußgänger-LSA / Querungshilfe', d:'Sichere Querung, wenn Fußgänger auf die andere Straßenseite geführt werden. Ob sie nötig ist, hängt von Verkehrsstärke, Sicht und vorhandenen Querungsstellen ab (RSA 21, B 2.4.5).', size:()=>'–', pos:()=>'Am Übergang vom gesperrten zum gegenüberliegenden Gehweg.'},
  bake:{t:'Leitbake Zeichen 605', d:'Führt den Verkehr an der Arbeitsstelle vorbei. Regelgröße 1000 × 250 mm. Längsabsperrung innerorts mit höchstens 9 m Abstand. Bei Gegenverkehr doppelseitige Leitbaken. Leitbaken sind nur für die Fahrbahn gedacht, nicht für Gehwege.', size:()=>'1000 × 250 mm', pos:()=>'Längs: Abstand ≤ 9 m. Seitlicher Sicherheitsabstand zur Grube nach ASR A5.2: 0,30 m (30 km/h) / 0,50 m (50 km/h).'},
  bakewl:{t:'Leitbake Z 605 mit gelber Warnleuchte', d:'Für die Querabsperrung: mindestens 3 einseitige Leitbaken schräg gestaffelt (längs 1–2 m, quer 0,6–1 m), auf jeder eine gelbe Warnleuchte mit Dauerlicht.', size:()=>'1000 × 250 mm + Warnleuchte', pos:()=>'Am Beginn der Einengung, schräg vom Bordstein zur Leitbakenlinie.'},
  g100:{t:'Absperrschrankengitter 100 mm mit Tastleiste', d:'Absperrung im Geh- und Notwegbereich. Die untere Tastleiste ist für blinde Menschen mit dem Langstock ertastbar. Oberkante 1,00 m. Flatterband oder Warnband ist keine zulässige Absperrung.', size:()=>'Schrankenblatt 100 mm hoch, Gesamthöhe 1,00 m', pos:()=>'Lückenlos quer und längs zum Fußgängerbereich.'},
  g250:{t:'Absperrschrankengitter 250 mm', d:'Absperrung im Fahrbahnbereich, z. B. Querabsperrung bei Vollsperrung.', size:()=>'Schrankenblatt 250 mm hoch', pos:()=>'Über die ganze gesperrte Breite.'},
  wlg:{t:'Warnleuchte gelb (Dauerlicht)', d:'Macht Absperrungen bei Dunkelheit sichtbar. Bei Teilsperrungen gelb. Am Gehweg längs i. d. R. alle 9 m und an jeder Querabsperrung.', size:()=>'–', pos:()=>'Auf dem Absperrschrankengitter bzw. auf den Leitbaken.'},
  wlr:{t:'Warnleuchte rot (Dauerlicht)', d:'Nur bei Vollsperrung für den gesamten Fahrzeugverkehr: mindestens 5 rote Warnleuchten auf der Querabsperrung (RSA 21, A 3.5.4).', size:()=>'–', pos:()=>'Gleichmäßig über die gesperrte Fahrbahnbreite.'},
};

/* ============================================================
   Szenario & Löser
   ============================================================ */
let S = null, R = null, items = [], undoStack = [], sel = null, tool = 'move', lessonIdx = 0;

function makeScenario(p) {
  const s = Object.assign({}, p);
  s.street = s.street || pick(STREETS);
  s.nr = s.nr || (2 + Math.floor(rnd() * 60));
  s.city = s.city || pick(CITIES);
  s.reason = s.reason || pick(REASONS);
  s.days = s.days || (2 + Math.floor(rnd() * 12));
  s.wy1 = Math.round(s.wy1 * 100) / 100;
  s.x0 = 96; s.x1 = s.x0 + s.len; s.L = s.x1 + 96;
  s.r0 = s.gN + s.pN; s.r1 = s.r0 + s.F;
  s.yEnd = s.r1 + s.pS + s.gS;
  return s;
}

function randomParams() {
  const type = pick(['teil','park','fahrbahn','wechsel','wechsel','voll','eng','oneway']);
  const p = {speed: pick([30, 50, 50]), vol: pick(['gering','hoch']), oneway:false, pS: pick([0,0,2.0]), gS: rr(1.8, 3.5)};
  switch (type) {
    case 'teil': p.gN = rr(2.8,4.5); p.pN = pick([0,2.0]); p.F = rr(5.5,8.5); p.wy1 = rr(0.8, p.gN-1.0); p.len = rr(6,25,1); break;
    case 'park': p.gN = rr(1.8,2.6); p.pN = 2.0; p.F = rr(5.5,7.5); p.wy1 = p.gN; p.len = rr(8,30,1); break;
    case 'fahrbahn': p.gN = rr(1.8,2.6); p.pN = 0; p.F = rr(7.6,9.5); p.wy1 = p.gN; p.len = rr(6,25,1); break;
    case 'wechsel': p.gN = rr(2.0,3.0); p.pN = pick([0,0,2.0]); p.F = rr(5.8,7.0); p.wy1 = p.gN + p.pN + rr(0.4,1.6); p.len = rr(8,70,1); break;
    case 'voll': p.gN = rr(1.8,2.5); p.pN = 0; p.F = rr(4.5,5.6); p.wy1 = p.gN + rr(2.0,3.0); p.len = rr(6,20,1); break;
    case 'eng': p.gN = rr(1.5,1.9); p.pN = 0; p.F = rr(4.0,4.5); p.wy1 = p.gN; p.oneway = true; p.len = rr(6,20,1); break;
    case 'oneway': p.oneway = true; p.gN = rr(2.0,3.0); p.pN = pick([0,2.0]); p.F = rr(4.5,6.0); p.wy1 = p.gN + p.pN + rr(0,1.2); p.len = rr(6,30,1); break;
  }
  return p;
}

const PED_OPTS = {
  'rest':'Restgehweg reicht (≥ 1,30 m)',
  'rest-eng':'Restgehweg als kurze Engstelle (≥ 1,00 m, max. ca. 10 m lang)',
  'notweg-park':'Notweg auf dem Parkstreifen',
  'notweg-fahrbahn':'Notweg auf der Fahrbahn',
  'andere-seite':'Fußgänger auf die andere Straßenseite (Zz 1000-12/-22, sichere Querung)'
};
const VEH_OPTS = {
  'frei':'Fahrbahn bleibt voll nutzbar (nur Abgrenzung am Parkstreifen / keine Maßnahme)',
  'begegnung':'Begegnungsverkehr bleibt möglich (Restfahrbahn ≥ 6,00 m)',
  'begegnung-ausnahme':'Begegnungsverkehr nur ausnahmsweise (5,70 – 6,00 m)',
  'einstreifig':'Einbahnstraße bleibt einstreifig befahrbar (≥ 3,00 m)',
  'vorrang':'Wechselverkehr mit Vorrangregelung Z 208 / Z 308',
  'lsa':'Wechselverkehr mit Baustellen-Lichtsignalanlage',
  'voll':'Vollsperrung (Z 250) mit Umleitung'
};

function z123Range(s) {
  if (s.speed < 50) return {a:10, b:30, why:'Tabelle B-1 der RSA 21: bei zul. Höchstgeschwindigkeit unter 50 km/h 10–30 m'};
  if (s.vol === 'gering') return {a:30, b:50, why:'Regelplan B I/1 (Straße mit geringer Verkehrsstärke): 30–50 m'};
  return {a:50, b:70, why:'Tabelle B-1 der RSA 21: Straße mit zwei Fahrstreifen 50–70 m'};
}
function solve(s) {
  const SQ = s.speed >= 50 ? 0.5 : 0.3;
  const r0 = s.r0, r1 = s.r1;
  const intr = b => (b == null ? 0 : Math.max(0, b - r0));
  const r = {SQ, ex:{}};
  const workOut = s.wy1 > s.gN + 0.001;
  const bake0 = workOut ? s.wy1 + SQ : null;
  const rest0 = +(s.F - intr(bake0)).toFixed(2);
  const restG = +Math.max(0, s.gN - s.wy1).toFixed(2);
  r.restG = restG;
  const voll = rest0 < 3.0;
  let ped;
  const bN = s.wy1 + 1.55;
  if (restG >= 1.30) ped = 'rest';
  else if (restG >= 1.00 && s.len <= 10) ped = 'rest-eng';
  else if (voll) ped = 'andere-seite';
  else if (bN <= r0 + 0.001) ped = 'notweg-park';
  else if (s.F - intr(bN) >= 3.0) ped = 'notweg-fahrbahn';
  else ped = 'andere-seite';
  r.ped = ped;
  const notweg = ped.startsWith('notweg');
  r.notweg = notweg;
  r.bakeLine = notweg ? bN : bake0;
  r.intr = +intr(r.bakeLine).toFixed(2);
  r.rest = voll ? rest0 : +(s.F - r.intr).toFixed(2);
  let veh;
  if (voll) veh = 'voll';
  else if (r.intr <= 0) veh = 'frei';
  else if (s.oneway) veh = 'einstreifig';
  else if (r.rest >= 6.0) veh = 'begegnung';
  else if (r.rest >= 5.7) veh = 'begegnung-ausnahme';
  else veh = (s.len <= 50 && s.vol === 'gering') ? 'vorrang' : 'lsa';
  r.veh = veh;
  r.needBaken = r.bakeLine != null && veh !== 'voll';
  r.needHV = s.pN > 0 && (s.wy1 > s.gN + 0.001 || (r.bakeLine != null && r.bakeLine > s.gN));
  r.needZ123 = r.bakeLine != null || veh === 'voll';
  r.size = s.speed < 50 ? 'mix' : '2';
  r.z = z123Range(s);
  r.dirs = s.oneway ? ['E'] : ['W','E'];
  r.approach = s.oneway ? 'x0' : 'x1';

  /* --- Erklärtexte --- */
  const wIn = Math.max(0, s.wy1 - s.r0);
  r.ex.restG = restG > 0
    ? `Gehweg ${fmt(s.gN)} m − Arbeitsbereich ${fmt(s.wy1)} m = <b>${fmt(restG)} m</b> Restgehweg.`
    : `Der Arbeitsbereich (${fmt(s.wy1)} m ab Hauswand) ist mindestens so breit wie der Gehweg (${fmt(s.gN)} m). Restgehweg = <b>0,00 m</b>, der Gehweg ist komplett gesperrt.`;
  const pedEx = {
    'rest': `Restgehweg ${fmt(restG)} m ≥ 1,30 m (Regelmaß RSA 21, Teil B 2.4). Fußgänger bleiben auf dem Gehweg. Absperrung: Gitter 100 mm mit Tastleiste quer und längs, gelbe Warnleuchten.`,
    'rest-eng': `Restgehweg ${fmt(restG)} m liegt unter 1,30 m, aber über 1,00 m. Die Engstelle ist nur ${s.len} m lang (kurze Engstelle), das geht ausnahmsweise. Mit der Behörde abstimmen.`,
    'notweg-park': `Der Gehweg ist zu (Rest ${fmt(restG)} m < 1,30 m). Der Parkstreifen (${fmt(s.pN)} m) nimmt den Notweg auf: 1,30 m + 0,25 m Gitter/Leitbake = ${fmt(1.55)} m passen hinein. Dafür ist ein <b>Haltverbot Z 283</b> nötig, Bordstein mit Anrampung.`,
    'notweg-fahrbahn': `Der Gehweg ist zu (Rest ${fmt(restG)} m < 1,30 m). Der Notweg (1,30 m) liegt auf der Fahrbahn, abgegrenzt mit Gitter 100 mm und Leitbaken. Es bleiben ${fmt(s.F - Math.max(0, bN - s.r0))} m ≥ 3,00 m für den Fahrverkehr, also ist der Notweg möglich.`,
    'andere-seite': voll
      ? `Die Fahrbahn wird voll gesperrt und der Gehweg ist zu. Fußgänger werden auf den gegenüberliegenden Gehweg geleitet: Zusatzzeichen 1000-12/-22 „Gehweg gegenüber benutzen“ am Absperrschrankengitter am letzten sicheren Querungspunkt, dazu eine sichere Querungsstelle. Ein Notweg auf der gesperrten Fahrbahn ist in Absprache mit der Behörde auch denkbar.`
      : `Der Gehweg ist zu, und ein Notweg (1,55 m inkl. Absperrung) würde die Restfahrbahn unter 3,00 m drücken (${fmt(s.F - Math.max(0, bN - s.r0))} m). Fußgänger müssen deshalb auf die <b>andere Straßenseite</b>: Zusatzzeichen 1000-12/-22 „Gehweg gegenüber benutzen“ an beiden Enden am Gitter. Eine <b>Überquerungshilfe ist zu prüfen</b> (RSA 21, B 2.4.5), je nach Verkehr z. B. Fußgänger-LSA. Einige Länder (z. B. Bayern) leiten aus den Regelplänen dann eine LSA ab.`
  };
  r.ex.ped = pedEx[ped];
  let restEx;
  if (r.bakeLine == null) restEx = `Die Arbeitsstelle bleibt auf dem Gehweg. Die Fahrbahn bleibt voll: <b>${fmt(s.F)} m</b>.`;
  else {
    const parts = [];
    if (notweg) parts.push(`Arbeitsbereich bis ${fmt(s.wy1)} m + Notweg 1,30 m + 0,25 m Gitter/Leitbake → Leitbakenlinie bei ${fmt(r.bakeLine)} m ab Hauswand`);
    else parts.push(`Arbeitsbereich bis ${fmt(s.wy1)} m + Sicherheitsabstand S<sub>Q</sub> ${fmt(SQ)} m (ASR A5.2 bei ${s.speed} km/h) → Leitbakenlinie bei ${fmt(bake0)} m ab Hauswand`);
    parts.push(`Fahrbahn beginnt bei ${fmt(s.r0)} m (Gehweg${s.pN ? ' + Parkstreifen' : ''}) → Eingriff in die Fahrbahn ${fmt(voll ? intr(bake0) : r.intr)} m`);
    parts.push(`Restfahrbahn = ${fmt(s.F)} − ${fmt(voll ? intr(bake0) : r.intr)} = <b>${fmt(r.rest)} m</b>`);
    restEx = parts.join('<br>');
  }
  r.ex.restF = restEx;
  const vehEx = {
    'frei': r.bakeLine != null ? `Die Fahrbahn wird nicht eingeengt (Leitbakenlinie im Parkstreifen). Zur Fahrbahn trotzdem Leitbaken (max. 9 m Abstand) und eine Querabsperrung mit Leitbaken und gelben Warnleuchten.` : `Kein Eingriff in die Fahrbahn. Für den Fahrverkehr sind keine Maßnahmen nötig.`,
    'begegnung': `Restfahrbahn ${fmt(r.rest)} m ≥ 6,00 m (2 × 3,00 m Fahrstreifen). Begegnungsverkehr bleibt möglich.`,
    'begegnung-ausnahme': `Restfahrbahn ${fmt(r.rest)} m liegt zwischen 5,70 und 6,00 m. Begegnungsverkehr ist nur ausnahmsweise möglich (2 × 2,85 m), mit der Behörde abstimmen.`,
    'einstreifig': `Einbahnstraße: Restfahrbahn ${fmt(r.rest)} m ≥ 3,00 m reicht für einen Fahrstreifen.`,
    'vorrang': `Restfahrbahn ${fmt(r.rest)} m: weniger als 5,70 m, also kein Begegnungsverkehr, aber ≥ 3,00 m, also einstreifiger Wechselverkehr. Die Engstelle ist ${s.len} m lang (≤ 50 m), aus beiden Richtungen überschaubar, und bei ${s.vol}em Verkehr ist kein nennenswerter Rückstau zu erwarten. Deshalb reicht eine Vorrangregelung (RSA 21, B 2.3.4): <b>Z 208</b> für die Richtung mit dem Hindernis (Verkehr nach Westen, obere Seite), <b>Z 308</b> für die Gegenrichtung.`,
    'lsa': `Restfahrbahn ${fmt(r.rest)} m: unter 5,70 m, also kein Begegnungsverkehr, aber ≥ 3,00 m, also Wechselverkehr. ${s.len > 50 ? `Engstelle ${s.len} m lang (> ca. 50 m)` : `${s.vol === 'hoch' ? 'Hohe Verkehrsstärke' : ''}`}, deshalb <b>Baustellen-LSA</b> statt Vorrangschildern (Vorrang nur bei ≤ 50 m, überschaubar, ohne nennenswerten Rückstau). Z 131 ist innerorts nach RSA 21 nicht mehr nötig.`,
    'voll': `Restfahrbahn ${fmt(r.rest)} m < 3,00 m (Mindestbreite Wechselverkehr). Es bleibt nur die <b>Vollsperrung</b>: Querabsperrung mit Gitter 250 mm und mind. 5 <b>roten</b> Warnleuchten, Z 250, Z 123 aus beiden Richtungen und ein <b>Umleitungsplan</b> mit Umleitungsbeschilderung (Schritt 2b).`
  };
  r.ex.veh = vehEx[veh];
  r.ex.hv = r.needHV
    ? `Ja. Der Parkstreifen wird von ${notweg && !workOut ? 'Notweg / Leitbaken' : 'der Arbeitsstelle'} belegt. Vor und hinter dem Bereich je ein Z 283 mit Zusatzzeichen (Zeitraum, Anfang/Ende). In vielen Städten mind. 72 h vorher aufstellen.`
    : (s.pN > 0 ? 'Nein. Der Parkstreifen wird nicht gebraucht.' : 'Nein. Auf der Arbeitsseite gibt es keinen Parkstreifen.');
  r.ex.size = s.speed < 50
    ? `Bei ${s.speed} km/h gelten nach VwV-StVO unterschiedliche Größen je Form. <b>Dreiecke</b> (z. B. Z 123, Z 121) haben unter 50 km/h <b>Größe 1 = 630 mm</b>. <b>Ronden</b> (z. B. Z 283, Z 250, Z 208) haben über 20 bis 80 km/h <b>Größe 2 = 600 mm</b>.`
    : `Bei ${s.speed} km/h gilt für Dreiecke (50–100 km/h) und Ronden (über 20 bis 80 km/h) <b>Größe 2</b>: Z 123 als Dreieck 900 mm, Ronden 600 mm.`;
  r.ex.z123 = `${r.z.why}. Gemessen wird ab Beginn der Einengung, rechts in Fahrtrichtung, für <b>jede</b> Anfahrrichtung${s.oneway ? ' (hier Einbahnstraße: nur von Westen)' : ''}. Abweichungen von ±10 % sind laut RSA tolerierbar. Unterkante ≥ 2,20 m über dem Gehweg.${r.needZ123 ? '' : ' Bei reinen Gehwegarbeiten ist Z 123 nicht zwingend, viele Behörden verlangen es trotzdem.'}`;
  return r;
}

/* ---------- Anforderungen (für Prüfung & Musterlösung) ---------- */
function requirements(s, r) {
  const L = [];
  const qTop = Math.min(s.wy1, s.gN);
  if (r.ped === 'rest' || r.ped === 'rest-eng') {
    L.push({t:'g100',o:'v',c:s.x0,a:0,b:s.wy1,name:'Querabsperrung Gehweg (West)',wl:1});
    L.push({t:'g100',o:'v',c:s.x1,a:0,b:s.wy1,name:'Querabsperrung Gehweg (Ost)',wl:1});
    L.push({t:'g100',o:'h',c:s.wy1,a:s.x0,b:s.x1,name:'Längsabsperrung zum Restgehweg',wlGap:9});
  } else if (r.notweg) {
    L.push({t:'g100',o:'v',c:s.x0,a:0,b:qTop,name:'Querabsperrung Gehweg (West)',wl:1});
    L.push({t:'g100',o:'v',c:s.x1,a:0,b:qTop,name:'Querabsperrung Gehweg (Ost)',wl:1});
    L.push({t:'g100',o:'h',c:s.wy1,a:s.x0,b:s.x1,name:'Längsabsperrung Arbeitsbereich ↔ Notweg',wlGap:9});
    L.push({t:'g100',o:'h',c:s.wy1+1.3,a:s.x0,b:s.x1,name:'Längsabsperrung Notweg ↔ Fahrbahn (Gitter 100 mm)'});
  } else if (r.ped === 'andere-seite') {
    L.push({t:'g100',o:'v',c:s.x0,a:0,b:s.gN,name:'Querabsperrung Gehweg volle Breite (West)',wl:1});
    L.push({t:'g100',o:'v',c:s.x1,a:0,b:s.gN,name:'Querabsperrung Gehweg volle Breite (Ost)',wl:1});
  }
  if (r.veh === 'voll') {
    L.push({t:'g250',o:'v',c:s.x0-3,cMin:s.x0-15,cMax:s.x0,a:s.r0,b:s.r1,name:'Vollsperrung Fahrbahn (West)',wlr:5});
    L.push({t:'g250',o:'v',c:s.x1+3,cMin:s.x1,cMax:s.x1+15,a:s.r0,b:s.r1,name:'Vollsperrung Fahrbahn (Ost)',wlr:5});
  }
  return L;
}

/* ============================================================
   Musterlösung (Elemente)
   ============================================================ */
function buildSolution(s, r) {
  const out = [];
  const P = (t, x, y) => out.push({t, x:+x.toFixed(2), y:+y.toFixed(2)});
  const ySouthSign = s.r1 + s.pS + Math.min(0.6, s.gS * 0.4);
  const yNorthSign = s.gN * 0.75;
  // Gitter
  for (const q of requirements(s, r)) {
    if (q.o === 'v') out.push({t:q.t, x1:q.c, y1:q.a, x2:q.c, y2:q.b});
    else out.push({t:q.t, x1:q.a, y1:q.c, x2:q.b, y2:q.c});
    if (q.wl) P('wlg', q.c, q.b);
    if (q.wlr) { const n = Math.max(5, Math.ceil((q.b - q.a) / 1.0)); for (let i = 0; i < n; i++) P('wlr', q.c, q.a + (i + 0.5) * (q.b - q.a) / n); }
    if (q.wlGap) { const n = Math.ceil((q.b - q.a) / q.wlGap); for (let i = 1; i < n; i++) P('wlg', q.a + i * (q.b - q.a) / n, q.c); P('wlg', q.b, q.c); P('wlg', q.a, q.c); }
  }
  // Leitbaken
  if (r.needBaken) {
    const bl = r.bakeLine, yI = s.gN + 0.2;
    const n = Math.ceil(s.len / 9);
    for (let i = 0; i <= n; i++) P(i % 2 ? 'bake' : 'bakewl', s.x0 + i * s.len / n, bl);
    const k = Math.max(3, Math.ceil((bl - yI) / 0.9) + 1);
    for (let i = 1; i <= k; i++) {
      const y = bl - (i - 1) * (bl - yI) / (k - 1);
      P('bakewl', s.x1 + 0.3 + i * 1.5, y);
      P('bakewl', s.x0 - 0.3 - i * 1.5, y);
    }
  }
  // Z 123
  const zm = (r.z.a + r.z.b) / 2;
  if (r.dirs.includes('W')) P('z123', s.x1 + zm, yNorthSign);
  if (r.dirs.includes('E')) P('z123', s.x0 - zm, ySouthSign);
  if (r.veh === 'vorrang') { P('z208', s.x1 + 6, yNorthSign); P('z308', s.x0 - 6, ySouthSign); }
  if (r.veh === 'lsa') { P('lsa', s.x1 + 10, Math.max(0.3, s.r0 - 0.4)); P('lsa', s.x0 - 10, s.r1 + 0.4); }
  if (r.needHV) { P('z283', s.x0 - 12, s.gN * 0.9); P('z283', s.x1 + 12, s.gN * 0.9); }
  if (r.veh === 'voll') {
    P('z250', s.x0 - 6, ySouthSign); P('z250', s.x1 + 9, yNorthSign);
  }
  if (r.ped === 'andere-seite') {
    P('z259', s.x0 - 1.5, s.gN * 0.35); P('z259', s.x1 + 1.5, s.gN * 0.35);
    P('flsa', s.x0 - 20, (s.r0 + s.r1) / 2);
  }
  return out;
}

function solutionText(s, r) {
  const st = [];
  st.push(`<b>Fußgänger:</b> ${r.ex.ped}`);
  st.push(`<b>Fahrverkehr:</b> ${r.ex.restF}<br>${r.ex.veh}`);
  if (r.needBaken) st.push(`<b>Leitbaken:</b> Längsabsperrung entlang der Linie ${fmt(r.bakeLine)} m ab Hauswand, Abstand ≤ 9 m (${s.len} m Länge → mind. ${Math.ceil(s.len / 9) + 1} Leitbaken). Querabsperrung an ${s.oneway ? 'beiden Enden (Anfahrt von Westen)' : 'beiden Enden'}: mind. 3 einseitige Leitbaken schräg gestaffelt (längs 1–2 m, quer 0,6–1 m), jede mit gelber Warnleuchte.`);
  if (r.ped !== 'andere-seite' || true) st.push(`<b>Gehweg-Absperrung:</b> Absperrschrankengitter <b>100 mm mit Tastleiste</b>, denn blinde Fußgänger müssen es mit dem Langstock ertasten. Gelbe Warnleuchten an jeder Querabsperrung und längs i. d. R. alle 9 m. Flatterband ist nicht zulässig.`);
  if (r.dirs) st.push(`<b>Z 123 (${s.speed < 50 ? 'Größe 1, Dreieck 630 mm' : 'Größe 2, Dreieck 900 mm'}):</b> ${r.ex.z123}`);
  if (r.veh === 'vorrang') st.push(`<b>Vorrang:</b> Z 208 für den Verkehr nach Westen (Hindernis auf seiner Seite, er wartet), Z 308 für den Verkehr nach Osten. Beide 0–10 m vor der Engstelle (Tabelle B-1), so dass man die Engstelle überblickt.`);
  if (r.veh === 'lsa') st.push(`<b>LSA:</b> je ein Signalgeber mit Haltebalken vor der Engstelle, rechts in Fahrtrichtung. Im echten Plan den Abstand der Haltebalken (hier ca. ${s.len + 20} m) angeben und die Räumzeit beachten.`);
  if (r.needHV) st.push(`<b>Haltverbot:</b> ${r.ex.hv}`);
  if (r.veh === 'voll') st.push(`<b>Vollsperrung:</b> Gitter 250 mm über die volle Fahrbahnbreite an beiden Enden, je mind. 5 <b>rote</b> Warnleuchten, Z 250 an der Sperrstelle, dazu der Umleitungsplan (Schritt 2b).`);
  if (r.ped === 'andere-seite') st.push(`<b>Querung:</b> Zusatzzeichen 1000-12 / 1000-22 „Fußgänger Gehweg gegenüber benutzen“ an beiden Enden am Absperrschrankengitter. Überquerungshilfe prüfen und vorsehen (Fußgänger-LSA / Querungshilfe; bei Vollsperrung ggf. an den Knoten).`);
  st.push(`<b>Größe der Schilder:</b> ${r.ex.size}`);
  return '<h3 style="margin:0 0 6px">Musterlösung erklärt</h3><ol>' + st.map(x => `<li>${x}</li>`).join('') + '</ol>';
}

/* ============================================================
   Prüfung
   ============================================================ */
function pts(types) { return items.filter(i => types.includes(i.t) && i.x != null); }
function lines(t) { return items.filter(i => i.t === t && i.x1 != null); }

function coverage(q, t) {
  const tol = q.o === 'h' ? 0.5 : 1.5;
  const cMin = q.cMin != null ? q.cMin : q.c - tol, cMax = q.cMax != null ? q.cMax : q.c + tol;
  const iv = [];
  let found = null;
  for (const l of lines(t)) {
    const hor = Math.abs(l.y1 - l.y2) < 0.01;
    if ((q.o === 'h') !== hor) continue;
    const c = hor ? l.y1 : l.x1;
    if (c < cMin || c > cMax) continue;
    let a = hor ? Math.min(l.x1, l.x2) : Math.min(l.y1, l.y2);
    let b = hor ? Math.max(l.x1, l.x2) : Math.max(l.y1, l.y2);
    a = Math.max(a, q.a); b = Math.min(b, q.b);
    if (b > a) { iv.push([a, b]); found = c; }
  }
  iv.sort((u, v) => u[0] - v[0]);
  let tot = 0, cur = null;
  for (const [a, b] of iv) {
    if (!cur) cur = [a, b];
    else if (a <= cur[1]) cur[1] = Math.max(cur[1], b);
    else { tot += cur[1] - cur[0]; cur = [a, b]; }
  }
  if (cur) tot += cur[1] - cur[0];
  return {f: tot / Math.max(0.01, q.b - q.a), c: found};
}

function maxGap(xs, a, b) {
  const arr = [a, ...xs.filter(x => x >= a - 0.01 && x <= b + 0.01).sort((u, v) => u - v), b];
  let g = 0; for (let i = 1; i < arr.length; i++) g = Math.max(g, arr[i] - arr[i - 1]);
  return g;
}

function runChecks() {
  const s = S, r = R, C = [];
  const add = (ok, title, detail, opt = false) => C.push({ok, title, detail, opt});
  const top = i => i.y < s.r0, bot = i => i.y > s.r1;

  // Z 123
  for (const d of r.dirs) {
    const za = r.z.a * 0.9, zb = r.z.b * 1.1;
    const want = d === 'W' ? [s.x1 + za, s.x1 + zb] : [s.x0 - zb, s.x0 - za];
    const side = d === 'W' ? top : bot;
    const all = pts(['z123']);
    const good = all.filter(i => side(i) && i.x >= want[0] && i.x <= want[1]);
    const dirTxt = d === 'W' ? 'Verkehr nach Westen (kommt von Osten, Schild oben)' : 'Verkehr nach Osten (kommt von Westen, Schild unten)';
    let detail;
    if (good.length) detail = `Steht ${fmt(d === 'W' ? good[0].x - s.x1 : s.x0 - good[0].x, 1)} m vor der Arbeitsstelle, richtige Seite.`;
    else {
      const near = all.filter(side);
      if (near.length) { const dist = d === 'W' ? near[0].x - s.x1 : s.x0 - near[0].x; detail = `Ein Z 123 steht auf der richtigen Seite, aber ${fmt(dist, 1)} m vor der Arbeitsstelle. Hier gefordert: <b>${r.z.a}–${r.z.b} m</b> (${r.z.why}).`; }
      else if (all.length) detail = 'Z 123 steht auf der falschen Straßenseite. Schilder gehören rechts in Fahrtrichtung.';
      else detail = 'Fehlt. Jede Anfahrrichtung braucht ein Z 123.';
    }
    if (r.needZ123) add(good.length > 0, `Z 123 für ${dirTxt}`, detail);
    else add(good.length > 0 ? true : null, `Z 123 für ${dirTxt} (empfohlen)`, good.length ? detail : 'Bei reinen Gehwegarbeiten nicht zwingend. Viele Behörden verlangen es trotzdem.', true);
  }

  // Gitter
  for (const q of requirements(s, r)) {
    const cv = coverage(q, q.t);
    const other = coverage(q, q.t === 'g100' ? 'g250' : 'g100');
    let ok = cv.f >= 0.85, detail;
    if (ok) detail = `Abgedeckt (${Math.round(Math.min(1, cv.f) * 100)} %).`;
    else if (other.f >= 0.85) detail = `Die Lage stimmt, aber der Gittertyp ist falsch: hier gehört <b>${q.t === 'g100' ? 'Gitter 100 mm mit Tastleiste (Gehweg/Notweg)' : 'Gitter 250 mm (Fahrbahn)'}</b> hin.`;
    else if (cv.f > 0) detail = `Nur ${Math.round(cv.f * 100)} % der nötigen Länge (${fmt(q.b - q.a, 1)} m) sind abgedeckt.`;
    else detail = q.o === 'v'
      ? `Fehlt. Senkrechte Linie ${q.c < s.x0 + 1 ? 'am Westende' : 'am Ostende'} der Arbeitsstelle, von ${fmt(q.a)} bis ${fmt(q.b)} m ab Hauswand.`
      : `Fehlt. Waagerechte Linie bei ${fmt(q.c)} m ab Hauswand, über die ganze Länge der Arbeitsstelle.`;
    add(ok, q.name + (q.t === 'g250' ? ' – Gitter 250 mm' : ' – Gitter 100 mm'), detail);
    const xC = cv.c != null ? cv.c : q.c;
    if (q.wl) {
      const n = pts(['wlg','bakewl']).filter(i => Math.abs(i.x - xC) <= 1.2 && i.y >= q.a - 0.6 && i.y <= q.b + 0.6).length;
      add(n >= q.wl, `Gelbe Warnleuchte an „${q.name}“`, n >= q.wl ? `${n} vorhanden.` : 'Fehlt. An jede Querabsperrung gehört mindestens eine gelbe Warnleuchte (AlD, Nacht).');
    }
    if (q.wlr) {
      const n = pts(['wlr']).filter(i => Math.abs(i.x - xC) <= 1.5 && i.y >= q.a - 0.6 && i.y <= q.b + 0.6).length;
      const ng = pts(['wlg','bakewl']).filter(i => Math.abs(i.x - xC) <= 1.5 && i.y >= q.a - 0.6 && i.y <= q.b + 0.6).length;
      add(n >= 5, `Rote Warnleuchten an „${q.name}“`, n >= 5 ? `${n} rote Warnleuchten.` : (ng && !n ? 'Bei Vollsperrung sind <b>rote</b> Warnleuchten nötig, nicht gelbe.' : `Nur ${n} rote Warnleuchten. Bei Vollsperrung mind. 5 rote Dauerlicht-Warnleuchten auf der Absperrung (RSA 21, A 3.5.4).`));
    }
    if (q.wlGap) {
      const xs = pts(['wlg','bakewl']).filter(i => Math.abs(i.y - q.c) <= 0.6).map(i => i.x);
      const g = maxGap(xs, q.a, q.b);
      add(g <= q.wlGap + 0.6, `Warnleuchten längs „${q.name}“ (Abstand ≤ 9 m)`, g <= q.wlGap + 0.6 ? `Größte Lücke ${fmt(g, 1)} m.` : `Größte Lücke ${fmt(g, 1)} m. Längs i. d. R. alle 9 m eine gelbe Warnleuchte, auch an den Ecken.`);
    }
  }

  // Leitbaken
  if (r.needBaken) {
    const bl = r.bakeLine;
    const bk = pts(['bake','bakewl']);
    const long = bk.filter(i => Math.abs(i.y - bl) <= 0.6 && i.x >= s.x0 - 1 && i.x <= s.x1 + 1).map(i => i.x);
    const g = maxGap(long, s.x0, s.x1);
    const wrongY = bk.filter(i => i.x >= s.x0 && i.x <= s.x1 && Math.abs(i.y - bl) > 0.6);
    add(g <= 9.3, 'Längsabsperrung mit Leitbaken (Abstand ≤ 9 m)',
      g <= 9.3 ? `${long.length} Leitbaken auf der Linie ${fmt(bl)} m, größte Lücke ${fmt(g, 1)} m.`
               : (long.length ? `Größte Lücke ${fmt(g, 1)} m. Innerorts max. 9 m (RSA 21, früher 10 m).` : `Fehlt. Leitbaken gehören auf die Linie ${fmt(bl)} m ab Hauswand${wrongY.length ? ` (deine stehen bei ${fmt(wrongY[0].y)} m, also falsche Breite)` : ''}.`));
    const ends = [{n:'Ostende', a:s.x1 - 0.5, b:s.x1 + 15, appr: r.approach === 'x1'}, {n:'Westende', a:s.x0 - 15, b:s.x0 + 0.5, appr: r.approach === 'x0'}];
    for (const e of ends) {
      const z = bk.filter(i => i.x >= e.a && i.x <= e.b && i.y >= s.gN - 0.5 && i.y <= bl + 0.8);
      const wl = pts(['bakewl','wlg']).filter(i => i.x >= e.a && i.x <= e.b && i.y >= s.gN - 0.5 && i.y <= bl + 0.8).length;
      const need = (e.appr || !s.oneway) ? 3 : 1;
      add(z.length >= need && wl >= need, `Querabsperrung zur Fahrbahn am ${e.n}${e.appr ? ' (Anfahrseite)' : ''}`,
        (z.length >= need && wl >= need) ? `${z.length} Leitbaken, ${wl} gelbe Warnleuchten.` :
        `${z.length} Leitbaken / ${wl} Warnleuchten gefunden. Nötig: mind. ${need} einseitige Leitbaken schräg gestaffelt vom Bordstein bis zur Leitbakenlinie (längs 1–2 m, quer 0,6–1 m), jede mit gelber Warnleuchte.`);
    }
  }

  // Vorrang / LSA
  if (r.veh === 'vorrang') {
    const a = pts(['z208']).filter(i => top(i) && i.x >= s.x1 - 0.5 && i.x <= s.x1 + 11);
    const b = pts(['z308']).filter(i => bot(i) && i.x >= s.x0 - 11 && i.x <= s.x0 + 0.5);
    const swapped = pts(['z308']).some(top) || pts(['z208']).some(bot);
    add(a.length > 0, 'Z 208 für den Verkehr nach Westen (Hindernis auf seiner Seite)', a.length ? 'Richtig.' : (swapped ? 'Z 208 und Z 308 sind vertauscht. Warten muss, wer das Hindernis auf seiner Fahrbahnseite hat.' : 'Fehlt oder falscher Abstand. Laut Tabelle B-1 steht Z 208 0–10 m vor der Engstelle: oben, östlich.'));
    add(b.length > 0, 'Z 308 für den Verkehr nach Osten', b.length ? 'Richtig.' : 'Fehlt oder falscher Abstand. Laut Tabelle B-1 steht Z 308 0–10 m vor der Engstelle: unten, westlich.');
  }
  if (r.veh === 'lsa') {
    const a = pts(['lsa']).filter(i => top(i) && i.x >= s.x1 + 1 && i.x <= s.x1 + 30);
    const b = pts(['lsa']).filter(i => bot(i) && i.x >= s.x0 - 30 && i.x <= s.x0 - 1);
    add(a.length > 0, 'Signalgeber LSA für den Verkehr nach Westen', a.length ? 'Richtig.' : 'Fehlt. Rechts in Fahrtrichtung (oben), kurz vor der Engstelle auf der Ostseite.');
    add(b.length > 0, 'Signalgeber LSA für den Verkehr nach Osten', b.length ? 'Richtig.' : 'Fehlt. Unten, kurz vor der Engstelle auf der Westseite.');
  }
  // Haltverbot
  if (r.needHV) {
    const a = pts(['z283']).filter(i => top(i) && i.x >= s.x0 - 25 && i.x <= s.x0 - 2);
    const b = pts(['z283']).filter(i => top(i) && i.x >= s.x1 + 2 && i.x <= s.x1 + 25);
    add(a.length > 0 && b.length > 0, 'Haltverbot Z 283 (Anfang und Ende)', (a.length && b.length) ? 'Richtig, der Bereich ist auf beiden Seiten begrenzt.' : 'Es fehlt Z 283 mit Zusatzzeichen vor und/oder hinter dem Bereich auf der Parkstreifenseite (je 2–25 m außerhalb der Arbeitsstelle, wegen der Querabsperrung).');
  }
  // Vollsperrung
  if (r.veh === 'voll') {
    const a = pts(['z250']).filter(i => i.x >= s.x0 - 20 && i.x <= s.x0);
    const b = pts(['z250']).filter(i => i.x >= s.x1 && i.x <= s.x1 + 20);
    add(a.length && b.length, 'Z 250 an beiden Sperrstellen', (a.length && b.length) ? 'Richtig.' : 'Fehlt. An jeder Sperrstelle ein Z 250 (ggf. mit Zusatzzeichen, z. B. Anlieger frei bis Baustelle).');
  }
  // Fußgänger gegenüber
  if (r.ped === 'andere-seite') {
    const a = pts(['z259']).filter(i => i.y < s.gN + 0.5 && i.x >= s.x0 - 30 && i.x <= s.x0);
    const b = pts(['z259']).filter(i => i.y < s.gN + 0.5 && i.x >= s.x1 && i.x <= s.x1 + 30);
    add(a.length && b.length, 'Zz 1000-12/-22 „Gehweg gegenüber benutzen“ an beiden Enden', (a.length && b.length) ? 'Richtig.' : 'Fehlt. Auf dem gesperrten Gehweg an beiden Enden ans Absperrschrankengitter (bzw. am letzten sicheren Querungspunkt).');
    const f = pts(['flsa']).filter(i => i.y > s.r0 - 0.5 && i.y < s.r1 + 0.5 && i.x >= s.x0 - 40 && i.x <= s.x1 + 40);
    add(f.length > 0, 'Sichere Querungsstelle für Fußgänger', f.length ? 'Vorhanden.' : 'Fehlt. Wenn kein Notweg möglich ist, ist eine Überquerungshilfe zu prüfen (RSA 21, B 2.4.5), z. B. Fußgänger-LSA. In der Übung wird sie immer verlangt.');
  }
  // Überflüssiges
  const extra = [];
  if (r.veh !== 'lsa' && pts(['lsa']).length) extra.push('Baustellen-LSA (hier nicht nötig)');
  if (r.veh !== 'vorrang' && pts(['z208','z308']).length) extra.push('Z 208/308 (hier keine Vorrangregelung nötig)');
  if (r.veh !== 'voll' && pts(['z250']).length) extra.push('Z 250 (keine Vollsperrung)');
  if (r.veh !== 'voll' && lines('g250').some(l => Math.abs(l.x1 - l.x2) < .01 && Math.abs(l.y2 - l.y1) > s.F * 0.8)) extra.push('Gitter über die volle Fahrbahn (keine Vollsperrung)');
  if (!r.needHV && pts(['z283']).length) extra.push('Z 283 Haltverbot (nicht nötig)');
  if (r.ped !== 'andere-seite' && pts(['z259']).length) extra.push('Zz „Gehweg gegenüber benutzen“ (Fußgänger bleiben auf ihrer Seite)');
  if (r.veh !== 'voll' && pts(['wlr']).length) extra.push('rote Warnleuchten (nur bei Vollsperrung)');
  add(extra.length === 0, 'Keine überflüssigen oder falschen Elemente', extra.length ? 'Bitte entfernen: ' + extra.join(', ') + '. Überflüssige Schilder schwächen die Wirkung der nötigen und werden von der Behörde gestrichen.' : 'Sauber.');
  return C;
}

