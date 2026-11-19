import { ArchiveRestore, CalendarClock, Check, ListTodo, Pencil, Plus, Repeat, Search, Timer, UserRound, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Card, cx, EmptyState, Input, PersonChip, Select, StatusBadge } from '../components/ui'
import { useUi } from '../components/uiContext'
import { relativeLabel } from '../lib/dates'
import { frequencyGroup, frequencyLabel, nextOccurrence } from '../lib/recurrence'
import { useStore } from '../lib/store'
import type { Occurrence, Slot, Task } from '../lib/types'

const GROUP_ORDER = ['Täglich', 'Mehrmals wöchentlich', 'Wöchentlich', 'Monatlich', 'Vierteljährlich & seltener', 'Einmalig']

export function TasksPage() {
  const store = useStore()
  const { snapshot, today, indexes, member } = store
  const { openTaskForm } = useUi()
  const [person, setPerson] = useState<'all' | Slot>('all')
  const [category, setCategory] = useState('all')
  const [q, setQ] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const active = snapshot.tasks.filter((t) => !t.archived_at)
  const archived = snapshot.tasks.filter((t) => t.archived_at)

  const nextByTask = useMemo(() => {
    const map = new Map<string, Occurrence | null>()
    for (const t of active) map.set(t.id, nextOccurrence(snapshot, t, today, indexes, store.mySlot))
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, today, indexes, store.mySlot])

  const categories = useMemo(() => [...new Set(active.map((t) => t.category))].sort((a, b) => a.localeCompare(b, 'de')), [active])

  const filtered = active.filter((t) => {
    if (category !== 'all' && t.category !== category) return false
    if (q && !`${t.name} ${t.description} ${t.category}`.toLowerCase().includes(q.toLowerCase())) return false
    if (person !== 'all') {
      if (t.assignment_mode === 'personal') return true
      const n = nextByTask.get(t.id)
      const slot = n?.slot ?? (t.assignment_mode === 'fixed' ? t.fixed_slot : t.rotation_group)
      if (slot !== person) return false
    }
    return true
  })

  const groups = GROUP_ORDER.map((g) => ({ name: g, tasks: filtered.filter((t) => frequencyGroup(t) === g) })).filter((g) => g.tasks.length)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aufgaben</h1>
          <p className="text-sm text-slate-500">{active.length} Haushaltsaufgaben im Plan</p>
        </div>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => openTaskForm(null)}>
          Neue Aufgabe
        </Button>
      </div>

      <Card className="p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Aufgaben durchsuchen …" className="pl-9" />
          </div>
          <Select value={person} onChange={(e) => setPerson(e.target.value as 'all' | Slot)} className="sm:w-44">
            <option value="all">Alle Personen</option>
            <option value="A">{member('A').display_name}</option>
            <option value="B">{member('B').display_name}</option>
          </Select>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:w-44">
            <option value="all">Alle Kategorien</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ListTodo className="h-5 w-5" />}
            title={active.length ? 'Keine Aufgaben für diesen Filter' : 'Noch keine Aufgaben'}
            text={active.length ? 'Passe die Filter an, um mehr zu sehen.' : 'Lege die erste Haushaltsaufgabe an.'}
            action={!active.length && <Button variant="primary" onClick={() => openTaskForm(null)}>Aufgabe erstellen</Button>}
          />
        </Card>
      ) : (
        groups.map((g) => (
          <section key={g.name}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {g.name} <span className="font-normal">· {g.tasks.length}</span>
            </h2>
            <Card className="divide-y divide-slate-100">
              {g.tasks.map((t) => (
                <TaskRow key={t.id} task={t} next={nextByTask.get(t.id) ?? null} />
              ))}
            </Card>
          </section>
        ))
      )}

      {archived.length > 0 && (
        <div>
          <button onClick={() => setShowArchived((v) => !v)} className="px-1 text-xs font-medium text-slate-500 hover:text-slate-700">
            {showArchived ? 'Gelöschte Aufgaben ausblenden' : `Gelöschte Aufgaben anzeigen (${archived.length})`}
          </button>
          {showArchived && (
            <Card className="mt-2 divide-y divide-slate-100">
              {archived.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-500 line-through">{t.name}</p>
                    <p className="text-xs text-slate-400">{frequencyLabel(t)} · Erledigungen bleiben in der Statistik</p>
                  </div>
                  <Button size="sm" icon={<ArchiveRestore className="h-3.5 w-3.5" />} onClick={() => store.restoreTask(t)}>
                    Wiederherstellen
                  </Button>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, next }: { task: Task; next: Occurrence | null }) {
  const store = useStore()
  const { openTaskForm, openOccurrence } = useUi()
  const [busy, setBusy] = useState(false)
  const m = next ? store.member(next.slot) : null

  const assignText =
    task.assignment_mode === 'personal'
      ? 'Jede Person für sich'
      : task.assignment_mode === 'fixed'
        ? `Immer ${store.member(task.fixed_slot ?? 'A').display_name}`
        : 'Rotation'
  const AssignIcon = task.assignment_mode === 'personal' ? Users : task.assignment_mode === 'fixed' ? UserRound : Repeat

  return (
    <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center">
      <button className="min-w-0 flex-1 text-left" onClick={() => (next ? openOccurrence(next) : openTaskForm(task))}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-800">{task.name}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{task.category}</span>
        </div>
        {task.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{task.description}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Repeat className="h-3.5 w-3.5" />
            {frequencyLabel(task)}
          </span>
          <span className="inline-flex items-center gap-1">
            <AssignIcon className="h-3.5 w-3.5" />
            {assignText}
          </span>
          {task.estimated_minutes ? (
            <span className="inline-flex items-center gap-1">
              <Timer className="h-3.5 w-3.5" />
              {task.estimated_minutes} Min.
            </span>
          ) : null}
        </div>
      </button>
      <div className="flex items-center gap-2 sm:justify-end">
        {next ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-none">
            <span className={cx('inline-flex items-center gap-1 text-xs font-medium', next.status === 'overdue' ? 'text-rose-600' : 'text-slate-600')}>
              <CalendarClock className="h-3.5 w-3.5" />
              {relativeLabel(next.date, store.today)}
            </span>
            {m && <PersonChip member={m} />}
            {next.status !== 'open' && <StatusBadge status={next.status} />}
          </div>
        ) : (
          <span className="flex-1 text-xs text-slate-400">Kein weiterer Termin</span>
        )}
        {next && (
          <Button
            size="sm"
            variant="secondary"
            loading={busy}
            icon={<Check className="h-3.5 w-3.5" />}
            onClick={async () => {
              setBusy(true)
              try {
                await store.complete(next)
              } finally {
                setBusy(false)
              }
            }}
            title="Nächsten Termin als erledigt markieren"
          >
            <span className="hidden sm:inline">Erledigt</span>
          </Button>
        )}
        <Button size="sm" variant="ghost" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => openTaskForm(task)} aria-label="Bearbeiten" />
      </div>
    </div>
  )
}
