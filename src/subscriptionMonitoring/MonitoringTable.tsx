import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { dateTime, number } from '../platform/format'
import { subscriptionStatuses } from './filters'
import type { MonitoredSubscription } from './types'

export default function MonitoringTable({
  subscriptions,
}: {
  subscriptions: MonitoredSubscription[]
}) {
  return (
    <div className="table-wrap">
      <table className="data-table min-w-[1000px]">
        <thead>
          <tr>
            <th>Account / owner</th>
            <th>Current plan</th>
            <th>Paid coverage until (PHT)</th>
            <th>Scheduled renewal</th>
            <th>
              <span className="sr-only">Manage subscription</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((row) => (
            <tr key={row.account.id}>
              <td>
                <Link className="text-link" to={`/accounts/${row.account.id}`}>
                  {row.account.name}
                </Link>
                <p className="mt-1 text-[10px] text-slate-400">Account #{row.account.id}</p>
                <div className="mt-2">
                  <StatusBadge status={row.account.status} />
                </div>
                <p className="mt-3 font-medium">{row.owner.name}</p>
                <p className="mt-1 text-[11px] text-slate-400">{row.owner.email}</p>
                {row.owner.status !== 'active' && (
                  <p className="mt-1 text-[10px] text-amber-700">Owner {row.owner.status}</p>
                )}
              </td>
              <td>
                <strong className="font-semibold">{row.current.plan.name}</strong>
                <span
                  className={`mt-2 block w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${row.state === 'expired_paid' ? 'bg-rose-50 text-rose-700' : row.is_expiring ? 'bg-amber-50 text-amber-700' : row.is_paid ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                >
                  {subscriptionStatuses[row.state]}
                </span>
                {row.is_expiring && (
                  <p className="mt-2 text-[10px] font-medium text-amber-700">Expiring soon</p>
                )}
                {row.current.ends_at && (
                  <p className="mt-2 max-w-44 text-[10px] leading-relaxed text-slate-400">
                    Current period ends {dateTime(row.current.ends_at)}
                  </p>
                )}
              </td>
              <td>
                <p className="font-medium">
                  {row.is_paid
                    ? row.coverage_ends_at
                      ? dateTime(row.coverage_ends_at)
                      : 'No expiry recorded'
                    : 'No active paid coverage'}
                </p>
                {row.state === 'expired_paid' && row.last_paid_ended_at && (
                  <p className="mt-2 max-w-48 text-[10px] leading-relaxed text-slate-400">
                    Last paid period ended {dateTime(row.last_paid_ended_at)}
                  </p>
                )}
                {row.is_paid && (
                  <p className="mt-2 max-w-48 text-[10px] leading-relaxed text-slate-400">
                    Includes continuous prepaid renewal periods.
                  </p>
                )}
              </td>
              <td>
                {row.next_period ? (
                  <>
                    <p className="font-medium">{row.next_period.plan.name}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Starts {dateTime(row.next_period.starts_at)}
                    </p>
                    <p className="mt-2 text-[10px] text-slate-400">
                      {number(row.scheduled_periods)} scheduled period
                      {row.scheduled_periods === 1 ? '' : 's'}
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400">No renewal scheduled</p>
                )}
              </td>
              <td>
                <Link
                  className="btn btn-secondary whitespace-nowrap"
                  to={`/accounts/${row.account.id}/subscription`}
                  aria-label={`Manage subscription for ${row.account.name}`}
                >
                  Manage
                  <ArrowUpRight size={14} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
