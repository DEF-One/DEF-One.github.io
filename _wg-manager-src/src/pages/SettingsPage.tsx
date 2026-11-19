import { ArrowRightLeft, Bell, Copy, Home, Link2, LogOut, Palette, Pencil, Repeat, Shuffle, UserCheck, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert, Avatar, Button, Card, CardHeader, cx, Field, Input, Select } from '../components/ui'
import { useUi } from '../components/uiContext'
import { resetDemo } from '../lib/backend'
import { buildSetupLink, clearSupabaseConfig, getSupabaseConfig, setMode } from '../lib/config'
import { frequencyLabel, otherSlot } from '../lib/recurrence'
import { notificationsSupported, requestNotificationPermission } from '../lib/notifications'
import { PERSON_COLORS } from '../lib/seed'
import { useStore } from '../lib/store'
import type { AssignmentMode, Member, Slot, Task } from '../lib/types'

const TIMEZONES = ['Europe/Berlin', 'Europe/Vienna', 'Europe/Zurich', 'Europe/London', 'Europe/Paris', 'Europe/Madrid', 'America/New_York', 'UTC']

export function SettingsPage() {
  const store = useStore()
  const { snapshot } = store
  const h = snapshot.household
  const [name, setName] = useState(h.name)
  const [start, setStart] = useState(h.plan_start_date)
  const [weeks, setWeeks] = useState(h.rotation_weeks)
  const [tz, setTz] = useState(h.timezone)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(h.name)
    setStart(h.plan_start_date)
    setWeeks(h.rotation_weeks)
    setTz(h.timezone)
  }, [h.name, h.plan_start_date, h.rotation_weeks, h.timezone])

  const dirty = name !== h.name || start !== h.plan_start_date || weeks !== h.rotation_weeks || tz !== h.timezone

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>
        <p className="text-sm text-slate-500">Änderungen gelten sofort für beide Bewohner</p>
      </div>

      <Card>
        <CardHeader title="WG & Putzplan" icon={<Home className="h-4 w-4" />} />
        <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
          <Field label="WG-Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </Field>
          <Field label="Startdatum des Putzplans" hint="Ab dieser Woche beginnt Rotationswoche 1">
            <Input type="date" value={start} onChange={(e) => e.target.value && setStart(e.target.value)} />
          </Field>
          <Field label="Rotationsrhythmus" hint="Wie oft die Aufgaben zwischen euch getauscht werden">
            <Select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
              <option value={1}>Jede Woche tauschen (2-Wochen-Zyklus)</option>
              <option value={2}>Alle 2 Wochen tauschen</option>
              <option value={3}>Alle 3 Wochen tauschen</option>
              <option value={4}>Alle 4 Wochen tauschen</option>
            </Select>
          </Field>
          <Field label="Zeitzone">
            <Select value={tz} onChange={(e) => setTz(e.target.value)}>
              {TIMEZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Button
              variant="primary"
              disabled={!dirty}
              loading={saving}
              onClick={async () => {
                setSaving(true)
                await store.updateHousehold({ name: name.trim() || 'Unsere WG', plan_start_date: start, rotation_weeks: weeks, timezone: tz })
                setSaving(false)
              }}
            >
              Speichern
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Bewohner" subtitle="Namen und Farben im Kalender" icon={<Users className="h-4 w-4" />} />
        <div className="grid gap-4 px-5 pb-5 md:grid-cols-2">
          {(['A', 'B'] as Slot[]).map((s) => (
            <MemberEditor key={s} member={store.member(s)} isMe={store.mySlot === s} demo={store.backend.kind === 'demo'} />
          ))}
        </div>
      </Card>

      {store.backend.kind === 'supabase' && <InviteCard />}

      <DistributionCard />

      <NotificationCard />

      <AccountCard />
    </div>
  )
}

function MemberEditor({ member, isMe, demo }: { member: Member; isMe: boolean; demo: boolean }) {
  const store = useStore()
  const [name, setName] = useState(member.display_name)
  useEffect(() => setName(member.display_name), [member.display_name])

  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <div className="mb-3 flex items-center gap-3">
        <Avatar member={{ ...member, display_name: name || member.display_name }} size={40} />
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">Person {member.slot}</p>
          <p className="flex items-center gap-1 text-xs text-slate-500">
            {demo ? null : member.user_id ? (
              <>
                <UserCheck className="h-3.5 w-3.5 text-emerald-500" /> {isMe ? 'Das bist du' : 'Verbunden'}
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5 text-amber-500" /> Noch nicht beigetreten
              </>
            )}
          </p>
        </div>
      </div>
      <Field label="Name">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && name !== member.display_name && store.updateMember(member, { display_name: name.trim() })}
          maxLength={40}
        />
      </Field>
      <div className="mt-3">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Palette className="h-3.5 w-3.5" /> Farbe
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {PERSON_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => store.updateMember(member, { color: c })}
              className={cx('h-7 w-7 rounded-full transition', member.color === c && 'ring-2 ring-offset-2')}
              style={{ background: c, ['--tw-ring-color' as string]: c }}
              aria-label={`Farbe ${c}`}
            />
          ))}
          <input type="color" value={member.color} onChange={(e) => store.updateMember(member, { color: e.target.value })} className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent" />
        </div>
      </div>
    </div>
  )
}

function InviteCard() {
  const { snapshot, toast } = useStore()
  const free = snapshot.members.some((m) => !m.user_id)
  const link = buildSetupLink()
  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast(`${what} kopiert`, 'success')
    } catch {
      toast('Kopieren nicht möglich – bitte manuell markieren.', 'error')
    }
  }
  return (
    <Card>
      <CardHeader title="Mitbewohner einladen" icon={<UserPlus className="h-4 w-4" />} />
      <div className="space-y-4 px-5 pb-5">
        {!free && <Alert kind="success">Beide Plätze sind belegt – ihr seht dieselben Daten.</Alert>}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">1. Link öffnen (verbindet die App)</p>
            <Button size="sm" className="mt-2" icon={<Link2 className="h-3.5 w-3.5" />} onClick={() => link && copy(link, 'Einrichtungslink')}>
              Einrichtungslink kopieren
            </Button>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">2. Konto erstellen und mit Code beitreten</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="rounded-lg bg-white px-3 py-1.5 font-mono text-base font-semibold tracking-widest text-slate-800 ring-1 ring-slate-200">{snapshot.household.invite_code}</code>
              <Button size="sm" variant="ghost" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => copy(snapshot.household.invite_code, 'Code')} aria-label="Code kopieren" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function DistributionCard() {
  const store = useStore()
  const { openTaskForm } = useUi()
  const tasks = store.snapshot.tasks.filter((t) => !t.archived_at)
  const [busy, setBusy] = useState(false)

  const setMode = (t: Task, mode: AssignmentMode) =>
    store.saveTask(t.id, { ...strip(t), assignment_mode: mode, fixed_slot: mode === 'fixed' ? (t.fixed_slot ?? t.rotation_group) : t.fixed_slot })
  const setSlot = (t: Task, slot: Slot) => store.saveTask(t.id, t.assignment_mode === 'fixed' ? { ...strip(t), fixed_slot: slot } : { ...strip(t), rotation_group: slot })

  const swapAll = async () => {
    setBusy(true)
    try {
      for (const t of tasks.filter((x) => x.assignment_mode === 'rotation')) {
        await store.backend.updateTask(t.id, { rotation_group: otherSlot(t.rotation_group) })
      }
      store.toast('Rotation getauscht', 'success')
    } catch {
      store.toast('Tauschen fehlgeschlagen', 'error')
    } finally {
      await store.reload()
      setBusy(false)
    }
  }

  const minutes = (slot: Slot) =>
    tasks
      .filter((t) => (t.assignment_mode === 'rotation' ? t.rotation_group === slot : t.assignment_mode === 'fixed' && t.fixed_slot === slot))
      .filter((t) => t.frequency === 'daily' || t.frequency === 'weekly')
      .reduce((s, t) => s + (t.estimated_minutes ?? 0) * (t.frequency === 'daily' ? 7 / t.repeat_every : (t.weekdays.length || 1) / t.repeat_every), 0)

  return (
    <Card>
      <CardHeader
        title="Aufgabenverteilung & Häufigkeiten"
        subtitle="Wer in Rotationswoche 1 zuständig ist – in Woche 2 wird getauscht"
        icon={<Repeat className="h-4 w-4" />}
        action={
          <Button size="sm" icon={<Shuffle className="h-3.5 w-3.5" />} loading={busy} onClick={swapAll}>
            Alles tauschen
          </Button>
        }
      />
      <div className="px-5 pb-2">
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
          {(['A', 'B'] as Slot[]).map((s) => (
            <div key={s} className="rounded-xl bg-slate-50 px-3 py-2">
              <span className="font-medium" style={{ color: store.member(s).color }}>
                {store.member(s).display_name}
              </span>{' '}
              · Woche 1: ca. {Math.round(minutes(s))} Min. (tägl./wöchentl.)
            </div>
          ))}
        </div>
      </div>
      <div className="max-h-[480px] divide-y divide-slate-100 overflow-y-auto border-t border-slate-100">
        {tasks.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center gap-2 px-5 py-2.5">
            <div className="min-w-0 flex-1 basis-48">
              <p className="truncate text-sm font-medium text-slate-800">{t.name}</p>
              <p className="text-xs text-slate-400">{frequencyLabel(t)}</p>
            </div>
            <Select value={t.assignment_mode} onChange={(e) => setMode(t, e.target.value as AssignmentMode)} className="!w-auto !py-1.5 text-xs">
              <option value="rotation">Rotation</option>
              <option value="fixed">Fest</option>
              <option value="personal">Persönlich</option>
            </Select>
            {t.assignment_mode !== 'personal' && (
              <button
                onClick={() => setSlot(t, otherSlot(t.assignment_mode === 'fixed' ? (t.fixed_slot ?? 'A') : t.rotation_group))}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium"
                style={{ color: store.member(t.assignment_mode === 'fixed' ? (t.fixed_slot ?? 'A') : t.rotation_group).color }}
                title="Person wechseln"
              >
                <ArrowRightLeft className="h-3 w-3" />
                {store.member(t.assignment_mode === 'fixed' ? (t.fixed_slot ?? 'A') : t.rotation_group).display_name}
              </button>
            )}
            <Button size="sm" variant="ghost" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => openTaskForm(t)} aria-label="Häufigkeit bearbeiten" />
          </div>
        ))}
      </div>
    </Card>
  )
}

function strip(t: Task) {
  const { id: _i, household_id: _h, archived_at: _a, created_at: _c, ...rest } = t
  return rest
}

function NotificationCard() {
  const store = useStore()
  const supported = notificationsSupported()
  const [perm, setPerm] = useState<string>(supported ? Notification.permission : 'unsupported')

  return (
    <Card>
      <CardHeader title="Erinnerungen" subtitle="Browser-Benachrichtigung einmal täglich, solange die App geöffnet ist" icon={<Bell className="h-4 w-4" />} />
      <div className="space-y-4 px-5 pb-5">
        {!supported ? (
          <Alert kind="warning">Dieser Browser unterstützt keine Benachrichtigungen. Auf dem iPhone: App über „Zum Home-Bildschirm“ hinzufügen.</Alert>
        ) : perm === 'denied' ? (
          <Alert kind="warning">Benachrichtigungen sind im Browser blockiert. Bitte in den Website-Einstellungen erlauben.</Alert>
        ) : null}
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-700">Tägliche Erinnerung an meine Aufgaben</span>
          <input
            type="checkbox"
            className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-slate-200 transition before:block before:h-4 before:w-4 before:translate-x-0.5 before:rounded-full before:bg-white before:shadow before:transition checked:bg-indigo-600 checked:before:translate-x-[18px]"
            checked={store.settings.notifications_enabled}
            disabled={!supported}
            onChange={async (e) => {
              if (e.target.checked) {
                const p = await requestNotificationPermission()
                setPerm(p)
                if (p !== 'granted') return store.toast('Benachrichtigungen wurden nicht erlaubt.', 'error')
              }
              await store.saveSettings({ notifications_enabled: e.target.checked })
            }}
          />
        </label>
        <Field label="Ab Uhrzeit">
          <Select value={store.settings.notify_hour} onChange={(e) => store.saveSettings({ notify_hour: Number(e.target.value) })} className="sm:w-40">
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {String(i).padStart(2, '0')}:00 Uhr
              </option>
            ))}
          </Select>
        </Field>
        <p className="text-xs text-slate-500">Heute fällige Aufgaben werden im Dashboard hervorgehoben, überfällige rot markiert.</p>
      </div>
    </Card>
  )
}

function AccountCard() {
  const store = useStore()
  const cfg = getSupabaseConfig()
  const leaveDemo = () => {
    setMode(null)
    window.location.reload()
  }
  return (
    <Card>
      <CardHeader title="Konto & Verbindung" icon={<LogOut className="h-4 w-4" />} />
      <div className="space-y-3 px-5 pb-5 text-sm">
        {store.backend.kind === 'demo' ? (
          <>
            <Alert kind="warning">Demo-Modus: Daten liegen nur in diesem Browser. Für die gemeinsame Nutzung Supabase einrichten.</Alert>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={leaveDemo}>
                Supabase einrichten
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm('Demo-Daten wirklich löschen?')) {
                    resetDemo()
                    window.location.reload()
                  }
                }}
              >
                Demo zurücksetzen
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-slate-600">
              Angemeldet als <strong className="font-medium text-slate-800">{store.user.email}</strong>
            </p>
            {cfg && <p className="truncate text-xs text-slate-400">Server: {cfg.url}</p>}
            <div className="flex flex-wrap gap-2">
              <Button
                icon={<LogOut className="h-4 w-4" />}
                onClick={async () => {
                  await store.backend.signOut()
                  window.location.reload()
                }}
              >
                Abmelden
              </Button>
              {cfg?.source === 'device' && (
                <Button
                  variant="ghost"
                  onClick={async () => {
                    if (!confirm('Verbindung auf diesem Gerät trennen?')) return
                    await store.backend.signOut()
                    clearSupabaseConfig()
                    setMode(null)
                    window.location.reload()
                  }}
                >
                  Verbindung ändern
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
