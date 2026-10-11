import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  EMOJIS, DAYS, MOODS, dateKey, minutesOf, greeting, quoteOfDay, motivationOfDay,
  repeatLabel, tasksFor, dayProgress, streak, loadState, saveState, buildICS, DEFAULT_TASKS,
} from './data.js'
import { askPermission, showNotification, bodyFor, dueTasks, notifSupported } from './notify.js'

const GLASSES = 8

function Background() {
  const items = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    left: Math.random() * 100, size: 14 + Math.random() * 26, delay: -Math.random() * 20,
    dur: 12 + Math.random() * 14, glyph: ['💗', '🌸', '✨', '🌷', '💖', '🎀'][i % 6],
  })), [])
  return (
    <div className="bg" aria-hidden="true">
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
      {items.map((it, i) => (
        <span key={i} className="float" style={{ left: `${it.left}%`, fontSize: it.size, animationDelay: `${it.delay}s`, animationDuration: `${it.dur}s` }}>{it.glyph}</span>
      ))}
    </div>
  )
}

function Ring({ pct }) {
  const r = 46, c = 2 * Math.PI * r
  return (
    <div className="ring">
      <svg viewBox="0 0 110 110">
        <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff9ec9" /><stop offset="1" stopColor="#ff4f9a" /></linearGradient></defs>
        <circle cx="55" cy="55" r={r} className="ring-bg" />
        <circle cx="55" cy="55" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      <b>{pct}%</b>
    </div>
  )
}

function Confetti({ burst }) {
  if (!burst) return null
  return (
    <div className="confetti" key={burst.id} aria-hidden="true">
      {Array.from({ length: 22 }, (_, i) => (
        <span key={i} style={{ '--x': `${(Math.random() - 0.5) * 320}px`, '--y': `${-80 - Math.random() * 260}px`, '--r': `${Math.random() * 720 - 360}deg`, animationDelay: `${Math.random() * 0.15}s`, left: burst.x, top: burst.y }}>
          {['💖', '🌸', '✨', '🎀', '💗'][i % 5]}
        </span>
      ))}
    </div>
  )
}

function Timeline({ state, list, today, now, onToggle, onEdit }) {
  const doneIds = state.done[today] || []
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nextId = list.find((t) => !doneIds.includes(t.id) && minutesOf(t.time) >= nowMin)?.id
  if (!list.length) return <p className="empty">Rien de prévu aujourd’hui 🌷<br />Ajoute une tâche dans l’onglet « Tâches ».</p>
  return (
    <ol className="timeline">
      {list.map((t, i) => {
        const done = doneIds.includes(t.id)
        const past = minutesOf(t.time) < nowMin
        const cls = ['tl-item', done && 'done', !done && past && 'late', t.id === nextId && 'next'].filter(Boolean).join(' ')
        return (
          <li key={t.id} className={cls} style={{ '--i': i }}>
            <div className="tl-time">{t.time}</div>
            <div className="tl-dot"><span>{done ? '✓' : t.emoji}</span></div>
            <div className="card tl-card" onClick={() => onEdit(t)}>
              <div className="tl-head">
                <div>
                  <h3>{t.title}</h3>
                  <small>{repeatLabel(t)}{t.notify ? ' · 🔔' : ''}</small>
                </div>
                <button className={`check ${done ? 'on' : ''}`} aria-label={done ? 'Marquer non fait' : 'Marquer fait'} onClick={(e) => { e.stopPropagation(); onToggle(t.id, e) }}>
                  {done ? '✓' : ''}
                </button>
              </div>
              {t.kind === 'welcome' && <p className="msg">{greeting(state.name)} Je te souhaite une magnifique journée, remplie de douceur et de petites victoires.</p>}
              {t.kind === 'motivation' && <p className="msg">{motivationOfDay()}</p>}
              {t.kind === 'quote' && <p className="msg quote">« {quoteOfDay()[0]} »<span>— {quoteOfDay()[1]}</span></p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function TaskEditor({ task, onSave, onDelete, onClose }) {
  const [t, setT] = useState(task)
  const set = (patch) => setT((x) => ({ ...x, ...patch }))
  const toggleDay = (d) => set({ days: t.days.includes(d) ? t.days.filter((x) => x !== d) : [...t.days, d] })
  const valid = t.title.trim() && t.time && (t.repeat !== 'once' || t.date) && (t.repeat !== 'weekly' || t.days.length)
  return (
    <div className="overlay" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (valid) onSave({ ...t, title: t.title.trim() }) }}>
        <div className="grab" />
        <h2>{task.isNew ? 'Nouvelle tâche ✨' : 'Modifier la tâche'}</h2>
        <label>Nom
          <input value={t.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ex : Boire de l’eau" autoFocus={task.isNew} maxLength={60} />
        </label>
        <div className="emojis">
          {EMOJIS.map((e) => <button type="button" key={e} className={t.emoji === e ? 'sel' : ''} onClick={() => set({ emoji: e })}>{e}</button>)}
        </div>
        <label>Heure exacte
          <input type="time" value={t.time} onChange={(e) => set({ time: e.target.value })} required />
        </label>
        <div className="seg" role="group" aria-label="Répétition">
          {[['once', 'Une fois'], ['daily', 'Chaque jour'], ['weekly', 'Certains jours']].map(([v, l]) => (
            <button type="button" key={v} className={t.repeat === v ? 'sel' : ''} onClick={() => set({ repeat: v })}>{l}</button>
          ))}
        </div>
        {t.repeat === 'once' && <label>Date<input type="date" value={t.date} onChange={(e) => set({ date: e.target.value })} /></label>}
        {t.repeat === 'weekly' && (
          <div className="days">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => <button type="button" key={d} className={t.days.includes(d) ? 'sel' : ''} onClick={() => toggleDay(d)}>{DAYS[d]}</button>)}
          </div>
        )}
        <label className="switch">
          <input type="checkbox" checked={t.notify} onChange={(e) => set({ notify: e.target.checked })} />
          <span className="slider" /> Me notifier à l’heure exacte 🔔
        </label>
        <div className="actions">
          {!task.isNew && <button type="button" className="btn danger" onClick={() => onDelete(t.id)}>Supprimer</button>}
          <button type="button" className="btn ghost" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn" disabled={!valid}>Enregistrer</button>
        </div>
      </form>
    </div>
  )
}

export default function App() {
  const [state, setState] = useState(loadState)
  const [tab, setTab] = useState('today')
  const [now, setNow] = useState(new Date())
  const [editing, setEditing] = useState(null)
  const [burst, setBurst] = useState(null)
  const [banner, setBanner] = useState(null)
  const [perm, setPerm] = useState(notifSupported() ? Notification.permission : 'unsupported')
  useEffect(() => { if (!banner) return; const id = setTimeout(() => setBanner(null), 15000); return () => clearTimeout(id) }, [banner])
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => { saveState(state); document.documentElement.dataset.theme = state.theme }, [state])

  const fireDue = useCallback(() => {
    for (const t of dueTasks(stateRef.current)) {
      showNotification(`${t.emoji} ${t.title}`, bodyFor(t), `task-${t.id}`)
      setBanner(t)
      navigator.vibrate?.([200, 100, 200])
    }
  }, [])

  useEffect(() => {
    const tick = () => { setNow(new Date()); fireDue() }
    tick()
    const id = setInterval(tick, 15000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [fireDue])

  const today = dateKey(now)
  const list = tasksFor(state.tasks, today)
  const prog = dayProgress(state, today)
  const doneIds = state.done[today] || []
  const nextTask = list.find((t) => !doneIds.includes(t.id) && minutesOf(t.time) >= now.getHours() * 60 + now.getMinutes())
  const upd = (patch) => setState((s) => ({ ...s, ...patch }))

  const toggle = (id, e) => {
    const was = doneIds.includes(id)
    setState((s) => {
      const cur = s.done[today] || []
      return { ...s, done: { ...s.done, [today]: was ? cur.filter((x) => x !== id) : [...cur, id] } }
    })
    if (!was) {
      const r = e?.currentTarget?.getBoundingClientRect()
      setBurst({ id: Date.now(), x: r ? r.left + r.width / 2 : '50%', y: r ? r.top + r.height / 2 : '50%' })
      setTimeout(() => setBurst(null), 1800)
    }
  }

  const saveTask = (t) => {
    const { isNew, ...clean } = t
    setState((s) => ({ ...s, tasks: isNew ? [...s.tasks, clean] : s.tasks.map((x) => (x.id === clean.id ? clean : x)) }))
    setEditing(null)
  }
  const delTask = (id) => {
    if (!confirm('Supprimer cette tâche ?')) return
    setState((s) => ({ ...s, tasks: s.tasks.filter((x) => x.id !== id) }))
    setEditing(null)
  }
  const newTask = () => setEditing({ id: `t${Date.now()}`, isNew: true, emoji: '🌸', title: '', time: '09:00', repeat: 'daily', days: [], date: today, notify: true })

  const enableNotifs = async () => {
    const p = await askPermission()
    setPerm(p)
    if (p === 'granted') showNotification('Notifications activées 💖', 'Tu recevras un rappel à chaque tâche.', 'welcome')
  }

  const download = (name, text, type) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([text], { type }))
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  const importBackup = (file) => {
    const fr = new FileReader()
    fr.onload = () => {
      try { const d = JSON.parse(fr.result); if (!Array.isArray(d.tasks)) throw 0; setState((s) => ({ ...s, ...d })) } catch { alert('Fichier invalide') }
    }
    fr.readAsText(file)
  }

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (6 - i))
    return { label: DAYS[d.getDay()], ...dayProgress(state, dateKey(d)) }
  })
  const totalDone = Object.values(state.done).reduce((n, a) => n + a.length, 0)
  const water = state.water[today] || 0
  const dateLabel = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <Background />
      <Confetti burst={burst} />
      {banner && (
        <div className="banner" onClick={() => setBanner(null)}>
          <span className="bell">🔔</span>
          <div><b>{banner.emoji} {banner.title}</b><br /><small>{bodyFor(banner)}</small></div>
        </div>
      )}
      <main className="app">
        {tab === 'today' && (
          <div className="grid">
            <aside className="side">
              <header className="hero card">
                <div>
                  <p className="date">{dateLabel}</p>
                  <h1>{greeting(state.name, now)}</h1>
                  <p className="sub">
                    {prog.total && prog.done === prog.total ? 'Bravo, tout est fait ! 🎉'
                      : nextTask ? <>Prochaine : <b>{nextTask.emoji} {nextTask.title}</b> à {nextTask.time}</> : 'Plus de tâche prévue pour le moment 🌙'}
                  </p>
                </div>
                <Ring pct={prog.pct} />
              </header>
              <div className="mini">
                <div className="card stat"><span>🔥</span><b>{streak(state)}</b><small>jours de suite</small></div>
                <div className="card stat"><span>✅</span><b>{prog.done}/{prog.total}</b><small>aujourd’hui</small></div>
              </div>
              <section className="card extra">
                <h3>💧 Eau <small>{water}/{GLASSES} verres</small></h3>
                <div className="glasses">
                  {Array.from({ length: GLASSES }, (_, i) => (
                    <button key={i} className={i < water ? 'on' : ''} aria-label={`Verre ${i + 1}`} onClick={() => upd({ water: { ...state.water, [today]: water === i + 1 ? i : i + 1 } })}>💧</button>
                  ))}
                </div>
              </section>
              <section className="card extra">
                <h3>Mon humeur du jour</h3>
                <div className="moods">
                  {MOODS.map((m) => <button key={m} className={state.mood[today] === m ? 'on' : ''} onClick={() => upd({ mood: { ...state.mood, [today]: m } })}>{m}</button>)}
                </div>
              </section>
            </aside>
            <section className="main-col">
              {perm !== 'granted' && perm !== 'unsupported' && (
                <button className="card notif-cta" onClick={enableNotifs}>🔔 Active les notifications pour être rappelée à chaque tâche</button>
              )}
              <Timeline state={state} list={list} today={today} now={now} onToggle={toggle} onEdit={setEditing} />
            </section>
          </div>
        )}

        {tab === 'tasks' && (
          <section className="narrow">
            <h1>Mes tâches 🎀</h1>
            <p className="sub">Touche une tâche pour la modifier.</p>
            <div className="task-list">
              {[...state.tasks].sort((a, b) => minutesOf(a.time) - minutesOf(b.time)).map((t) => (
                <div key={t.id} className="card row" onClick={() => setEditing(t)}>
                  <span className="em">{t.emoji}</span>
                  <div><b>{t.title}</b><small>{t.time} · {repeatLabel(t)}</small></div>
                  <span>{t.notify ? '🔔' : '🔕'}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'me' && (
          <section className="narrow">
            <h1>Moi 💕</h1>
            <div className="card">
              <label>Mon prénom
                <input value={state.name} onChange={(e) => upd({ name: e.target.value })} placeholder="Comment t’appelles-tu ?" maxLength={30} />
              </label>
              <div className="themes">
                {[['rose', 'Rose'], ['peche', 'Pêche'], ['lilas', 'Lilas']].map(([v, l]) => <button key={v} className={state.theme === v ? 'sel' : ''} data-t={v} onClick={() => upd({ theme: v })}>{l}</button>)}
              </div>
            </div>
            <div className="card">
              <h3>📊 Ma semaine <small>{totalDone} tâches accomplies au total</small></h3>
              <div className="bars">
                {week.map((w, i) => (
                  <div key={i}><div className="bar"><i style={{ height: `${w.pct}%` }} /></div><small>{w.label}</small></div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3>🔔 Notifications</h3>
              {perm === 'unsupported' && <p className="hint">Ton navigateur ne supporte pas les notifications. Sur iPhone, ajoute d’abord l’app à l’écran d’accueil.</p>}
              {perm === 'denied' && <p className="hint">Les notifications sont bloquées : autorise-les dans les réglages du navigateur / de l’appli.</p>}
              {perm === 'granted' && <p className="hint ok">Activées ✓</p>}
              <div className="actions left">
                {perm === 'default' && <button className="btn" onClick={enableNotifs}>Activer</button>}
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
                <button className="btn danger" onClick={() => confirm('Remettre les tâches par défaut ?') && upd({ tasks: DEFAULT_TASKS })}>Tâches par défaut</button>
              </div>
            </div>
          </section>
        )}
      </main>

      <button className="fab" aria-label="Ajouter une tâche" onClick={newTask}>＋</button>
      <nav className="tabs">
        {[['today', '🌸', 'Aujourd’hui'], ['tasks', '🎀', 'Tâches'], ['me', '💕', 'Moi']].map(([k, e, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><span>{e}</span>{l}</button>
        ))}
      </nav>
      {editing && <TaskEditor task={editing} onSave={saveTask} onDelete={delTask} onClose={() => setEditing(null)} />}
    </>
  )
}
