# WG Manager – Haushalts- und Putzkalender für zwei

Live: **https://def-one.github.io/wg-manager/**

React · TypeScript · Vite · Tailwind CSS · Supabase · Lucide Icons · GitHub Pages

## Funktionen

- **Dashboard**: Begrüßung mit Datum, KW und Rotationswoche, vier Kennzahlen (heute fällig, offen, überfällig, diese Woche erledigt), Aufgaben für heute zum Abhaken, Überfälliges, Vorschau der nächsten 7 Tage, Personenübersicht mit Wochenfortschritt, Filter „Nur meine“.
- **Kalender**: Tag-, Wochen- und Monatsansicht, farbig je Person, erledigte Einträge bleiben durchgestrichen sichtbar, Klick öffnet Details (abhaken, verschieben, der anderen Person geben, zurücksetzen, bearbeiten).
- **Aufgaben**: anlegen, bearbeiten, löschen (Historie bleibt erhalten, wiederherstellbar), zuweisen, verschieben, erledigen; Wiederholung täglich / mehrmals pro Woche / wöchentlich / alle N Wochen / monatlich / vierteljährlich; Filter nach Person, Kategorie und Suche.
- **Automatische Rotation**: 2-Wochen-Zyklus (Woche 1 / Woche 2, danach von vorn). Monatliche und vierteljährliche Aufgaben wechseln bei jedem Termin die Person. Persönliche Aufgaben (z. B. eigene Sachen wegräumen) gelten für jede Person einzeln und werden nicht übertragen. Jeder Termin lässt sich manuell umverteilen.
- **Statistik**: erledigt, offen und überfällig pro Person, Erledigungsquote für Woche und Monat, Verlauf über 8 Wochen, **faire Auswertung nach Zeitaufwand**. Gezählt wird, wer tatsächlich abgehakt hat.
- **Erinnerungen**: Heute Fälliges wird hervorgehoben, Überfälliges rot markiert, optional tägliche Browser-Benachrichtigung.
- **Einstellungen**: Namen, Farben, WG-Name, Startdatum, Rotationsrhythmus, Zeitzone, Verteilung und Häufigkeiten aller Aufgaben, „Alles tauschen“, Benachrichtigungen, Einladung.
- **Live-Synchronisation** über Supabase Realtime. Datumswechsel um Mitternacht werden in der Zeitzone der WG erkannt.
- **Demo-Modus** zum Ausprobieren ohne Supabase (speichert nur im Browser).

Der komplette Haushaltsplan mit 35 Aufgaben wird beim Anlegen der WG automatisch eingetragen.

## Einrichtung (einmalig, ca. 10 Minuten)

### 1. Supabase-Projekt anlegen
1. Auf <https://supabase.com> kostenlos registrieren und **New project** anlegen (Region z. B. Frankfurt).
2. Links **SQL Editor → New query** öffnen, den Inhalt von [`supabase/migrations/20261119000000_init.sql`](supabase/migrations/20261119000000_init.sql) einfügen und **Run** klicken.
3. **Authentication → URL Configuration**:
   - *Site URL*: `https://def-one.github.io/wg-manager/`
   - *Redirect URLs*: `https://def-one.github.io/wg-manager/**`
4. Optional: Unter **Authentication → Providers → Email** kann „Confirm email“ ausgeschaltet werden, dann entfällt die Bestätigungsmail.
5. **Project Settings → API**: *Project URL* und den *anon / publishable key* kopieren.

### 2. App verbinden
1. <https://def-one.github.io/wg-manager/> öffnen, URL und Key eintragen und auf **Verbinden** klicken.
2. Konto registrieren, dann **WG erstellen**.
3. Unter **Einstellungen → Mitbewohner einladen** den **Einrichtungslink** kopieren und mit dem **Einladungscode** an die zweite Person schicken. Sie öffnet den Link, registriert sich und tritt mit dem Code bei.

Der anon-Key ist öffentlich gedacht. Die Daten schützt Row Level Security: Jede Person sieht nur den eigenen Haushalt.

Alternativ können die Werte fest eingebaut werden: `.env.example` nach `.env` kopieren, die Werte eintragen und neu bauen. Dann entfällt der Verbindungsschritt.

## Entwicklung

```bash
cd _wg-manager-src
npm install
npm run dev        # lokal starten
npm test           # Tests für Wiederholungen, Rotation, Status und Zeitzonen
npm run build      # baut nach ../wg-manager (wird von GitHub Pages ausgeliefert)
```

Nach `npm run build` die Änderungen am Ordner `wg-manager/` committen und pushen, dann ist die neue Version online.

### Struktur

```
_wg-manager-src/            Quellcode (Jekyll ignoriert Ordner mit „_“)
  src/lib/recurrence.ts     Wiederholungen, Rotation, Status (offen/erledigt/überfällig/verschoben)
  src/lib/backend.ts        Supabase- und Demo-Datenschicht
  src/lib/store.tsx         App-Zustand, Live-Sync, Aktionen
  src/lib/seed.ts           Vorgegebener Haushaltsplan
  src/pages/                Dashboard, Kalender, Aufgaben, Statistik, Einstellungen
  supabase/migrations/      Datenbankschema inkl. RLS
wg-manager/                 Gebaute App (GitHub Pages)
```

### Datenmodell

| Tabelle | Zweck |
|---|---|
| `households` | WG: Name, Einladungscode, Zeitzone, Planstart, Rotationsrhythmus |
| `household_members` | genau zwei Plätze (A/B) mit Name, Farbe, verknüpftem Nutzer |
| `tasks` | Aufgaben mit Wiederholungsregel, Zeitaufwand, Verteilungsart |
| `task_completions` | Erledigungen je Termin (Historie, wer und wie lange) |
| `task_assignments` | Abweichungen je Termin: andere Person und/oder verschoben |
| `user_settings` | Benachrichtigungen je Nutzer |

Termine werden aus den Regeln berechnet und nicht als Zeilen vorab angelegt. Sobald ein Termin erledigt ist, steht automatisch der nächste an, und Änderungen an der Häufigkeit gelten sofort für alle zukünftigen Termine.

Ein nicht erledigter Termin bleibt überfällig, bis der nächste reguläre Termin derselben Aufgabe fällig ist. Danach gilt er als „ausgelassen“. So stapeln sich tägliche Aufgaben nicht.
