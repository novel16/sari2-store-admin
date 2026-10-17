import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import { shortDate } from '../../platform/format'
import type { StoreRecord } from '../../platform/types'
export default function StoresTable({ stores }: { stores: StoreRecord[] }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Store</th>
            <th>Account</th>
            <th>Owner</th>
            <th>Store status</th>
            <th>Registered</th>
            <th>
              <span className="sr-only">View store</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => (
            <tr key={store.id}>
              <td>
                <Link className="text-link" to={`/stores/${store.id}`}>
                  {store.name}
                </Link>
                <p className="mt-1 text-[10px] text-slate-400">Store #{store.id}</p>
              </td>
              <td>
                <Link
                  className="font-medium text-slate-600 hover:underline"
                  to={`/accounts/${store.account.id}`}
                >
                  {store.account.name}
                </Link>
              </td>
              <td>
                <span className="font-medium">{store.account.owner.name}</span>
                <span className="mt-1 block text-[11px] text-slate-400">
                  {store.account.owner.email}
                </span>
              </td>
              <td>
                <StatusBadge status={store.status} />
              </td>
              <td className="whitespace-nowrap text-slate-500">{shortDate(store.created_at)}</td>
              <td>
                <Link
                  className="icon-button"
                  to={`/stores/${store.id}`}
                  aria-label={`View ${store.name}`}
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
