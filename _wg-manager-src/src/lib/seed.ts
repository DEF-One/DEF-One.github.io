import type { TaskInput } from './types'

export const CATEGORIES = ['Küche', 'Bad', 'Böden', 'Wohnräume', 'Müll', 'Persönlich', 'Allgemein'] as const

type Seed = Partial<TaskInput> & Pick<TaskInput, 'name' | 'category' | 'frequency'>

// Wochentage: 0 = Mo, 1 = Di, 2 = Mi, 3 = Do, 4 = Fr, 5 = Sa, 6 = So
// rotation_group = wer die Aufgabe in „Woche 1“ übernimmt (A oder B). In Woche 2 wird getauscht.
const SEEDS: Seed[] = [
  // ---------- Täglich ----------
  { name: 'Geschirr spülen / Spülmaschine', description: 'Geschirr spülen bzw. Spülmaschine ein- und ausräumen und koordinieren.', category: 'Küche', frequency: 'daily', estimated_minutes: 15, rotation_group: 'A', due_time: '21:00' },
  { name: 'Küchenarbeitsfläche abwischen', description: 'Arbeitsfläche nach dem Kochen sauber machen.', category: 'Küche', frequency: 'daily', estimated_minutes: 5, rotation_group: 'A', due_time: '21:00' },
  { name: 'Esstisch abwischen', description: 'Nach dem Essen abwischen.', category: 'Wohnräume', frequency: 'daily', estimated_minutes: 3, rotation_group: 'B', due_time: '21:00' },
  { name: 'Müll kontrollieren', description: 'Füllstand prüfen, bei Bedarf Beutel wechseln.', category: 'Müll', frequency: 'daily', estimated_minutes: 3, rotation_group: 'A' },
  { name: 'Herd nach Benutzung reinigen', description: 'Wer kocht, macht den Herd danach sauber.', category: 'Persönlich', frequency: 'daily', estimated_minutes: 5, assignment_mode: 'personal' },
  { name: 'Eigene Sachen aus Gemeinschaftsräumen wegräumen', description: 'Eigene Gegenstände und eigenes Geschirr bleiben in der Verantwortung des jeweiligen Bewohners.', category: 'Persönlich', frequency: 'daily', estimated_minutes: 5, assignment_mode: 'personal', due_time: '22:00' },

  // ---------- Mehrmals wöchentlich ----------
  { name: 'Staubsaugen', description: 'Gemeinschaftsräume und Flur saugen.', category: 'Böden', frequency: 'weekly', weekdays: [0, 2, 4], estimated_minutes: 20, rotation_group: 'B' },
  { name: 'Küchenboden fegen', description: '', category: 'Küche', frequency: 'weekly', weekdays: [1, 5], estimated_minutes: 10, rotation_group: 'A' },
  { name: 'Badezimmer kurz kontrollieren', description: 'Kurzer Check: Handtücher, Klopapier, grobe Verschmutzung.', category: 'Bad', frequency: 'weekly', weekdays: [2, 6], estimated_minutes: 5, rotation_group: 'B' },
  { name: 'Spiegel kontrollieren und reinigen', description: 'Bei Bedarf reinigen.', category: 'Bad', frequency: 'weekly', weekdays: [1, 4], estimated_minutes: 5, rotation_group: 'B' },
  { name: 'Müll rausbringen', description: 'Rechtzeitig vor der Abholung rausbringen (Rest, Bio, Papier, Gelber Sack).', category: 'Müll', frequency: 'weekly', weekdays: [0, 3], estimated_minutes: 10, rotation_group: 'A', due_time: '20:00' },

  // ---------- Wöchentlich ----------
  { name: 'Badezimmer gründlich putzen', description: 'Fliesen, Armaturen, Ablagen.', category: 'Bad', frequency: 'weekly', weekdays: [5], estimated_minutes: 30, rotation_group: 'B' },
  { name: 'Toilette gründlich reinigen', description: '', category: 'Bad', frequency: 'weekly', weekdays: [5], estimated_minutes: 15, rotation_group: 'B' },
  { name: 'Dusche / Badewanne reinigen', description: '', category: 'Bad', frequency: 'weekly', weekdays: [5], estimated_minutes: 20, rotation_group: 'B' },
  { name: 'Waschbecken gründlich reinigen', description: '', category: 'Bad', frequency: 'weekly', weekdays: [5], estimated_minutes: 10, rotation_group: 'B' },
  { name: 'Gemeinschaftliche Böden wischen', description: '', category: 'Böden', frequency: 'weekly', weekdays: [6], estimated_minutes: 30, rotation_group: 'B' },
  { name: 'Küche gründlich reinigen', description: 'Fronten, Spüle, Herd, Fliesenspiegel.', category: 'Küche', frequency: 'weekly', weekdays: [5], estimated_minutes: 45, rotation_group: 'A' },
  { name: 'Kühlschrank kontrollieren', description: 'Auf abgelaufene Lebensmittel prüfen.', category: 'Küche', frequency: 'weekly', weekdays: [3], estimated_minutes: 10, rotation_group: 'A' },
  { name: 'Oberflächen und Regale abstauben', description: 'Staub wischen in den Gemeinschaftsräumen.', category: 'Wohnräume', frequency: 'weekly', weekdays: [6], estimated_minutes: 20, rotation_group: 'B' },
  { name: 'Wohnzimmertisch reinigen', description: '', category: 'Wohnräume', frequency: 'weekly', weekdays: [4], estimated_minutes: 5, rotation_group: 'A' },

  // ---------- Monatlich (wechselt jeden Monat die Person) ----------
  { name: 'Kühlschrank gründlich reinigen', description: '', category: 'Küche', frequency: 'monthly', day_of_month: 3, estimated_minutes: 40, rotation_group: 'A' },
  { name: 'Backofen reinigen', description: '', category: 'Küche', frequency: 'monthly', day_of_month: 6, estimated_minutes: 40, rotation_group: 'B' },
  { name: 'Mikrowelle reinigen', description: '', category: 'Küche', frequency: 'monthly', day_of_month: 9, estimated_minutes: 10, rotation_group: 'A' },
  { name: 'Küchenschränke außen abwischen', description: '', category: 'Küche', frequency: 'monthly', day_of_month: 12, estimated_minutes: 20, rotation_group: 'B' },
  { name: 'Türen und Lichtschalter reinigen', description: '', category: 'Wohnräume', frequency: 'monthly', day_of_month: 14, estimated_minutes: 15, rotation_group: 'A' },
  { name: 'Abflüsse reinigen', description: 'Küche, Bad, Dusche.', category: 'Bad', frequency: 'monthly', day_of_month: 17, estimated_minutes: 15, rotation_group: 'B' },
  { name: 'Fußleisten abwischen', description: '', category: 'Böden', frequency: 'monthly', day_of_month: 20, estimated_minutes: 25, rotation_group: 'A' },
  { name: 'Fensterbänke reinigen', description: '', category: 'Wohnräume', frequency: 'monthly', day_of_month: 22, estimated_minutes: 15, rotation_group: 'B' },
  { name: 'Waschmaschine reinigen', description: 'Flusensieb, Dichtung, Leerwaschgang.', category: 'Bad', frequency: 'monthly', day_of_month: 25, estimated_minutes: 20, rotation_group: 'A' },
  { name: 'Mülleimer gründlich reinigen', description: '', category: 'Müll', frequency: 'monthly', day_of_month: 27, estimated_minutes: 15, rotation_group: 'B' },

  // ---------- Vierteljährlich ----------
  { name: 'Fenster putzen', description: '', category: 'Wohnräume', frequency: 'monthly', repeat_every: 3, day_of_month: 5, estimated_minutes: 60, rotation_group: 'A' },
  { name: 'Heizkörper reinigen', description: '', category: 'Wohnräume', frequency: 'monthly', repeat_every: 3, day_of_month: 10, estimated_minutes: 30, rotation_group: 'B' },
  { name: 'Schwer erreichbare Stellen reinigen', description: 'Hinter/unter Möbeln, Schrankoberseiten, Lampen.', category: 'Allgemein', frequency: 'monthly', repeat_every: 3, day_of_month: 15, estimated_minutes: 45, rotation_group: 'A' },
  { name: 'Sofa gründlich absaugen', description: '', category: 'Wohnräume', frequency: 'monthly', repeat_every: 3, day_of_month: 20, estimated_minutes: 20, rotation_group: 'B' },
  { name: 'Gefrierschrank kontrollieren', description: 'Bei Bedarf abtauen und reinigen.', category: 'Küche', frequency: 'monthly', repeat_every: 3, day_of_month: 25, estimated_minutes: 30, rotation_group: 'A' },
]

export function defaultTasks(startDate: string): TaskInput[] {
  return SEEDS.map((s, i) => ({
    description: '',
    repeat_every: 1,
    weekdays: [],
    day_of_month: null,
    due_time: null,
    estimated_minutes: null,
    assignment_mode: 'rotation',
    rotation_group: 'A',
    fixed_slot: null,
    ...s,
    start_date: startDate,
    sort_order: i,
  }))
}

export const PERSON_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#64748b']
