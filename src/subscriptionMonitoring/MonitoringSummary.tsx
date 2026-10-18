import { CalendarClock, CheckCircle2, Clock3, Layers, Leaf } from 'lucide-react'
import { number } from '../platform/format'
import type { MonitoringResponse, SubscriptionFilter } from './types'

const cards = [
  {
    key: 'active_basic',
    label: 'Active Basic',
    icon: CheckCircle2,
    color: 'bg-emerald-50 text-emerald-700',
  },
  {
    key: 'expiring',
    label: 'Expiring soon',
    icon: CalendarClock,
    color: 'bg-amber-50 text-amber-700',
  },
  { key: 'expired_paid', label: 'Expired paid', icon: Clock3, color: 'bg-rose-50 text-rose-700' },
  { key: 'free', label: 'Free', icon: Leaf, color: 'bg-slate-100 text-slate-600' },
  { key: 'other_paid', label: 'Other paid', icon: Layers, color: 'bg-indigo-50 text-indigo-700' },
] as const

export default function MonitoringSummary({
  summary,
  selected,
  expiryDays,
  onSelect,
}: {
  summary: MonitoringResponse['summary']
  selected: SubscriptionFilter
  expiryDays: string
  onSelect: (status: SubscriptionFilter) => void
}) {
  const visible = cards.filter((card) => card.key !== 'other_paid' || summary.other_paid > 0)
  return (
    <section aria-label="Subscription summary" className="mb-6">
      <div
        className={`grid gap-4 sm:grid-cols-2 ${visible.length === 5 ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}
      >
        {visible.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            className={`panel p-5 text-left transition hover:border-brand/40 ${selected === key ? '!border-brand ring-1 ring-brand/15' : ''}`}
            aria-pressed={selected === key}
            onClick={() => onSelect(key)}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">{label}</span>
              <span className={`grid size-9 place-items-center rounded-xl ${color}`}>
                <Icon size={18} />
              </span>
            </span>
            <strong className="mt-2 block font-display text-[32px] font-bold tracking-tight">
              {number(summary[key])}
            </strong>
            <span className="mt-2 block text-[10px] text-slate-400">
              {key === 'expiring'
                ? `Paid coverage ends within ${expiryDays} days`
                : key === 'expired_paid'
                  ? 'Paid coverage ended; now on Free'
                  : key === 'free'
                    ? 'No active or expired paid coverage'
                    : key === 'active_basic'
                      ? 'Includes Basic expiring soon'
                      : 'Other active paid plans'}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        {number(summary.total)} accounts match your search and account status. Summary totals ignore
        the subscription status filter. Expiring soon overlaps active paid plans.
      </p>
    </section>
  )
}
