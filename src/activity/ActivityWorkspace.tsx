import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import QueryState from '../components/QueryState'
import { useApiQuery } from '../hooks/useApiQuery'
import ActivityFilters from './ActivityFilters'
import ActivityTimeline from './ActivityTimeline'
import { useActivityFilters } from './useActivityFilters'
import type { ActivityResponse } from './types'

export default function ActivityWorkspace() {
  const filters = useActivityFilters()
  const result = useApiQuery<ActivityResponse>(filters.path)
  const loading = result.loading || filters.searching
  function refresh() {
    filters.change('cursor', '')
    result.reload()
  }
  return (
    <>
      <PageHeader
        eyebrow="Platform oversight"
        title="Activity log"
        description="A shared timeline of recorded platform changes and the people who made them."
        actions={
          <button className="btn btn-secondary" onClick={refresh} disabled={loading}>
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />
      <ActivityFilters
        filters={filters.filters}
        error={filters.error}
        onChange={filters.change}
        onReset={filters.reset}
      />
      <section className="panel overflow-hidden" aria-label="Platform activity">
        <div className="border-b border-slate-100 px-5 py-4 text-xs leading-relaxed text-slate-500 sm:px-6">
          Read-only audit history. Names are shown as recorded at the time; older records may have
          no recorded administrator name. All times are PHT.
        </div>
        {!filters.error && <QueryState loading={loading} error={result.error} retry={refresh} />}
        {filters.error && (
          <p className="p-6 text-sm text-slate-500">Adjust the dates above to load activity.</p>
        )}
        {result.data && !loading && !filters.error && (
          <>
            {result.data.data.length ? (
              <ActivityTimeline entries={result.data.data} />
            ) : (
              <EmptyState
                title="No activity found"
                description="No recorded changes match these filters. Try a different date range, administrator, or action."
                onReset={filters.reset}
              />
            )}
            <nav
              aria-label="Activity pagination"
              className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs sm:px-6"
            >
              <span className="text-slate-500">
                {result.data.data.length} record{result.data.data.length === 1 ? '' : 's'} shown.
                Newest first.
              </span>
              <div className="flex gap-2">
                <button
                  className="btn btn-secondary"
                  disabled={!result.data.meta.prev_cursor}
                  onClick={() => filters.change('cursor', result.data!.meta.prev_cursor!)}
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={!result.data.meta.next_cursor}
                  onClick={() => filters.change('cursor', result.data!.meta.next_cursor!)}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </nav>
          </>
        )}
      </section>
    </>
  )
}
