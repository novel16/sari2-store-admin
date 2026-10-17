import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import { number, shortDate } from '../../platform/format'
import type { AccountRecord } from '../../platform/types'
export default function AccountsTable({ accounts }: { accounts: AccountRecord[] }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Owner</th>
            <th>Stores</th>
            <th>Status</th>
            <th>Registered</th>
            <th>
              <span className="sr-only">View account</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td>
                <Link className="text-link" to={`/accounts/${account.id}`}>
                  {account.name}
                </Link>
                <p className="mt-1 text-[10px] text-slate-400">Account #{account.id}</p>
              </td>
              <td>
                <span className="font-medium">{account.owner.name}</span>
                <span className="mt-1 block text-[11px] text-slate-400">{account.owner.email}</span>
              </td>
              <td>{number(account.stores_count)}</td>
              <td>
                <StatusBadge status={account.status} />
              </td>
              <td className="whitespace-nowrap text-slate-500">{shortDate(account.created_at)}</td>
              <td>
                <Link
                  className="icon-button"
                  to={`/accounts/${account.id}`}
                  aria-label={`View ${account.name}`}
                >
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
