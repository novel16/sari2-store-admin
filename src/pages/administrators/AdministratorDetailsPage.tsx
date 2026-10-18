import { useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { administratorsPath } from '../../administrators/api'
import AdministratorHistory from '../../administrators/AdministratorHistory'
import AdministratorStatusManagement from '../../administrators/AdministratorStatusManagement'
import type { Administrator } from '../../administrators/types'
import DetailsGrid from '../../components/DetailsGrid'
import PageHeader from '../../components/PageHeader'
import QueryState from '../../components/QueryState'
import StatusBadge from '../../components/StatusBadge'
import { useApiQuery } from '../../hooks/useApiQuery'
import { recordId } from '../../platform/directory'
import { dateTime, number } from '../../platform/format'

export default function AdministratorDetailsPage() {
  const { administratorId } = useParams(),
    id = recordId(administratorId),
    { user } = useAuth()
  const result = useApiQuery<{ data: Administrator; meta: { active_administrators: number } }>(
    id ? `${administratorsPath}/${id}` : null,
  )
  const administrator = result.data?.data
  const [revision, setRevision] = useState(0),
    [message, setMessage] = useState('')
  return (
    <>
      <Link
        className="mb-6 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-brand"
        to="/administrators"
      >
        <ArrowLeft size={14} />
        All administrators
      </Link>
      <PageHeader
        eyebrow={administrator ? `Administrator #${administrator.id}` : 'Platform access'}
        title={administrator?.name ?? 'Administrator details'}
        description="Independent platform identity, availability, and audit history."
        actions={
          <button
            className="btn btn-secondary"
            onClick={result.reload}
            disabled={!id || result.loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />
      {message && (
        <p role="status" className="mb-5 rounded-xl bg-brand/5 p-4 text-sm text-brand">
          {message}
        </p>
      )}
      {!id ? (
        <p role="alert" className="panel p-6 text-sm text-slate-500">
          This administrator was not found.
        </p>
      ) : (
        <QueryState loading={result.loading} error={result.error} retry={result.reload} />
      )}
      {administrator && (
        <>
          <section className="panel mb-8 p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold">Administrator information</h2>
              <StatusBadge status={administrator.status} />
            </div>
            <DetailsGrid
              items={[
                { label: 'Full name', value: administrator.name },
                { label: 'Sign-in email', value: administrator.email },
                { label: 'Created', value: dateTime(administrator.created_at) },
                { label: 'Last updated', value: dateTime(administrator.updated_at) },
                {
                  label: 'Active administrators',
                  value: number(result.data!.meta.active_administrators),
                },
              ]}
            />
            {administrator.id === user?.id && (
              <Link className="text-link mt-5 inline-block text-xs" to="/settings">
                Edit my profile and password
              </Link>
            )}
          </section>
          <AdministratorStatusManagement
            key={`${user?.id}:${administrator.id}`}
            administrator={administrator}
            activeCount={result.data!.meta.active_administrators}
            onSaved={() => {
              setMessage('Administrator access updated.')
              setRevision((value) => value + 1)
              result.reload()
            }}
          />
          <AdministratorHistory
            key={`${user?.id}:${administrator.id}:${revision}`}
            id={administrator.id}
          />
        </>
      )}
    </>
  )
}
