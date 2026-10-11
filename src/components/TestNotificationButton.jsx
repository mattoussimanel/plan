import { useState } from 'react'
import { isNative, nativePermission, requestNativePermission, testNow } from '../lib/native.js'

/** Bouton « Tester les notifications » (Android) : demande l'autorisation si besoin puis envoie une notification immédiate. */
export default function TestNotificationButton({ className = 'btn', onPermission, sound }) {
  const [msg, setMsg] = useState('')
  if (!isNative()) return null

  const run = async () => {
    try {
      let perm = await nativePermission()
      if (perm !== 'granted') perm = await requestNativePermission()
      onPermission?.(perm)
      if (perm !== 'granted') {
        setMsg('❌ Notifications non autorisées : Paramètres → Applications → Ma Journée Rosée → Notifications.')
        return
      }
      await testNow(sound)
      setMsg('✅ Notification de test envoyée ! Regarde en haut de l’écran.')
    } catch (e) {
      setMsg(`❌ Erreur : ${String(e?.message || e)}`)
    }
  }

  return (
    <>
      <button className={className} onClick={run}>🔔 Tester les notifications</button>
      {msg && <p className="hint" role="status">{msg}</p>}
    </>
  )
}
