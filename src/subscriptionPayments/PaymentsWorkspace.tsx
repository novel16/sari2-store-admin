import { RefreshCw } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import QueryState from '../components/QueryState'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import { useApiQuery } from '../hooks/useApiQuery'
import PaymentControls from './PaymentControls'
import PaymentsTable from './PaymentsTable'
import { usePaymentFilters } from './usePaymentFilters'
import type { PaymentsReply } from './types'

export default function PaymentsWorkspace() {
  const filters = usePaymentFilters()
  const result = useApiQuery<PaymentsReply>(filters.path)
  const loading = result.loading || filters.searching
  return (
    <>
      <PageHeader
        eyebrow="Platform billing"
        title="Subscription payments"
        description="Track PayMongo QR Ph payments and subscription activation separately."
        actions={
          <button className="btn btn-secondary" disabled={loading} onClick={result.reload}>
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />
      <section className="panel overflow-hidden" aria-label="Subscription payment directory">
        <PaymentControls
          filters={filters.filters}
          onChange={filters.change}
          onReset={filters.reset}
        />
        <p className="border-t border-slate-100 px-5 py-3 text-[11px] leading-relaxed text-slate-500">
          Payment confirmation comes from verified PayMongo notifications. A paid order may still be
          processing activation. Account suspension remains separate.
        </p>
        <QueryState loading={loading} error={result.error} retry={result.reload} />
        {result.data && !loading && (
          <>
            {result.data.data.length ? (
              <PaymentsTable payments={result.data.data} />
            ) : (
              <EmptyState
                title="No payments found"
                description="Try another account, payment status, or activation status."
                onReset={filters.reset}
              />
            )}
            <Pagination
              meta={result.data.meta}
              onPage={(page) => filters.change('page', String(page))}
            />
          </>
        )}
      </section>
    </>
  )
}
