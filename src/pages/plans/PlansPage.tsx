import { Link, useSearchParams } from 'react-router-dom'
import { Plus, RefreshCw, ArrowUpRight } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import QueryState from '../../components/QueryState'
import Pagination from '../../components/Pagination'
import { useApiQuery } from '../../hooks/useApiQuery'
import { pageNumber } from '../../platform/directory'
import { number } from '../../platform/format'
import type { PageResponse } from '../../platform/types'
import type { Plan } from '../../plans/types'
import { planMoney } from '../../plans/format'
import PlanStatus from './PlanStatus'

export default function PlansPage() {
  const [params, setParams] = useSearchParams(),
    page = pageNumber(params.get('page'))
  const result = useApiQuery<PageResponse<Plan>>(`/api/v1/admin/plans?page=${page}`)
  return (
    <>
      <PageHeader
        eyebrow="Room to grow"
        title="Plans"
        description="Manage your pricing, product allowances, and published plan catalog."
        actions={
          <>
            <button className="btn btn-secondary" onClick={result.reload} disabled={result.loading}>
              <RefreshCw size={15} />
              Refresh
            </button>
            <Link className="btn btn-primary" to="/plans/new">
              <Plus size={16} />
              New plan
            </Link>
          </>
        }
      />
      <p className="mb-5 rounded-xl border border-brand/10 bg-brand/5 p-4 text-xs leading-relaxed text-brand">
        Published and Coming soon plans appear in the store app. Paid checkout is not open yet.
        Existing paid subscriptions keep their saved terms when the catalog changes.
      </p>
      <section className="panel overflow-hidden">
        <QueryState loading={result.loading} error={result.error} retry={result.reload} />
        {result.data && (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Monthly</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Subscriptions</th>
                    <th>
                      <span className="sr-only">Manage</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.data.map((plan) => (
                    <tr key={plan.id}>
                      <td>
                        <Link className="text-link" to={`/plans/${plan.id}`}>
                          {plan.name}
                        </Link>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {plan.code} · v{plan.version}
                          {plan.featured ? ' · Featured' : ''}
                        </p>
                      </td>
                      <td className="whitespace-nowrap font-semibold">
                        {planMoney(plan.monthly_price_centavos)}
                      </td>
                      <td>
                        <p>
                          {plan.active_product_limit === null
                            ? 'Unlimited'
                            : number(plan.active_product_limit)}{' '}
                          active products
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {plan.quota_scope === 'account' ? 'Shared across account' : 'Per store'} ·{' '}
                          {plan.store_limit} store(s) · {plan.staff_limit} staff
                        </p>
                      </td>
                      <td>
                        <PlanStatus status={plan.catalog_status} />
                      </td>
                      <td>{number(plan.subscriptions_count)}</td>
                      <td>
                        <Link
                          className="icon-button"
                          aria-label={`Manage ${plan.name}`}
                          to={`/plans/${plan.id}`}
                        >
                          <ArrowUpRight size={17} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!result.data.data.length && (
              <p className="p-8 text-center text-sm text-slate-500">
                No plans yet. Create your first plan to begin.
              </p>
            )}
            <Pagination
              meta={result.data.meta}
              onPage={(value) => setParams({ page: String(value) })}
            />
          </>
        )}
      </section>
    </>
  )
}
