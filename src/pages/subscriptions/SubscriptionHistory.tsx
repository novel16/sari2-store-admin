import { useState } from 'react'
import Pagination from '../../components/Pagination'
import QueryState from '../../components/QueryState'
import { useApiQuery } from '../../hooks/useApiQuery'
import { planMoney } from '../../plans/format'
import { dateTime } from '../../platform/format'
import type { PageResponse } from '../../platform/types'
import { subscriptionPath } from '../../subscriptions/api'
import type { Activation } from '../../subscriptions/types'

export default function SubscriptionHistory({ accountId }: { accountId: number }) {
  const [page, setPage] = useState(1),
    result = useApiQuery<PageResponse<Activation>>(
      `${subscriptionPath(accountId)}/history?page=${page}`,
    )
  return (
    <section className="panel overflow-hidden">
      <div className="p-5 sm:p-7">
        <h2 className="font-display text-lg font-bold">Activation & renewal history</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Saved periods, verified references, complimentary grants, and the administrator who
          confirmed them.
        </p>
      </div>
      <QueryState loading={result.loading} error={result.error} retry={result.reload} />
      {result.data && (
        <>
          {!result.data.data.length && (
            <p className="px-5 pb-7 text-sm text-slate-500">
              No manual activations or renewals yet.
            </p>
          )}
          <div className="divide-y divide-slate-100">
            {result.data.data.map((entry) => (
              <article key={entry.id} className="min-w-0 space-y-2 px-5 py-5 sm:px-7">
                <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold">
                  <span>
                    {entry.snapshot.terms.name} ·{' '}
                    {entry.action === 'renew' ? 'Renewal' : 'Activation'} #{entry.id}
                  </span>
                  <span>{planMoney(entry.amount_centavos)}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {entry.months} month(s) · version {entry.snapshot.plan_version} ·{' '}
                  {entry.settlement_method === 'complimentary'
                    ? 'Complimentary'
                    : 'Verified payment'}
                </p>
                <p className="text-xs leading-relaxed text-slate-500">
                  {dateTime(entry.snapshot.starts_at)} → {dateTime(entry.snapshot.ends_at)} (PHT)
                </p>
                {entry.payment_reference && (
                  <p className="break-all text-xs text-brand">
                    Reference: {entry.payment_reference}
                  </p>
                )}
                <p className="break-words text-xs leading-relaxed text-slate-600">{entry.reason}</p>
                <p className="break-words text-[11px] text-slate-400">
                  {entry.actor.name} · {dateTime(entry.created_at)}
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
