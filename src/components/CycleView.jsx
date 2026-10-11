import { useState } from 'react'
import { summary as cycleSummary } from '../lib/cycle.js'
import { dateKey } from '../lib/dates.js'
import CycleSummaryCard from './cycle/CycleSummaryCard.jsx'
import PeriodActions from './cycle/PeriodActions.jsx'
import CycleCalendar from './cycle/CycleCalendar.jsx'
import DayEditor from './cycle/DayEditor.jsx'
import RemindersSection from './cycle/RemindersSection.jsx'
import CycleSettings from './cycle/CycleSettings.jsx'
import CycleHistory from './cycle/CycleHistory.jsx'

export default function CycleView({ state, dispatch, now }) {
  const { cycle } = state
  const today = dateKey(now)
  const [day, setDay] = useState(null)
  const s = cycleSummary(cycle, today)
  const start = (date) => dispatch({ type: 'startPeriod', date })
  return (
    <section className="narrow">
      <h1>Mon cycle 🌙</h1>
      <CycleSummaryCard summary={s} today={today} onStart={start} />
      {s && <PeriodActions today={today} hasPeriods onStart={start} onEnd={(date) => dispatch({ type: 'endPeriod', date })} />}
      <CycleCalendar cycle={cycle} today={today} onSelect={setDay} />
      <RemindersSection cycle={cycle} now={now} dispatch={dispatch} />
      <CycleHistory cycle={cycle} dispatch={dispatch} />
      <CycleSettings cycle={cycle} dispatch={dispatch} />
      {day && <DayEditor cycle={cycle} dayKey={day} today={today} dispatch={dispatch} onClose={() => setDay(null)} />}
    </section>
  )
}
