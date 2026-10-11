import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskEditor from './TaskEditor.jsx'
import { newTaskDraft } from '../lib/tasks.js'
import { task } from '../test/helpers.js'

const setup = (t = newTaskDraft('2026-10-11', 1)) => {
  const props = { onSave: vi.fn(), onDelete: vi.fn(), onClose: vi.fn() }
  render(<TaskEditor task={t} {...props} />)
  return { user: userEvent.setup(), ...props }
}
const saveBtn = () => screen.getByRole('button', { name: 'Enregistrer' })

describe('TaskEditor', () => {
  it('nouvelle tâche : Enregistrer désactivé tant que le nom est vide', async () => {
    const { user } = setup()
    expect(screen.getByText(/Nouvelle tâche/)).toBeInTheDocument()
    expect(saveBtn()).toBeDisabled()
    await user.type(screen.getByPlaceholderText(/Boire/), 'Boire de l’eau')
    expect(saveBtn()).toBeEnabled()
  })
  it('enregistre nom (nettoyé), emoji, heure et notification', async () => {
    const { user, onSave } = setup()
    await user.type(screen.getByPlaceholderText(/Boire/), '  Yoga ')
    await user.click(screen.getByRole('button', { name: '🧘‍♀️' }))
    await user.selectOptions(screen.getByLabelText('Heures'), '18')
    await user.selectOptions(screen.getByLabelText('Minutes'), '45')
    await user.click(screen.getByRole('checkbox'))
    await user.click(saveBtn())
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'Yoga', emoji: '🧘‍♀️', time: '18:45', notify: false, repeat: 'daily', isNew: true }))
  })
  it('répétition « Une fois » exige une date', async () => {
    const { user, onSave } = setup()
    await user.type(screen.getByPlaceholderText(/Boire/), 'RDV')
    await user.click(screen.getByRole('button', { name: 'Une fois' }))
    const date = screen.getByLabelText('Date')
    await user.clear(date)
    expect(saveBtn()).toBeDisabled()
    await user.type(date, '2026-12-24')
    expect(saveBtn()).toBeEnabled()
    await user.click(saveBtn())
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ repeat: 'once', date: '2026-12-24' }))
  })
  it('« Certains jours » exige au moins un jour et permet de décocher', async () => {
    const { user, onSave } = setup()
    await user.type(screen.getByPlaceholderText(/Boire/), 'Sport')
    await user.click(screen.getByRole('button', { name: 'Certains jours' }))
    expect(saveBtn()).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Lun' }))
    await user.click(screen.getByRole('button', { name: 'Mer' }))
    await user.click(screen.getByRole('button', { name: 'Lun' }))
    await user.click(saveBtn())
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ repeat: 'weekly', days: [3] }))
  })
  it('modification : pas de bouton « nouvelle », suppression possible', async () => {
    const { user, onDelete } = setup(task({ id: 'abc', title: 'Lire' }))
    expect(screen.getByText('Modifier la tâche')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Lire')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Supprimer' }))
    expect(onDelete).toHaveBeenCalledWith('abc')
  })
  it('pas de bouton Supprimer pour une nouvelle tâche', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Supprimer' })).toBeNull()
  })
  it('Annuler et clic sur le fond ferment sans enregistrer, clic dans la feuille non', async () => {
    const { user, onClose, onSave } = setup()
    await user.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('dialog').parentElement)
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(onSave).not.toHaveBeenCalled()
  })
  it('Entrée dans le formulaire invalide n’enregistre pas', async () => {
    const { user, onSave } = setup()
    await user.type(screen.getByPlaceholderText(/Boire/), '   {Enter}')
    expect(onSave).not.toHaveBeenCalled()
  })
})
