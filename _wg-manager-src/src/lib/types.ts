export type Slot = 'A' | 'B'
export type Scope = 'shared' | Slot
export type Frequency = 'once' | 'daily' | 'weekly' | 'monthly'
export type AssignmentMode = 'rotation' | 'fixed' | 'personal'
export type OccurrenceStatus = 'open' | 'done' | 'overdue' | 'postponed' | 'missed'

export interface Household {
  id: string
  name: string
  invite_code: string
  timezone: string
  plan_start_date: string // YYYY-MM-DD
  rotation_weeks: number
  created_at?: string
}

export interface Member {
  id: string
  household_id: string
  slot: Slot
  user_id: string | null
  display_name: string
  color: string
}

export interface Task {
  id: string
  household_id: string
  name: string
  description: string
  category: string
  frequency: Frequency
  repeat_every: number
  weekdays: number[] // 0 = Mo … 6 = So
  day_of_month: number | null
  start_date: string
  due_time: string | null
  estimated_minutes: number | null
  assignment_mode: AssignmentMode
  rotation_group: Slot
  fixed_slot: Slot | null
  sort_order: number
  archived_at: string | null
  created_at?: string
}

export type TaskInput = Omit<Task, 'id' | 'household_id' | 'archived_at' | 'created_at'>

export interface Completion {
  id: string
  household_id: string
  task_id: string
  occurrence_date: string
  scope: Scope
  completed_by_slot: Slot
  completed_by_user: string | null
  minutes: number | null
  completed_at: string
}

export interface Assignment {
  id: string
  household_id: string
  task_id: string
  occurrence_date: string
  scope: Scope
  assigned_slot: Slot | null
  moved_to: string | null
  note: string | null
}

export interface UserSettings {
  user_id: string
  household_id: string | null
  notifications_enabled: boolean
  notify_hour: number
}

export interface Snapshot {
  household: Household
  members: Member[]
  tasks: Task[]
  completions: Completion[]
  assignments: Assignment[]
}

/** Ein konkreter Termin einer Aufgabe */
export interface Occurrence {
  key: string
  task: Task
  originalDate: string
  date: string // effektives Datum (ggf. verschoben)
  scope: Scope
  slot: Slot // verantwortliche Person
  status: OccurrenceStatus
  completion?: Completion
  assignment?: Assignment
  isMoved: boolean
  isReassigned: boolean
}
