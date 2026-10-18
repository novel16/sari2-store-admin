import { actions, modules } from './filters'
import ActivityActorPicker from './ActivityActorPicker'
import type { ActivityFilters as Filters } from './types'

export default function ActivityFilters({
  filters,
  error,
  onChange,
  onReset,
}: {
  filters: Filters
  error: string
  onChange: (key: keyof Filters, value: string) => void
  onReset: () => void
}) {
  return (
    <section className="panel mb-6 p-5 sm:p-6" aria-label="Activity filters">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Find platform activity</h2>
        <button className="text-link text-xs" onClick={onReset}>
          Clear filters
        </button>
      </div>
      <div className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <label className="field sm:col-span-2 xl:col-span-3">
          Search activity
          <input
            className="input"
            type="search"
            value={filters.q}
            maxLength={100}
            placeholder="Search recorded names or reasons..."
            onChange={(event) => onChange('q', event.target.value)}
          />
        </label>
        <label className="field">
          Module
          <select
            className="input"
            value={filters.module}
            onChange={(event) => onChange('module', event.target.value)}
          >
            {Object.entries(modules).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Action
          <select
            className="input"
            value={filters.action}
            onChange={(event) => onChange('action', event.target.value)}
          >
            {Object.entries(actions).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <ActivityActorPicker
          value={filters.actor_id}
          onChange={(value) => onChange('actor_id', value)}
        />
        <label className="field">
          From (PHT)
          <input
            className="input"
            type="date"
            value={filters.date_from}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'activity-date-error' : 'activity-date-help'}
            onChange={(event) => onChange('date_from', event.target.value)}
          />
        </label>
        <label className="field">
          To (PHT)
          <input
            className="input"
            type="date"
            value={filters.date_to}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'activity-date-error' : 'activity-date-help'}
            onChange={(event) => onChange('date_to', event.target.value)}
          />
        </label>
      </div>
      {error ? (
        <p id="activity-date-error" role="alert" className="mt-4 text-xs text-red-700">
          {error}
        </p>
      ) : (
        <p id="activity-date-help" className="mt-4 text-xs text-slate-500">
          Dates are inclusive in Philippine time. Default: last 30 days. Maximum: 366 days.
        </p>
      )}
    </section>
  )
}
