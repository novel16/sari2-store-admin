import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'

export default function ContentListEditor({
  title,
  items,
  fields,
  onChange,
  disabled,
}: {
  title: string
  items: Record<string, string>[]
  fields: string[]
  onChange: (value: Record<string, string>[]) => void
  disabled: boolean
}) {
  function move(index: number, direction: number) {
    const next = [...items]
    ;[next[index], next[index + direction]] = [next[index + direction], next[index]]
    onChange(next)
  }
  return (
    <fieldset className="panel p-5 sm:p-6" disabled={disabled}>
      <legend className="sr-only">{title}</legend>
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-5 space-y-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">
                {title} {index + 1}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="icon-button border border-slate-200"
                  disabled={index === 0}
                  aria-label={`Move ${title} ${index + 1} up`}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className="icon-button border border-slate-200"
                  disabled={index === items.length - 1}
                  aria-label={`Move ${title} ${index + 1} down`}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  className="icon-button border border-slate-200"
                  disabled={items.length === 1}
                  aria-label={`Remove ${title} ${index + 1}`}
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {fields.map((field) => (
              <label key={field} className="mt-3 block text-xs font-medium capitalize">
                {field}
                <textarea
                  className="input mt-2 w-full"
                  rows={field === 'title' || field === 'question' ? 2 : 3}
                  maxLength={field === 'title' || field === 'question' ? 160 : 1200}
                  required
                  value={item[field]}
                  onChange={(event) =>
                    onChange(
                      items.map((current, i) =>
                        i === index ? { ...current, [field]: event.target.value } : current,
                      ),
                    )
                  }
                />
              </label>
            ))}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-secondary mt-4"
        disabled={items.length >= 12}
        onClick={() => onChange([...items, Object.fromEntries(fields.map((field) => [field, '']))])}
      >
        <Plus size={14} />
        Add {title.toLowerCase()}
      </button>
    </fieldset>
  )
}
