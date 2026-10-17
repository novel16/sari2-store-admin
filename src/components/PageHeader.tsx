import type { ReactNode } from 'react'
export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="break-words font-display text-[28px] font-bold leading-tight tracking-[-1px] sm:text-[32px]">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
