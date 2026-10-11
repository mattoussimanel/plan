import { render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'
import { STATE_KEY } from './lib/storage.js'
import { dateKey } from './lib/dates.js'

const NOW = new Date(2026, 9, 11, 8, 30, 0)
const saved = () => JSON.parse(localStorage.getItem(STATE_KEY))

function setup() {
  vi.useFakeTimers({ shouldAdvanceTime: true, now: NOW })
  vi.stubGlobal('Notification', Object.assign(vi.fn(), { permission: 'granted', requestPermission: vi.fn() }))
  vi.stubGlobal('navigator', { ...navigator, vibrate: vi.fn(), serviceWorker: undefined })
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(<App />)
  return user
}

describe('App (intégration)', () => {
  it('affiche la timeline du jour avec les 7 tâches par défaut', () => {
    setup()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bonjour')
    expect(screen.getByRole('list', { name: /Timeline/ }).children).toHaveLength(7)
    expect(screen.getByText('Réveil & message de bienvenue')).toBeInTheDocument()
  })

  it('cocher une tâche met à jour la progression et persiste', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /Marquer fait : Manger/ }))
    expect(screen.getByText('1/7')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '14% accompli' })).toBeInTheDocument()
    expect(saved().done[dateKey(NOW)]).toEqual(['d4'])
    expect(document.querySelectorAll('.confetti span').length).toBe(22)
    await user.click(screen.getByRole('button', { name: /Marquer non fait : Manger/ }))
    expect(screen.getByText('0/7')).toBeInTheDocument()
  })

  it('ajoute ma propre tâche récurrente (certains jours) à l’heure exacte', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Ajouter une tâche' }))
    await user.type(screen.getByPlaceholderText(/Boire/), 'Yoga')
    await user.selectOptions(screen.getByLabelText('Heures'), '18')
    await user.selectOptions(screen.getByLabelText('Minutes'), '45')
    await user.click(screen.getByRole('button', { name: 'Certains jours' }))
    await user.click(screen.getByRole('button', { name: 'Dim' }))
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('Yoga')).toBeInTheDocument() // dimanche = aujourd’hui
    expect(screen.getByText('18:45')).toBeInTheDocument()
    expect(saved().tasks.at(-1)).toMatchObject({ title: 'Yoga', time: '18:45', repeat: 'weekly', days: [0], notify: true })
  })

  it('une tâche « une fois » à une autre date n’apparaît pas aujourd’hui mais dans la liste', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Ajouter une tâche' }))
    await user.type(screen.getByPlaceholderText(/Boire/), 'Médecin')
    await user.click(screen.getByRole('button', { name: 'Une fois' }))
    await user.clear(screen.getByLabelText('Date'))
    await user.type(screen.getByLabelText('Date'), '2026-12-24')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(screen.queryByText('Médecin')).toBeNull()
    await user.click(screen.getByRole('button', { name: /Tâches/ }))
    expect(screen.getByText('Médecin')).toBeInTheDocument()
    expect(screen.getByText(/Une fois · 24\/12\/2026/)).toBeInTheDocument()
  })

  it('modifie puis supprime une tâche (avec confirmation)', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /Tâches/ }))
    await user.click(screen.getByRole('button', { name: /Manger/ }))
    const name = screen.getByDisplayValue('Manger')
    await user.clear(name)
    await user.type(name, 'Déjeuner')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(screen.getByText('Déjeuner')).toBeInTheDocument()

    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    await user.click(screen.getByRole('button', { name: /Déjeuner/ }))
    await user.click(screen.getByRole('button', { name: 'Supprimer' }))
    expect(screen.getByText('Déjeuner')).toBeInTheDocument() // refusé
    await user.click(screen.getByRole('button', { name: 'Supprimer' }))
    expect(screen.queryByText('Déjeuner')).toBeNull()
    expect(saved().tasks).toHaveLength(6)
  })

  it('prénom et thème : appliqués et persistés', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /Moi/ }))
    await user.type(screen.getByLabelText('Mon prénom'), 'Lina')
    await user.click(screen.getByRole('button', { name: 'Pêche' }))
    expect(document.documentElement.dataset.theme).toBe('peche')
    await user.click(screen.getByRole('button', { name: /Aujourd/ }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bonjour Lina')
    expect(saved()).toMatchObject({ name: 'Lina', theme: 'peche' })
  })

  it('eau et humeur sont mémorisées pour le jour', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Verre 2' }))
    await user.click(screen.getByRole('button', { name: 'Humeur 😍' }))
    expect(saved().water[dateKey(NOW)]).toBe(2)
    expect(saved().mood[dateKey(NOW)]).toBe('😍')
  })

  it('rappel à l’heure exacte : bannière + notification, une seule fois', async () => {
    const user = setup()
    const showSpy = vi.fn()
    Notification.mockImplementation(showSpy)
    expect(screen.queryByRole('alert')).toBeNull()
    await act(async () => { vi.setSystemTime(new Date(2026, 9, 11, 10, 0, 5)); await vi.advanceTimersByTimeAsync(15000) })
    const alert = screen.getByRole('alert')
    expect(within(alert).getByText(/Lire en français/)).toBeInTheDocument()
    expect(showSpy).toHaveBeenCalledWith(expect.stringContaining('Lire en français'), expect.any(Object))
    const calls = showSpy.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(30000) })
    expect(showSpy.mock.calls.length).toBe(calls)
    await user.click(alert)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('cycle : saisir les règles, voir les prévisions, ajouter un rappel « X jours avant »', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /Cycle/ }))
    expect(screen.getByRole('heading', { level: 1, name: /Mon cycle/ })).toBeInTheDocument()
    const input = screen.getByLabelText(/Premier jour de mes dernières règles/)
    await user.clear(input)
    await user.type(input, '2026-10-01')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByRole('heading', { name: /Jour 11 du cycle/ })).toBeInTheDocument() // l’horloge du test est figée au 11 octobre
    expect(saved().cycle.periods).toEqual([{ start: '2026-10-01', end: null }])
    await user.click(screen.getByRole('button', { name: /Ajouter un rappel/ }))
    await user.selectOptions(screen.getByLabelText('Combien de temps avant'), '3')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(saved().cycle.reminders.at(-1)).toMatchObject({ event: 'period', daysBefore: 3, time: '09:00' })
  })

  it('la carte cycle apparaît sur Aujourd’hui et mène à l’onglet Cycle ; plus de bouton de test sur Aujourd’hui', async () => {
    localStorage.setItem(STATE_KEY, JSON.stringify({ cycle: { periods: [{ start: '2026-10-05' }] } }))
    const user = setup()
    expect(screen.queryByRole('button', { name: /Tester les notifications/ })).toBeNull()
    await user.click(screen.getByText(/Jour 7/).closest('button'))
    expect(screen.getByRole('heading', { level: 1, name: /Mon cycle/ })).toBeInTheDocument()
  })

  it('l’état sauvegardé est rechargé au démarrage', () => {
    localStorage.setItem(STATE_KEY, JSON.stringify({ name: 'Sara', theme: 'lilas', tasks: [{ id: 'a', emoji: '🌸', title: 'Ma tâche', time: '12:00', repeat: 'daily', days: [], date: '', notify: true }] }))
    setup()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sara')
    expect(screen.getByText('Ma tâche')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: /Timeline/ }).children).toHaveLength(1)
  })
})
