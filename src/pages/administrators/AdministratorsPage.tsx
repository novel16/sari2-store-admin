import { Link } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import DirectoryFilters from '../../components/DirectoryFilters'
import EmptyState from '../../components/EmptyState'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import QueryState from '../../components/QueryState'
import StatusBadge from '../../components/StatusBadge'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useDirectoryParams } from '../../platform/useDirectoryParams'
import { dateTime, number } from '../../platform/format'
import { administratorsPath } from '../../administrators/api'
import type { AdministratorDirectory } from '../../administrators/types'

export default function AdministratorsPage() {
  const filters = useDirectoryParams()
  const query = new URLSearchParams(filters.query)
  query.delete('account_id')
  const result = useApiQuery<AdministratorDirectory>(`${administratorsPath}?${query}`)
  const loading = result.loading || filters.searching
  return (
    <>
      <PageHeader
        eyebrow="Platform access"
        title="Administrators"
        description="Independent platform accounts and their access history."
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary" onClick={result.reload} disabled={loading}>
              <RefreshCw size={15} />
              Refresh
            </button>
            <Link className="btn btn-primary" to="/administrators/new">
              <Plus size={15} />
              Create administrator
            </Link>
          </div>
        }
      />
      <section className="panel overflow-hidden">
        <DirectoryFilters
          search={filters.search}
          status={filters.status}
          placeholder="Search administrator name or email..."
          onSearch={(value) => filters.change('q', value)}
          onStatus={(value) => filters.change('status', value)}
        />
        <QueryState loading={loading} error={result.error} retry={result.reload} />
        {result.data && !loading && (
          <>
            <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              {number(result.data.meta.active_administrators)} active platform administrators
            </p>
            {result.data.data.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">Administrator</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 font-medium">Created (PHT)</th>
                      <th className="px-5 py-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.data.data.map((administrator) => (
                      <tr key={administrator.id}>
                        <td className="px-5 py-4">
                          <strong className="block font-semibold">{administrator.name}</strong>
                          <span className="mt-1 block text-slate-500">{administrator.email}</span>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={administrator.status} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {dateTime(administrator.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            className="text-link"
                            to={`/administrators/${administrator.id}`}
                            aria-label={`View ${administrator.name}`}
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No administrators found"
                description="Try changing your search or status filter."
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
