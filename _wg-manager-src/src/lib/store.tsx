import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AuthUser, Backend } from './backend'
import { humanError } from './backend'
import { todayIn } from './dates'
import { buildIndexes, type Indexes } from './recurrence'
import type { Completion, Household, Member, Occurrence, Slot, Snapshot, Task, TaskInput, UserSettings } from './types'

export interface Toast {
  id: number
  kind: 'success' | 'error' | 'info'
  text: string
}

interface StoreValue {
  backend: Backend
  user: AuthUser
  snapshot: Snapshot
  indexes: Indexes
  today: string
  mySlot: Slot
  setDemoSlot: (s: Slot) => void
  member: (slot: Slot) => Member
  settings: UserSettings
  syncing: boolean
  reload: () => Promise<void>
  toast: (text: string, kind?: Toast['kind']) => void

  complete: (o: Occurrence, by?: Slot) => Promise<void>
  uncomplete: (o: Occurrence) => Promise<void>
  move: (o: Occurrence, newDate: string) => Promise<void>
  reassign: (o: Occurrence, slot: Slot) => Promise<void>
  resetOverride: (o: Occurrence) => Promise<void>
  saveTask: (id: string | null, input: TaskInput) => Promise<void>
  archiveTask: (task: Task) => Promise<void>
  restoreTask: (task: Task) => Promise<void>
  updateHousehold: (patch: Partial<Household>) => Promise<void>
  updateMember: (m: Member, patch: Partial<Member>) => Promise<void>
  saveSettings: (patch: Partial<UserSettings>) => Promise<void>
}

const Ctx = createContext<StoreValue | null>(null)

export function useStore(): StoreValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('StoreProvider fehlt')
  return v
}

const DEMO_SLOT_KEY = 'wgm.demo.me'

export function StoreProvider(props: {
  backend: Backend
  user: AuthUser
  initial: Snapshot
  initialSettings: UserSettings | null
  toast: (text: string, kind?: Toast['kind']) => void
  children: ReactNode
}) {
  const { backend, user, toast } = props
  const [snapshot, setSnapshot] = useState<Snapshot>(props.initial)
  const [settings, setSettings] = useState<UserSettings>(
    props.initialSettings ?? { user_id: user.id, household_id: props.initial.household.id, notifications_enabled: false, notify_hour: 8 },
  )
  const [syncing, setSyncing] = useState(false)
  const [demoSlot, setDemoSlotState] = useState<Slot>(() => (localStorage.getItem(DEMO_SLOT_KEY) as Slot) || 'A')
  const hid = snapshot.household.id
  const tz = snapshot.household.timezone || 'Europe/Berlin'
  const [today, setToday] = useState(() => todayIn(tz))
  const loadSeq = useRef(0)

  // Datumswechsel um Mitternacht erkennen
  useEffect(() => {
    const tick = () => setToday((prev) => {
      const now = todayIn(tz)
      return now === prev ? prev : now
    })
    tick()
    const t = setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [tz])

  const reload = useCallback(async () => {
    const seq = ++loadSeq.current
    setSyncing(true)
    try {
      const snap = await backend.loadSnapshot(hid)
      if (seq === loadSeq.current) setSnapshot(snap)
    } catch (e) {
      toast(humanError(e), 'error')
    } finally {
      if (seq === loadSeq.current) setSyncing(false)
    }
  }, [backend, hid, toast])

  // Live-Synchronisation + Aktualisieren beim Zurückkehren in die App
  useEffect(() => {
    const unsub = backend.subscribe(hid, () => void reload())
    const onFocus = () => {
      if (document.visibilityState === 'visible') void reload()
    }
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('online', onFocus)
    const poll = setInterval(onFocus, 60_000)
    return () => {
      unsub()
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('online', onFocus)
      clearInterval(poll)
    }
  }, [backend, hid, reload])

  const mySlot: Slot = useMemo(() => {
    if (backend.kind === 'demo') return demoSlot
    return snapshot.members.find((m) => m.user_id === user.id)?.slot ?? 'A'
  }, [backend.kind, demoSlot, snapshot.members, user.id])

  const setDemoSlot = (s: Slot) => {
    localStorage.setItem(DEMO_SLOT_KEY, s)
    setDemoSlotState(s)
  }

  const member = useCallback(
    (slot: Slot): Member =>
      snapshot.members.find((m) => m.slot === slot) ?? {
        id: slot,
        household_id: hid,
        slot,
        user_id: null,
        display_name: slot === 'A' ? 'Person A' : 'Person B',
        color: slot === 'A' ? '#3b82f6' : '#10b981',
      },
    [snapshot.members, hid],
  )

  const indexes = useMemo(() => buildIndexes(snapshot), [snapshot])

  /** Führt eine Änderung aus, lädt danach neu und meldet Fehler verständlich */
  const run = useCallback(
    async (fn: () => Promise<void>, success?: string, rollback?: () => void) => {
      try {
        await fn()
        if (success) toast(success, 'success')
      } catch (e) {
        rollback?.()
        toast(humanError(e), 'error')
      } finally {
        await reload()
      }
    },
    [reload, toast],
  )

  const complete = useCallback(
    async (o: Occurrence, by?: Slot) => {
      const optimistic: Completion = {
        id: `tmp-${o.key}`,
        household_id: hid,
        task_id: o.task.id,
        occurrence_date: o.originalDate,
        scope: o.scope,
        completed_by_slot: by ?? mySlot,
        completed_by_user: backend.kind === 'demo' ? null : user.id,
        minutes: o.task.estimated_minutes,
        completed_at: new Date().toISOString(),
      }
      const prev = snapshot
      setSnapshot((s) => ({ ...s, completions: [optimistic, ...s.completions] }))
      await run(
        () =>
          backend.addCompletion({
            household_id: hid,
            task_id: o.task.id,
            occurrence_date: o.originalDate,
            scope: o.scope,
            completed_by_slot: optimistic.completed_by_slot,
            completed_by_user: optimistic.completed_by_user,
            minutes: o.task.estimated_minutes,
          }),
        undefined,
        () => setSnapshot(prev),
      )
    },
    [backend, hid, mySlot, run, snapshot, user.id],
  )

  const uncomplete = useCallback(
    async (o: Occurrence) => {
      const prev = snapshot
      setSnapshot((s) => ({
        ...s,
        completions: s.completions.filter(
          (c) => !(c.task_id === o.task.id && c.occurrence_date === o.originalDate && c.scope === o.scope),
        ),
      }))
      await run(() => backend.removeCompletion(o.task.id, o.originalDate, o.scope), undefined, () => setSnapshot(prev))
    },
    [backend, run, snapshot],
  )

  const move = useCallback(
    async (o: Occurrence, newDate: string) => {
      await run(
        () =>
          newDate === o.originalDate && !o.assignment?.assigned_slot
            ? backend.deleteAssignment(o.task.id, o.originalDate, o.scope)
            : backend.upsertAssignment(hid, {
                task_id: o.task.id,
                occurrence_date: o.originalDate,
                scope: o.scope,
                moved_to: newDate === o.originalDate ? null : newDate,
                assigned_slot: o.assignment?.assigned_slot ?? null,
              }),
        'Termin verschoben',
      )
    },
    [backend, hid, run],
  )

  const reassign = useCallback(
    async (o: Occurrence, slot: Slot) => {
      await run(
        () =>
          backend.upsertAssignment(hid, {
            task_id: o.task.id,
            occurrence_date: o.originalDate,
            scope: o.scope,
            assigned_slot: slot,
            moved_to: o.assignment?.moved_to ?? null,
          }),
        'Zuständigkeit geändert',
      )
    },
    [backend, hid, run],
  )

  const resetOverride = useCallback(
    async (o: Occurrence) => {
      await run(() => backend.deleteAssignment(o.task.id, o.originalDate, o.scope), 'Auf Plan zurückgesetzt')
    },
    [backend, run],
  )

  const saveTask = useCallback(
    async (id: string | null, input: TaskInput) => {
      await run(
        () => (id ? backend.updateTask(id, input) : backend.createTasks(hid, [input])),
        id ? 'Aufgabe gespeichert' : 'Aufgabe erstellt',
      )
    },
    [backend, hid, run],
  )

  const archiveTask = useCallback(
    async (task: Task) => {
      await run(() => backend.archiveTask(task.id), 'Aufgabe gelöscht – erledigte Termine bleiben in der Historie')
    },
    [backend, run],
  )

  const restoreTask = useCallback(
    async (task: Task) => {
      await run(() => backend.updateTask(task.id, { archived_at: null }), 'Aufgabe wiederhergestellt')
    },
    [backend, run],
  )

  const updateHousehold = useCallback(
    async (patch: Partial<Household>) => {
      await run(() => backend.updateHousehold(hid, patch), 'Gespeichert')
    },
    [backend, hid, run],
  )

  const updateMember = useCallback(
    async (m: Member, patch: Partial<Member>) => {
      await run(() => backend.updateMember(m.id, patch))
    },
    [backend, run],
  )

  const saveSettings = useCallback(
    async (patch: Partial<UserSettings>) => {
      const next = { ...settings, ...patch, user_id: user.id, household_id: hid }
      setSettings(next)
      try {
        await backend.saveUserSettings(next)
      } catch (e) {
        toast(humanError(e), 'error')
      }
    },
    [backend, hid, settings, toast, user.id],
  )

  const value: StoreValue = {
    backend,
    user,
    snapshot,
    indexes,
    today,
    mySlot,
    setDemoSlot,
    member,
    settings,
    syncing,
    reload,
    toast,
    complete,
    uncomplete,
    move,
    reassign,
    resetOverride,
    saveTask,
    archiveTask,
    restoreTask,
    updateHousehold,
    updateMember,
    saveSettings,
  }

  return <Ctx.Provider value={value}>{props.children}</Ctx.Provider>
}
