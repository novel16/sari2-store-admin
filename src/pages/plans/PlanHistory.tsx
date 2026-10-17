import { useState } from 'react'
import { useApiQuery } from '../../hooks/useApiQuery'
import QueryState from '../../components/QueryState'
import Pagination from '../../components/Pagination'
import { dateTime } from '../../platform/format'
import type { PageResponse } from '../../platform/types'
import type { PlanVersion } from '../../plans/types'
import { planMoney } from '../../plans/format'
export default function PlanHistory({ planId }: { planId: number }) {
  const [page, setPage] = useState(1),
    result = useApiQuery<PageResponse<PlanVersion>>(
      `/api/v1/admin/plans/${planId}/versions?page=${page}`,
    )
  return (
    <section className="panel mt-7 overflow-hidden">
      <h2 className="px-5 py-5 font-display text-base font-bold sm:px-7">Version history</h2>
      <QueryState loading={result.loading} error={result.error} retry={result.reload} />
      {result.data && (
        <>
          <ul className="divide-y divide-slate-100">
            {result.data.data.map((version) => (
              <li key={version.id} className="px-5 py-5 sm:px-7">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="text-xs font-semibold">
                    Version {version.version} · {planMoney(version.terms.monthly_price_centavos)}
                    /month
                  </p>
                  <time className="text-[10px] text-slate-400">{dateTime(version.created_at)}</time>
                </div>
                <p className="mt-2 break-words text-xs text-slate-600">
                  {version.change_note ?? 'Catalog update'}
                </p>
                <p className="mt-2 text-[10px] text-slate-400">
                  {version.actor?.name ?? 'System'} ·{' '}
                  {version.terms.active_product_limit ?? 'Unlimited'} products ·{' '}
                  {version.terms.quota_scope === 'account' ? 'Account allowance' : 'Per store'} ·{' '}
                  {version.terms.store_limit} store(s) · {version.terms.staff_limit} staff
                </p>
              </li>
            ))}
          </ul>
          {!result.data.data.length && (
            <p className="px-7 pb-7 text-xs text-slate-500">No managed versions yet.</p>
          )}
          <Pagination meta={result.data.meta} onPage={setPage} />
        </>
      )}
    </section>
  )
}
