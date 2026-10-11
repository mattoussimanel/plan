import { THEMES } from '../data/content.js'
import { weekStats, totalDone } from '../lib/progress.js'
import { buildICS } from '../lib/ics.js'
import { download } from '../lib/download.js'
import { showNotification } from '../lib/notifications.js'

function Bars({ week }) {
  return (
    <div className="bars" role="img" aria-label="Progression des 7 derniers jours">
      {week.map((w) => <div key={w.key}><div className="bar"><i style={{ height: `${w.pct}%` }} /></div><small>{w.label}</small></div>)}
    </div>
  )
}

export default function SettingsView({ state, dispatch, now, perm, onEnableNotifs }) {
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
      <div className="card">
        <h3>💾 Sauvegarde</h3>
        <div className="actions left">
          <button className="btn ghost" onClick={() => download('ma-journee.json', JSON.stringify(state, null, 2), 'application/json')}>Exporter</button>
          <label className="btn ghost file">Importer<input type="file" accept="application/json" hidden onChange={(e) => e.target.files[0] && importBackup(e.target.files[0])} /></label>
          <button className="btn danger" onClick={() => confirm('Remettre les tâches par défaut ?') && dispatch({ type: 'resetTasks' })}>Tâches par défaut</button>
        </div>
      </div>
    </section>
  )
}
