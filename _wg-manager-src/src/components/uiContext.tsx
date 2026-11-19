import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Occurrence, Task } from '../lib/types'

export type Page = 'dashboard' | 'calendar' | 'tasks' | 'stats' | 'settings'
const PAGES: Page[] = ['dashboard', 'calendar', 'tasks', 'stats', 'settings']

interface UiValue {
  page: Page
  navigate: (p: Page) => void
  occurrence: Occurrence | null
  openOccurrence: (o: Occurrence | null) => void
  taskForm: { open: boolean; task: Task | null }
  openTaskForm: (task: Task | null) => void
  closeTaskForm: () => void
}

const Ctx = createContext<UiValue | null>(null)
export const useUi = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('UiProvider fehlt')
  return v
}

function pageFromHash(): Page {
  const h = window.location.hash.replace(/^#\/?/, '').split('?')[0] as Page
  return PAGES.includes(h) ? h : 'dashboard'
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>(pageFromHash)
  const [occurrence, setOccurrence] = useState<Occurrence | null>(null)
  const [taskForm, setTaskForm] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null })

  useEffect(() => {
    const onHash = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = (p: Page) => {
    window.location.hash = `#/${p}`
    setPage(p)
    window.scrollTo({ top: 0 })
  }

  return (
    <Ctx.Provider
      value={{
        page,
        navigate,
        occurrence,
        openOccurrence: setOccurrence,
        taskForm,
        openTaskForm: (task) => setTaskForm({ open: true, task }),
        closeTaskForm: () => setTaskForm({ open: false, task: null }),
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
