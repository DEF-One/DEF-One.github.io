import { AlertTriangle, CalendarCheck2, CalendarDays, CheckCheck, Clock3, PartyPopper, Repeat2, Sparkles, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { OccurrenceRow } from '../components/Occurrence'
import { Avatar, Card, CardHeader, cx, EmptyState, ProgressBar, Segmented } from '../components/ui'
import { useUi } from '../components/uiContext'
import { addDays, endOfWeek, fmtLong, isoWeek, relativeLabel, startOfWeek } from '../lib/dates'
import { rotationWeekNumber, useOccurrences, useOverdue } from '../lib/hooks'
import { useStore } from '../lib/store'
import type { Occurrence, Slot } from '../lib/types'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Gute Nacht'
  if (h < 11) return 'Guten Morgen'
  if (h < 18) return 'Hallo'
  return 'Guten Abend'
}

export function Dashboard() {
  const store = useStore()
  const { today, snapshot, member, mySlot } = store
  const { navigate } = useUi()
  const [filter, setFilter] = useState<'all' | 'mine'>('all')
  const me = member(mySlot)

  const weekStart = startOfWeek(today)
  const weekEnd = endOfWeek(today)
  const week = useOccurrences(weekStart, weekEnd)
  const upcoming = useOccurrences(addDays(today, 1), addDays(today, 7))
  const overdue = useOverdue()

  const mineOnly = (list: Occurrence[]) => (filter === 'mine' ? list.filter((o) => o.slot === mySlot) : list)
  const todayList = mineOnly(week.filter((o) => o.date === today && o.status !== 'missed'))
  const overdueList = mineOnly(overdue)

  const stats = useMemo(() => {
    const todayAll = week.filter((o) => o.date === today && o.status !== 'missed')
    return {
      today: todayAll.length,
      todayDone: todayAll.filter((o) => o.status === 'done').length,
      open: week.filter((o) => o.date >= today && (o.status === 'open' || o.status === 'postponed')).length + overdue.length,
      overdue: overdue.length,
      doneWeek: week.filter((o) => o.status === 'done').length,
    }
  }, [week, overdue, today])

  const rotWeek = rotationWeekNumber(today, snapshot.household.plan_start_date, snapshot.household.rotation_weeks)

  // Vorschau: tägliche Aufgaben ausblenden, damit wichtige Termine sichtbar bleiben
  const preview = useMemo(() => {
    const list = mineOnly(upcoming.filter((o) => o.task.frequency !== 'daily' && o.status !== 'done'))
    const byDay = new Map<string, Occurrence[]>()
    for (const o of list) byDay.set(o.date, [...(byDay.get(o.date) ?? []), o])
    return [...byDay.entries()]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcoming, filter, mySlot])

  const people = (['A', 'B'] as Slot[]).map((slot) => {
    const assigned = week.filter((o) => o.slot === slot && o.status !== 'missed')
    const doneByThem = week.filter((o) => o.completion?.completed_by_slot === slot).length
    const openCount = assigned.filter((o) => o.status !== 'done').length
    const doneAssigned = assigned.filter((o) => o.status === 'done').length
    const progress = assigned.length ? Math.round((doneAssigned / assigned.length) * 100) : 0
    return { m: member(slot), openCount, doneByThem, progress, overdue: overdue.filter((o) => o.slot === slot).length }
  })

  return (
    <div className="space-y-6">
      {/* Begrüßung */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {fmtLong(today)} · KW {isoWeek(today)}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {greeting()}, {me.display_name}
          </h1>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500">
            <Repeat2 className="h-4 w-4" /> Rotationswoche {rotWeek} von 2
          </p>
        </div>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Alle Aufgaben' },
            { value: 'mine', label: 'Nur meine' },
          ]}
        />
      </div>

      {/* Kennzahlen */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<CalendarCheck2 className="h-4 w-4" />} label="Heute fällig" value={stats.today} sub={`${stats.todayDone} erledigt`} tone="indigo" />
        <Stat icon={<Clock3 className="h-4 w-4" />} label="Noch offen" value={stats.open} sub="bis Sonntag" tone="slate" />
        <Stat icon={<AlertTriangle className="h-4 w-4" />} label="Überfällig" value={stats.overdue} sub={stats.overdue ? 'bitte nachholen' : 'alles im Plan'} tone={stats.overdue ? 'rose' : 'emerald'} />
        <Stat icon={<CheckCheck className="h-4 w-4" />} label="Diese Woche erledigt" value={stats.doneWeek} sub={`von ${week.filter((o) => o.status !== 'missed' && o.date <= weekEnd).length}`} tone="emerald" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {overdueList.length > 0 && (
            <Card className="border-rose-200/80">
              <CardHeader title="Überfällig" subtitle="Diese Aufgaben hätten schon erledigt sein sollen" icon={<AlertTriangle className="h-4 w-4 text-rose-500" />} />
              <div className="space-y-0.5 px-2 pb-3">
                {overdueList.map((o) => (
                  <OccurrenceRow key={o.key} o={o} showDate />
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Aufgaben für heute"
              subtitle={todayList.length ? `${todayList.filter((o) => o.status === 'done').length} von ${todayList.length} erledigt` : undefined}
              icon={<Sparkles className="h-4 w-4" />}
            />
            <div className="px-5">
              {todayList.length > 0 && (
                <ProgressBar value={(todayList.filter((o) => o.status === 'done').length / todayList.length) * 100} className="mb-2" />
              )}
            </div>
            <div className="space-y-0.5 px-2 pb-3">
              {todayList.length === 0 ? (
                <EmptyState icon={<PartyPopper className="h-5 w-5" />} title="Heute steht nichts an" text={filter === 'mine' ? 'Für dich ist heute nichts geplant.' : 'Genießt den freien Tag!'} />
              ) : (
                todayList.map((o) => <OccurrenceRow key={o.key} o={o} />)
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Personen" subtitle="Diese Woche" icon={<Users className="h-4 w-4" />} />
            <div className="space-y-4 px-5 pb-5">
              {people.map(({ m, openCount, doneByThem, progress, overdue: od }) => (
                <div key={m.slot} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar member={m} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {m.display_name}
                        {m.slot === mySlot && <span className="ml-1.5 text-xs font-normal text-slate-400">(du)</span>}
                      </p>
                      <p className="text-xs text-slate-500">
                        {openCount} offen · {doneByThem} erledigt{od ? ` · ` : ''}
                        {od ? <span className="text-rose-600">{od} überfällig</span> : null}
                      </p>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: m.color }}>
                      {progress}%
                    </span>
                  </div>
                  <ProgressBar value={progress} color={m.color} className="mt-3" />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Nächste 7 Tage"
              subtitle="ohne tägliche Routine"
              icon={<CalendarDays className="h-4 w-4" />}
              action={
                <button onClick={() => navigate('calendar')} className="text-xs font-medium text-indigo-600 hover:underline">
                  Kalender
                </button>
              }
            />
            <div className="px-2 pb-3">
              {preview.length === 0 ? (
                <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="Keine weiteren Termine" />
              ) : (
                preview.map(([date, list]) => (
                  <div key={date} className="mb-2">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{relativeLabel(date, today)}</p>
                    {list.map((o) => (
                      <OccurrenceRow key={o.key} o={o} compact />
                    ))}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: number; sub: string; tone: 'indigo' | 'slate' | 'rose' | 'emerald' }) {
  const toneCls = {
    indigo: 'bg-indigo-50 text-indigo-600',
    slate: 'bg-slate-100 text-slate-600',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }[tone]
  return (
    <Card className="p-4 sm:p-5">
      <div className={cx('mb-3 grid h-8 w-8 place-items-center rounded-xl', toneCls)}>{icon}</div>
      <p className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-600 sm:text-sm">{label}</p>
      <p className="text-[11px] text-slate-400 sm:text-xs">{sub}</p>
    </Card>
  )
}
