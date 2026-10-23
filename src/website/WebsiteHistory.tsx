import { useState } from 'react'
import { useApiQuery } from '../hooks/useApiQuery'
import QueryState from '../components/QueryState'
import Pagination from '../components/Pagination'
import type { WebsiteRevision } from './types'

export default function WebsiteHistory({
  busy,
  onRestore,
}: {
  busy: boolean
  onRestore: (revision: number) => void
}) {
  const [page, setPage] = useState(1)
  const result = useApiQuery<{
    data: WebsiteRevision[]
    current_page: number
    last_page: number
    total: number
    per_page: number
    from: number | null
    to: number | null
  }>(`/api/v1/admin/website/history?page=${page}`)
  const data = result.data
  return (
    <section className="panel mt-8 overflow-hidden">
      <h2 className="p-5 text-base font-semibold">Website revision history</h2>
      <QueryState loading={result.loading} error={result.error} retry={result.reload} />
      {data && (
        <>
          <div className="divide-y divide-slate-100">
            {data.data.map((revision) => (
              <article
                className="flex flex-wrap items-center justify-between gap-4 p-5"
                key={revision.id}
              >
                <div>
                  <p className="text-sm font-semibold">
                    Version {revision.version} · {revision.action}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{revision.change_note}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {revision.actor_name_snapshot || 'System'} ·{' '}
                    {new Intl.DateTimeFormat('en-PH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'Asia/Manila',
                    }).format(new Date(revision.created_at))}{' '}
                    PHT
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() => onRestore(revision.id)}
                >
                  Restore to draft
                </button>
              </article>
            ))}
          </div>
          <Pagination meta={data} onPage={setPage} />
        </>
      )}
    </section>
  )
}
