import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TodayView from './TodayView.jsx'
import TasksView from './TasksView.jsx'
import SettingsView from './SettingsView.jsx'
import TabBar from './TabBar.jsx'
import Banner from './Banner.jsx'
import Ring from './Ring.jsx'
import Confetti from './Confetti.jsx'
import * as download from '../lib/download.js'
import * as notif from '../lib/notifications.js'
import { dayProgress, nextTask } from '../lib/progress.js'
import { tasksFor } from '../lib/tasks.js'
import { makeState, task, SUNDAY, SUNDAY_KEY } from '../test/helpers.js'

const today = (state, over = {}) => {
  const list = tasksFor(state.tasks, SUNDAY_KEY)
  const props = {
    state, dispatch: vi.fn(), now: SUNDAY, today: SUNDAY_KEY, list, prog: dayProgress(state, SUNDAY_KEY),
    next: nextTask(list, state.done[SUNDAY_KEY] || [], 510), perm: 'granted', onEnableNotifs: vi.fn(), onToggle: vi.fn(), onEdit: vi.fn(), ...over,
  }
  render(<TodayView {...props} />)
  return { user: userEvent.setup(), ...props }
}

describe('TodayView', () => {
  it('salue, affiche la prochaine tâche, la série et la progression', () => {
    today(makeState({ name: 'Lina' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bonjour Lina 💕')
    expect(screen.getByText(/Prochaine/)).toHaveTextContent('Lire en français à 10:00')
    expect(screen.getByText('0/7')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '0% accompli' })).toBeInTheDocument()
  })
  it('félicite quand tout est fait', () => {
    const s = makeState({ tasks: [task({ id: 'a' })], done: { [SUNDAY_KEY]: ['a'] } })
    today(s)
    expect(screen.getByText(/Bravo/)).toBeInTheDocument()
    expect(screen.getByText('1/1')).toBeInTheDocument()
  })
  it('message « plus de tâche » quand il n’y en a plus à venir', () => {
    today(makeState({ tasks: [task({ time: '07:00' })] }))
    expect(screen.getByText(/Plus de tâche prévue/)).toBeInTheDocument()
  })
  it('eau : clic sur un verre, re-clic sur le dernier verre rempli le retire', async () => {
    const { user, dispatch } = today(makeState())
    await user.click(screen.getByRole('button', { name: 'Verre 3' }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'setWater', key: SUNDAY_KEY, count: 3 })
  })
  it('eau : retirer le dernier verre', async () => {
    const { user, dispatch } = today(makeState({ water: { [SUNDAY_KEY]: 3 } }))
    expect(screen.getByText('3/8 verres')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Verre 3' }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'setWater', key: SUNDAY_KEY, count: 2 })
  })
  it('humeur', async () => {
    const { user, dispatch } = today(makeState({ mood: { [SUNDAY_KEY]: '😊' } }))
    expect(screen.getByRole('button', { name: 'Humeur 😊' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Humeur 😍' }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'setMood', key: SUNDAY_KEY, mood: '😍' })
  })
  it('invite à activer les notifications seulement si pas encore accordées', async () => {
    const { user, onEnableNotifs } = today(makeState(), { perm: 'default' })
    await user.click(screen.getByText(/Active les notifications/))
    expect(onEnableNotifs).toHaveBeenCalled()
  })
  it.each(['granted', 'unsupported'])('pas d’invitation si perm = %s', (perm) => {
    today(makeState(), { perm })
    expect(screen.queryByText(/Active les notifications/)).toBeNull()
  })
})

describe('TasksView', () => {
  it('liste triée par heure avec répétition et cloche', () => {
    render(<TasksView tasks={[task({ id: 'b', title: 'Soir', time: '21:00', notify: false }), task({ id: 'a', title: 'Matin', time: '07:00' })]} onEdit={() => {}} />)
    const rows = screen.getAllByRole('button')
    expect(rows[0]).toHaveTextContent('Matin')
    expect(rows[1]).toHaveTextContent('Soir')
    expect(within(rows[0]).getByLabelText('Notification activée')).toBeInTheDocument()
    expect(within(rows[1]).getByLabelText('Notification désactivée')).toBeInTheDocument()
  })
  it('clic = édition ; liste vide = message', async () => {
    const onEdit = vi.fn()
    const t = task({ title: 'Lire' })
    const { rerender } = render(<TasksView tasks={[t]} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /Lire/ }))
    expect(onEdit).toHaveBeenCalledWith(t)
    rerender(<TasksView tasks={[]} onEdit={onEdit} />)
    expect(screen.getByText(/Aucune tâche/)).toBeInTheDocument()
  })
})

describe('SettingsView', () => {
  const setup = (over = {}, state = makeState({ name: 'Lina' })) => {
    const props = { state, dispatch: vi.fn(), now: SUNDAY, perm: 'default', onEnableNotifs: vi.fn(), ...over }
    render(<SettingsView {...props} />)
    return { user: userEvent.setup(), ...props }
  }
  it('prénom et thème', async () => {
    const { user, dispatch } = setup()
    await user.type(screen.getByLabelText('Mon prénom'), 'a')
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'setName', name: 'Linaa' })
    await user.click(screen.getByRole('button', { name: 'Lilas' }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'setTheme', theme: 'lilas' })
    expect(screen.getByRole('button', { name: 'Rose' })).toHaveAttribute('aria-pressed', 'true')
  })
  it('statistiques de la semaine', () => {
    setup({}, makeState({ done: { a: ['x', 'y'] } }))
    expect(screen.getByText(/2 tâches accomplies/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /7 derniers jours/ })).toBeInTheDocument()
  })
  it('états de la permission', async () => {
    const { user, onEnableNotifs } = setup({ perm: 'default' })
    await user.click(screen.getByRole('button', { name: 'Activer' }))
    expect(onEnableNotifs).toHaveBeenCalled()
  })
  it.each([['denied', /bloquées/], ['unsupported', /ne supporte pas/], ['granted', /Activées/]])('perm %s', (perm, re) => {
    setup({ perm })
    expect(screen.getByText(re)).toBeInTheDocument()
  })
  it('bouton Tester envoie une notification', async () => {
    vi.spyOn(notif, 'showNotification').mockResolvedValue(true)
    const { user } = setup({ perm: 'granted' })
    await user.click(screen.getByRole('button', { name: 'Tester' }))
    expect(notif.showNotification).toHaveBeenCalled()
  })
  it('exports : agenda .ics et sauvegarde .json', async () => {
    const dl = vi.spyOn(download, 'download').mockImplementation(() => {})
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /Exporter vers mon agenda/ }))
    expect(dl).toHaveBeenLastCalledWith('ma-journee.ics', expect.stringContaining('BEGIN:VCALENDAR'), 'text/calendar')
    await user.click(screen.getByRole('button', { name: 'Exporter' }))
    expect(dl).toHaveBeenLastCalledWith('ma-journee.json', expect.stringContaining('"name": "Lina"'), 'application/json')
  })
  it('import : fichier valide → importState ; invalide → alerte', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const { dispatch, user } = setup()
    const input = document.querySelector('input[type=file]')
    await user.upload(input, new File([JSON.stringify({ tasks: [task()] })], 'b.json', { type: 'application/json' }))
    await vi.waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: 'importState', data: { tasks: [task()] } }))
    await user.upload(input, new File(['pas du json'], 'x.json', { type: 'application/json' }))
    await vi.waitFor(() => expect(alert).toHaveBeenCalledWith('Fichier invalide'))
    await user.upload(input, new File([JSON.stringify({ foo: 1 })], 'y.json', { type: 'application/json' }))
    await vi.waitFor(() => expect(alert).toHaveBeenCalledTimes(2))
  })
  it('réinitialiser les tâches demande confirmation', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const { user, dispatch } = setup()
    await user.click(screen.getByRole('button', { name: 'Tâches par défaut' }))
    expect(dispatch).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Tâches par défaut' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'resetTasks' })
    expect(confirm).toHaveBeenCalledTimes(2)
  })
})

describe('petits composants', () => {
  it('TabBar : onglet courant et changement', async () => {
    const onChange = vi.fn()
    render(<TabBar tab="tasks" onChange={onChange} />)
    expect(screen.getByRole('button', { name: /Tâches/ })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(screen.getByRole('button', { name: /Moi/ }))
    expect(onChange).toHaveBeenCalledWith('me')
  })
  it('Banner : rien sans tâche ; clic pour fermer', async () => {
    const { container, rerender } = render(<Banner task={null} onClose={() => {}} />)
    expect(container).toBeEmptyDOMElement()
    const onClose = vi.fn()
    rerender(<Banner task={task({ title: 'Manger' })} onClose={onClose} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Manger')
    fireEvent.click(screen.getByRole('alert'))
    expect(onClose).toHaveBeenCalled()
  })
  it('Ring : décalage proportionnel au pourcentage', () => {
    const { container, rerender } = render(<Ring pct={0} />)
    const full = Number(container.querySelector('.ring-fg').getAttribute('stroke-dashoffset'))
    rerender(<Ring pct={100} />)
    expect(Number(container.querySelector('.ring-fg').getAttribute('stroke-dashoffset'))).toBeCloseTo(0)
    rerender(<Ring pct={50} />)
    expect(Number(container.querySelector('.ring-fg').getAttribute('stroke-dashoffset'))).toBeCloseTo(full / 2)
  })
  it('Confetti : 22 particules seulement pendant une rafale', () => {
    const { container, rerender } = render(<Confetti burst={null} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<Confetti burst={{ id: 1, x: 10, y: 10 }} />)
    expect(container.querySelectorAll('.confetti span')).toHaveLength(22)
  })
})
