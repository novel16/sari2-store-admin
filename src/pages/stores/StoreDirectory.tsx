import { Link } from 'react-router-dom'
import DirectoryFilters from '../../components/DirectoryFilters'
import QueryState from '../../components/QueryState'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useDirectoryParams } from '../../platform/useDirectoryParams'
import type { StoreRecord, PageResponse } from '../../platform/types'
import StoresTable from './StoresTable'

export default function StoreDirectory({ accountId }: { accountId?: number }) {
  const filters = useDirectoryParams(accountId),
    result = useApiQuery<PageResponse<StoreRecord>>(`/api/v1/admin/stores?${filters.query}`),
    loading = result.loading || filters.searching
  return (
    <section className="panel overflow-hidden">
      {filters.accountId && !accountId && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-brand/5 px-5 py-3 text-xs text-brand">
          <span>
            Stores for{' '}
            <Link className="font-semibold underline" to={`/accounts/${filters.accountId}`}>
              account #{filters.accountId}
            </Link>
          </span>
          <button
            className="font-semibold underline"
            onClick={() => filters.change('account_id', '')}
          >
            Show all accounts
          </button>
        </div>
      )}
      <DirectoryFilters
        search={filters.search}
        status={filters.status}
        placeholder="Search store, account or owner…"
        onSearch={(value) => filters.change('q', value)}
        onStatus={(value) => filters.change('status', value)}
      />
      <QueryState loading={loading} error={result.error} retry={result.reload} />
      {result.data && !loading && (
        <>
          {result.data.data.length ? (
            <StoresTable stores={result.data.data} />
          ) : (
            <EmptyState
              title="No stores found"
              description="Stores will appear here when their owners register. Try another search or status."
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
  )
}
