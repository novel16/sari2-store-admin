import { ArrowLeft, ArrowUpRight, RefreshCw } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import QueryState from '../../components/QueryState'
import DetailsGrid from '../../components/DetailsGrid'
import StatusBadge from '../../components/StatusBadge'
import { useApiQuery } from '../../hooks/useApiQuery'
import { recordId } from '../../platform/directory'
import { dateTime } from '../../platform/format'
import type { StoreRecord } from '../../platform/types'

export default function StoreDetailsPage() {
  const { storeId } = useParams(),
    id = recordId(storeId),
    result = useApiQuery<{ data: StoreRecord }>(id ? `/api/v1/admin/stores/${id}` : null),
    store = result.data?.data
  return (
    <>
      <Link
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-brand"
        to="/stores"
      >
        <ArrowLeft size={14} />
        All stores
      </Link>
      <PageHeader
        eyebrow={store ? `Store #${store.id}` : 'Platform directory'}
        title={store?.name ?? 'Store details'}
        description="The registered store profile and its parent account."
        actions={
          <button
            className="btn btn-secondary"
            disabled={!id || result.loading}
            onClick={result.reload}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />
      {!id ? (
        <p role="alert" className="panel p-6 text-sm text-slate-500">
          This store was not found.
        </p>
      ) : (
        <QueryState loading={result.loading} error={result.error} retry={result.reload} />
      )}
      {store && (
        <>
          <section className="panel mb-8 p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold">Store information</h2>
              <StatusBadge status={store.status} />
            </div>
            <DetailsGrid
              items={[
                { label: 'Store name', value: store.name },
                { label: 'Store ID', value: `#${store.id}` },
                { label: 'Phone number', value: store.phone || 'Not provided' },
                { label: 'Address', value: store.address || 'Not provided' },
                { label: 'Store slug', value: store.slug },
                { label: 'Registered', value: dateTime(store.created_at) },
                { label: 'Last updated', value: dateTime(store.updated_at) },
              ]}
            />
          </section>
          <section className="panel p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold">Account & owner</h2>
              <Link
                className="text-link flex items-center gap-1 text-xs"
                to={`/accounts/${store.account.id}`}
              >
                View account
                <ArrowUpRight size={14} />
              </Link>
            </div>
            <DetailsGrid
              items={[
                { label: 'Account', value: store.account.name },
                { label: 'Account status', value: <StatusBadge status={store.account.status} /> },
                { label: 'Owner', value: store.account.owner.name },
                { label: 'Owner email', value: store.account.owner.email },
                {
                  label: 'Owner status',
                  value: <StatusBadge status={store.account.owner.status} />,
                },
              ]}
            />
            <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
              Store, account, and owner status are shown separately. Parent account and owner
              restrictions also apply to workspace access.
            </p>
          </section>
        </>
      )}
    </>
  )
}
