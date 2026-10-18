import { RefreshCw } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import Pagination from '../components/Pagination'
import QueryState from '../components/QueryState'
import { useApiQuery } from '../hooks/useApiQuery'
import { dateTime } from '../platform/format'
import MonitoringFilters from './MonitoringFilters'
import MonitoringSummary from './MonitoringSummary'
import MonitoringTable from './MonitoringTable'
import type { MonitoringResponse } from './types'
import { useMonitoringFilters } from './useMonitoringFilters'

export default function MonitoringWorkspace() {
  const filters = useMonitoringFilters()
  const result = useApiQuery<MonitoringResponse>(filters.path)
  const loading = result.loading || filters.searching
  return (
    <>
      <PageHeader
        eyebrow="Platform oversight"
        title="Subscriptions"
        description="Track paid coverage, upcoming expirations, and scheduled renewals across accounts."
        actions={
          <button className="btn btn-secondary" disabled={loading} onClick={result.reload}>
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />
      {result.data && !loading && (
        <MonitoringSummary
          summary={result.data.summary}
          selected={filters.filters.status}
          expiryDays={filters.filters.expiry_days}
          onSelect={(status) => filters.change('status', status)}
        />
      )}
      <section className="panel overflow-hidden" aria-label="Subscription directory">
        <MonitoringFilters
          filters={filters.filters}
          onChange={filters.change}
          onReset={filters.reset}
        />
        <div className="border-t border-slate-100 px-5 py-3 text-[11px] leading-relaxed text-slate-500">
          Expiry uses continuous paid coverage, including prepaid renewals. Account suspension is
          shown separately. Manual renewal; no automatic charges.
        </div>
        <QueryState loading={loading} error={result.error} retry={result.reload} />
        {result.data && !loading && (
          <>
            {result.data.data.length ? (
              <MonitoringTable subscriptions={result.data.data} />
            ) : (
              <EmptyState
                title="No subscriptions found"
                description="No accounts match these filters. Try another search, subscription status, or account status."
                onReset={filters.reset}
              />
            )}
            <Pagination
              meta={result.data.meta}
              onPage={(page) => filters.change('page', String(page))}
            />
            <p className="border-t border-slate-100 px-5 py-3 text-[10px] text-slate-400">
              As of {dateTime(result.data.meta.generated_at)} PHT. Refresh to check current
              coverage.
            </p>
          </>
        )}
      </section>
    </>
  )
}
