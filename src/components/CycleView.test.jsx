import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CycleView from './CycleView.jsx'
import CycleToday from './cycle/CycleToday.jsx'
import { nextPeriodText } from './cycle/CycleSummaryCard.jsx'
import { defaultCycle, summary } from '../lib/cycle.js'
import { makeState } from '../test/helpers.js'

const NOW = new Date(2026, 9, 30, 10, 0)
const withPeriods = (cycle = {}) => makeState({
  cycle: { ...defaultCycle(), periods: [{ start: '2026-09-20', end: '2026-09-24' }, { start: '2026-10-18', end: null }], ...cycle },
})
const setup = (state = makeState()) => {
  const dispatch = vi.fn()
  render(<CycleView state={state} dispatch={dispatch} now={NOW} />)
  return { user: userEvent.setup(), dispatch }
}

describe('CycleView — première utilisation', () => {
  it('invite à saisir le premier jour des dernières règles', async () => {
    const { user, dispatch } = setup()
    expect(screen.getByText(/premier jour de tes dernières règles/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'startPeriod', date: '2026-10-30' })
  })
  it('permet de choisir une autre date', async () => {
    const { user, dispatch } = setup()
    const input = screen.getByLabelText(/Premier jour de mes dernières règles/)
    await user.clear(input)
    await user.type(input, '2026-10-20')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'startPeriod', date: '2026-10-20' })
  })
  it('une date future ne peut pas être enregistrée', async () => {
    const { user } = setup()
    const input = screen.getByLabelText(/Premier jour de mes dernières règles/)
    await user.clear(input)
    await user.type(input, '2026-12-01')
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
  })
  it('pas encore de boutons « elles se terminent »', () => {
    setup()
    expect(screen.queryByRole('button', { name: /Elles se terminent/ })).toBeNull()
  })
})

describe('CycleView — avec historique', () => {
  it('résumé : jour du cycle, phase, prochaines règles, fenêtre fertile, ovulation, moyenne', () => {
    setup(withPeriods())
    expect(screen.getByRole('heading', { name: /Jour 13 du cycle/ })).toBeInTheDocument()
    expect(screen.getByText('Fenêtre fertile (estimée)')).toBeInTheDocument()
    expect(screen.getByText(/Prochaines règles :/).textContent).toMatch(/dans 16 jours.*dimanche 15 novembre/)
    expect(screen.getByText(/Ovulation estimée/).textContent).toMatch(/dimanche 1 novembre/)
    expect(screen.getByText(/Cycle moyen/).textContent).toMatch(/28 jours/)
  })
  it('règles commencées / terminées à une date choisie', async () => {
    const { user, dispatch } = setup(withPeriods())
    await user.click(screen.getByRole('button', { name: /Elles commencent/ }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'startPeriod', date: '2026-10-30' })
    await user.click(screen.getByRole('button', { name: /Elles se terminent/ }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'endPeriod', date: '2026-10-30' })
  })
  it('retard de règles', () => {
    expect(nextPeriodText({ late: 3, daysToNext: -3 })).toBe('en retard de 3 jours')
    expect(nextPeriodText({ late: 1, daysToNext: -1 })).toBe('en retard de 1 jour')
    expect(nextPeriodText({ late: 0, daysToNext: 0 })).toBe('prévues aujourd’hui')
    expect(nextPeriodText({ late: 0, daysToNext: 1 })).toBe('dans 1 jour')
  })
})

describe('CycleView — calendrier', () => {
  it('colore règles, règles prévues, fenêtre fertile, ovulation et aujourd’hui', () => {
    setup(withPeriods())
    const day = (n) => screen.getByRole('button', { name: new RegExp(`^\\w+ ${n} octobre$`) })
    expect(day(18)).toHaveClass('period')
    expect(day(25)).not.toHaveClass('period')
    expect(day(28)).toHaveClass('fertile')
    expect(day(30)).toHaveClass('today')
    expect(screen.getByRole('grid', { name: /octobre 2026/ })).toBeInTheDocument()
  })
  it('navigue entre les mois et affiche les règles prévues', async () => {
    const { user } = setup(withPeriods())
    await user.click(screen.getByRole('button', { name: 'Mois suivant' }))
    expect(screen.getByRole('grid', { name: /novembre 2026/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^dimanche 15 novembre$/ })).toHaveClass('period-pred')
    expect(screen.getByRole('button', { name: /^dimanche 1 novembre$/ })).toHaveClass('ovulation')
    await user.click(screen.getByRole('button', { name: 'Mois précédent' }))
    await user.click(screen.getByRole('button', { name: 'Mois précédent' }))
    expect(screen.getByRole('grid', { name: /septembre 2026/ })).toBeInTheDocument()
  })
  it('point sur les jours renseignés', () => {
    setup(withPeriods({ days: { '2026-10-19': { flow: 'heavy' } } }))
    expect(screen.getByRole('button', { name: /^lundi 19 octobre$/ })).toHaveClass('logged')
  })
  it('toucher un jour ouvre la fiche : flux, symptômes, note', async () => {
    const { user, dispatch } = setup(withPeriods())
    await user.click(screen.getByRole('button', { name: /^lundi 19 octobre$/ }))
    const dlg = screen.getByRole('dialog', { name: /lundi 19 octobre/ })
    expect(within(dlg).getByText(/Règles · jour 2/)).toBeInTheDocument()
    await user.click(within(dlg).getByRole('button', { name: /Abondant/ }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'setCycleDay', key: '2026-10-19', patch: { flow: 'heavy' } })
    await user.click(within(dlg).getByRole('button', { name: /Crampes/ }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'setCycleDay', key: '2026-10-19', patch: { symptoms: ['cramps'] } })
    await user.type(within(dlg).getByPlaceholderText(/Comment je me sens/), 'a')
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'setCycleDay', key: '2026-10-19', patch: { note: 'a' } })
    await user.click(within(dlg).getByRole('button', { name: /Règles commencées/ }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'startPeriod', date: '2026-10-19' })
    await user.click(within(dlg).getByRole('button', { name: /Règles terminées/ }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'endPeriod', date: '2026-10-19' })
    await user.click(within(dlg).getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('flux et symptômes déjà choisis se décochent ; pas d’action « règles » dans le futur', async () => {
    const { user, dispatch } = setup(withPeriods({ days: { '2026-10-19': { flow: 'light', symptoms: ['cramps', 'acne'] } } }))
    await user.click(screen.getByRole('button', { name: /^lundi 19 octobre$/ }))
    await user.click(screen.getByRole('button', { name: /Léger/ }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'setCycleDay', key: '2026-10-19', patch: { flow: undefined } })
    await user.click(screen.getByRole('button', { name: /Crampes/ }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'setCycleDay', key: '2026-10-19', patch: { symptoms: ['acne'] } })
    await user.click(screen.getByRole('button', { name: 'Fermer' }))
    await user.click(screen.getByRole('button', { name: /Mois suivant/ }))
    await user.click(screen.getByRole('button', { name: /^dimanche 15 novembre$/ }))
    expect(screen.queryByRole('button', { name: /Règles commencées/ })).toBeNull()
    expect(screen.getByText(/Règles \(estimée\) · jour 1/)).toBeInTheDocument()
  })
})

describe('CycleView — rappels « X jours avant »', () => {
  it('liste les rappels et les prochains déclenchements', () => {
    setup(withPeriods())
    expect(screen.getByText('Mes règles', { selector: 'b' }).closest('button')).toHaveTextContent('2 jours avant · 09:00')
    expect(screen.getByText('Ovulation', { selector: 'b' }).closest('button')).toHaveTextContent('1 jour avant · 09:00')
    expect(screen.getByText('Prochains rappels')).toBeInTheDocument()
    expect(screen.getAllByText(/Ton ovulation est estimée dans 1 jour/).length).toBeGreaterThan(0)
  })
  it('ajoute un rappel : évènement, jours avant, heure 24 h', async () => {
    const { user, dispatch } = setup(withPeriods())
    await user.click(screen.getByRole('button', { name: /Ajouter un rappel/ }))
    const dlg = screen.getByRole('dialog', { name: 'Nouveau rappel' })
    await user.selectOptions(within(dlg).getByLabelText('Me prévenir pour'), 'fertile')
    await user.selectOptions(within(dlg).getByLabelText('Combien de temps avant'), '5')
    await user.selectOptions(within(dlg).getByLabelText('Heures'), '20')
    await user.selectOptions(within(dlg).getByLabelText('Minutes'), '30')
    await user.click(within(dlg).getByRole('button', { name: 'Enregistrer' }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'saveReminder', reminder: expect.objectContaining({ event: 'fertile', daysBefore: 5, time: '20:30', enabled: true }) })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('modifie, désactive et supprime un rappel', async () => {
    const { user, dispatch } = setup(withPeriods())
    await user.click(screen.getByText('Mes règles', { selector: 'b' }).closest('button'))
    const dlg = screen.getByRole('dialog', { name: 'Modifier le rappel' })
    await user.click(within(dlg).getByRole('checkbox'))
    await user.click(within(dlg).getByRole('button', { name: 'Enregistrer' }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'saveReminder', reminder: { id: 'r1', event: 'period', daysBefore: 2, time: '09:00', enabled: false } })
    await user.click(screen.getByText('Mes règles', { selector: 'b' }).closest('button'))
    await user.click(screen.getByRole('button', { name: 'Supprimer' }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'deleteReminder', id: 'r1' })
  })
  it('annuler ferme sans enregistrer ; liste vide ; aide sans règles saisies', async () => {
    const { user, dispatch } = setup(makeState({ cycle: { ...defaultCycle(), reminders: [] } }))
    expect(screen.getByText(/Aucun rappel/)).toBeInTheDocument()
    expect(screen.getByText(/dès que tu as saisi tes dernières règles/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Ajouter un rappel/ }))
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(dispatch).not.toHaveBeenCalled()
  })
})

describe('CycleView — réglages et historique', () => {
  it('réglages de durée', async () => {
    const { user, dispatch } = setup(withPeriods())
    await user.selectOptions(screen.getByLabelText('Durée habituelle du cycle'), '31')
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'cycleSettings', patch: { cycleLength: 31 } })
    await user.selectOptions(screen.getByLabelText('Durée des règles'), '4')
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'cycleSettings', patch: { periodLength: 4 } })
    await user.selectOptions(screen.getByLabelText(/phase lutéale/), '13')
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'cycleSettings', patch: { lutealLength: 13 } })
  })
  it('historique : cycles, durées et suppression avec confirmation', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const { user, dispatch } = setup(withPeriods())
    expect(screen.getByText(/cycle de 28 j/)).toBeInTheDocument()
    expect(screen.getByText(/\(5 j\)/)).toBeInTheDocument()
    const del = screen.getByRole('button', { name: /Supprimer les règles du 20 sept/ })
    await user.click(del)
    expect(dispatch).not.toHaveBeenCalled()
    await user.click(del)
    expect(dispatch).toHaveBeenCalledWith({ type: 'deletePeriod', start: '2026-09-20' })
    expect(confirm).toHaveBeenCalledTimes(2)
  })
  it('pas d’historique sans règles', () => {
    setup()
    expect(screen.queryByText(/Historique/)).toBeNull()
  })
})

describe('CycleToday (écran Aujourd’hui)', () => {
  it('rien sans règles saisies', () => {
    const { container } = render(<CycleToday summary={null} onOpen={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
  it('affiche le jour, la phase et ouvre l’onglet Cycle', async () => {
    const onOpen = vi.fn()
    render(<CycleToday summary={summary(withPeriods().cycle, '2026-10-30')} onOpen={onOpen} />)
    expect(screen.getByText(/Jour 13 · Fenêtre fertile/)).toBeInTheDocument()
    expect(screen.getByText(/Règles dans 16 jours/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button'))
    expect(onOpen).toHaveBeenCalled()
  })
})
