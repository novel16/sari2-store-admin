import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import type { Overview } from '../../platform/types'
import { dayLabel, number } from '../../platform/format'

export default function RegistrationTrend({
  registrations,
  date_from,
  date_to,
}: Pick<Overview, 'registrations' | 'date_from' | 'date_to'>) {
  const [selectedDate, setSelectedDate] = useState(date_to)
  const selected = registrations.find((day) => day.date === selectedDate) ?? registrations.at(-1)
  const total = registrations.reduce((sum, day) => sum + day.accounts, 0)
  const max = Math.max(1, ...registrations.map((day) => day.accounts))
  return (
    <section className="panel mt-6 p-5 sm:p-6" aria-labelledby="registrations-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Growing together</p>
          <h2 id="registrations-heading" className="font-display text-lg font-bold">
            Account registrations
          </h2>
          <p className="mt-1 text-xs text-slate-400">Last 30 days · Philippine time</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-[#f3f7f4] px-4 py-3">
          <TrendingUp size={19} className="text-brand" />
          <span className="font-display text-xl font-bold">{number(total)}</span>
          <span className="text-xs text-slate-500">new accounts</span>
        </div>
      </div>
      <div
        role="img"
        aria-label={`${number(total)} accounts registered from ${dayLabel(date_from)} to ${dayLabel(date_to)}. Choose a date below for its count.`}
        className="mt-8 flex h-40 items-end gap-1 border-b border-slate-200 sm:gap-2"
      >
        {registrations.map((day) => (
          <div
            key={day.date}
            title={`${dayLabel(day.date)}: ${number(day.accounts)} accounts`}
            className={`min-w-0 flex-1 rounded-t-[3px] transition-colors ${day.date === selected?.date ? 'bg-brand' : 'bg-brand/30'}`}
            style={{ height: day.accounts ? `${Math.max(3, (day.accounts / max) * 100)}%` : '2px' }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-400">
        <span>{dayLabel(date_from)}</span>
        <span>{dayLabel(date_to)}</span>
      </div>
      <div className="mt-5 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
        <label className="flex items-center gap-3 text-xs text-slate-500">
          Inspect date
          <select
            className="input w-auto"
            value={selected?.date ?? ''}
            onChange={(event) => setSelectedDate(event.target.value)}
          >
            {registrations.map((day) => (
              <option key={day.date} value={day.date}>
                {dayLabel(day.date)}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-slate-500" aria-live="polite">
          <strong className="font-semibold text-ink">{number(selected?.accounts ?? 0)}</strong>{' '}
          accounts registered{selected ? ` on ${dayLabel(selected.date)}` : ''}.
        </p>
      </div>
      {total === 0 && (
        <p className="mt-3 text-xs text-slate-400">No accounts registered in this period yet.</p>
      )}
    </section>
  )
}
