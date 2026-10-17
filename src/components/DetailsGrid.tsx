import type { ReactNode } from 'react'
export default function DetailsGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="eyebrow mb-2">{item.label}</dt>
          <dd className="break-words text-sm leading-relaxed text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
