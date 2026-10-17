import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import QueryState from '../../components/QueryState'
import { useApiQuery } from '../../hooks/useApiQuery'
import { recordId } from '../../platform/directory'
import { subscriptionPath } from '../../subscriptions/api'
import type { SubscriptionOverview } from '../../subscriptions/types'
import SubscriptionSummary from './SubscriptionSummary'
import SubscriptionForm from './SubscriptionForm'
import SubscriptionHistory from './SubscriptionHistory'

export default function AccountSubscriptionPage() {
  const id = recordId(useParams().accountId),
    result = useApiQuery<{ data: SubscriptionOverview }>(id ? subscriptionPath(id) : null),
    data = result.data?.data
  return (
    <>
      <Link
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-brand"
        to={id ? `/accounts/${id}` : '/accounts'}
      >
        <ArrowLeft size={14} /> Account details
      </Link>
      <PageHeader
        eyebrow={id ? `Account #${id}` : 'Accounts'}
        title={data ? `${data.account.name} subscription` : 'Account subscription'}
        description="Activate Basic or add a paid period after verifying payment. All dates use Philippine time."
        actions={
          <button
            className="btn btn-secondary"
            disabled={!id || result.loading}
            onClick={result.reload}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />
      {!id ? (
        <p role="alert">This account was not found.</p>
      ) : (
        <QueryState loading={result.loading} error={result.error} retry={result.reload} />
      )}
      {data && (
        <>
          <SubscriptionSummary data={data} />
          <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <SubscriptionForm key={`form:${id}`} data={data} onSaved={result.reload} />
            <SubscriptionHistory key={`history:${id}`} accountId={data.account.id} />
          </div>
        </>
      )}
    </>
  )
}
