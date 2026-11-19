import { BarChart3, CalendarDays, CheckCircle2, Home, ListTodo, Loader2, Plus, Settings, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useStore } from '../lib/store'
import { NotificationAgent } from '../lib/notifications'
import { OccurrenceModal } from './Occurrence'
import { TaskFormModal } from './TaskForm'
import { Avatar, cx } from './ui'
import { useUi, type Page } from './uiContext'

const NAV: { page: Page; label: string; icon: LucideIcon }[] = [
  { page: 'dashboard', label: 'Übersicht', icon: Home },
  { page: 'calendar', label: 'Kalender', icon: CalendarDays },
  { page: 'tasks', label: 'Aufgaben', icon: ListTodo },
  { page: 'stats', label: 'Statistik', icon: BarChart3 },
  { page: 'settings', label: 'Einstellungen', icon: Settings },
]

export function Layout({ children }: { children: ReactNode }) {
  const { page, navigate, occurrence, openOccurrence, openTaskForm } = useUi()
  const store = useStore()
  const me = store.member(store.mySlot)

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      {/* Sidebar (Desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/70 bg-white/80 px-4 py-6 backdrop-blur lg:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{store.snapshot.household.name}</p>
            <p className="text-xs text-slate-400">WG Manager</p>
          </div>
        </div>
        <nav className="space-y-1">
          {NAV.map(({ page: p, label, icon: Icon }) => (
            <button
              key={p}
              onClick={() => navigate(p)}
              className={cx(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                page === p ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </button>
          ))}
        </nav>
        <button onClick={() => openTaskForm(null)} className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">
          <Plus className="h-4 w-4" /> Neue Aufgabe
        </button>
        <div className="mt-auto">
          {store.backend.kind === 'demo' && <DemoSwitch />}
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar member={me} size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{me.display_name}</p>
              <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                {store.syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                {store.backend.kind === 'demo' ? 'Demo-Modus (nur dieses Gerät)' : store.syncing ? 'Synchronisiere …' : 'Synchronisiert'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Header (Mobil) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/85 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur lg:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-600 text-white">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="truncate text-sm font-semibold">{store.snapshot.household.name}</p>
          {store.syncing && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
        </div>
        <div className="flex items-center gap-2">
          {store.backend.kind === 'demo' && <DemoSwitch compact />}
          <button onClick={() => navigate('settings')} aria-label="Einstellungen">
            <Avatar member={me} size={30} />
          </button>
        </div>
      </header>

      <main className="pb-28 lg:pb-12 lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>

      {/* Schnell-Hinzufügen (Mobil) */}
      <button
        onClick={() => openTaskForm(null)}
        className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-30 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95 lg:hidden"
        aria-label="Neue Aufgabe"
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* Bottom-Navigation (Mobil) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.map(({ page: p, label, icon: Icon }) => (
          <button key={p} onClick={() => navigate(p)} className={cx('flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium', page === p ? 'text-indigo-600' : 'text-slate-400')}>
            <Icon className="h-5 w-5" />
            {label === 'Einstellungen' ? 'Mehr' : label}
          </button>
        ))}
      </nav>

      <OccurrenceModal o={occurrence} onClose={() => openOccurrence(null)} />
      <TaskFormModal />
      <NotificationAgent />
    </div>
  )
}

function DemoSwitch({ compact }: { compact?: boolean }) {
  const store = useStore()
  return (
    <div className={cx('flex items-center gap-1 rounded-xl bg-amber-50 p-1', !compact && 'mb-3')}>
      {!compact && <span className="px-2 text-[11px] font-medium text-amber-700">Ich bin:</span>}
      {(['A', 'B'] as const).map((s) => {
        const m = store.member(s)
        return (
          <button
            key={s}
            onClick={() => store.setDemoSlot(s)}
            className={cx('truncate rounded-lg px-2 py-1 text-[11px] font-medium', store.mySlot === s ? 'bg-white text-slate-800 shadow-sm' : 'text-amber-700')}
            title="Demo: Ansicht wechseln"
          >
            {compact ? m.display_name.slice(0, 6) : m.display_name}
          </button>
        )
      })}
    </div>
  )
}
