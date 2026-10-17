import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PageMeta } from '../platform/types'
import { number } from '../platform/format'
export default function Pagination({
  meta,
  onPage,
}: {
  meta: PageMeta
  onPage: (page: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
      <p className="text-xs text-slate-500">
        {meta.total
          ? `${number(meta.from ?? 0)}–${number(meta.to ?? 0)} of ${number(meta.total)} records`
          : '0 records'}
      </p>
      <div className="flex items-center gap-2">
        <button
          className="icon-button border border-slate-200"
          aria-label="Previous page"
          disabled={meta.current_page <= 1}
          onClick={() => onPage(meta.current_page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs text-slate-500">
          Page {meta.current_page} of {meta.last_page}
        </span>
        <button
          className="icon-button border border-slate-200"
          aria-label="Next page"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPage(meta.current_page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
