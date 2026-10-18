import { useState } from 'react'
import Pagination from '../components/Pagination'
import QueryState from '../components/QueryState'
import StatusBadge from '../components/StatusBadge'
import { useApiQuery } from '../hooks/useApiQuery'
import { dateTime } from '../platform/format'
import type { PageResponse } from '../platform/types'
import { statusPath } from './api'
import type { StatusChange, StatusTarget } from './types'

export default function StatusHistory({ target }: { target: StatusTarget }) {
  const [page, setPage] = useState(1)
  const result = useApiQuery<PageResponse<StatusChange>>(
    `${statusPath(target)}/status-history?page=${page}&per_page=10`,
  )
  return (
    <section className="panel mb-8 overflow-hidden">
      <div className="p-5 sm:p-7">
        <h2 className="font-display text-lg font-bold">Status history</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Permanent records of confirmed changes, reasons, and the administrator who made them.
        </p>
      </div>
      <QueryState loading={result.loading} error={result.error} retry={result.reload} />
      {result.data && (
        <>
          {!result.data.data.length && (
            <p className="px-5 pb-7 text-sm text-slate-500">No status changes recorded yet.</p>
          )}
          <div className="divide-y divide-slate-100">
            {result.data.data.map((entry) => (
              <article key={entry.id} className="space-y-3 p-5 sm:px-7">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <StatusBadge status={entry.from_status} />
                  <span>to</span>
                  <StatusBadge status={entry.to_status} />
                  <span className="ml-auto text-slate-400">#{entry.id}</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">
                  {entry.reason}
                </p>
                <p className="break-words text-[11px] text-slate-400">
                  {entry.actor.name} - {dateTime(entry.created_at)} (PHT)
                </p>
              </article>
            ))}
          </div>
          <Pagination meta={result.data.meta} onPage={setPage} />
        </>
      )}
    </section>
  )
}
