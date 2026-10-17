import { SearchX } from 'lucide-react'
export default function EmptyState({
  title,
  description,
  onReset,
}: {
  title: string
  description: string
  onReset?: () => void
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-canvas text-slate-400">
        <SearchX size={25} />
      </span>
      <h3 className="font-display font-bold">{title}</h3>
      <p className="max-w-sm text-sm text-slate-500">{description}</p>
      {onReset && (
        <button className="btn btn-secondary mt-2" onClick={onReset}>
          Reset filters
        </button>
      )}
    </div>
  )
}
