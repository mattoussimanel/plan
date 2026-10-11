import { useEffect, useState } from 'react'
import { isNative, onBackButton, onResume, syncNative } from '../lib/native.js'

/** Android : (re)programme les notifications quand les tâches changent ou que l'appli revient au premier plan. */
export function useNativeSync(tasks, enabled, cycle) {
  const [status, setStatus] = useState({ count: null, inexact: false, error: '' })
  useEffect(() => {
    if (!isNative() || !enabled) return undefined
    const run = () => syncNative(tasks, new Date(), cycle)
      .then(({ count, inexact }) => setStatus({ count, inexact, error: '' }))
      .catch((e) => setStatus({ count: null, inexact: false, error: String(e?.message || e) }))
    run()
    return onResume(run)
  }, [tasks, enabled, cycle])
  return status
}

/** Android : le bouton retour ferme d'abord l'éditeur, puis revient à l'accueil, puis quitte. */
export function useBackButton(handler) {
  useEffect(() => (isNative() ? onBackButton(handler) : undefined), [handler])
}
