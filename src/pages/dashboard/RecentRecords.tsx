import { ArrowRight, Building2, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import type { Overview } from '../../platform/types'
import { shortDate } from '../../platform/format'

export default function RecentRecords({
  recent_accounts,
  recent_stores,
}: Pick<Overview, 'recent_accounts' | 'recent_stores'>) {
  const sections = [
    {
      title: 'Recent accounts',
      path: '/accounts',
      icon: Building2,
      records: recent_accounts.map((account) => ({ ...account, description: account.owner.name })),
    },
    {
      title: 'Recent stores',
      path: '/stores',
      icon: Store,
      records: recent_stores.map((store) => ({ ...store, description: store.account.name })),
    },
  ]
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      {sections.map(({ title, path, icon: Icon, records }) => (
        <section key={path} className="panel overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
            <h2 className="font-display text-sm font-bold">{title}</h2>
            <Link to={path} className="text-link inline-flex min-h-10 items-center gap-2 text-xs">
              View all
              <ArrowRight size={14} />
            </Link>
          </div>
          {records.length ? (
            <ul className="divide-y divide-slate-100">
              {records.map((record) => (
                <li key={record.id}>
                  <Link
                    to={`${path}/${record.id}`}
                    className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f4f1] text-brand">
                      <Icon size={17} strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{record.name}</p>
                      <p className="mt-1 truncate text-[11px] text-slate-400">
                        {record.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <StatusBadge status={record.status} />
                      <span className="text-[10px] text-slate-400">
                        {shortDate(record.created_at)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-12 text-center text-xs text-slate-400">
              Registered {path.slice(1)} will appear here.
            </p>
          )}
        </section>
      ))}
    </div>
  )
}
