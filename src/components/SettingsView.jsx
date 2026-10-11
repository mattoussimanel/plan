import { THEMES } from '../data/content.js'
import { weekStats, totalDone } from '../lib/progress.js'
import { buildICS } from '../lib/ics.js'
import { download } from '../lib/download.js'
import { showNotification } from '../lib/notifications.js'
import { exactAlarmStatus, isNative, requestExactAlarm, shareText, testNative } from '../lib/native.js'
import { useEffect, useState } from 'react'

function Bars({ week }) {
  return (
    <div className="bars" role="img" aria-label="Progression des 7 derniers jours">
      {week.map((w) => <div key={w.key}><div className="bar"><i style={{ height: `${w.pct}%` }} /></div><small>{w.label}</small></div>)}
    </div>
  )
}

function NativeNotifications({ perm, onEnableNotifs }) {
  const [exact, setExact] = useState('granted')
  useEffect(() => { exactAlarmStatus().then(setExact) }, [perm])
  return (
    <div className="card">
      <h3>🔔 Notifications Android</h3>
      {perm === 'granted' && exact === 'granted' && <p className="hint ok">Activées : rappels à l’heure exacte, même appli fermée ✓</p>}
      {perm === 'denied' && <p className="hint">Notifications bloquées : autorise-les dans Paramètres → Applications → Ma Journée Rosée → Notifications.</p>}
      {perm === 'default' && <p className="hint">Autorise les notifications pour recevoir tes rappels.</p>}
      {perm === 'granted' && exact === 'denied' && <p className="hint">Autorise « Alarmes et rappels » pour que les notifications arrivent à la minute exacte.</p>}
      <div className="actions left">
        {perm === 'default' && <button className="btn" onClick={onEnableNotifs}>Autoriser</button>}
        {exact === 'denied' && <button className="btn" onClick={() => requestExactAlarm().then(setExact)}>Alarmes exactes</button>}
        {perm === 'granted' && <button className="btn ghost" onClick={() => testNative().then(() => alert('Notification de test dans 5 secondes : ferme l’appli pour essayer !'))}>Tester</button>}
      </div>
      <p className="hint">Astuce : si certaines notifications n’arrivent pas, désactive l’optimisation de batterie pour l’appli (Paramètres → Applications → Batterie → Sans restriction).</p>
    </div>
  )
}

export default function SettingsView({ state, dispatch, now, perm, onEnableNotifs }) {
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
      {native ? <NativeNotifications perm={perm} onEnableNotifs={onEnableNotifs} /> : (
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
