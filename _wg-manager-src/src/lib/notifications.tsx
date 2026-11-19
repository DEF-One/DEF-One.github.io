import { useEffect } from 'react'
import { buildOccurrences, overdueOccurrences } from './recurrence'
import { useStore } from './store'

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

const LAST_KEY = 'wgm.notified'

/**
 * Zeigt einmal pro Tag (ab der eingestellten Uhrzeit) eine Browser-Benachrichtigung
 * mit den eigenen Aufgaben für heute und überfälligen Aufgaben – solange die App geöffnet ist.
 */
export function NotificationAgent() {
  const { settings, snapshot, today, mySlot, indexes } = useStore()

  useEffect(() => {
    if (!settings.notifications_enabled || !notificationsSupported()) return
    const check = () => {
      if (Notification.permission !== 'granted') return
      const hour = Number(
        new Intl.DateTimeFormat('de-DE', { hour: '2-digit', hour12: false, timeZone: snapshot.household.timezone }).format(new Date()),
      )
      const key = `${today}|${mySlot}`
      if (hour < settings.notify_hour || localStorage.getItem(LAST_KEY) === key) return
      const mine = buildOccurrences(snapshot, today, today, today, indexes).filter((o) => o.slot === mySlot && o.status !== 'done')
      const overdue = overdueOccurrences(snapshot, today, indexes).filter((o) => o.slot === mySlot)
      localStorage.setItem(LAST_KEY, key)
      if (!mine.length && !overdue.length) return
      const lines = [
        mine.length ? `Heute: ${mine.slice(0, 4).map((o) => o.task.name).join(', ')}${mine.length > 4 ? ` +${mine.length - 4}` : ''}` : '',
        overdue.length ? `Überfällig: ${overdue.length}` : '',
      ].filter(Boolean)
      try {
        new Notification(`${snapshot.household.name}: ${mine.length} Aufgabe${mine.length === 1 ? '' : 'n'} für dich`, {
          body: lines.join('\n'),
          icon: `${import.meta.env.BASE_URL}favicon.svg`,
          tag: 'wgm-daily',
        })
      } catch {
        /* z. B. mobile Browser ohne Notification-Konstruktor */
      }
    }
    check()
    const t = setInterval(check, 60_000)
    return () => clearInterval(t)
  }, [settings.notifications_enabled, settings.notify_hour, snapshot, today, mySlot, indexes])

  return null
}
