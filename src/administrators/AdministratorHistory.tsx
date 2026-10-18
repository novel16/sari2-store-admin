import { useState } from 'react'
import Pagination from '../components/Pagination'
import QueryState from '../components/QueryState'
import StatusBadge from '../components/StatusBadge'
import { useApiQuery } from '../hooks/useApiQuery'
import { dateTime } from '../platform/format'
import type { PageResponse } from '../platform/types'
import { administratorsPath } from './api'
import type { AdministratorEvent } from './types'

export default function AdministratorHistory({ id }: { id: number }) {
  const [page, setPage] = useState(1)
  const result = useApiQuery<PageResponse<AdministratorEvent>>(
    `${administratorsPath}/${id}/history?page=${page}&per_page=10`,
  )
  return (
    <section className="panel overflow-hidden">
      <div className="p-5 sm:p-7">
        <h2 className="font-display text-lg font-bold">Administrator audit history</h2>
        <p className="mt-2 text-xs text-slate-500">
          Permanent creation and status records, with the names recorded at the time.
        </p>
      </div>
      <QueryState loading={result.loading} error={result.error} retry={result.reload} />
      {result.data && (
        <>
          {!result.data.data.length && (
            <p className="px-5 pb-7 text-sm text-slate-500">No changes recorded yet.</p>
          )}
          <div className="divide-y divide-slate-100">
            {result.data.data.map((event) => (
              <article className="space-y-3 p-5 sm:px-7" key={event.id}>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {event.from_status ? (
                    <>
                      <StatusBadge status={event.from_status} />
                      <span>to</span>
                    </>
                  ) : (
                    <span>Administrator created</span>
                  )}
                  <StatusBadge status={event.to_status} />
                  <span className="ml-auto text-slate-400">#{event.id}</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm text-slate-600">
                  {event.reason}
                </p>
                <p className="break-words text-[11px] text-slate-400">
                  {event.actor.name} - {dateTime(event.created_at)} (PHT)
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
