// Datumshilfen. Alle Kalendertage werden als 'YYYY-MM-DD' gespeichert und
// rein über UTC-Tageszahlen gerechnet – so gibt es keine Fehler durch
// Sommer-/Winterzeit oder die Zeitzone des Geräts.

const DAY = 86_400_000

export function toDayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / DAY)
}

export function fromDayNumber(n: number): string {
  const dt = new Date(n * DAY)
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

export function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

export function addDays(iso: string, n: number): string {
  return fromDayNumber(toDayNumber(iso) + n)
}

export function diffDays(a: string, b: string): number {
  return toDayNumber(a) - toDayNumber(b)
}

/** 0 = Montag … 6 = Sonntag */
export function weekday(iso: string): number {
  // 1970-01-01 war ein Donnerstag (= 3)
  return (((toDayNumber(iso) + 3) % 7) + 7) % 7
}

export function startOfWeek(iso: string): string {
  return addDays(iso, -weekday(iso))
}

export function endOfWeek(iso: string): string {
  return addDays(startOfWeek(iso), 6)
}

export function startOfMonth(iso: string): string {
  return iso.slice(0, 8) + '01'
}

export function endOfMonth(iso: string): string {
  const [y, m] = iso.split('-').map(Number)
  return `${y}-${pad(m)}-${pad(daysInMonth(y, m))}`
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate()
}

export function addMonths(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const total = y * 12 + (m - 1) + n
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  return `${ny}-${pad(nm)}-${pad(Math.min(d, daysInMonth(ny, nm)))}`
}

export function monthIndex(iso: string): number {
  const [y, m] = iso.split('-').map(Number)
  return y * 12 + (m - 1)
}

export function rangeDays(from: string, to: string): string[] {
  const out: string[] = []
  for (let n = toDayNumber(from); n <= toDayNumber(to); n++) out.push(fromDayNumber(n))
  return out
}

/** Heutiges Datum in der Zeitzone des Haushalts */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now)
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
    return `${get('year')}-${get('month')}-${get('day')}`
  } catch {
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  }
}

/** ISO-8601-Kalenderwoche */
export function isoWeek(iso: string): number {
  const thursday = addDays(iso, 3 - weekday(iso))
  const yearStart = `${thursday.slice(0, 4)}-01-01`
  return Math.floor(diffDays(thursday, yearStart) / 7) + 1
}

const asDate = (iso: string) => new Date(toDayNumber(iso) * DAY)

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('de-DE', { ...opts, timeZone: 'UTC' }).format(asDate(iso))
}

export const fmtLong = (iso: string) =>
  formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
export const fmtShort = (iso: string) => formatDate(iso, { weekday: 'short', day: '2-digit', month: '2-digit' })
export const fmtDayMonth = (iso: string) => formatDate(iso, { day: '2-digit', month: '2-digit', year: 'numeric' })
export const fmtMonthYear = (iso: string) => formatDate(iso, { month: 'long', year: 'numeric' })

export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
export const WEEKDAYS_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

export function relativeLabel(iso: string, today: string): string {
  const d = diffDays(iso, today)
  if (d === 0) return 'Heute'
  if (d === 1) return 'Morgen'
  if (d === -1) return 'Gestern'
  if (d > 1 && d < 7) return formatDate(iso, { weekday: 'long' })
  if (d < 0) return `vor ${-d} Tagen`
  return fmtShort(iso)
}
