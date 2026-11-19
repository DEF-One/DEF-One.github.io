import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Layout } from './components/Layout'
import { cx, FullScreenLoader } from './components/ui'
import { UiProvider, useUi } from './components/uiContext'
import { demoBackend, humanError, supabaseBackend, type AuthUser, type Backend } from './lib/backend'
import { clearSupabaseConfig, consumeSetupLink, getMode, getSupabaseConfig, setMode } from './lib/config'
import { StoreProvider, type Toast } from './lib/store'
import type { Snapshot, UserSettings } from './lib/types'
import { CalendarPage } from './pages/CalendarPage'
import { Dashboard } from './pages/Dashboard'
import { AuthPage, ErrorPage, OnboardingPage, SetupPage } from './pages/EntryPages'
import { SettingsPage } from './pages/SettingsPage'
import { StatsPage } from './pages/StatsPage'
import { TasksPage } from './pages/TasksPage'

type Phase =
  | { name: 'boot' }
  | { name: 'setup' }
  | { name: 'auth'; backend: Backend }
  | { name: 'onboarding'; backend: Backend; user: AuthUser }
  | { name: 'ready'; backend: Backend; user: AuthUser; snapshot: Snapshot; settings: UserSettings | null }
  | { name: 'error'; message: string }

export default function App() {
  const [phase, setPhase] = useState<Phase>({ name: 'boot' })
  const [toasts, setToasts] = useState<Toast[]>([])
  const backendRef = useRef<Backend | null>(null)
  const bootSeq = useRef(0)

  const toast = useCallback((text: string, kind: Toast['kind'] = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t.slice(-2), { id, kind, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 6000 : 3000)
  }, [])

  const boot = useCallback(async () => {
    const seq = ++bootSeq.current
    const guard = (p: Phase) => seq === bootSeq.current && setPhase(p)
    consumeSetupLink()
    const mode = getMode()
    if (!mode) return guard({ name: 'setup' })
    try {
      if (!backendRef.current || backendRef.current.kind !== mode) backendRef.current = mode === 'demo' ? demoBackend() : supabaseBackend()
      const backend = backendRef.current
      const user = await backend.getUser()
      if (!user) return guard({ name: 'auth', backend })
      const hid = await backend.getMyHouseholdId(user)
      if (!hid) return guard({ name: 'onboarding', backend, user })
      const [snapshot, settings] = await Promise.all([backend.loadSnapshot(hid), backend.getUserSettings(user).catch(() => null)])
      guard({ name: 'ready', backend, user, snapshot, settings })
    } catch (e) {
      guard({ name: 'error', message: humanError(e) })
    }
  }, [])

  useEffect(() => {
    void boot()
  }, [boot])

  // Reagiert auf Anmelden/Abmelden (auch in anderen Tabs)
  const kind = phase.name === 'auth' || phase.name === 'onboarding' || phase.name === 'ready' ? phase.backend.kind : null
  useEffect(() => {
    const b = backendRef.current
    if (!b || b.kind !== 'supabase') return
    let last: string | null | undefined
    return b.onAuthChange((u) => {
      const id = u?.id ?? null
      if (last !== undefined && last === id) return
      const firstCall = last === undefined
      last = id
      if (!firstCall) void boot()
    })
  }, [kind, boot])

  const resetConnection = () => {
    if (getSupabaseConfig()?.source === 'device') clearSupabaseConfig()
    setMode(null)
    backendRef.current = null
    setPhase({ name: 'setup' })
  }

  let content: React.ReactNode
  switch (phase.name) {
    case 'boot':
      content = <FullScreenLoader label="WG Manager wird geladen …" />
      break
    case 'setup':
      content = <SetupPage onDone={() => void boot()} />
      break
    case 'auth':
      content = <AuthPage backend={phase.backend} onBack={resetConnection} />
      break
    case 'onboarding':
      content = <OnboardingPage backend={phase.backend} defaultName={phase.user.name ?? ''} onDone={() => void boot()} />
      break
    case 'error':
      content = <ErrorPage message={phase.message} onRetry={() => void boot()} onReset={resetConnection} />
      break
    case 'ready':
      content = (
        <StoreProvider key={phase.snapshot.household.id} backend={phase.backend} user={phase.user} initial={phase.snapshot} initialSettings={phase.settings} toast={toast}>
          <UiProvider>
            <Layout>
              <CurrentPage />
            </Layout>
          </UiProvider>
        </StoreProvider>
      )
      break
  }

  return (
    <>
      {content}
      <Toasts toasts={toasts} onClose={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </>
  )
}

function CurrentPage() {
  const { page } = useUi()
  return useMemo(() => {
    switch (page) {
      case 'calendar':
        return <CalendarPage />
      case 'tasks':
        return <TasksPage />
      case 'stats':
        return <StatsPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <Dashboard />
    }
  }, [page])
}

function Toasts({ toasts, onClose }: { toasts: Toast[]; onClose: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => {
        const Icon = t.kind === 'error' ? AlertTriangle : t.kind === 'success' ? CheckCircle2 : Info
        return (
          <div
            key={t.id}
            className={cx(
              'pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-2xl px-4 py-3 text-sm shadow-lg animate-[rise_.2s_ease-out]',
              t.kind === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white',
            )}
            role="status"
          >
            <Icon className={cx('mt-0.5 h-4 w-4 shrink-0', t.kind === 'success' && 'text-emerald-400')} />
            <p className="flex-1">{t.text}</p>
            <button onClick={() => onClose(t.id)} className="opacity-60 hover:opacity-100" aria-label="Schließen">
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
