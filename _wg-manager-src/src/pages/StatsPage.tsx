import { BarChart3, CheckCircle2, History, Scale, Timer, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { Avatar, Card, CardHeader, cx, EmptyState, ProgressBar } from '../components/ui'
import { addDays, endOfMonth, fmtShort, formatDate, isoWeek, startOfMonth, startOfWeek } from '../lib/dates'
import { useOccurrences, useOverdue } from '../lib/hooks'
import { useStore } from '../lib/store'
import type { Completion, Occurrence, Slot } from '../lib/types'

const SLOTS: Slot[] = ['A', 'B']

function rate(list: Occurrence[], today: string, slot?: Slot) {
  const due = list.filter((o) => o.date <= today && (!slot || o.slot === slot))
  const done = due.filter((o) => o.status === 'done').length
  return { done, total: due.length, pct: due.length ? Math.round((done / due.length) * 100) : 0 }
}

export function StatsPage() {
  const { snapshot, today, member } = useStore()
  const weekStart = startOfWeek(today)
  const monthStart = startOfMonth(today)
  const histStart = addDays(weekStart, -7 * 7)

  const hist = useOccurrences(histStart < monthStart ? histStart : monthStart, endOfMonth(today))
  const overdue = useOverdue()
  const week = hist.filter((o) => o.date >= weekStart && o.date <= addDays(weekStart, 6))
  const month = hist.filter((o) => o.date >= monthStart && o.date <= endOfMonth(today))

  const taskById = useMemo(() => new Map(snapshot.tasks.map((t) => [t.id, t])), [snapshot.tasks])
  const minutesOf = (c: Completion) => c.minutes ?? taskById.get(c.task_id)?.estimated_minutes ?? 0
  const completedIn = (from: string, to: string) =>
    snapshot.completions.filter((c) => {
      const d = c.occurrence_date
      return d >= from && d <= to
    })

  const monthCompletions = completedIn(monthStart, endOfMonth(today))
  const allCompletions = snapshot.completions

  const perPerson = SLOTS.map((slot) => {
    const doneMonth = monthCompletions.filter((c) => c.completed_by_slot === slot)
    const doneAll = allCompletions.filter((c) => c.completed_by_slot === slot)
    return {
      slot,
      m: member(slot),
      doneMonth: doneMonth.length,
      doneAll: doneAll.length,
      minutesMonth: doneMonth.reduce((s, c) => s + minutesOf(c), 0),
      minutesAll: doneAll.reduce((s, c) => s + minutesOf(c), 0),
      open: week.filter((o) => o.slot === slot && o.date >= today && (o.status === 'open' || o.status === 'postponed')).length,
      overdue: overdue.filter((o) => o.slot === slot).length,
      weekRate: rate(week, today, slot),
      monthRate: rate(month, today, slot),
      plannedMonth: month.filter((o) => o.slot === slot && o.status !== 'missed').reduce((s, o) => s + (o.task.estimated_minutes ?? 0), 0),
    }
  })

  const weekRate = rate(week, today)
  const monthRate = rate(month, today)

  // Historie: letzte 8 Wochen
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const from = addDays(histStart, i * 7)
    const to = addDays(from, 6)
    const occ = hist.filter((o) => o.date >= from && o.date <= to)
    const comps = completedIn(from, to)
    return {
      from,
      label: `KW ${isoWeek(from)}`,
      rate: rate(occ, today),
      minutes: SLOTS.map((s) => comps.filter((c) => c.completed_by_slot === s).reduce((sum, c) => sum + minutesOf(c), 0)),
    }
  })
  const maxMinutes = Math.max(30, ...weeks.flatMap((w) => w.minutes))

  const recent = [...allCompletions].sort((a, b) => (a.completed_at < b.completed_at ? 1 : -1)).slice(0, 15)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fortschritt & Fairness</h1>
        <p className="text-sm text-slate-500">Wer macht wie viel – nach Anzahl und nach Zeitaufwand</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <RateCard title="Erledigungsquote diese Woche" r={weekRate} perPerson={perPerson.map((p) => ({ m: p.m, r: p.weekRate }))} />
        <RateCard title={`Erledigungsquote ${formatDate(today, { month: 'long' })}`} r={monthRate} perPerson={perPerson.map((p) => ({ m: p.m, r: p.monthRate }))} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {perPerson.map((p) => (
          <Card key={p.slot} className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <Avatar member={p.m} size={40} />
              <div>
                <p className="font-semibold">{p.m.display_name}</p>
                <p className="text-xs text-slate-500">insgesamt {p.doneAll} erledigt · {formatMinutes(p.minutesAll)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Mini label="Erledigt (Monat)" value={p.doneMonth} />
              <Mini label="Offen (Woche)" value={p.open} />
              <Mini label="Überfällig" value={p.overdue} danger={p.overdue > 0} />
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Faire Verteilung" subtitle="Tatsächlich geleistete Zeit (wer hat abgehakt)" icon={<Scale className="h-4 w-4" />} />
        <div className="space-y-5 px-5 pb-5">
          <FairBar label="Dieser Monat" values={perPerson.map((p) => ({ m: p.m, v: p.minutesMonth }))} />
          <FairBar label="Gesamt" values={perPerson.map((p) => ({ m: p.m, v: p.minutesAll }))} />
          <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
            {perPerson.map((p) => (
              <p key={p.slot} className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5" /> {p.m.display_name}: laut Plan {formatMinutes(p.plannedMonth)} diesen Monat, geleistet {formatMinutes(p.minutesMonth)}
              </p>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Historische Entwicklung" subtitle="Geleistete Minuten pro Woche (letzte 8 Wochen)" icon={<TrendingUp className="h-4 w-4" />} />
        <div className="px-5 pb-5">
          <div className="flex h-48 items-end gap-2 sm:gap-4">
            {weeks.map((w) => (
              <div key={w.from} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <div className="flex h-full items-end justify-center gap-0.5 sm:gap-1">
                  {w.minutes.map((v, i) => (
                    <div
                      key={i}
                      className="w-full max-w-[18px] rounded-t-md transition-all duration-500"
                      style={{ height: `${(v / maxMinutes) * 100}%`, minHeight: v ? 3 : 0, background: member(SLOTS[i]).color }}
                      title={`${member(SLOTS[i]).display_name}: ${v} Min.`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2 border-t border-slate-100 pt-2 sm:gap-4">
            {weeks.map((w) => (
              <div key={w.from} className="min-w-0 flex-1 text-center">
                <p className="truncate text-[10px] font-medium text-slate-500 sm:text-xs">{w.label}</p>
                <p className={cx('text-[10px] sm:text-xs', w.rate.total ? 'text-slate-400' : 'text-slate-300')}>{w.rate.total ? `${w.rate.pct}%` : '–'}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
            {SLOTS.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: member(s).color }} /> {member(s).display_name}
              </span>
            ))}
            <span>Prozent = Erledigungsquote der Woche</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Zuletzt erledigt" icon={<History className="h-4 w-4" />} />
        <div className="px-2 pb-3">
          {recent.length === 0 ? (
            <EmptyState icon={<BarChart3 className="h-5 w-5" />} title="Noch nichts erledigt" text="Sobald ihr Aufgaben abhakt, erscheint hier der Verlauf." />
          ) : (
            recent.map((c) => {
              const t = taskById.get(c.task_id)
              const m = member(c.completed_by_slot)
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: m.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-700">
                      {t?.name ?? 'Gelöschte Aufgabe'}
                      {t?.archived_at && <span className="ml-1 text-xs text-slate-400">(gelöscht)</span>}
                    </p>
                    <p className="text-xs text-slate-400">
                      {m.display_name} · Termin {fmtShort(c.occurrence_date)} · {formatMinutes(minutesOf(c))}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min} Min.`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} Std. ${m} Min.` : `${h} Std.`
}

function Mini({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-3">
      <p className={cx('text-xl font-semibold', danger ? 'text-rose-600' : 'text-slate-900')}>{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  )
}

function RateCard({ title, r, perPerson }: { title: string; r: { done: number; total: number; pct: number }; perPerson: { m: { display_name: string; color: string }; r: { pct: number; done: number; total: number } }[] }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">
        {r.pct}% <span className="text-sm font-normal text-slate-400">({r.done}/{r.total})</span>
      </p>
      <div className="mt-4 space-y-2.5">
        {perPerson.map(({ m, r: pr }) => (
          <div key={m.display_name}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-600">{m.display_name}</span>
              <span className="text-slate-400">
                {pr.pct}% · {pr.done}/{pr.total}
              </span>
            </div>
            <ProgressBar value={pr.pct} color={m.color} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function FairBar({ label, values }: { label: string; values: { m: { display_name: string; color: string }; v: number }[] }) {
  const total = values.reduce((s, x) => s + x.v, 0)
  const shares = values.map((x) => (total ? (x.v / total) * 100 : 50))
  const diff = Math.abs(shares[0] - shares[1])
  const verdict = !total
    ? 'Noch keine Daten'
    : diff <= 10
      ? 'Ausgeglichen'
      : `${values[shares[0] > shares[1] ? 0 : 1].m.display_name} übernimmt mehr (${Math.round(Math.max(...shares))}%)`
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className={cx('text-xs font-medium', !total ? 'text-slate-400' : diff <= 10 ? 'text-emerald-600' : 'text-amber-600')}>{verdict}</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {values.map((x, i) => (
          <div key={i} className="h-full transition-all duration-500" style={{ width: `${total ? shares[i] : 50}%`, background: total ? x.m.color : '#e2e8f0' }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        {values.map((x, i) => (
          <span key={i}>
            {x.m.display_name}: {formatMinutes(x.v)}
          </span>
        ))}
      </div>
    </div>
  )
}
