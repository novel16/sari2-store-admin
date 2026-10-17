import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { LoaderCircle, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toApiError, ApiError } from '../../api/errors'
import { useAuth } from '../../auth/useAuth'
import { savePlan } from '../../plans/api'
import { priceCentavos } from '../../plans/format'
import type { Plan, PlanInput } from '../../plans/types'

export default function PlanForm({
  plan,
  onSaved,
}: {
  plan?: Plan
  onSaved: (plan: Plan) => void
}) {
  const [error, setError] = useState<ApiError>(),
    [pending, setPending] = useState(false),
    busy = useRef(false),
    { refresh } = useAuth()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current) return
    const form = new FormData(event.currentTarget),
      value = (name: string) => String(form.get(name) ?? '').trim()
    const price = priceCentavos(value('price'))
    if (price === null) {
      setError(
        new ApiError('Enter a valid monthly price with up to two decimal places.', 422, {
          monthly_price_centavos: ['Enter a price between ₱0.00 and ₱1,000,000.00.'],
        }),
      )
      return
    }
    const input: PlanInput = {
      code: value('code'),
      name: value('name'),
      description: value('description'),
      monthly_price_centavos: price,
      active_product_limit: value('active_product_limit')
        ? Number(value('active_product_limit'))
        : null,
      quota_scope: value('quota_scope') as PlanInput['quota_scope'],
      store_limit: Number(value('store_limit')),
      staff_limit: Number(value('staff_limit')),
      catalog_status: value('catalog_status') as PlanInput['catalog_status'],
      planned_features: value('planned_features')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      featured: form.get('featured') === 'on',
      sort_order: Number(value('sort_order')),
      change_note: value('change_note'),
      ...(plan ? { expected_version: plan.version } : {}),
    }
    busy.current = true
    setPending(true)
    setError(undefined)
    try {
      onSaved((await savePlan(input, plan?.id)).data)
    } catch (failure) {
      const next = toApiError(failure)
      setError(next)
      if (next.status === 401 || next.status === 403) void refresh()
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  const fieldError = (name: string) =>
    error?.fields[name]?.[0] && (
      <small className="text-xs text-red-700">{error.fields[name][0]}</small>
    )
  return (
    <form onSubmit={(event) => void submit(event)} className="panel p-5 sm:p-7" aria-busy={pending}>
      <h2 className="font-display text-lg font-bold">{plan ? 'Plan settings' : 'Create a plan'}</h2>
      <p className="mb-6 mt-2 text-xs leading-relaxed text-slate-500">
        {plan?.code === 'free'
          ? 'Free-plan allowance changes apply to Free accounts. Keep this plan published and priced at zero.'
          : 'Saving creates a new version. Existing paid subscribers keep the price and allowances they agreed to.'}
      </p>
      <fieldset disabled={pending} className="grid min-w-0 gap-5 sm:grid-cols-2">
        <label className="field">
          Plan name
          <input className="input" name="name" defaultValue={plan?.name} required maxLength={80} />
          {fieldError('name')}
        </label>
        <label className="field">
          Code
          <input
            className="input"
            name="code"
            defaultValue={plan?.code}
            readOnly={Boolean(plan)}
            required
            maxLength={40}
            pattern={'[a-z][a-z0-9_\\-]*'}
            placeholder="starter"
          />
          {fieldError('code')}
        </label>
        <label className="field sm:col-span-2">
          Description
          <textarea
            className="input min-h-24"
            name="description"
            defaultValue={plan?.description ?? ''}
            maxLength={500}
          />
          {fieldError('description')}
        </label>
        <label className="field">
          Monthly price (₱)
          <input
            className="input"
            name="price"
            inputMode="decimal"
            defaultValue={plan ? (plan.monthly_price_centavos / 100).toFixed(2) : ''}
            required
            placeholder="49.00"
          />
          {fieldError('monthly_price_centavos')}
        </label>
        <label className="field">
          Active product limit
          <input
            className="input"
            name="active_product_limit"
            type="number"
            min={1}
            max={1000000}
            step={1}
            defaultValue={plan?.active_product_limit ?? ''}
            placeholder="Leave blank for unlimited"
          />
          {fieldError('active_product_limit')}
        </label>
        <label className="field">
          Product allowance applies
          <select className="input" name="quota_scope" defaultValue={plan?.quota_scope ?? 'store'}>
            <option value="store">Per store</option>
            <option value="account">Shared across the account</option>
          </select>
          {fieldError('quota_scope')}
        </label>
        <label className="field">
          Catalog status
          <select
            className="input"
            name="catalog_status"
            defaultValue={plan?.catalog_status ?? 'draft'}
          >
            <option value="draft">Draft · hidden</option>
            <option value="published">Published</option>
            <option value="coming_soon">Coming soon</option>
            <option value="retired">Retired · hidden</option>
          </select>
          {fieldError('catalog_status')}
        </label>
        <label className="field">
          Store limit
          <input
            className="input"
            name="store_limit"
            type="number"
            min={1}
            max={100}
            step={1}
            defaultValue={plan?.store_limit ?? 1}
            required
          />
          {fieldError('store_limit')}
        </label>
        <label className="field">
          Staff allowance (owner excluded)
          <input
            className="input"
            name="staff_limit"
            type="number"
            min={0}
            max={1000}
            step={1}
            defaultValue={plan?.staff_limit ?? 0}
            required
          />
          {fieldError('staff_limit')}
        </label>
        <label className="field sm:col-span-2">
          Planned features · one per line
          <textarea
            className="input min-h-24"
            name="planned_features"
            defaultValue={plan?.planned_features.join('\n') ?? ''}
            placeholder="Staff activity tracking"
          />
          <small className="font-normal leading-relaxed text-slate-400">
            Staff, multiple stores, and planned features can only be listed as Coming soon or Draft
            until available.
          </small>
          {fieldError('planned_features')}
          {Object.entries(error?.fields ?? {})
            .filter(([key]) => key.startsWith('planned_features.'))
            .map(([key, values]) => (
              <small key={key} className="text-xs text-red-700">
                {values[0]}
              </small>
            ))}
        </label>
        <label className="field">
          Display order
          <input
            className="input"
            name="sort_order"
            type="number"
            min={0}
            max={10000}
            step={1}
            defaultValue={plan?.sort_order ?? 0}
            required
          />
          {fieldError('sort_order')}
        </label>
        <label className="flex min-h-11 items-center gap-3 self-end pb-3 text-xs text-slate-600">
          <input
            type="checkbox"
            className="size-4"
            name="featured"
            defaultChecked={plan?.featured ?? false}
          />
          Highlight this plan
        </label>
        <label className="field sm:col-span-2">
          Reason for this version
          <input
            className="input"
            name="change_note"
            required
            minLength={3}
            maxLength={255}
            placeholder="Explain the pricing or allowance change"
          />
          {fieldError('change_note')}
        </label>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-100 bg-red-50 p-4 text-xs text-red-700 sm:col-span-2"
          >
            {error.message}
            {error.status === 409 && ' Use Refresh above to load the current plan.'}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2">
          <Link className="btn btn-secondary" to="/plans">
            Back to plans
          </Link>
          <button type="submit" className="btn btn-primary">
            {pending ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}{' '}
            {pending ? 'Saving…' : plan ? 'Save new version' : 'Create plan'}
          </button>
        </div>
      </fieldset>
    </form>
  )
}
