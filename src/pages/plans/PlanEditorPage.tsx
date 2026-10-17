import { useNavigate, useParams } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import QueryState from '../../components/QueryState'
import { useApiQuery } from '../../hooks/useApiQuery'
import { recordId } from '../../platform/directory'
import type { Plan } from '../../plans/types'
import PlanForm from './PlanForm'
import PlanHistory from './PlanHistory'
import PlanStatus from './PlanStatus'

export default function PlanEditorPage({ create = false }: { create?: boolean }) {
  const { planId } = useParams(),
    id = recordId(planId),
    navigate = useNavigate()
  const result = useApiQuery<{ data: Plan }>(!create && id ? `/api/v1/admin/plans/${id}` : null),
    plan = result.data?.data
  function saved(value: Plan) {
    if (create) navigate(`/plans/${value.id}`, { replace: true })
    else result.reload()
  }
  return (
    <>
      <PageHeader
        eyebrow="Plan management"
        title={create ? 'New plan' : (plan?.name ?? 'Plan details')}
        description="Set clear pricing and capacity for store owners."
        actions={
          !create && (
            <button
              className="btn btn-secondary"
              disabled={result.loading || !id}
              onClick={result.reload}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          )
        }
      />
      {!create &&
        (!id ? (
          <p role="alert" className="panel p-6">
            This plan was not found.
          </p>
        ) : (
          <QueryState loading={result.loading} error={result.error} retry={result.reload} />
        ))}
      {plan && (
        <div className="mb-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <PlanStatus status={plan.catalog_status} />
          <span>
            Version {plan.version} · {plan.subscriptions_count} subscription record(s)
          </span>
        </div>
      )}
      {(create || plan) && (
        <PlanForm
          key={plan ? `form:${plan.id}:${plan.version}` : 'new'}
          plan={plan}
          onSaved={saved}
        />
      )}
      {plan && <PlanHistory key={`history:${plan.id}:${plan.version}`} planId={plan.id} />}
    </>
  )
}
