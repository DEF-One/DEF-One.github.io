import { describe, expect, it } from 'vitest'
import { addDays, addMonths, isoWeek, startOfWeek, todayIn, weekday } from './dates'
import { buildIndexes, buildOccurrences, nextOccurrence, overdueOccurrences, scheduledDates } from './recurrence'
import { defaultTasks } from './seed'
import type { Completion, Snapshot, Task } from './types'

const START = '2026-11-16' // Montag
const household = { id: 'h', name: 'WG', invite_code: 'X', timezone: 'Europe/Berlin', plan_start_date: START, rotation_weeks: 1 }

let n = 0
function task(p: Partial<Task>): Task {
  return {
    id: `t${++n}`,
    household_id: 'h',
    name: p.name ?? 'Aufgabe',
    description: '',
    category: 'X',
    frequency: 'weekly',
    repeat_every: 1,
    weekdays: [],
    day_of_month: null,
    start_date: START,
    due_time: null,
    estimated_minutes: 10,
    assignment_mode: 'rotation',
    rotation_group: 'A',
    fixed_slot: null,
    sort_order: 0,
    archived_at: null,
    ...p,
  }
}

function snap(tasks: Task[], completions: Completion[] = [], assignments: Snapshot['assignments'] = []): Snapshot {
  return {
    household,
    members: [
      { id: 'a', household_id: 'h', slot: 'A', user_id: 'u1', display_name: 'Anna', color: '#00f' },
      { id: 'b', household_id: 'h', slot: 'B', user_id: 'u2', display_name: 'Ben', color: '#0f0' },
    ],
    tasks,
    completions,
    assignments,
  }
}

const done = (t: Task, date: string, scope: Completion['scope'] = 'shared', by: 'A' | 'B' = 'A'): Completion => ({
  id: `${t.id}${date}${scope}`,
  household_id: 'h',
  task_id: t.id,
  occurrence_date: date,
  scope,
  completed_by_slot: by,
  completed_by_user: null,
  minutes: 10,
  completed_at: `${date}T10:00:00Z`,
})

describe('Datumslogik', () => {
  it('Wochentage und Wochenstart', () => {
    expect(weekday('2026-11-16')).toBe(0) // Montag
    expect(weekday('2026-11-22')).toBe(6) // Sonntag
    expect(startOfWeek('2026-11-22')).toBe('2026-11-16')
    expect(isoWeek('2026-11-19')).toBe(47)
    expect(isoWeek('2027-01-01')).toBe(53)
  })
  it('Monatsenden und Zeitumstellung', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30') // über Sommerzeitumstellung
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
  })
  it('Heute in der Haushaltszeitzone', () => {
    // 23:30 UTC am 19.11. ist in Berlin schon der 20.11.
    expect(todayIn('Europe/Berlin', new Date('2026-11-19T23:30:00Z'))).toBe('2026-11-20')
    expect(todayIn('America/New_York', new Date('2026-11-20T03:00:00Z'))).toBe('2026-11-19')
  })
})

describe('Wiederholungen', () => {
  it('täglich', () => {
    expect(scheduledDates(task({ frequency: 'daily' }), '2026-11-15', '2026-11-18')).toEqual(['2026-11-16', '2026-11-17', '2026-11-18'])
    expect(scheduledDates(task({ frequency: 'daily', repeat_every: 2 }), '2026-11-17', '2026-11-21')).toEqual(['2026-11-18', '2026-11-20'])
  })
  it('mehrmals pro Woche (Mo, Mi, Fr)', () => {
    expect(scheduledDates(task({ weekdays: [0, 2, 4] }), START, '2026-11-29')).toEqual([
      '2026-11-16', '2026-11-18', '2026-11-20', '2026-11-23', '2026-11-25', '2026-11-27',
    ])
  })
  it('alle 2 Wochen', () => {
    expect(scheduledDates(task({ weekdays: [5], repeat_every: 2 }), START, '2026-12-20')).toEqual(['2026-11-21', '2026-12-05', '2026-12-19'])
  })
  it('monatlich mit Tag 31 im Februar', () => {
    expect(scheduledDates(task({ frequency: 'monthly', day_of_month: 31 }), START, '2027-03-31')).toEqual([
      '2026-11-30', '2026-12-31', '2027-01-31', '2027-02-28', '2027-03-31',
    ])
  })
  it('vierteljährlich', () => {
    expect(scheduledDates(task({ frequency: 'monthly', repeat_every: 3, day_of_month: 5 }), START, '2027-12-31')).toEqual([
      '2027-02-05', '2027-05-05', '2027-08-05', '2027-11-05',
    ])
  })
})

describe('Rotation', () => {
  it('wöchentlicher Tausch zwischen A und B', () => {
    const t = task({ frequency: 'daily', rotation_group: 'A' })
    const occ = buildOccurrences(snap([t]), START, '2026-12-06', START)
    const slotOn = (d: string) => occ.find((o) => o.date === d)!.slot
    expect(slotOn('2026-11-16')).toBe('A')
    expect(slotOn('2026-11-22')).toBe('A')
    expect(slotOn('2026-11-23')).toBe('B') // Woche 2
    expect(slotOn('2026-11-30')).toBe('A') // wieder Woche 1
  })
  it('Rotationsrhythmus 2 Wochen', () => {
    const t = task({ frequency: 'daily' })
    const s = { ...snap([t]), household: { ...household, rotation_weeks: 2 } }
    const occ = buildOccurrences(s, START, '2026-12-14', START)
    const slotOn = (d: string) => occ.find((o) => o.date === d)!.slot
    expect([slotOn('2026-11-16'), slotOn('2026-11-23'), slotOn('2026-11-30'), slotOn('2026-12-07'), slotOn('2026-12-14')]).toEqual(['A', 'A', 'B', 'B', 'A'])
  })
  it('monatliche Aufgaben wechseln jeden Termin', () => {
    const t = task({ frequency: 'monthly', day_of_month: 20, rotation_group: 'B' })
    const occ = buildOccurrences(snap([t]), START, '2027-02-28', START)
    expect(occ.map((o) => o.slot)).toEqual(['B', 'A', 'B', 'A'])
  })
  it('alle-2-Wochen-Aufgaben wechseln trotzdem', () => {
    const t = task({ weekdays: [5], repeat_every: 2 })
    const occ = buildOccurrences(snap([t]), START, '2026-12-31', START)
    expect(occ.map((o) => o.slot)).toEqual(['A', 'B', 'A'])
  })
  it('persönliche Aufgaben erzeugen je Person einen eigenen Termin', () => {
    const t = task({ frequency: 'daily', assignment_mode: 'personal' })
    const occ = buildOccurrences(snap([t]), START, START, START)
    expect(occ.map((o) => o.slot).sort()).toEqual(['A', 'B'])
  })
  it('feste Person', () => {
    const t = task({ frequency: 'daily', assignment_mode: 'fixed', fixed_slot: 'B' })
    const occ = buildOccurrences(snap([t]), START, '2026-11-30', START)
    expect(new Set(occ.map((o) => o.slot))).toEqual(new Set(['B']))
  })
})

describe('Status', () => {
  it('erledigt, offen, überfällig, ausgelassen', () => {
    const t = task({ weekdays: [0] }) // jeden Montag
    const today = '2026-11-25' // Mittwoch der 2. Woche
    const s = snap([t], [done(t, '2026-11-16')])
    const occ = buildOccurrences(s, START, '2026-11-30', today)
    expect(occ.map((o) => [o.date, o.status])).toEqual([
      ['2026-11-16', 'done'],
      ['2026-11-23', 'overdue'],
      ['2026-11-30', 'open'],
    ])
  })
  it('nicht erledigter Termin wird durch den nächsten fälligen ersetzt („ausgelassen“)', () => {
    const t = task({ frequency: 'daily' })
    const today = '2026-11-18'
    const occ = buildOccurrences(snap([t]), START, today, today)
    expect(occ.map((o) => o.status)).toEqual(['missed', 'missed', 'open'])
    expect(overdueOccurrences(snap([t]), today)).toHaveLength(0)
  })
  it('verschieben und neu zuweisen', () => {
    const t = task({ weekdays: [0] })
    const s = snap([t], [], [
      { id: 'x', household_id: 'h', task_id: t.id, occurrence_date: '2026-11-23', scope: 'shared', assigned_slot: 'A', moved_to: '2026-12-02', note: null },
    ])
    // Rotation wäre am 23.11. B – manuell A
    const occ = buildOccurrences(s, '2026-11-30', '2026-12-06', '2026-11-25')
    const moved = occ.find((o) => o.originalDate === '2026-11-23')!
    expect(moved.date).toBe('2026-12-02')
    expect(moved.status).toBe('postponed')
    expect(moved.slot).toBe('A')
    expect(moved.isReassigned).toBe(true)
    // am ursprünglichen Tag nicht mehr sichtbar
    expect(buildOccurrences(s, '2026-11-23', '2026-11-23', '2026-11-25')).toHaveLength(0)
  })
  it('nach Erledigung erscheint automatisch der nächste Termin', () => {
    const t = task({ frequency: 'monthly', day_of_month: 20 })
    const s1 = snap([t])
    expect(nextOccurrence(s1, t, START, buildIndexes(s1))!.date).toBe('2026-11-20')
    const s2 = snap([t], [done(t, '2026-11-20')])
    expect(nextOccurrence(s2, t, START, buildIndexes(s2))!.date).toBe('2026-12-20')
  })
  it('gelöschte Aufgaben behalten erledigte Termine', () => {
    const t = task({ frequency: 'daily', archived_at: '2026-11-18T00:00:00Z' })
    const occ = buildOccurrences(snap([t], [done(t, '2026-11-16')]), START, '2026-11-30', '2026-11-20')
    expect(occ).toHaveLength(1)
    expect(occ[0].status).toBe('done')
  })
})

describe('Startdaten', () => {
  it('enthält den vollständigen Haushaltsplan', () => {
    const tasks = defaultTasks(START)
    expect(tasks).toHaveLength(35)
    expect(tasks.filter((t) => t.frequency === 'daily')).toHaveLength(6)
    expect(tasks.filter((t) => t.frequency === 'monthly' && t.repeat_every === 1)).toHaveLength(10)
    expect(tasks.filter((t) => t.frequency === 'monthly' && t.repeat_every === 3)).toHaveLength(5)
  })
  it('Verteilung über zwei Wochen ist ausgeglichen', () => {
    const tasks = defaultTasks(START).map((t, i) => ({ ...t, id: `s${i}`, household_id: 'h', archived_at: null }))
    const occ = buildOccurrences(snap(tasks), START, addDays(START, 13), START).filter((o) => o.scope === 'shared')
    const minutes = (slot: 'A' | 'B') => occ.filter((o) => o.slot === slot).reduce((s, o) => s + (o.task.estimated_minutes ?? 0), 0)
    const a = minutes('A')
    const b = minutes('B')
    expect(Math.abs(a - b) / (a + b)).toBeLessThan(0.1)
  })
})
