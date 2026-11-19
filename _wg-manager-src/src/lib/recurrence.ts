import {
  addDays,
  daysInMonth,
  diffDays,
  fromDayNumber,
  monthIndex,
  pad,
  startOfWeek,
  toDayNumber,
  weekday,
} from './dates'
import type { Assignment, Completion, Household, Occurrence, Scope, Slot, Snapshot, Task } from './types'

export const otherSlot = (s: Slot): Slot => (s === 'A' ? 'B' : 'A')
const mod = (n: number, m: number) => ((n % m) + m) % m
const maxIso = (a: string, b: string) => (a > b ? a : b)

/** Alle planmäßigen (ursprünglichen) Termine einer Aufgabe im Zeitraum [from, to]. */
export function scheduledDates(task: Task, from: string, to: string): string[] {
  const start = maxIso(from, task.start_date)
  if (start > to) return []
  const every = Math.max(1, task.repeat_every || 1)
  const out: string[] = []

  switch (task.frequency) {
    case 'once':
      if (task.start_date >= from && task.start_date <= to) out.push(task.start_date)
      break

    case 'daily': {
      const origin = toDayNumber(task.start_date)
      const first = toDayNumber(start)
      const k = Math.ceil((first - origin) / every)
      for (let n = origin + k * every; n <= toDayNumber(to); n += every) out.push(fromDayNumber(n))
      break
    }

    case 'weekly': {
      const days = new Set(task.weekdays?.length ? task.weekdays : [weekday(task.start_date)])
      const originWeek = startOfWeek(task.start_date)
      for (let n = toDayNumber(start); n <= toDayNumber(to); n++) {
        const d = fromDayNumber(n)
        if (!days.has(weekday(d))) continue
        const weeks = diffDays(startOfWeek(d), originWeek) / 7
        if (mod(weeks, every) === 0) out.push(d)
      }
      break
    }

    case 'monthly': {
      const dom = task.day_of_month ?? Number(task.start_date.slice(8, 10))
      const originMonth = monthIndex(task.start_date)
      for (let m = monthIndex(start); m <= monthIndex(to); m++) {
        if (mod(m - originMonth, every) !== 0) continue
        const y = Math.floor(m / 12)
        const mo = (m % 12) + 1
        const d = `${y}-${pad(mo)}-${pad(Math.min(dom, daysInMonth(y, mo)))}`
        if (d >= start && d <= to) out.push(d)
      }
      break
    }
  }
  return out
}

/**
 * Ist die Rotation an diesem Termin „getauscht“?
 * - tägliche/wöchentliche Aufgaben: nach Rotationswochen seit Planstart (Woche 1 / Woche 2 …)
 * - Aufgaben, die seltener als wöchentlich vorkommen: abwechselnd je Termin
 */
export function rotationFlipped(task: Task, date: string, household: Pick<Household, 'plan_start_date' | 'rotation_weeks'>): boolean {
  const every = Math.max(1, task.repeat_every || 1)
  switch (task.frequency) {
    case 'once':
      return false
    case 'monthly': {
      const idx = Math.floor((monthIndex(date) - monthIndex(task.start_date)) / every)
      return mod(idx, 2) === 1
    }
    case 'weekly':
      if (every > 1) {
        const idx = Math.floor(diffDays(startOfWeek(date), startOfWeek(task.start_date)) / 7 / every)
        return mod(idx, 2) === 1
      }
    // fallthrough
    case 'daily': {
      const weeks = Math.floor(diffDays(startOfWeek(date), startOfWeek(household.plan_start_date)) / 7)
      const period = Math.floor(weeks / Math.max(1, household.rotation_weeks || 1))
      return mod(period, 2) === 1
    }
  }
}

/** Planmäßig verantwortliche Person (ohne manuelle Abweichung) */
export function plannedSlot(task: Task, date: string, scope: Scope, household: Snapshot['household']): Slot {
  if (scope !== 'shared') return scope
  if (task.assignment_mode === 'fixed') return task.fixed_slot ?? 'A'
  return rotationFlipped(task, date, household) ? otherSlot(task.rotation_group) : task.rotation_group
}

export function scopesFor(task: Task): Scope[] {
  return task.assignment_mode === 'personal' ? ['A', 'B'] : ['shared']
}

export const occKey = (taskId: string, date: string, scope: Scope) => `${taskId}|${date}|${scope}`

export interface Indexes {
  completions: Map<string, Completion>
  assignments: Map<string, Assignment>
  movedInto: Assignment[]
}

export function buildIndexes(snapshot: Pick<Snapshot, 'completions' | 'assignments'>): Indexes {
  const completions = new Map<string, Completion>()
  for (const c of snapshot.completions) completions.set(occKey(c.task_id, c.occurrence_date, c.scope), c)
  const assignments = new Map<string, Assignment>()
  const movedInto: Assignment[] = []
  for (const a of snapshot.assignments) {
    assignments.set(occKey(a.task_id, a.occurrence_date, a.scope), a)
    if (a.moved_to && a.moved_to !== a.occurrence_date) movedInto.push(a)
  }
  return { completions, assignments, movedInto }
}

const LOOKBACK_DAYS = 400

/**
 * Erzeugt alle Termine, deren effektives Datum in [from, to] liegt,
 * inklusive Status (offen, erledigt, überfällig, verschoben, verpasst).
 */
export function buildOccurrences(snapshot: Snapshot, from: string, to: string, today: string, idx = buildIndexes(snapshot)): Occurrence[] {
  const out: Occurrence[] = []
  const lastDueCache = new Map<string, string | null>()

  const lastScheduledUpToToday = (task: Task) => {
    if (!lastDueCache.has(task.id)) {
      const list = scheduledDates(task, addDays(today, -LOOKBACK_DAYS), today)
      lastDueCache.set(task.id, list.length ? list[list.length - 1] : null)
    }
    return lastDueCache.get(task.id)!
  }

  const taskById = new Map(snapshot.tasks.map((t) => [t.id, t]))

  const make = (task: Task, original: string, scope: Scope): Occurrence | null => {
    const key = occKey(task.id, original, scope)
    const completion = idx.completions.get(key)
    if (task.archived_at && !completion) return null
    const assignment = idx.assignments.get(key)
    const isMoved = !!assignment?.moved_to && assignment.moved_to !== original
    const date = isMoved ? assignment!.moved_to! : original
    const planned = plannedSlot(task, original, scope, snapshot.household)
    const slot = scope === 'shared' ? (assignment?.assigned_slot ?? planned) : scope
    const isReassigned = scope === 'shared' && !!assignment?.assigned_slot && assignment.assigned_slot !== planned

    let status: Occurrence['status']
    if (completion) status = 'done'
    else if (date >= today) status = isMoved ? 'postponed' : 'open'
    else if (isMoved) status = 'overdue'
    else {
      const last = lastScheduledUpToToday(task)
      status = last && original < last ? 'missed' : 'overdue'
    }

    return { key, task, originalDate: original, date, scope, slot, status, completion, assignment, isMoved, isReassigned }
  }

  for (const task of snapshot.tasks) {
    for (const d of scheduledDates(task, from, to)) {
      for (const scope of scopesFor(task)) {
        const occ = make(task, d, scope)
        if (occ && occ.date >= from && occ.date <= to) out.push(occ)
      }
    }
  }

  // Termine, die aus einem anderen Zeitraum hierher verschoben wurden
  for (const a of idx.movedInto) {
    if (!a.moved_to || a.moved_to < from || a.moved_to > to) continue
    if (a.occurrence_date >= from && a.occurrence_date <= to) continue // bereits oben erfasst
    const task = taskById.get(a.task_id)
    if (!task) continue
    if (!scheduledDates(task, a.occurrence_date, a.occurrence_date).length) continue
    const occ = make(task, a.occurrence_date, a.scope)
    if (occ) out.push(occ)
  }

  return out.sort(compareOccurrences)
}

const STATUS_ORDER: Record<Occurrence['status'], number> = { overdue: 0, open: 1, postponed: 2, done: 3, missed: 4 }

export function compareOccurrences(a: Occurrence, b: Occurrence): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  if (s) return s
  const ta = a.task.due_time ?? '99:99'
  const tb = b.task.due_time ?? '99:99'
  if (ta !== tb) return ta < tb ? -1 : 1
  if (a.task.sort_order !== b.task.sort_order) return a.task.sort_order - b.task.sort_order
  return a.task.name.localeCompare(b.task.name, 'de')
}

/** Alle aktuell überfälligen Termine (unabhängig vom angezeigten Zeitraum) */
export function overdueOccurrences(snapshot: Snapshot, today: string, idx = buildIndexes(snapshot)): Occurrence[] {
  return buildOccurrences(snapshot, addDays(today, -LOOKBACK_DAYS), addDays(today, -1), today, idx).filter(
    (o) => o.status === 'overdue',
  )
}

/** Nächster offener Termin einer Aufgabe ab heute (für die Aufgabenliste) */
export function nextOccurrence(snapshot: Snapshot, task: Task, today: string, idx = buildIndexes(snapshot), prefer?: Scope): Occurrence | null {
  const single: Snapshot = { ...snapshot, tasks: [task] }
  const pick = (list: Occurrence[]) => {
    if (!list.length) return null
    const first = list[0]
    return (prefer && list.find((o) => o.date === first.date && o.scope === prefer)) || first
  }
  const overdue = pick(
    buildOccurrences(single, addDays(today, -LOOKBACK_DAYS), addDays(today, -1), today, idx).filter((o) => o.status === 'overdue'),
  )
  if (overdue) return overdue
  let from = today
  for (let i = 0; i < 4; i++) {
    const to = addDays(from, 120)
    const found = pick(buildOccurrences(single, from, to, today, idx).filter((o) => o.status !== 'done' && o.status !== 'missed'))
    if (found) return found
    from = addDays(to, 1)
  }
  return null
}

export function frequencyLabel(task: Pick<Task, 'frequency' | 'repeat_every' | 'weekdays' | 'day_of_month'>): string {
  const n = task.repeat_every || 1
  const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  switch (task.frequency) {
    case 'once':
      return 'Einmalig'
    case 'daily':
      return n === 1 ? 'Täglich' : `Alle ${n} Tage`
    case 'weekly': {
      const days = [...(task.weekdays ?? [])].sort().map((d) => WD[d]).join(', ')
      const times = task.weekdays?.length ?? 1
      const base = n === 1 ? (times > 1 ? `${times}× pro Woche` : 'Wöchentlich') : `Alle ${n} Wochen`
      return days ? `${base} (${days})` : base
    }
    case 'monthly': {
      const base = n === 1 ? 'Monatlich' : n === 3 ? 'Vierteljährlich' : n === 6 ? 'Halbjährlich' : n === 12 ? 'Jährlich' : `Alle ${n} Monate`
      return task.day_of_month ? `${base} (am ${task.day_of_month}.)` : base
    }
  }
}

export function frequencyGroup(task: Task): string {
  if (task.frequency === 'daily') return 'Täglich'
  if (task.frequency === 'weekly') return (task.weekdays?.length ?? 1) > 1 && task.repeat_every === 1 ? 'Mehrmals wöchentlich' : 'Wöchentlich'
  if (task.frequency === 'monthly') return task.repeat_every >= 3 ? 'Vierteljährlich & seltener' : 'Monatlich'
  return 'Einmalig'
}
