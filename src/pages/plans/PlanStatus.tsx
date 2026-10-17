import { statusLabel } from '../../plans/format'
import type { CatalogStatus } from '../../plans/types'
export default function PlanStatus({ status }: { status: CatalogStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${status === 'published' ? 'bg-emerald-50 text-emerald-700' : status === 'coming_soon' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
    >
      {statusLabel(status)}
    </span>
  )
}
