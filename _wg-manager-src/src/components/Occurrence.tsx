import { ArrowRightLeft, CalendarClock, Clock, Pencil, RotateCcw, Timer, Undo2, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { addDays, fmtLong, fmtShort, relativeLabel } from '../lib/dates'
import { frequencyLabel, otherSlot } from '../lib/recurrence'
import { useStore } from '../lib/store'
import type { Occurrence } from '../lib/types'
import { Button, CheckButton, cx, Field, Input, Modal, PersonChip, StatusBadge } from './ui'
import { useUi } from './uiContext'

export function OccurrenceRow({ o, showDate, compact }: { o: Occurrence; showDate?: boolean; compact?: boolean }) {
  const { member, complete, uncomplete, today } = useStore()
  const { openOccurrence } = useUi()
  const m = member(o.slot)
  const done = o.status === 'done'
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    setBusy(true)
    try {
      if (done) await uncomplete(o)
      else await complete(o)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openOccurrence(o)}
      onKeyDown={(e) => e.key === 'Enter' && openOccurrence(o)}
      className={cx(
        'group flex cursor-pointer items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-slate-200 hover:bg-slate-50/80',
        o.status === 'overdue' && 'bg-rose-50/40',
        o.status === 'missed' && 'opacity-60',
      )}
    >
      <div className="pt-0.5">
        {o.status === 'missed' ? (
          <span className="block h-7 w-7 rounded-full border-2 border-dashed border-slate-200" />
        ) : (
          <CheckButton done={done} onClick={toggle} color={m.color} disabled={busy} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cx('text-sm font-medium', done ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800')}>{o.task.name}</span>
          {o.status !== 'open' && <StatusBadge status={o.status} />}
        </div>
        {!compact && o.task.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{o.task.description}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <PersonChip member={m} />
          {showDate && (
            <span className={cx('inline-flex items-center gap-1', o.status === 'overdue' && 'font-medium text-rose-600')}>
              <CalendarClock className="h-3.5 w-3.5" />
              {relativeLabel(o.date, today)}
            </span>
          )}
          {o.task.due_time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {o.task.due_time} Uhr
            </span>
          )}
          {o.task.estimated_minutes ? (
            <span className="inline-flex items-center gap-1">
              <Timer className="h-3.5 w-3.5" />
              {o.task.estimated_minutes} Min.
            </span>
          ) : null}
          {o.scope !== 'shared' && <span className="text-slate-400">persönlich</span>}
        </div>
      </div>
    </div>
  )
}

export function OccurrenceModal({ o, onClose }: { o: Occurrence | null; onClose: () => void }) {
  const store = useStore()
  const { openTaskForm } = useUi()
  const [moveDate, setMoveDate] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (o) setMoveDate(o.date < store.today ? store.today : addDays(o.date, 1))
  }, [o, store.today])

  if (!o) return null
  const m = store.member(o.slot)
  const other = store.member(otherSlot(o.slot))
  const done = o.status === 'done'
  const doneBy = o.completion ? store.member(o.completion.completed_by_slot) : null

  const act = async (name: string, fn: () => Promise<void>) => {
    setBusy(name)
    try {
      await fn()
      onClose()
    } finally {
      setBusy(null)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={o.task.name}
      footer={
        <>
          <Button
            variant="ghost"
            icon={<Pencil className="h-4 w-4" />}
            onClick={() => {
              onClose()
              openTaskForm(o.task)
            }}
          >
            Aufgabe bearbeiten
          </Button>
          {done ? (
            <Button variant="secondary" icon={<Undo2 className="h-4 w-4" />} loading={busy === 'undo'} onClick={() => act('undo', () => store.uncomplete(o))}>
              Wieder öffnen
            </Button>
          ) : (
            <Button variant="success" loading={busy === 'done'} onClick={() => act('done', () => store.complete(o))}>
              {o.status === 'missed' ? 'Nachträglich erledigt' : 'Als erledigt markieren'}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={o.status} />
          <PersonChip member={m} />
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{o.task.category}</span>
        </div>

        {o.task.description && <p className="text-sm leading-relaxed text-slate-600">{o.task.description}</p>}

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Fällig am" value={fmtLong(o.date)} />
          <Info label="Uhrzeit" value={o.task.due_time ? `${o.task.due_time} Uhr` : 'Ganztägig'} />
          <Info label="Häufigkeit" value={frequencyLabel(o.task)} />
          <Info label="Zeitaufwand" value={o.task.estimated_minutes ? `${o.task.estimated_minutes} Min.` : '–'} />
          {o.isMoved && <Info label="Ursprünglich" value={fmtShort(o.originalDate)} />}
          {o.completion && (
            <Info
              label="Erledigt"
              value={`${doneBy?.display_name ?? ''}, ${new Date(o.completion.completed_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`}
            />
          )}
        </dl>

        {!done && (
          <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
            {o.scope === 'shared' && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="h-4 w-4" /> Zuständig: <strong className="font-semibold text-slate-800">{m.display_name}</strong>
                </div>
                <Button size="sm" icon={<ArrowRightLeft className="h-3.5 w-3.5" />} loading={busy === 'swap'} onClick={() => act('swap', () => store.reassign(o, other.slot))}>
                  An {other.display_name} geben
                </Button>
              </div>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <Field label="Verschieben auf" className="min-w-[160px] flex-1">
                <Input type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} />
              </Field>
              <Button size="md" icon={<CalendarClock className="h-4 w-4" />} disabled={!moveDate || moveDate === o.date} loading={busy === 'move'} onClick={() => act('move', () => store.move(o, moveDate))}>
                Verschieben
              </Button>
            </div>
            {(o.isMoved || o.isReassigned) && (
              <Button size="sm" variant="ghost" icon={<RotateCcw className="h-3.5 w-3.5" />} loading={busy === 'reset'} onClick={() => act('reset', () => store.resetOverride(o))}>
                Änderungen an diesem Termin zurücksetzen
              </Button>
            )}
          </div>
        )}

        {done && o.slot !== o.completion?.completed_by_slot && (
          <p className="text-xs text-slate-500">Diese Aufgabe wurde von {doneBy?.display_name} statt {m.display_name} erledigt – das wird in der Statistik fair angerechnet.</p>
        )}
        {!done && o.slot !== store.mySlot && (
          <p className="text-xs text-slate-500">Wenn du diese Aufgabe für {m.display_name} erledigst, wird der Zeitaufwand dir angerechnet.</p>
        )}
      </div>
    </Modal>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 px-3 py-2">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{value}</dd>
    </div>
  )
}
