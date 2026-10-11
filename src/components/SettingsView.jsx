import { THEMES } from '../data/content.js'
import { weekStats, totalDone } from '../lib/progress.js'
import { buildICS } from '../lib/ics.js'
import { download } from '../lib/download.js'
import { showNotification } from '../lib/notifications.js'
import { appVersion, exactAlarmStatus, isNative, requestExactAlarm, shareText, testNative } from '../lib/native.js'
import { useEffect, useState } from 'react'
import TestNotificationButton from './TestNotificationButton.jsx'

function Bars({ week }) {
  return (
    <div className="bars" role="img" aria-label="Progression des 7 derniers jours">
      {week.map((w) => <div key={w.key}><div className="bar"><i style={{ height: `${w.pct}%` }} /></div><small>{w.label}</small></div>)}
    </div>
  )
}

function NativeNotifications({ perm, onEnableNotifs, status, onPermission, now }) {
  const [exact, setExact] = useState('granted')
  const [testError, setTestError] = useState('')
  const [version, setVersion] = useState('')
  useEffect(() => { exactAlarmStatus().then(setExact) }, [perm])
  useEffect(() => { appVersion().then(setVersion) }, [])
  const testAlarm = () => testNative().then(({ inexact, at }) => {
    setTestError('')
    const hh = at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })
    alert(`Alarme de test programmée à ${hh}. Ferme l’appli et attends 1 minute.${inexact ? '\n⚠️ Alarme non exacte : autorise « Alarmes et rappels » pour ce téléphone.' : ''}`)
  }).catch((e) => setTestError(String(e?.message || e)))
  return (
    <div className="card">
      <h3>🔔 Notifications Android</h3>
      <ul className="diag">
        <li>{perm === 'granted' ? '✅' : '❌'} Autorisation des notifications : {perm === 'granted' ? 'accordée' : perm === 'denied' ? 'refusée' : perm === 'unsupported' ? 'indisponible (erreur du plugin)' : 'à accorder'}</li>
        <li>{exact === 'granted' ? '✅' : '❌'} Alarmes exactes : {exact === 'granted' ? 'autorisées' : 'refusées'}</li>
        <li>{status.error ? '❌' : status.count ? (status.inexact ? '⚠️' : '✅') : '⏳'} Rappels programmés : {status.error || (status.count == null ? 'en cours…' : status.count)}{status.inexact ? ' (non exacts)' : ''}</li>
        <li>🕒 Heure de ton téléphone : {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} ({Intl.DateTimeFormat().resolvedOptions().timeZone})</li>
      </ul>
      {perm === 'denied' && <p className="hint">Notifications bloquées : Paramètres → Applications → Ma Journée Rosée → Notifications → Autoriser.</p>}
      {status.inexact && <p className="hint">⚠️ Les rappels sont programmés mais Android peut les retarder. Touche « Alarmes exactes » ci-dessous.</p>}
      {perm === 'granted' && exact === 'denied' && <p className="hint">Autorise « Alarmes et rappels » pour que les notifications arrivent à la minute exacte.</p>}
      {testError && <p className="hint">Erreur : {testError}</p>}
      <div className="actions left">
        {(perm === 'default' || perm === 'unsupported') && <button className="btn" onClick={onEnableNotifs}>Autoriser</button>}
        {exact === 'denied' && <button className="btn" onClick={() => requestExactAlarm().then(setExact)}>Alarmes exactes</button>}
        <TestNotificationButton onPermission={onPermission} />
        {perm === 'granted' && <button className="btn ghost" onClick={testAlarm}>⏰ Tester une alarme (1 min)</button>}
      </div>
      <p className="hint">Version installée : {version || '…'}</p>
      <p className="hint">Si le test immédiat marche mais pas les rappels : Paramètres → Applications → Ma Journée Rosée → Batterie → « Sans restriction » (sur OnePlus / Oppo / Realme : active aussi « Lancement automatique » et « Autoriser l’activité en arrière-plan »), et ne ferme pas l’appli de force (balayage « forcer l’arrêt »).</p>
    </div>
  )
}

export default function SettingsView({ state, dispatch, now, perm, onEnableNotifs, onPermission, nativeStatus = { count: null, error: '' } }) {
  const native = isNative()
  const importBackup = (file) => {
    const fr = new FileReader()
    fr.onload = () => {
      try {
        const data = JSON.parse(fr.result)
        if (!Array.isArray(data.tasks)) throw new Error('format')
        dispatch({ type: 'importState', data })
      } catch { alert('Fichier invalide') }
    }
    fr.readAsText(file)
  }
  return (
    <section className="narrow">
      <h1>Moi 💕</h1>
      <div className="card">
        <label>Mon prénom
          <input value={state.name} onChange={(e) => dispatch({ type: 'setName', name: e.target.value })} placeholder="Comment t’appelles-tu ?" maxLength={30} />
        </label>
        <div className="themes" role="group" aria-label="Thème">
          {THEMES.map(([v, l]) => <button key={v} className={state.theme === v ? 'sel' : ''} aria-pressed={state.theme === v} data-t={v} onClick={() => dispatch({ type: 'setTheme', theme: v })}>{l}</button>)}
        </div>
      </div>
      <div className="card">
        <h3>📊 Ma semaine <small>{totalDone(state)} tâches accomplies au total</small></h3>
        <Bars week={weekStats(state, now)} />
      </div>
      {native ? <NativeNotifications perm={perm} onEnableNotifs={onEnableNotifs} status={nativeStatus} onPermission={onPermission} now={now} /> : (
      <div className="card">
        <h3>🔔 Notifications</h3>
        {perm === 'unsupported' && <p className="hint">Ton navigateur ne supporte pas les notifications. Sur iPhone, ajoute d’abord l’app à l’écran d’accueil.</p>}
        {perm === 'denied' && <p className="hint">Les notifications sont bloquées : autorise-les dans les réglages du navigateur / de l’appli.</p>}
        {perm === 'granted' && <p className="hint ok">Activées ✓</p>}
        <div className="actions left">
          {perm === 'default' && <button className="btn" onClick={onEnableNotifs}>Activer</button>}
          {perm === 'granted' && <button className="btn" onClick={() => showNotification('Test 💖', 'Ça marche !', 'test')}>Tester</button>}
        </div>
        <p className="hint">Pour être sûre d’être rappelée même quand l’appli est fermée, exporte tes tâches vers l’agenda de ton téléphone (alarme incluse) :</p>
        <div className="actions left">
          <button className="btn ghost" onClick={() => download('ma-journee.ics', buildICS(state.tasks), 'text/calendar')}>📅 Exporter vers mon agenda</button>
        </div>
      </div>
      )}
      <div className="card">
        <h3>💾 Sauvegarde</h3>
        <div className="actions left">
          <button className="btn ghost" onClick={() => (native ? shareText('Sauvegarde Ma Journée', JSON.stringify(state)).catch(() => {}) : download('ma-journee.json', JSON.stringify(state, null, 2), 'application/json'))}>Exporter</button>
          <label className="btn ghost file">Importer<input type="file" accept="application/json" hidden onChange={(e) => e.target.files[0] && importBackup(e.target.files[0])} /></label>
          <button className="btn danger" onClick={() => confirm('Remettre les tâches par défaut ?') && dispatch({ type: 'resetTasks' })}>Tâches par défaut</button>
        </div>
      </div>
    </section>
  )
}
