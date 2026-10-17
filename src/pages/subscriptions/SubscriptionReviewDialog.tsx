import { useRef, useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { ApiError, toApiError } from '../../api/errors'
import { useAuth } from '../../auth/useAuth'
import ReviewDialog from '../../components/ReviewDialog'
import DetailsGrid from '../../components/DetailsGrid'
import { planMoney } from '../../plans/format'
import { dateTime } from '../../platform/format'
import { confirmSubscription } from '../../subscriptions/api'
import { clearConfirmation, loadConfirmation, saveConfirmation } from '../../subscriptions/recovery'
import type { SubscriptionReview } from '../../subscriptions/types'

export default function SubscriptionReviewDialog({
  accountId,
  review,
  onClose,
  onSaved,
}: {
  accountId: number
  review: SubscriptionReview
  onClose: () => void
  onSaved: () => void
}) {
  const { user, refresh } = useAuth(),
    recovery = loadConfirmation(user?.id ?? 0, accountId),
    recovered = recovery?.review.quote === review.quote,
    [pending, setPending] = useState(false),
    [uncertain, setUncertain] = useState(recovered),
    [error, setError] = useState<ApiError>(),
    [saved, setSaved] = useState(false),
    key = useRef(recovered ? recovery.requestKey : crypto.randomUUID()),
    busy = useRef(false),
    { proposal, settlement } = review,
    close = saved ? onSaved : onClose
  async function confirm() {
    if (busy.current || saved) return
    busy.current = true
    setPending(true)
    setError(undefined)
    try {
      // Persist before sending so refresh/navigation cannot generate a second grant request.
      if (!saveConfirmation(user?.id ?? 0, accountId, { review, requestKey: key.current })) {
        setError(
          new ApiError(
            'The pending confirmation could not be saved in this tab. Enable browser session storage and retry. If another confirmation is pending, refresh to recover it first.',
          ),
        )
        return
      }
      await confirmSubscription(accountId, review.quote, key.current)
      clearConfirmation(user?.id ?? 0, accountId, key.current)
      setUncertain(false)
      setSaved(true)
    } catch (failure) {
      const next = toApiError(failure)
      setError(next)
      const unresolved =
        !next.status || next.status >= 500 || (uncertain && ![409, 422].includes(next.status))
      setUncertain(unresolved)
      if (!unresolved) clearConfirmation(user?.id ?? 0, accountId, key.current)
      if (next.status === 401 || next.status === 403) void refresh()
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  const stale = error?.status === 409 || error?.status === 422
  return (
    <ReviewDialog
      title={saved ? 'Subscription saved' : 'Review subscription'}
      onClose={close}
      dismissible={!pending && !uncertain}
    >
      {saved && (
        <p
          role="status"
          className="mb-5 flex items-start gap-2 rounded-xl bg-brand/5 p-4 text-sm text-brand"
        >
          <Check size={18} className="shrink-0" />
          {proposal.action === 'renew' ? 'The renewal is scheduled.' : 'Basic is now active.'} The
          record is saved in this account’s history.
        </p>
      )}
      <DetailsGrid
        items={[
          { label: 'Account', value: `${proposal.account_name} (#${proposal.account_id})` },
          { label: 'Plan', value: `${proposal.terms.name} · version ${proposal.plan_version}` },
          { label: 'Monthly price', value: planMoney(proposal.terms.monthly_price_centavos) },
          { label: 'Duration', value: `${proposal.months} month(s)` },
          { label: 'Starts (PHT)', value: dateTime(proposal.starts_at) },
          { label: 'Ends (PHT)', value: dateTime(proposal.ends_at) },
          {
            label: 'Active products',
            value: proposal.terms.active_product_limit?.toLocaleString('en-PH') ?? 'Unlimited',
          },
          {
            label: 'Settlement',
            value:
              settlement.settlement_method === 'complimentary'
                ? 'Complimentary grant'
                : 'Verified manual payment',
          },
          { label: 'Plan total', value: planMoney(proposal.total_centavos) },
          { label: 'Recorded payment', value: planMoney(settlement.amount_centavos) },
          { label: 'Reference', value: settlement.payment_reference ?? 'No payment required' },
          { label: 'Reason', value: settlement.reason },
        ]}
      />
      {!saved && (
        <p className="mt-5 text-xs leading-relaxed text-slate-500">
          This review expires at {dateTime(review.expires_at)}. Prices and allowances are saved for
          this period. There are no automatic charges.
        </p>
      )}
      {uncertain && !error && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-800"
        >
          An earlier confirmation is awaiting verification. Retry the saved request to check its
          result before starting another period.
        </p>
      )}
      {error && (
        <div role="alert" className="mt-4 rounded-xl bg-amber-50 p-4 text-xs text-amber-800">
          <p>{error.message}</p>
          {Object.values(error.fields)
            .flat()
            .map((message, i) => (
              <p className="mt-2" key={i}>
                {message}
              </p>
            ))}
          {uncertain && (
            <p className="mt-2">
              The result could not be confirmed. Retry this confirmation to check the same request
              safely.
            </p>
          )}
        </div>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        {saved ? (
          <button className="btn btn-primary" onClick={onSaved}>
            Done
          </button>
        ) : (
          <>
            <button
              className="btn btn-secondary"
              disabled={pending || uncertain}
              onClick={stale ? onSaved : onClose}
            >
              {stale ? 'Refresh details' : 'Back'}
            </button>
            <button
              className="btn btn-primary"
              disabled={pending || stale}
              onClick={() => void confirm()}
            >
              {pending ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
              {uncertain ? 'Retry confirmation' : 'Confirm subscription'}
            </button>
          </>
        )}
      </div>
    </ReviewDialog>
  )
}
