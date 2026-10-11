import { averageCycle, averagePeriod, cycleLengths } from '../../lib/cycle.js'
import { diffDays, parseKey } from '../../lib/dates.js'

const short = (key) => parseKey(key).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

export default function CycleHistory({ cycle, dispatch }) {
  const periods = [...cycle.periods].reverse().slice(0, 8)
  if (!periods.length) return null
  const lengths = cycleLengths(cycle)
  return (
    <section className="card">
      <h3>📖 Historique <small>{lengths.length ? `cycle moyen ${averageCycle(cycle)} j · règles ${averagePeriod(cycle)} j` : ''}</small></h3>
      <ul className="history">
        {periods.map((p, i) => {
          const next = periods[i - 1]
          return (
            <li key={p.start}>
              <div>
                <b>{short(p.start)}</b>{p.end && <> → {short(p.end)} <small>({diffDays(p.end, p.start) + 1} j)</small></>}
                {next && <small> · cycle de {diffDays(next.start, p.start)} j</small>}
              </div>
              <button className="icon-btn" aria-label={`Supprimer les règles du ${short(p.start)}`}
                onClick={() => confirm('Supprimer cette période ?') && dispatch({ type: 'deletePeriod', start: p.start })}>🗑️</button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
