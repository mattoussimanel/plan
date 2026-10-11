import { QUOTES, MOTIVATIONS } from '../data/content.js'
import { bodyFor, greeting, motivationOfDay, quoteOfDay } from './messages.js'
import { task } from '../test/helpers.js'

describe('messages', () => {
  it('salue selon l’heure', () => {
    expect(greeting('', new Date(2026, 0, 1, 3))).toBe('Bonne nuit 💕')
    expect(greeting('', new Date(2026, 0, 1, 9))).toBe('Bonjour 💕')
    expect(greeting('', new Date(2026, 0, 1, 17, 59))).toBe('Bonjour 💕')
    expect(greeting('', new Date(2026, 0, 1, 18))).toBe('Bonsoir 💕')
  })
  it('ajoute le prénom (nettoyé) s’il existe', () => {
    expect(greeting('  Lina ', new Date(2026, 0, 1, 9))).toBe('Bonjour Lina 💕')
    expect(greeting('   ', new Date(2026, 0, 1, 9))).toBe('Bonjour 💕')
    expect(greeting(undefined, new Date(2026, 0, 1, 9))).toBe('Bonjour 💕')
  })
  it('citation et motivation changent chaque jour et tournent', () => {
    const a = new Date(2026, 5, 1), b = new Date(2026, 5, 2)
    expect(quoteOfDay(a)).not.toEqual(quoteOfDay(b))
    expect(quoteOfDay(a)).toEqual(quoteOfDay(new Date(2026, 5, 1, 23)))
    expect(QUOTES).toContainEqual(quoteOfDay(a))
    expect(MOTIVATIONS).toContain(motivationOfDay(a))
    const d = new Date(2026, 5, 1), d2 = new Date(2026, 5, 1 + QUOTES.length * MOTIVATIONS.length)
    expect(quoteOfDay(d)).toEqual(quoteOfDay(d2))
  })
  it('bodyFor selon le type de tâche', () => {
    const d = new Date(2026, 5, 1)
    expect(bodyFor(task({ kind: 'quote' }), d)).toContain(quoteOfDay(d)[0])
    expect(bodyFor(task({ kind: 'motivation' }), d)).toBe(motivationOfDay(d))
    expect(bodyFor(task({ kind: 'welcome' }), d)).toMatch(/Belle journée/)
    expect(bodyFor(task({ time: '10:00' }), d)).toBe('C’est l’heure ! 10:00')
  })
})
