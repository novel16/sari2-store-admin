import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { useStatusChange } from './useStatusChange'
import StatusReviewDialog from './StatusReviewDialog'
import type { StatusTarget } from './types'

export default function StatusManagement({
  target,
  onSaved,
}: {
  target: StatusTarget
  onSaved: () => void
}) {
  const operation = useStatusChange(target, onSaved)
  const [reason, setReason] = useState(() => operation.pending?.review.reason ?? '')
  const fieldId = useId()
  const nextStatus = target.status === 'active' ? 'suspended' : 'active'
  const parentBlocked =
    target.type === 'store' && nextStatus === 'active' && target.parentStatus !== 'active'
  const disabled =
    operation.working ||
    operation.blocked ||
    Boolean(operation.pending || operation.review) ||
    parentBlocked
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!disabled) await operation.preview(nextStatus, reason)
  }
  const restrictions = [
    ...(target.status !== 'active' ? [`This ${target.type} is suspended.`] : []),
    ...(target.type === 'store' && target.parentStatus !== 'active'
      ? ['The parent account is suspended.']
      : []),
    ...(target.ownerStatus !== 'active' ? ['The owner user is inactive.'] : []),
  ]
  return (
    <section className="panel mb-8 p-5 sm:p-7">
      <h2 className="font-display text-lg font-bold">Manage availability</h2>
      <p
        className={`mt-3 rounded-xl p-3 text-xs leading-relaxed ${restrictions.length ? 'bg-amber-50 text-amber-900' : 'bg-brand/5 text-brand'}`}
      >
        <strong>
          {restrictions.length
            ? 'Workspace unavailable. '
            : target.type === 'account'
              ? 'Account restriction lifted. '
              : 'Store and account restrictions lifted. '}
        </strong>
        {restrictions.join(' ')}
        {target.type === 'account'
          ? ' Individual store and owner restrictions still apply.'
          : ' Workspace access also requires active store membership.'}
      </p>
      <p className="mb-5 mt-3 text-xs leading-relaxed text-slate-500">
        {target.type === 'account'
          ? 'Account suspension blocks every store in the account. Reactivation preserves each store status.'
          : 'Store suspension applies only to this store. The account and owner must also be active for workspace access.'}
      </p>
      {operation.blocked && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-xs leading-relaxed text-red-700"
        >
          Browser recovery is unavailable or contains an unreadable pending request. Status changes
          are blocked until recovery can be verified. Keep this browser data and contact support.
        </p>
      )}
      {operation.pending && (
        <div
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900"
          role="status"
        >
          <h3 className="font-semibold">Pending status confirmation</h3>
          <p className="mt-2">
            A previous confirmation may have reached the server. Check it or retry the same request
            before starting another change.
          </p>
          <p className="mt-2 break-words">
            {operation.pending.review.to_status === 'suspended' ? 'Suspend' : 'Reactivate'}{' '}
            {operation.pending.review.target_name}: {operation.pending.review.reason}
          </p>
          <p className="mt-2 break-all text-[11px]">Request: {operation.pending.requestKey}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="btn btn-secondary"
              type="button"
              disabled={operation.working}
              onClick={operation.check}
            >
              Check saved status
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              disabled={operation.working}
              onClick={operation.retry}
            >
              Retry same confirmation
            </button>
          </div>
        </div>
      )}
      <form onSubmit={(event) => void submit(event)} aria-busy={operation.working}>
        <fieldset disabled={disabled} className="grid min-w-0 gap-4">
          <label className="field" htmlFor={fieldId}>
            Reason for {nextStatus === 'suspended' ? 'suspension' : 'reactivation'}
            <textarea
              id={fieldId}
              className="input min-h-24"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              minLength={3}
              maxLength={500}
              aria-invalid={Boolean(operation.error?.fields.reason)}
              aria-describedby={operation.error?.fields.reason ? `${fieldId}-error` : undefined}
            />
          </label>
          {operation.error?.fields.reason && (
            <p id={`${fieldId}-error`} className="text-xs text-red-700">
              {operation.error.fields.reason.join(' ')}
            </p>
          )}
          <button className="btn btn-secondary justify-self-start" type="submit">
            {operation.working
              ? 'Please wait...'
              : `Review ${nextStatus === 'suspended' ? 'suspension' : 'reactivation'}`}
          </button>
        </fieldset>
      </form>
      {parentBlocked && (
        <p className="mt-3 text-xs text-amber-800">
          Reactivate the parent account before reactivating this store.
        </p>
      )}
      {operation.error && (
        <div
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-4 text-xs leading-relaxed text-red-700"
        >
          <p>{operation.error.message}</p>
          {Object.entries(operation.error.fields)
            .filter(([field]) => field !== 'reason')
            .map(([field, messages]) => (
              <p className="mt-2" key={field}>
                {messages.join(' ')}
              </p>
            ))}
        </div>
      )}
      {operation.review && (
        <StatusReviewDialog
          review={operation.review}
          working={operation.working}
          onClose={operation.closeReview}
          onConfirm={operation.confirm}
        />
      )}
    </section>
  )
}
