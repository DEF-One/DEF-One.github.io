import { ArrowRight, CheckCircle2, Database, Home, KeyRound, Mail, PlayCircle, UserPlus } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Alert, Button, Card, Field, Input, Segmented } from '../components/ui'
import { humanError, type Backend } from '../lib/backend'
import { saveSupabaseConfig, setMode } from '../lib/config'
import { todayIn } from '../lib/dates'

function Shell({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-50 to-indigo-50/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">WG Manager</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle ?? 'Euer gemeinsamer Haushalts- und Putzkalender'}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

export function SetupPage({ onDone }: { onDone: () => void }) {
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^https:\/\/.+/.test(url.trim())) return setError('Die Projekt-URL muss mit https:// beginnen.')
    if (key.trim().length < 20) return setError('Der Schlüssel scheint unvollständig zu sein.')
    saveSupabaseConfig(url, key)
    setMode('supabase')
    onDone()
  }

  return (
    <Shell subtitle="Einmalige Einrichtung">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-4 w-4 text-indigo-600" />
          <h2 className="text-sm font-semibold">Mit Supabase verbinden</h2>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-slate-500">
          Damit ihr beide auf euren Geräten dieselben Daten seht, speichert die App alles in eurem eigenen kostenlosen Supabase-Projekt. Die Werte findest du im Supabase-Dashboard unter <em>Project Settings → API</em>. Deine Mitbewohnerin bzw. dein Mitbewohner bekommt später einfach einen Einrichtungslink.
        </p>
        <form onSubmit={submit} className="space-y-3">
          {error && <Alert kind="error">{error}</Alert>}
          <Field label="Project URL">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xyzcompany.supabase.co" inputMode="url" autoComplete="off" />
          </Field>
          <Field label="anon / publishable key">
            <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="eyJhbGciOi… oder sb_publishable_…" autoComplete="off" />
          </Field>
          <Button type="submit" variant="primary" className="w-full" icon={<ArrowRight className="h-4 w-4" />}>
            Verbinden
          </Button>
        </form>
      </Card>
      <Card className="mt-4 p-5">
        <div className="flex items-start gap-3">
          <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Erst mal ausprobieren?</p>
            <p className="mt-0.5 text-xs text-slate-500">Der Demo-Modus speichert nur in diesem Browser – ideal zum Anschauen.</p>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => {
                setMode('demo')
                onDone()
              }}
            >
              Demo starten
            </Button>
          </div>
        </div>
      </Card>
    </Shell>
  )
}

export function AuthPage({ backend, onBack }: { backend: Backend; onBack: () => void }) {
  const [mode, setModeTab] = useState<'login' | 'register' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      if (mode === 'login') await backend.signIn(email.trim(), password)
      else if (mode === 'register') {
        const { needsConfirmation } = await backend.signUp(email.trim(), password, name.trim())
        if (needsConfirmation) setInfo('Fast geschafft! Bitte bestätige deine E-Mail-Adresse über den Link in deinem Postfach und melde dich dann an.')
      } else {
        await backend.resetPassword(email.trim())
        setInfo('Wir haben dir einen Link zum Zurücksetzen geschickt.')
      }
    } catch (err) {
      setError(humanError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Shell>
      <Card className="p-6">
        {mode !== 'reset' && (
          <Segmented
            className="mb-5 w-full [&>button]:flex-1"
            value={mode}
            onChange={(v) => {
              setModeTab(v)
              setError(null)
              setInfo(null)
            }}
            options={[
              { value: 'login', label: 'Anmelden' },
              { value: 'register', label: 'Registrieren' },
            ]}
          />
        )}
        <form onSubmit={submit} className="space-y-3">
          {error && <Alert kind="error">{error}</Alert>}
          {info && <Alert kind="success">{info}</Alert>}
          {mode === 'register' && (
            <Field label="Dein Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="given-name" />
            </Field>
          )}
          <Field label="E-Mail">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </Field>
          {mode !== 'reset' && (
            <Field label="Passwort" hint={mode === 'register' ? 'Mindestens 6 Zeichen' : undefined}>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </Field>
          )}
          <Button type="submit" variant="primary" className="w-full" loading={loading} icon={mode === 'reset' ? <Mail className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}>
            {mode === 'login' ? 'Anmelden' : mode === 'register' ? 'Konto erstellen' : 'Link senden'}
          </Button>
        </form>
        <div className="mt-4 flex justify-between text-xs">
          <button className="text-slate-500 hover:text-slate-700" onClick={() => setModeTab(mode === 'reset' ? 'login' : 'reset')}>
            {mode === 'reset' ? '← Zurück zur Anmeldung' : 'Passwort vergessen?'}
          </button>
          <button className="text-slate-400 hover:text-slate-600" onClick={onBack}>
            Verbindung ändern
          </button>
        </div>
      </Card>
    </Shell>
  )
}

export function OnboardingPage({ backend, defaultName, onDone }: { backend: Backend; defaultName: string; onDone: () => void }) {
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [wgName, setWgName] = useState('Unsere WG')
  const [myName, setMyName] = useState(defaultName)
  const [partner, setPartner] = useState('')
  const [start, setStart] = useState(todayIn('Europe/Berlin'))
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (tab === 'create') await backend.createHousehold({ name: wgName, myName, partnerName: partner || 'Person B', startDate: start })
      else await backend.joinHousehold(code, myName)
      onDone()
    } catch (err) {
      setError(humanError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Shell subtitle="Willkommen! Legt eure WG an oder tretet bei.">
      <Card className="p-6">
        {backend.kind === 'supabase' && (
          <Segmented
            className="mb-5 w-full [&>button]:flex-1"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'create', label: 'WG erstellen' },
              { value: 'join', label: 'WG beitreten' },
            ]}
          />
        )}
        <form onSubmit={submit} className="space-y-3">
          {error && <Alert kind="error">{error}</Alert>}
          {tab === 'create' ? (
            <>
              <Field label="Name der WG">
                <Input value={wgName} onChange={(e) => setWgName(e.target.value)} required maxLength={60} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Dein Name">
                  <Input value={myName} onChange={(e) => setMyName(e.target.value)} required maxLength={40} />
                </Field>
                <Field label="Mitbewohner:in">
                  <Input value={partner} onChange={(e) => setPartner(e.target.value)} placeholder="Name" maxLength={40} />
                </Field>
              </div>
              <Field label="Start des Putzplans" hint="Ab dieser Woche beginnt Rotationswoche 1">
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
              </Field>
              <p className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                <Home className="mt-0.5 h-4 w-4 shrink-0" />
                Der komplette Haushaltsplan (35 Aufgaben von täglich bis vierteljährlich) wird mit fairer 2-Wochen-Rotation angelegt. Alles lässt sich später anpassen.
              </p>
            </>
          ) : (
            <>
              <Field label="Dein Name">
                <Input value={myName} onChange={(e) => setMyName(e.target.value)} required maxLength={40} />
              </Field>
              <Field label="Einladungscode" hint="Steht bei deinem Mitbewohner unter Einstellungen">
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required placeholder="z. B. 4F7A2C9B" className="font-mono tracking-widest" />
              </Field>
            </>
          )}
          <Button type="submit" variant="primary" className="w-full" loading={loading} icon={tab === 'create' ? <Home className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}>
            {tab === 'create' ? 'WG erstellen' : 'Beitreten'}
          </Button>
        </form>
        {backend.kind === 'supabase' && (
          <button className="mt-4 text-xs text-slate-400 hover:text-slate-600" onClick={() => backend.signOut()}>
            Abmelden
          </button>
        )}
      </Card>
    </Shell>
  )
}

export function ErrorPage({ message, onRetry, onReset }: { message: string; onRetry: () => void; onReset: () => void }) {
  return (
    <Shell subtitle="Da ist etwas schiefgelaufen">
      <Card className="space-y-4 p-6">
        <Alert kind="error">{message}</Alert>
        <div className="flex gap-2">
          <Button variant="primary" onClick={onRetry}>
            Erneut versuchen
          </Button>
          <Button variant="ghost" onClick={onReset}>
            Verbindung ändern
          </Button>
        </div>
      </Card>
    </Shell>
  )
}
