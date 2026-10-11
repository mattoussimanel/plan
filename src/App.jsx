import { useCallback, useState } from 'react'
import { useAppState } from './hooks/useAppState.js'
import { useNow } from './hooks/useNow.js'
import { useReminders } from './hooks/useReminders.js'
import { useConfetti } from './hooks/useConfetti.js'
import { dateKey, minutesNow } from './lib/dates.js'
import { tasksFor, newTaskDraft } from './lib/tasks.js'
import { dayProgress, nextTask } from './lib/progress.js'
import Background from './components/Background.jsx'
import Confetti from './components/Confetti.jsx'
import Banner from './components/Banner.jsx'
import TabBar from './components/TabBar.jsx'
import TodayView from './components/TodayView.jsx'
import TasksView from './components/TasksView.jsx'
import SettingsView from './components/SettingsView.jsx'
import TaskEditor from './components/TaskEditor.jsx'

export default function App() {
  const [state, dispatch, stateRef] = useAppState()
  const [tab, setTab] = useState('today')
  const [editing, setEditing] = useState(null)
  const [burst, fireConfetti] = useConfetti()
  const { banner, dismiss, perm, enable, check } = useReminders(stateRef)
  const now = useNow(check)

  const key = dateKey(now)
  const list = tasksFor(state.tasks, key)
  const prog = dayProgress(state, key)
  const next = nextTask(list, state.done[key] || [], minutesNow(now))

  const toggle = useCallback((id, el) => {
    if (!(stateRef.current.done[key] || []).includes(id)) fireConfetti(el)
    dispatch({ type: 'toggleDone', key, id })
  }, [key, dispatch, fireConfetti, stateRef])

  const save = (task) => { dispatch({ type: 'saveTask', task }); setEditing(null) }
  const remove = (id) => {
    if (!confirm('Supprimer cette tâche ?')) return
    dispatch({ type: 'deleteTask', id })
    setEditing(null)
  }

  return (
    <>
      <Background />
      <Confetti burst={burst} />
      <Banner task={banner} onClose={dismiss} />
      <main className="app">
        {tab === 'today' && (
          <TodayView state={state} dispatch={dispatch} now={now} today={key} list={list} prog={prog} next={next}
            perm={perm} onEnableNotifs={enable} onToggle={toggle} onEdit={setEditing} />
        )}
        {tab === 'tasks' && <TasksView tasks={state.tasks} onEdit={setEditing} />}
        {tab === 'me' && <SettingsView state={state} dispatch={dispatch} now={now} perm={perm} onEnableNotifs={enable} />}
      </main>
      <button className="fab" aria-label="Ajouter une tâche" onClick={() => setEditing(newTaskDraft(key))}>＋</button>
      <TabBar tab={tab} onChange={setTab} />
      {editing && <TaskEditor task={editing} onSave={save} onDelete={remove} onClose={() => setEditing(null)} />}
    </>
  )
}
