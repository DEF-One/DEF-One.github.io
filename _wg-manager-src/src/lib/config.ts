import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const LS_KEY = 'wgm.supabase'
const MODE_KEY = 'wgm.mode'

export interface SupabaseConfig {
  url: string
  anonKey: string
  source: 'env' | 'device'
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function safeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* Speicher nicht verfügbar */
  }
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (envUrl && envKey) return { url: envUrl, anonKey: envKey, source: 'env' }
  const raw = safeGet(LS_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed.url && parsed.anonKey) return { url: parsed.url, anonKey: parsed.anonKey, source: 'device' }
  } catch {
    /* ignorieren */
  }
  return null
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  safeSet(LS_KEY, JSON.stringify({ url: url.trim().replace(/\/+$/, ''), anonKey: anonKey.trim() }))
}

export function clearSupabaseConfig() {
  safeSet(LS_KEY, null)
}

export type AppMode = 'supabase' | 'demo' | null

export function getMode(): AppMode {
  const m = safeGet(MODE_KEY)
  if (m === 'demo') return 'demo'
  if (getSupabaseConfig()) return 'supabase'
  return null
}

export function setMode(mode: AppMode) {
  safeSet(MODE_KEY, mode)
}

let client: SupabaseClient | null = null
let clientFor = ''

export function getSupabase(): SupabaseClient {
  const cfg = getSupabaseConfig()
  if (!cfg) throw new Error('Supabase ist noch nicht eingerichtet.')
  const id = cfg.url + cfg.anonKey
  if (!client || clientFor !== id) {
    client = createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
    clientFor = id
  }
  return client
}

/** Link, mit dem die zweite Person die Verbindungsdaten nicht abtippen muss */
export function buildSetupLink(): string | null {
  const cfg = getSupabaseConfig()
  if (!cfg) return null
  const base = window.location.href.split('#')[0]
  const payload = btoa(JSON.stringify({ u: cfg.url, k: cfg.anonKey }))
  return `${base}#/setup?c=${encodeURIComponent(payload)}`
}

/** Liest einen Einrichtungslink aus der URL und speichert ihn */
export function consumeSetupLink(): boolean {
  const hash = window.location.hash
  const m = hash.match(/[?&]c=([^&]+)/)
  if (!hash.startsWith('#/setup') || !m) return false
  try {
    const { u, k } = JSON.parse(atob(decodeURIComponent(m[1])))
    if (u && k) {
      saveSupabaseConfig(u, k)
      setMode('supabase')
      history.replaceState(null, '', window.location.pathname + window.location.search)
      return true
    }
  } catch {
    /* ungültiger Link */
  }
  return false
}
