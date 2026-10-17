import { RefreshCw } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DirectoryFilters from '../../components/DirectoryFilters'
import QueryState from '../../components/QueryState'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useDirectoryParams } from '../../platform/useDirectoryParams'
import type { AccountRecord, PageResponse } from '../../platform/types'
import AccountsTable from './AccountsTable'

export default function AccountsPage() {
  const filters = useDirectoryParams(),
    result = useApiQuery<PageResponse<AccountRecord>>(`/api/v1/admin/accounts?${filters.query}`),
    loading = result.loading || filters.searching
  return (
    <>
      <PageHeader
        eyebrow="Platform directory"
        title="Accounts"
        description="The store owners and organizations registered on your platform."
        actions={
          <button className="btn btn-secondary" disabled={loading} onClick={result.reload}>
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />
      <section className="panel overflow-hidden">
        <DirectoryFilters
          search={filters.search}
          status={filters.status}
          placeholder="Search account, owner name or email…"
          onSearch={(value) => filters.change('q', value)}
          onStatus={(value) => filters.change('status', value)}
        />
        <QueryState loading={loading} error={result.error} retry={result.reload} />
        {result.data && !loading && (
          <>
            {result.data.data.length ? (
              <AccountsTable accounts={result.data.data} />
            ) : (
              <EmptyState
                title="No accounts found"
                description="Newly registered accounts will appear here. Try changing your search or status filter."
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
