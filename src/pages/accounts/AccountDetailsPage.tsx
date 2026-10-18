import { ArrowLeft, ArrowUpRight, RefreshCw } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import QueryState from '../../components/QueryState'
import DetailsGrid from '../../components/DetailsGrid'
import StatusBadge from '../../components/StatusBadge'
import { useApiQuery } from '../../hooks/useApiQuery'
import { recordId } from '../../platform/directory'
import { dateTime, number } from '../../platform/format'
import type { AccountRecord } from '../../platform/types'
import StoreDirectory from '../stores/StoreDirectory'
import StatusWorkspace from '../../statusManagement/StatusWorkspace'

export default function AccountDetailsPage() {
  const { accountId } = useParams(),
    id = recordId(accountId),
    result = useApiQuery<{ data: AccountRecord }>(id ? `/api/v1/admin/accounts/${id}` : null),
    account = result.data?.data
  return (
    <>
      <Link
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-brand"
        to="/accounts"
      >
        <ArrowLeft size={14} />
        All accounts
      </Link>
      <PageHeader
        eyebrow={account ? `Account #${account.id}` : 'Platform directory'}
        title={account?.name ?? 'Account details'}
        description="Account registration and ownership information."
        actions={
          <div className="flex flex-wrap gap-2">
            {account && (
              <Link className="btn btn-primary" to={`/accounts/${account.id}/subscription`}>
                Manage subscription
              </Link>
            )}
            <button
              className="btn btn-secondary"
              disabled={!id || result.loading}
              onClick={result.reload}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        }
      />
      {!id ? (
        <p role="alert" className="panel p-6 text-sm text-slate-500">
          This account was not found.
        </p>
      ) : (
        <QueryState loading={result.loading} error={result.error} retry={result.reload} />
      )}
      {account && (
        <>
          <section className="panel mb-8 p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold">Account information</h2>
              <StatusBadge status={account.status} />
            </div>
            <DetailsGrid
              items={[
                { label: 'Account name', value: account.name },
                { label: 'Account ID', value: `#${account.id}` },
                { label: 'Store count', value: number(account.stores_count) },
                { label: 'Account members', value: number(account.members_count) },
                { label: 'Registered', value: dateTime(account.created_at) },
                { label: 'Last updated', value: dateTime(account.updated_at) },
              ]}
            />
          </section>
          <section className="panel mb-8 p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold">Account owner</h2>
              <StatusBadge status={account.owner.status} />
            </div>
            <DetailsGrid
              items={[
                { label: 'Full name', value: account.owner.name },
                { label: 'Sign-in email', value: account.owner.email },
              ]}
            />
          </section>
          <StatusWorkspace
            target={{
              type: 'account',
              id: account.id,
              accountId: account.id,
              name: account.name,
              status: account.status,
              ownerStatus: account.owner.status,
            }}
            onSaved={result.reload}
          />
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Stores in this account</h2>
            <Link
              className="text-link flex items-center gap-1 text-xs"
              to={`/stores?account_id=${account.id}`}
            >
              Open store directory
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <StoreDirectory key={account.id} accountId={account.id} />
        </>
      )}
    </>
  )
}
