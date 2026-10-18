import { Search } from 'lucide-react'
import { subscriptionStatuses } from './filters'
import type { MonitoringFilters as Filters } from './types'

export default function MonitoringFilters({
  filters,
  onChange,
  onReset,
}: {
  filters: Filters
  onChange: (key: keyof Filters, value: string) => void
  onReset: () => void
}) {
  return (
    <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_180px_160px_160px_auto] xl:items-end">
      <label className="field">
        <span>Search account or owner</span>
        <span className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"
          />
          <input
            type="search"
            className="input !pl-10"
            value={filters.q}
            maxLength={120}
            placeholder="Account, owner name or email…"
            onChange={(event) => onChange('q', event.target.value)}
          />
        </span>
      </label>
      <label className="field">
        <span>Subscription status</span>
        <select
          className="input"
          value={filters.status}
          onChange={(event) => onChange('status', event.target.value)}
        >
          {Object.entries(subscriptionStatuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Expiry window</span>
        <select
          className="input"
          value={filters.expiry_days}
          onChange={(event) => onChange('expiry_days', event.target.value)}
        >
          <option value="7">Within 7 days</option>
          <option value="30">Within 30 days</option>
        </select>
      </label>
      <label className="field">
        <span>Account status</span>
        <select
          className="input"
          value={filters.account_status}
          onChange={(event) => onChange('account_status', event.target.value)}
        >
          <option value="all">All accounts</option>
          <option value="active">Active accounts</option>
          <option value="suspended">Suspended accounts</option>
        </select>
      </label>
      <button className="btn btn-secondary" onClick={onReset}>
        Clear filters
      </button>
    </div>
  )
}
