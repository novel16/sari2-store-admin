import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { ApiError, toApiError } from '../../api/errors'
import { useAuth } from '../../auth/useAuth'
import { planMoney, priceCentavos } from '../../plans/format'
import { previewSubscription } from '../../subscriptions/api'
import { loadConfirmation } from '../../subscriptions/recovery'
import type {
  PreviewInput,
  SubscriptionOverview,
  SubscriptionReview,
} from '../../subscriptions/types'
import SubscriptionReviewDialog from './SubscriptionReviewDialog'

export default function SubscriptionForm({
  data,
  onSaved,
}: {
  data: SubscriptionOverview
  onSaved: () => void
}) {
  const { user, refresh } = useAuth(),
    [method, setMethod] = useState<PreviewInput['settlement_method']>('manual_payment'),
    [months, setMonths] = useState(1),
    [pending, setPending] = useState(false),
    [error, setError] = useState<ApiError>(),
    [review, setReview] = useState<SubscriptionReview | undefined>(
      () => loadConfirmation(user?.id ?? 0, data.account.id)?.review,
    ),
    busy = useRef(false),
    plan = data.available_plan,
    total = (plan?.monthly_price_centavos ?? 0) * months
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!plan || busy.current) return
    const form = new FormData(event.currentTarget),
      amount = method === 'complimentary' ? 0 : priceCentavos(String(form.get('amount') ?? ''))
    if (amount === null) {
      setError(new ApiError('Enter a valid payment amount with up to two decimal places.', 422))
      return
    }
    busy.current = true
    setPending(true)
    setError(undefined)
    try {
      const input: PreviewInput = {
        plan_id: plan.id,
        months,
        settlement_method: method,
        amount_centavos: amount,
        reason: String(form.get('reason') ?? '').trim(),
        ...(method === 'manual_payment'
          ? {
              payment_reference: String(form.get('payment_reference') ?? '').trim(),
              payment_verified: form.get('payment_verified') === 'on',
            }
          : {}),
      }
      setReview((await previewSubscription(data.account.id, input)).data)
    } catch (failure) {
      const next = toApiError(failure)
      setError(next)
      if (next.status === 401 || next.status === 403) void refresh()
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  const dialog = review && (
    <SubscriptionReviewDialog
      accountId={data.account.id}
      review={review}
      onClose={() => setReview(undefined)}
      onSaved={onSaved}
    />
  )
  if (!plan)
    return (
      <>
        <section className="panel p-6 text-sm text-slate-500">
          Publish Basic in Plans before activating subscriptions. Plus and Pro remain unavailable.
        </section>
        {dialog}
      </>
    )
  return (
    <>
      <form
        className="panel p-5 sm:p-7"
        onSubmit={(event) => void submit(event)}
        aria-busy={pending}
      >
        <h2 className="font-display text-lg font-bold">Activate or renew Basic</h2>
        <p className="mb-6 mt-2 text-xs leading-relaxed text-slate-500">
          New periods use the published offer. Renewals start after the last scheduled paid period.
          Review the exact dates before confirming.
        </p>
        <fieldset
          disabled={pending || Boolean(review) || data.account.status !== 'active'}
          className="grid min-w-0 gap-5"
        >
          <div className="rounded-xl bg-brand/5 p-4 text-sm">
            <strong>
              {plan.name} · {planMoney(plan.monthly_price_centavos)}/month
            </strong>
            <p className="mt-1 text-xs text-slate-500">
              Version {plan.version} ·{' '}
              {plan.active_product_limit?.toLocaleString('en-PH') ?? 'Unlimited'} active products ·
              1 store · owner only
            </p>
          </div>
          <label className="field">
            Months
            <select
              className="input"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'month' : 'months'}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Settlement
            <select
              className="input"
              value={method}
              onChange={(e) => setMethod(e.target.value as PreviewInput['settlement_method'])}
            >
              <option value="manual_payment">Verified manual payment</option>
              <option value="complimentary">Complimentary grant</option>
            </select>
          </label>
          <p className="flex justify-between gap-3 text-sm">
            <span>Plan total</span>
            <strong>{planMoney(total)}</strong>
          </p>
          {method === 'manual_payment' ? (
            <>
              <label className="field">
                Amount received (₱)
                <input
                  className="input"
                  name="amount"
                  key={`amount:${total}`}
                  defaultValue={(total / 100).toFixed(2)}
                  inputMode="decimal"
                  required
                />
                <span className="text-[11px] font-normal text-slate-400">
                  Must exactly match the total. Verify the payment outside this app first.
                </span>
              </label>
              <label className="field">
                Unique payment reference
                <input
                  className="input"
                  name="payment_reference"
                  maxLength={100}
                  required
                  placeholder="e.g. receipt-2026-001"
                  autoComplete="off"
                />
                <span className="text-[11px] font-normal text-slate-400">
                  Letters, numbers, dots, hyphens, underscores, colons, and slashes.
                </span>
              </label>
              <label className="flex items-start gap-3 text-xs leading-relaxed text-slate-600">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0"
                  name="payment_verified"
                  required
                />
                I verified this payment and its reference. Recording it here does not collect money.
              </label>
            </>
          ) : (
            <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
              No money is recorded for this grant. Add a clear reason for the complimentary period.
            </p>
          )}
          <label className="field">
            {method === 'complimentary' ? 'Grant reason' : 'Verification note'}
            <textarea
              className="input min-h-24"
              name="reason"
              required
              minLength={5}
              maxLength={500}
              placeholder={
                method === 'complimentary'
                  ? 'e.g. One month launch promotion'
                  : 'e.g. Cash receipt verified in person'
              }
            />
          </label>
          <button className="btn btn-primary" type="submit">
            {pending ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <ArrowRight size={15} />
            )}{' '}
            Review subscription
          </button>
        </fieldset>
        {data.account.status !== 'active' && (
          <p role="alert" className="mt-4 text-xs text-amber-800">
            This account must be active before adding a paid period.
          </p>
        )}
        {error && (
          <div role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-xs text-red-700">
            <p>{error.message}</p>
            {Object.values(error.fields)
              .flat()
              .map((message, i) => (
                <p className="mt-2" key={i}>
                  {message}
                </p>
              ))}
          </div>
        )}
      </form>
      {dialog}
    </>
  )
}
