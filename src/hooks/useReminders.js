import { useCallback, useEffect, useState } from 'react'
import { dueTasks } from '../lib/reminders.js'
import { askPermission, notifPermission, showNotification } from '../lib/notifications.js'
import { bodyFor } from '../lib/messages.js'
import { isNative, nativePermission, requestNativePermission } from '../lib/native.js'

const BANNER_MS = 15000

/** Rappels : notification système + bannière dans l'appli à l'heure de chaque tâche. */
export function useReminders(stateRef) {
  const [banner, setBanner] = useState(null)
  const [perm, setPerm] = useState(notifPermission)

  // Android : les notifications exactes sont programmées par le système (voir useNativeSync), pas ici
  useEffect(() => { if (isNative()) nativePermission().then(setPerm) }, [])

  const check = useCallback((now = new Date()) => {
    if (isNative()) return
    for (const t of dueTasks(stateRef.current, now)) {
      showNotification(`${t.emoji} ${t.title}`, bodyFor(t, now), `task-${t.id}`)
      setBanner(t)
      navigator.vibrate?.([200, 100, 200])
    }
  }, [stateRef])

  useEffect(() => {
    if (!banner) return undefined
    const id = setTimeout(() => setBanner(null), BANNER_MS)
    return () => clearTimeout(id)
  }, [banner])

  const enable = useCallback(async () => {
    const p = isNative() ? await requestNativePermission() : await askPermission()
    setPerm(p)
    if (p === 'granted' && !isNative()) showNotification('Notifications activées 💖', 'Tu recevras un rappel à chaque tâche.', 'welcome')
  }, [])

  return { banner, dismiss: () => setBanner(null), perm, enable, check }
}
