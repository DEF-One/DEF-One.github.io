import { useMemo } from 'react'
import { diffDays, startOfWeek } from './dates'
import { buildOccurrences, overdueOccurrences } from './recurrence'
import { useStore } from './store'

export function useOccurrences(from: string, to: string) {
  const { snapshot, today, indexes } = useStore()
  return useMemo(() => buildOccurrences(snapshot, from, to, today, indexes), [snapshot, from, to, today, indexes])
}

export function useOverdue() {
  const { snapshot, today, indexes } = useStore()
  return useMemo(() => overdueOccurrences(snapshot, today, indexes), [snapshot, today, indexes])
}

/** 1 oder 2 – welche Rotationswoche gerade läuft */
export function rotationWeekNumber(date: string, planStart: string, rotationWeeks: number): 1 | 2 {
  const weeks = Math.floor(diffDays(startOfWeek(date), startOfWeek(planStart)) / 7)
  const period = Math.floor(weeks / Math.max(1, rotationWeeks))
  return (((period % 2) + 2) % 2) === 0 ? 1 : 2
}
