import { Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { WEEKDAYS_SHORT, weekday } from '../lib/dates'
import { frequencyLabel } from '../lib/recurrence'
import { CATEGORIES } from '../lib/seed'
import { useStore } from '../lib/store'
import type { AssignmentMode, Frequency, Slot, Task, TaskInput } from '../lib/types'
import { Alert, Button, cx, Field, Input, Modal, Select, Textarea } from './ui'
import { useUi } from './uiContext'

type Preset = 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly'

function presetOf(t: Pick<TaskInput, 'frequency' | 'repeat_every'>): Preset {
  if (t.frequency === 'monthly' && t.repeat_every === 3) return 'quarterly'
  return t.frequency
}

export function TaskFormModal() {
  const { taskForm, closeTaskForm } = useUi()
  if (!taskForm.open) return null
  return <TaskForm task={taskForm.task} onClose={closeTaskForm} />
}

function TaskForm({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const store = useStore()
  const { snapshot, today, member } = store
  const blank: TaskInput = {
    name: '',
    description: '',
    category: 'Allgemein',
    frequency: 'weekly',
    repeat_every: 1,
    weekdays: [weekday(today)],
    day_of_month: null,
    start_date: today,
    due_time: null,
    estimated_minutes: 15,
    assignment_mode: 'rotation',
    rotation_group: 'A',
    fixed_slot: null,
    sort_order: snapshot.tasks.length + 100,
  }
  const [f, setF] = useState<TaskInput>(() => {
    if (!task) return blank
    const { id: _i, household_id: _h, archived_at: _a, created_at: _c, ...rest } = task
    return { ...blank, ...rest }
  })
  const [preset, setPreset] = useState<Preset>(presetOf(f))
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof TaskInput>(k: K, v: TaskInput[K]) => setF((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    setF((p) => {
      switch (preset) {
        case 'once':
          return { ...p, frequency: 'once' as Frequency, repeat_every: 1 }
        case 'daily':
          return { ...p, frequency: 'daily', repeat_every: p.frequency === 'daily' ? p.repeat_every : 1 }
        case 'weekly':
          return { ...p, frequency: 'weekly', repeat_every: p.frequency === 'weekly' ? p.repeat_every : 1, weekdays: p.weekdays.length ? p.weekdays : [weekday(p.start_date)] }
        case 'monthly':
          return { ...p, frequency: 'monthly', repeat_every: p.frequency === 'monthly' && p.repeat_every !== 3 ? p.repeat_every : 1, day_of_month: p.day_of_month ?? Number(p.start_date.slice(8, 10)) }
        case 'quarterly':
          return { ...p, frequency: 'monthly', repeat_every: 3, day_of_month: p.day_of_month ?? Number(p.start_date.slice(8, 10)) }
      }
    })
  }, [preset])

  const categories = useMemo(() => {
    const s = new Set<string>(CATEGORIES)
    snapshot.tasks.forEach((t) => s.add(t.category))
    return [...s]
  }, [snapshot.tasks])

  const toggleDay = (d: number) => {
    const has = f.weekdays.includes(d)
    const next = has ? f.weekdays.filter((x) => x !== d) : [...f.weekdays, d].sort()
    set('weekdays', next)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.name.trim()) return setError('Bitte gib einen Namen ein.')
    if (f.frequency === 'weekly' && !f.weekdays.length) return setError('Bitte wähle mindestens einen Wochentag.')
    if (f.assignment_mode === 'fixed' && !f.fixed_slot) return setError('Bitte wähle die feste Person.')
    setError(null)
    setSaving(true)
    try {
      await store.saveTask(task?.id ?? null, { ...f, name: f.name.trim(), category: f.category.trim() || 'Allgemein' })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const A = member('A')
  const B = member('B')

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={task ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}
      footer={
        <>
          {task && (
            <Button
              type="button"
              variant="danger"
              className="mr-auto"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={async () => {
                if (!confirmDelete) return setConfirmDelete(true)
                await store.archiveTask(task)
                onClose()
              }}
            >
              {confirmDelete ? 'Wirklich löschen?' : 'Löschen'}
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" form="task-form" variant="primary" loading={saving}>
            Speichern
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="space-y-4">
        {error && <Alert kind="error">{error}</Alert>}
        <Field label="Name">
          <Input autoFocus value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="z. B. Bad putzen" maxLength={120} />
        </Field>
        <Field label="Beschreibung">
          <Textarea value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional: Was genau ist zu tun?" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kategorie">
            <Input list="wgm-categories" value={f.category} onChange={(e) => set('category', e.target.value)} />
            <datalist id="wgm-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Zeitaufwand (Minuten)" hint="Für die faire Auswertung">
            <Input
              type="number"
              min={0}
              max={600}
              value={f.estimated_minutes ?? ''}
              onChange={(e) => set('estimated_minutes', e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
            />
          </Field>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">Wiederholung</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Häufigkeit">
              <Select value={preset} onChange={(e) => setPreset(e.target.value as Preset)}>
                <option value="once">Einmalig</option>
                <option value="daily">Täglich</option>
                <option value="weekly">Wöchentlich / mehrmals pro Woche</option>
                <option value="monthly">Monatlich</option>
                <option value="quarterly">Vierteljährlich</option>
              </Select>
            </Field>
            {preset !== 'once' && preset !== 'quarterly' && (
              <Field label={`Wiederholungsintervall (alle … ${preset === 'daily' ? 'Tage' : preset === 'weekly' ? 'Wochen' : 'Monate'})`}>
                <Input type="number" min={1} max={52} value={f.repeat_every} onChange={(e) => set('repeat_every', Math.max(1, Number(e.target.value) || 1))} />
              </Field>
            )}
            <Field label={task ? 'Startdatum der Wiederholung' : 'Erste Fälligkeit / Start'}>
              <Input type="date" value={f.start_date} onChange={(e) => e.target.value && set('start_date', e.target.value)} />
            </Field>
            <Field label="Uhrzeit (optional)">
              <Input type="time" value={f.due_time ?? ''} onChange={(e) => set('due_time', e.target.value || null)} />
            </Field>
            {(preset === 'monthly' || preset === 'quarterly') && (
              <Field label="Tag im Monat">
                <Input type="number" min={1} max={31} value={f.day_of_month ?? 1} onChange={(e) => set('day_of_month', Math.min(31, Math.max(1, Number(e.target.value) || 1)))} />
              </Field>
            )}
          </div>
          {preset === 'weekly' && (
            <div className="mt-4">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">An diesen Tagen</span>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS_SHORT.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={cx(
                      'h-9 w-10 rounded-lg text-sm font-medium transition',
                      f.weekdays.includes(i) ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500">→ {frequencyLabel(f)}</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">Verteilung</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ['rotation', 'Rotation', 'Wechselt automatisch'],
                ['fixed', 'Feste Person', 'Immer dieselbe Person'],
                ['personal', 'Persönlich', 'Jede Person für sich'],
              ] as [AssignmentMode, string, string][]
            ).map(([v, l, d]) => (
              <button
                key={v}
                type="button"
                onClick={() => setF((p) => ({ ...p, assignment_mode: v, fixed_slot: v === 'fixed' ? (p.fixed_slot ?? 'A') : p.fixed_slot }))}
                className={cx(
                  'rounded-xl border px-3 py-2.5 text-left transition',
                  f.assignment_mode === v ? 'border-indigo-300 bg-white ring-4 ring-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50',
                )}
              >
                <span className="block text-sm font-medium text-slate-800">{l}</span>
                <span className="block text-xs text-slate-500">{d}</span>
              </button>
            ))}
          </div>
          {f.assignment_mode !== 'personal' && (
            <div className="mt-4">
              <Field label={f.assignment_mode === 'rotation' ? (f.frequency === 'monthly' ? 'Beim ersten Termin zuständig' : 'In Rotationswoche 1 zuständig') : 'Zuständige Person'}>
                <div className="flex gap-2">
                  {[A, B].map((m) => {
                    const active = f.assignment_mode === 'rotation' ? f.rotation_group === m.slot : f.fixed_slot === m.slot
                    return (
                      <button
                        key={m.slot}
                        type="button"
                        onClick={() => (f.assignment_mode === 'rotation' ? set('rotation_group', m.slot as Slot) : set('fixed_slot', m.slot as Slot))}
                        className={cx('flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition', active ? 'bg-white' : 'border-slate-200 bg-white text-slate-500')}
                        style={active ? { borderColor: m.color, color: m.color, boxShadow: `0 0 0 3px ${m.color}22` } : undefined}
                      >
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                        {m.display_name}
                      </button>
                    )
                  })}
                </div>
              </Field>
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
