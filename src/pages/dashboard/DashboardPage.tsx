import { RefreshCw, ShieldCheck } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import QueryState from '../../components/QueryState'
import { useApiQuery } from '../../hooks/useApiQuery'
import type { Overview } from '../../platform/types'
import { dateTime } from '../../platform/format'
import PlatformStats from './PlatformStats'
import RegistrationTrend from './RegistrationTrend'
import RecentRecords from './RecentRecords'

export default function DashboardPage() {
  const result = useApiQuery<{ data: Overview }>('/api/v1/admin/dashboard')
  const overview = result.data?.data
  return (
    <>
      <PageHeader
        eyebrow="A view of your community"
        title="Platform overview"
        description="A clear picture of the accounts, stores, and people on Sarisari."
        actions={
          <button className="btn btn-secondary" disabled={result.loading} onClick={result.reload}>
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />
      <QueryState loading={result.loading} error={result.error} retry={result.reload} />
      {overview && (
        <>
          <PlatformStats summary={overview.summary} />
          <p className="mt-3 text-[10px] text-slate-400">
            User totals include platform administrators. Status counts reflect each record’s saved
            status.
          </p>
          <RegistrationTrend
            registrations={overview.registrations}
            date_from={overview.date_from}
            date_to={overview.date_to}
          />
          <RecentRecords
            recent_accounts={overview.recent_accounts}
            recent_stores={overview.recent_stores}
          />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} />
              Platform directory · Account and store metadata
            </span>
            <span>Updated {dateTime(overview.generated_at)} · PHT</span>
          </div>
        </>
      )}
    </>
  )
}
