import { useEffect, useState } from 'react'
import { isNative, onBackButton, onResume, syncNative } from '../lib/native.js'

/** Android : (re)programme les notifications quand les tâches changent ou que l'appli revient au premier plan. */
export function useNativeSync(tasks, enabled) {
  const [status, setStatus] = useState({ count: null, error: '' })
  useEffect(() => {
    if (!isNative() || !enabled) return undefined
    const run = () => syncNative(tasks)
      .then((count) => setStatus({ count, error: '' }))
      .catch((e) => setStatus({ count: null, error: String(e?.message || e) }))
    run()
    return onResume(run)
  }, [tasks, enabled])
  return status
}

/** Android : le bouton retour ferme d'abord l'éditeur, puis revient à l'accueil, puis quitte. */
export function useBackButton(handler) {
  useEffect(() => (isNative() ? onBackButton(handler) : undefined), [handler])
}
