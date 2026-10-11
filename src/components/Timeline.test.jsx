import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Timeline from './Timeline.jsx'
import { DEFAULT_TASKS } from '../data/content.js'
import { quoteOfDay } from '../lib/messages.js'
import { task, SUNDAY } from '../test/helpers.js'

const setup = (over = {}) => {
  const props = { list: DEFAULT_TASKS, doneIds: [], name: 'Lina', now: SUNDAY, onToggle: vi.fn(), onEdit: vi.fn(), ...over }
  render(<Timeline {...props} />)
  return { user: userEvent.setup(), ...props }
}

describe('Timeline', () => {
  it('affiche toutes les tâches du jour avec leur heure', () => {
    setup()
    expect(screen.getAllByRole('listitem')).toHaveLength(7)
    expect(screen.getByText('07:00')).toBeInTheDocument()
    expect(screen.getByText('Faire mes soins')).toBeInTheDocument()
  })
  it('message vide quand il n’y a rien', () => {
    setup({ list: [] })
    expect(screen.getByText(/Rien de prévu/)).toBeInTheDocument()
  })
  it('contenus spéciaux : bienvenue personnalisée, motivation, citation du jour', () => {
    setup()
    expect(screen.getByText(/Bonjour Lina 💕 Je te souhaite/)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(quoteOfDay(SUNDAY)[0].slice(0, 20)))).toBeInTheDocument()
  })
  it('marque la prochaine tâche (08:30 → « Manger » 08:00 est passée, « Lire » 10:00 est la prochaine)', () => {
    setup()
    const items = screen.getAllByRole('listitem')
    expect(items[4]).toHaveClass('next')
    expect(items[3]).toHaveClass('late')
    expect(items[0]).toHaveClass('late')
  })
  it('une tâche faite est cochée, pas « en retard » et n’est pas la prochaine', () => {
    setup({ doneIds: ['d5'] })
    const items = screen.getAllByRole('listitem')
    expect(items[4]).toHaveClass('done')
    expect(items[4]).not.toHaveClass('next')
    expect(items[5]).toHaveClass('next')
    expect(within(items[4]).getByRole('button', { name: /Marquer non fait/ })).toHaveAttribute('aria-pressed', 'true')
  })
  it('cocher appelle onToggle avec l’id sans ouvrir l’éditeur', async () => {
    const { user, onToggle, onEdit } = setup({ list: [task({ id: 'z', title: 'Zen' })] })
    await user.click(screen.getByRole('button', { name: /Marquer fait : Zen/ }))
    expect(onToggle).toHaveBeenCalledWith('z', expect.any(HTMLElement))
    expect(onEdit).not.toHaveBeenCalled()
  })
  it('cliquer la carte ouvre l’édition', async () => {
    const t = task({ id: 'z', title: 'Zen' })
    const { user, onEdit } = setup({ list: [t] })
    await user.click(screen.getByText('Zen'))
    expect(onEdit).toHaveBeenCalledWith(t)
  })
})
