import { useState } from 'react'
import { administratorsPath } from '../administrators/api'
import type { Administrator, AdministratorDirectory } from '../administrators/types'
import { useApiQuery } from '../hooks/useApiQuery'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

export default function ActivityActorPicker({
  value,
  onChange,
}: {
  value: number | null
  onChange: (value: string) => void
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebouncedValue(search)
  const query = new URLSearchParams({ q: debounced.trim(), page: String(page), per_page: '20' })
  const result = useApiQuery<AdministratorDirectory>(`${administratorsPath}?${query}`)
  const records = result.data?.data ?? []
  const selected = records.find((record) => record.id === value)
  const detail = useApiQuery<{ data: Administrator }>(
    value && !selected ? `${administratorsPath}/${value}` : null,
  )
  const searching = search !== debounced
  return (
    <div className="min-w-0 sm:col-span-2 xl:col-span-1">
      <label className="field">
        Search administrators
        <input
          className="input"
          type="search"
          placeholder="Name or email..."
          maxLength={100}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
      </label>
      <label className="field mt-3">
        Performed by
        <select
          className="input"
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">All administrators and system</option>
          <option value="0">System / Console</option>
          {value !== null && value > 0 && !selected && (
            <option value={value}>{detail.data?.data.name ?? `Administrator #${value}`}</option>
          )}
          {records.map((record) => (
            <option key={record.id} value={record.id}>
              {record.name} ({record.status})
            </option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        Includes active and suspended administrators.
      </p>
      {(result.loading || searching) && (
        <p className="mt-2 text-xs text-slate-500" role="status">
          Finding administrators...
        </p>
      )}
      {result.error && (
        <p className="mt-2 text-xs text-amber-700" role="alert">
          Administrator search unavailable.{' '}
          <button className="text-link" onClick={result.reload}>
            Retry search
          </button>
        </p>
      )}
      {result.data && !result.loading && !searching && (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
          {!records.length && <span className="text-slate-500">No matching administrators.</span>}
          {result.data.meta.last_page > 1 && (
            <>
              <button
                className="text-link disabled:no-underline"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous administrators
              </button>
              <button
                className="text-link disabled:no-underline"
                disabled={page >= result.data.meta.last_page}
                onClick={() => setPage((current) => current + 1)}
              >
                More administrators
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
