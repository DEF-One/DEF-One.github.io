import type { RealtimeChannel } from '@supabase/supabase-js'
import { getSupabase } from './config'
import { defaultTasks } from './seed'
import type { Assignment, Completion, Household, Member, Scope, Slot, Snapshot, Task, TaskInput, UserSettings } from './types'

export interface AuthUser {
  id: string
  email: string | null
  name?: string | null
}

export interface CreateHouseholdInput {
  name: string
  myName: string
  partnerName: string
  startDate: string
}

export interface AssignmentPatch {
  task_id: string
  occurrence_date: string
  scope: Scope
  assigned_slot?: Slot | null
  moved_to?: string | null
}

export interface Backend {
  kind: 'supabase' | 'demo'
  getUser(): Promise<AuthUser | null>
  onAuthChange(cb: (u: AuthUser | null) => void): () => void
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string, name: string): Promise<{ needsConfirmation: boolean }>
  resetPassword(email: string): Promise<void>
  signOut(): Promise<void>

  getMyHouseholdId(user: AuthUser): Promise<string | null>
  createHousehold(input: CreateHouseholdInput): Promise<string>
  joinHousehold(code: string, displayName: string): Promise<string>
  loadSnapshot(householdId: string): Promise<Snapshot>

  updateHousehold(id: string, patch: Partial<Household>): Promise<void>
  updateMember(id: string, patch: Partial<Member>): Promise<void>
  createTasks(householdId: string, tasks: TaskInput[]): Promise<void>
  updateTask(id: string, patch: Partial<Task>): Promise<void>
  archiveTask(id: string): Promise<void>
  addCompletion(c: Omit<Completion, 'id' | 'completed_at'>): Promise<void>
  removeCompletion(taskId: string, occurrenceDate: string, scope: Scope): Promise<void>
  upsertAssignment(householdId: string, patch: AssignmentPatch): Promise<void>
  deleteAssignment(taskId: string, occurrenceDate: string, scope: Scope): Promise<void>

  getUserSettings(user: AuthUser): Promise<UserSettings | null>
  saveUserSettings(s: UserSettings): Promise<void>

  subscribe(householdId: string, onChange: () => void): () => void
}

// ---------------------------------------------------------------------------
// Fehler verständlich machen
// ---------------------------------------------------------------------------
export function humanError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e)
  const map: [RegExp, string][] = [
    [/Invalid login credentials/i, 'E-Mail oder Passwort ist falsch.'],
    [/Email not confirmed/i, 'Bitte bestätige zuerst deine E-Mail-Adresse (Link im Postfach).'],
    [/User already registered/i, 'Für diese E-Mail gibt es schon ein Konto. Bitte melde dich an.'],
    [/Password should be at least/i, 'Das Passwort muss mindestens 6 Zeichen lang sein.'],
    [/rate limit/i, 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.'],
    [/Failed to fetch|NetworkError|Load failed/i, 'Keine Verbindung zum Server. Bitte Internetverbindung prüfen.'],
    [/relation .* does not exist|Could not find the (table|function)/i, 'Die Datenbank ist noch nicht eingerichtet. Bitte die SQL-Migration im Supabase SQL Editor ausführen (siehe README).'],
    [/row-level security|permission denied/i, 'Keine Berechtigung für diese Aktion.'],
    [/Invalid API key|No API key/i, 'Der Supabase-Schlüssel ist ungültig. Bitte in der Einrichtung prüfen.'],
  ]
  for (const [re, text] of map) if (re.test(msg)) return text
  return msg
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function check<T = any>(res: { data: unknown; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------
export function supabaseBackend(): Backend {
  const sb = getSupabase()
  const toUser = (u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null | undefined): AuthUser | null =>
    u ? { id: u.id, email: u.email ?? null, name: (u.user_metadata?.name as string) ?? null } : null

  return {
    kind: 'supabase',
    async getUser() {
      const { data } = await sb.auth.getSession()
      return toUser(data.session?.user)
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_e, session) => cb(toUser(session?.user)))
      return () => data.subscription.unsubscribe()
    },
    async signIn(email, password) {
      check(await sb.auth.signInWithPassword({ email, password }))
    },
    async signUp(email, password, name) {
      const data = check(
        await sb.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: window.location.href.split('#')[0] },
        }),
      )
      return { needsConfirmation: !data.session }
    },
    async resetPassword(email) {
      check(await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.href.split('#')[0] }))
    },
    async signOut() {
      await sb.auth.signOut()
    },

    async getMyHouseholdId(user) {
      const rows = check(await sb.from('household_members').select('household_id').eq('user_id', user.id).limit(1))
      return rows?.[0]?.household_id ?? null
    },
    async createHousehold(input) {
      const hid = check(
        await sb.rpc('create_household', {
          p_name: input.name,
          p_my_name: input.myName,
          p_partner_name: input.partnerName,
          p_start_date: input.startDate,
        }),
      ) as string
      await this.createTasks(hid, defaultTasks(input.startDate))
      return hid
    },
    async joinHousehold(code, displayName) {
      return check(await sb.rpc('join_household', { p_code: code, p_display_name: displayName })) as string
    },
    async loadSnapshot(hid) {
      const [h, m, t, c, a] = await Promise.all([
        sb.from('households').select('*').eq('id', hid).single(),
        sb.from('household_members').select('*').eq('household_id', hid).order('slot'),
        sb.from('tasks').select('*').eq('household_id', hid).order('sort_order'),
        sb.from('task_completions').select('*').eq('household_id', hid).order('completed_at', { ascending: false }).limit(10000),
        sb.from('task_assignments').select('*').eq('household_id', hid).limit(10000),
      ])
      return {
        household: check(h) as Household,
        members: check(m) as Member[],
        tasks: check(t) as Task[],
        completions: check(c) as Completion[],
        assignments: check(a) as Assignment[],
      }
    },

    async updateHousehold(id, patch) {
      const { id: _i, invite_code: _c, ...rest } = patch
      check(await sb.from('households').update(rest).eq('id', id))
    },
    async updateMember(id, patch) {
      check(await sb.from('household_members').update({ display_name: patch.display_name, color: patch.color }).eq('id', id))
    },
    async createTasks(hid, tasks) {
      if (!tasks.length) return
      check(await sb.from('tasks').insert(tasks.map((t) => ({ ...t, household_id: hid }))))
    },
    async updateTask(id, patch) {
      const { id: _i, household_id: _h, created_at: _c, ...rest } = patch
      check(await sb.from('tasks').update(rest).eq('id', id))
    },
    async archiveTask(id) {
      check(await sb.from('tasks').update({ archived_at: new Date().toISOString() }).eq('id', id))
    },
    async addCompletion(c) {
      check(await sb.from('task_completions').upsert(c, { onConflict: 'task_id,occurrence_date,scope' }))
    },
    async removeCompletion(taskId, date, scope) {
      check(await sb.from('task_completions').delete().eq('task_id', taskId).eq('occurrence_date', date).eq('scope', scope))
    },
    async upsertAssignment(hid, patch) {
      check(await sb.from('task_assignments').upsert({ household_id: hid, ...patch }, { onConflict: 'task_id,occurrence_date,scope' }))
    },
    async deleteAssignment(taskId, date, scope) {
      check(await sb.from('task_assignments').delete().eq('task_id', taskId).eq('occurrence_date', date).eq('scope', scope))
    },

    async getUserSettings(user) {
      const rows = check(await sb.from('user_settings').select('*').eq('user_id', user.id).limit(1))
      return (rows?.[0] as UserSettings) ?? null
    },
    async saveUserSettings(s) {
      check(await sb.from('user_settings').upsert(s, { onConflict: 'user_id' }))
    },

    subscribe(hid, onChange) {
      let timer: ReturnType<typeof setTimeout> | undefined
      const debounced = () => {
        clearTimeout(timer)
        timer = setTimeout(onChange, 250)
      }
      const channel: RealtimeChannel = sb.channel(`household-${hid}`)
      for (const table of ['tasks', 'task_completions', 'task_assignments', 'household_members']) {
        channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `household_id=eq.${hid}` }, debounced)
      }
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'households', filter: `id=eq.${hid}` }, debounced)
      channel.subscribe()
      return () => {
        clearTimeout(timer)
        sb.removeChannel(channel)
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Demo-Modus: alles nur auf diesem Gerät (zum Ausprobieren ohne Supabase)
// ---------------------------------------------------------------------------
const DEMO_KEY = 'wgm.demo.v1'
const DEMO_USER: AuthUser = { id: 'demo-user', email: 'demo@wg.local', name: 'Demo' }

interface DemoDb {
  households: Household[]
  members: Member[]
  tasks: Task[]
  completions: Completion[]
  assignments: Assignment[]
  settings: UserSettings[]
}

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export function demoBackend(): Backend {
  const listeners = new Set<() => void>()
  const read = (): DemoDb => {
    try {
      const raw = localStorage.getItem(DEMO_KEY)
      if (raw) return JSON.parse(raw)
    } catch {
      /* leer */
    }
    return { households: [], members: [], tasks: [], completions: [], assignments: [], settings: [] }
  }
  const write = (db: DemoDb) => {
    localStorage.setItem(DEMO_KEY, JSON.stringify(db))
    listeners.forEach((l) => l())
  }
  const mutate = async (fn: (db: DemoDb) => void) => {
    const db = read()
    fn(db)
    write(db)
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key === DEMO_KEY) listeners.forEach((l) => l())
  }

  return {
    kind: 'demo',
    async getUser() {
      return DEMO_USER
    },
    onAuthChange() {
      return () => {}
    },
    async signIn() {},
    async signUp() {
      return { needsConfirmation: false }
    },
    async resetPassword() {},
    async signOut() {},

    async getMyHouseholdId() {
      return read().households[0]?.id ?? null
    },
    async createHousehold(input) {
      const hid = uid()
      const now = new Date().toISOString()
      await mutate((db) => {
        db.households = [
          {
            id: hid,
            name: input.name || 'Unsere WG',
            invite_code: 'DEMO1234',
            timezone: 'Europe/Berlin',
            plan_start_date: input.startDate,
            rotation_weeks: 1,
            created_at: now,
          },
        ]
        db.members = [
          { id: uid(), household_id: hid, slot: 'A', user_id: DEMO_USER.id, display_name: input.myName || 'Person A', color: '#3b82f6' },
          { id: uid(), household_id: hid, slot: 'B', user_id: null, display_name: input.partnerName || 'Person B', color: '#10b981' },
        ]
        db.tasks = []
        db.completions = []
        db.assignments = []
      })
      await this.createTasks(hid, defaultTasks(input.startDate))
      return hid
    },
    async joinHousehold() {
      throw new Error('Im Demo-Modus gibt es kein Beitreten. Richte Supabase ein, um die WG zu teilen.')
    },
    async loadSnapshot() {
      const db = read()
      if (!db.households[0]) throw new Error('Keine Demo-WG vorhanden.')
      return {
        household: db.households[0],
        members: db.members,
        tasks: db.tasks,
        completions: db.completions,
        assignments: db.assignments,
      }
    },
    async updateHousehold(id, patch) {
      await mutate((db) => {
        db.households = db.households.map((h) => (h.id === id ? { ...h, ...patch, id: h.id } : h))
      })
    },
    async updateMember(id, patch) {
      await mutate((db) => {
        db.members = db.members.map((m) => (m.id === id ? { ...m, ...patch, id: m.id } : m))
      })
    },
    async createTasks(hid, tasks) {
      await mutate((db) => {
        db.tasks.push(...tasks.map((t) => ({ ...t, id: uid(), household_id: hid, archived_at: null, created_at: new Date().toISOString() })))
      })
    },
    async updateTask(id, patch) {
      await mutate((db) => {
        db.tasks = db.tasks.map((t) => (t.id === id ? { ...t, ...patch, id: t.id } : t))
      })
    },
    async archiveTask(id) {
      await this.updateTask(id, { archived_at: new Date().toISOString() })
    },
    async addCompletion(c) {
      await mutate((db) => {
        db.completions = db.completions.filter(
          (x) => !(x.task_id === c.task_id && x.occurrence_date === c.occurrence_date && x.scope === c.scope),
        )
        db.completions.push({ ...c, id: uid(), completed_at: new Date().toISOString() })
      })
    },
    async removeCompletion(taskId, date, scope) {
      await mutate((db) => {
        db.completions = db.completions.filter((x) => !(x.task_id === taskId && x.occurrence_date === date && x.scope === scope))
      })
    },
    async upsertAssignment(hid, patch) {
      await mutate((db) => {
        const i = db.assignments.findIndex(
          (a) => a.task_id === patch.task_id && a.occurrence_date === patch.occurrence_date && a.scope === patch.scope,
        )
        if (i >= 0) db.assignments[i] = { ...db.assignments[i], ...patch }
        else db.assignments.push({ id: uid(), household_id: hid, assigned_slot: null, moved_to: null, note: null, ...patch })
      })
    },
    async deleteAssignment(taskId, date, scope) {
      await mutate((db) => {
        db.assignments = db.assignments.filter((a) => !(a.task_id === taskId && a.occurrence_date === date && a.scope === scope))
      })
    },
    async getUserSettings() {
      return read().settings[0] ?? null
    },
    async saveUserSettings(s) {
      await mutate((db) => {
        db.settings = [s]
      })
    },
    subscribe(_hid, onChange) {
      listeners.add(onChange)
      window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(onChange)
        window.removeEventListener('storage', onStorage)
      }
    },
  }
}

export function resetDemo() {
  localStorage.removeItem(DEMO_KEY)
}
