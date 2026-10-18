import { ArrowUpRight, History } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dateTime } from '../platform/format'
import { actions, modules, targetPath } from './filters'
import type { ActivityEntry } from './types'

export default function ActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  return (
    <ol className="divide-y divide-slate-100" aria-label="Activity entries">
      {entries.map((entry) => {
        const path = targetPath(entry.target)
        return (
          <li key={entry.id} className="flex gap-3 px-5 py-6 sm:gap-4 sm:px-6">
            <span className="mt-0.5 hidden size-10 shrink-0 place-items-center rounded-xl bg-brand/5 text-brand sm:grid">
              <History size={18} />
            </span>
            <article className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                    {modules[entry.module]}
                  </span>
                  <h3 className="text-sm font-semibold">{actions[entry.action]}</h3>
                </div>
                <time className="text-xs text-slate-500" dateTime={entry.occurred_at}>
                  {dateTime(entry.occurred_at)} PHT
                </time>
              </div>
              <p className="mt-3 break-words text-sm font-medium">{entry.target.name}</p>
              <p className="mt-2 break-words text-xs text-slate-500">
                By {entry.actor.name}
                {entry.actor.id !== null && !entry.actor.name_recorded && (
                  <span> (name not recorded)</span>
                )}
              </p>
              {(entry.changes.from_status || entry.changes.to_status) && (
                <p className="mt-3 text-xs text-slate-600">
                  Status: {entry.changes.from_status ?? 'None'}{' '}
                  <span aria-label="changed to">&rarr;</span> {entry.changes.to_status ?? 'None'}
                </p>
              )}
              {entry.reason && (
                <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                  <span className="font-semibold">Reason: </span>
                  {entry.reason}
                </p>
              )}
              {(entry.details.plan_name || entry.details.plan_version || entry.details.months) && (
                <p className="mt-3 text-xs text-slate-500">
                  {entry.details.plan_name && (
                    <span className="mr-3">Plan: {entry.details.plan_name}</span>
                  )}
                  {entry.details.plan_version !== undefined && (
                    <span className="mr-3">Version {entry.details.plan_version}</span>
                  )}
                  {entry.details.months !== undefined && (
                    <span>
                      {entry.details.months} month{entry.details.months === 1 ? '' : 's'}
                    </span>
                  )}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                {path && (
                  <Link className="text-link inline-flex items-center gap-1 text-xs" to={path}>
                    View{' '}
                    {entry.target.type === 'administrator'
                      ? 'administrator'
                      : entry.module === 'subscriptions'
                        ? 'subscription'
                        : entry.target.type}
                    <ArrowUpRight size={13} />
                  </Link>
                )}
                <span className="text-[10px] text-slate-400">Record {entry.id}</span>
              </div>
            </article>
          </li>
        )
      })}
    </ol>
  )
}
