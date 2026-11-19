import { Check, ChevronLeft, ChevronRight, CalendarX2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { OccurrenceRow } from '../components/Occurrence'
import { Card, cx, EmptyState, Segmented } from '../components/ui'
import { useUi } from '../components/uiContext'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  fmtLong,
  fmtMonthYear,
  formatDate,
  isoWeek,
  rangeDays,
  startOfMonth,
  startOfWeek,
  WEEKDAYS_SHORT,
} from '../lib/dates'
import { useOccurrences } from '../lib/hooks'
import { useStore } from '../lib/store'
import type { Occurrence, Slot } from '../lib/types'

type View = 'day' | 'week' | 'month'

export function CalendarPage() {
  const { today, member } = useStore()
  const [view, setView] = useState<View>(() => (window.innerWidth < 640 ? 'week' : 'month'))
  const [cursor, setCursor] = useState(today)
  const [person, setPerson] = useState<'all' | Slot>('all')
  const [showDaily, setShowDaily] = useState(false)

  const range = useMemo(() => {
    if (view === 'day') return { from: cursor, to: cursor }
    if (view === 'week') return { from: startOfWeek(cursor), to: endOfWeek(cursor) }
    return { from: startOfWeek(startOfMonth(cursor)), to: endOfWeek(endOfMonth(cursor)) }
  }, [view, cursor])

  const all = useOccurrences(range.from, range.to)
  const list = useMemo(
    () =>
      all.filter(
        (o) =>
          o.status !== 'missed' &&
          (person === 'all' || o.slot === person) &&
          (view === 'day' || showDaily || o.task.frequency !== 'daily'),
      ),
    [all, person, showDaily, view],
  )
  const byDay = useMemo(() => {
    const m = new Map<string, Occurrence[]>()
    for (const o of list) m.set(o.date, [...(m.get(o.date) ?? []), o])
    return m
  }, [list])

  const step = (dir: number) => {
    if (view === 'day') setCursor(addDays(cursor, dir))
    else if (view === 'week') setCursor(addDays(cursor, 7 * dir))
    else setCursor(addMonths(startOfMonth(cursor), dir))
  }

  const title =
    view === 'day'
      ? fmtLong(cursor)
      : view === 'week'
        ? `KW ${isoWeek(cursor)} · ${formatDate(range.from, { day: '2-digit', month: '2-digit' })} – ${formatDate(range.to, { day: '2-digit', month: '2-digit', year: 'numeric' })}`
        : fmtMonthYear(cursor)

  const openDay = (d: string) => {
    setCursor(d)
    setView('day')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Kalender</h1>
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'day', label: 'Tag' },
            { value: 'week', label: 'Woche' },
            { value: 'month', label: 'Monat' },
          ]}
        />
      </div>

      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => step(-1)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Zurück">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => setCursor(today)} className="h-9 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Heute
            </button>
            <button onClick={() => step(1)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Weiter">
              <ChevronRight className="h-5 w-5" />
            </button>
            <p className="ml-2 text-sm font-semibold capitalize text-slate-800 sm:text-base">{title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {(['all', 'A', 'B'] as const).map((p) => {
                const m = p === 'all' ? null : member(p)
                return (
                  <button
                    key={p}
                    onClick={() => setPerson(p)}
                    className={cx('flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium', person === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}
                  >
                    {m && <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />}
                    {m ? m.display_name : 'Alle'}
                  </button>
                )
              })}
            </div>
            {view !== 'day' && (
              <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1 text-xs font-medium text-slate-600">
                <input type="checkbox" checked={showDaily} onChange={(e) => setShowDaily(e.target.checked)} className="h-4 w-4 rounded accent-indigo-600" />
                Tägliche Aufgaben
              </label>
            )}
          </div>
        </div>
      </Card>

      {view === 'month' && <MonthView cursor={cursor} from={range.from} to={range.to} byDay={byDay} onDay={openDay} />}
      {view === 'week' && <WeekView from={range.from} byDay={byDay} onDay={openDay} />}
      {view === 'day' && (
        <Card>
          <div className="px-2 py-3">
            {(byDay.get(cursor) ?? []).length === 0 ? (
              <EmptyState icon={<CalendarX2 className="h-5 w-5" />} title="Keine Aufgaben an diesem Tag" />
            ) : (
              (byDay.get(cursor) ?? []).map((o) => <OccurrenceRow key={o.key} o={o} />)
            )}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-slate-500">
        {(['A', 'B'] as Slot[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: member(s).color }} /> {member(s).display_name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-3 w-3" /> erledigt
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm ring-2 ring-rose-400" /> überfällig
        </span>
      </div>
    </div>
  )
}

function Chip({ o }: { o: Occurrence }) {
  const { member } = useStore()
  const { openOccurrence } = useUi()
  const m = member(o.slot)
  const done = o.status === 'done'
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        openOccurrence(o)
      }}
      className={cx(
        'flex w-full items-center gap-1 truncate rounded-md px-1.5 py-[3px] text-left text-[11px] font-medium leading-tight transition hover:brightness-95',
        done && 'opacity-55',
        o.status === 'overdue' && 'ring-2 ring-rose-400',
      )}
      style={{ background: done ? '#f1f5f9' : `${m.color}1f`, color: done ? '#64748b' : m.color }}
      title={`${o.task.name} – ${m.display_name}`}
    >
      {done ? <Check className="h-3 w-3 shrink-0" strokeWidth={3} /> : <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: m.color }} />}
      <span className={cx('truncate', done && 'line-through')}>{o.task.name}</span>
    </button>
  )
}

function MonthView({ cursor, from, to, byDay, onDay }: { cursor: string; from: string; to: string; byDay: Map<string, Occurrence[]>; onDay: (d: string) => void }) {
  const { today, member } = useStore()
  const month = cursor.slice(0, 7)
  const days = rangeDays(from, to)
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const items = byDay.get(d) ?? []
          const inMonth = d.slice(0, 7) === month
          const isToday = d === today
          const max = 3
          return (
            <div
              key={d}
              onClick={() => onDay(d)}
              className={cx(
                'min-h-[64px] cursor-pointer border-slate-100 p-1 transition hover:bg-slate-50 sm:min-h-[112px] sm:p-1.5',
                i % 7 !== 6 && 'border-r',
                i < days.length - 7 && 'border-b',
                !inMonth && 'bg-slate-50/50',
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cx(
                    'grid h-6 w-6 place-items-center rounded-full text-xs font-medium',
                    isToday ? 'bg-indigo-600 text-white' : inMonth ? 'text-slate-700' : 'text-slate-300',
                  )}
                >
                  {Number(d.slice(8))}
                </span>
              </div>
              {/* Mobil: Punkte */}
              <div className="flex flex-wrap gap-0.5 px-0.5 sm:hidden">
                {items.slice(0, 8).map((o) => (
                  <span
                    key={o.key}
                    className={cx('h-1.5 w-1.5 rounded-full', o.status === 'done' && 'opacity-30')}
                    style={{ background: o.status === 'overdue' ? '#f43f5e' : member(o.slot).color }}
                  />
                ))}
              </div>
              {/* Desktop: Einträge */}
              <div className="hidden space-y-0.5 sm:block">
                {items.slice(0, max).map((o) => (
                  <Chip key={o.key} o={o} />
                ))}
                {items.length > max && <p className="px-1.5 text-[11px] font-medium text-slate-400">+{items.length - max} weitere</p>}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function WeekView({ from, byDay, onDay }: { from: string; byDay: Map<string, Occurrence[]>; onDay: (d: string) => void }) {
  const { today } = useStore()
  const days = rangeDays(from, addDays(from, 6))
  return (
    <>
      {/* Desktop: 7 Spalten */}
      <div className="hidden grid-cols-7 gap-2 lg:grid">
        {days.map((d) => {
          const items = byDay.get(d) ?? []
          return (
            <Card key={d} className={cx('min-h-[320px] p-2', d === today && 'ring-2 ring-indigo-200')}>
              <button onClick={() => onDay(d)} className="mb-2 flex w-full items-baseline justify-between rounded-lg px-1.5 py-1 text-left hover:bg-slate-50">
                <span className="text-xs font-semibold uppercase text-slate-400">{formatDate(d, { weekday: 'short' })}</span>
                <span className={cx('text-lg font-semibold', d === today ? 'text-indigo-600' : 'text-slate-800')}>{Number(d.slice(8))}</span>
              </button>
              <div className="space-y-1">
                {items.length === 0 && <p className="px-1.5 text-xs text-slate-300">–</p>}
                {items.map((o) => (
                  <Chip key={o.key} o={o} />
                ))}
              </div>
            </Card>
          )
        })}
      </div>
      {/* Mobil/Tablet: Liste je Tag */}
      <div className="space-y-3 lg:hidden">
        {days.map((d) => {
          const items = byDay.get(d) ?? []
          return (
            <Card key={d} className={cx(d === today && 'ring-2 ring-indigo-200')}>
              <button onClick={() => onDay(d)} className="flex w-full items-center justify-between px-4 pb-1 pt-3 text-left">
                <span className={cx('text-sm font-semibold', d === today ? 'text-indigo-600' : 'text-slate-800')}>
                  {formatDate(d, { weekday: 'long', day: '2-digit', month: '2-digit' })}
                  {d === today && ' · Heute'}
                </span>
                <span className="text-xs text-slate-400">{items.length} Aufgaben</span>
              </button>
              <div className="px-1 pb-2">
                {items.length === 0 ? <p className="px-3 py-2 text-xs text-slate-400">Nichts geplant</p> : items.map((o) => <OccurrenceRow key={o.key} o={o} compact />)}
              </div>
            </Card>
          )
        })}
      </div>
    </>
  )
}
