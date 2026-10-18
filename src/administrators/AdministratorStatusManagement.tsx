import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import AdministratorRecovery from './AdministratorRecovery'
import AdministratorReviewDialog from './AdministratorReviewDialog'
import OperationErrors from './OperationErrors'
import { useAdministratorOperation } from './useAdministratorOperation'
import type { Administrator } from './types'

export default function AdministratorStatusManagement({
  administrator,
  activeCount,
  onSaved,
}: {
  administrator: Administrator
  activeCount: number
  onSaved: () => void
}) {
  const { user } = useAuth()
  const operation = useAdministratorOperation({ kind: 'status', id: administrator.id }, onSaved)
  const [reason, setReason] = useState(operation.pending?.review.reason ?? '')
  const nextStatus = administrator.status === 'active' ? 'suspended' : 'active'
  const self = administrator.id === user?.id,
    lastActive = administrator.status === 'active' && activeCount <= 1
  const protectedAdmin = nextStatus === 'suspended' && (self || lastActive)
  const disabled =
    operation.working ||
    operation.blocked ||
    Boolean(operation.pending || operation.review) ||
    protectedAdmin
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!disabled) void operation.preview({ status: nextStatus, reason })
  }
  return (
    <section className="panel mb-8 p-5 sm:p-7">
      <h2 className="font-display text-lg font-bold">Manage administrator access</h2>
      <p className="mb-5 mt-2 text-xs leading-relaxed text-slate-500">
        Suspension blocks existing and future platform sessions. Every confirmed change keeps its
        reason and administrator in the audit history.
      </p>
      <AdministratorRecovery {...operation} onCheck={operation.check} onRetry={operation.retry} />
      {protectedAdmin && (
        <p className="mb-4 rounded-xl bg-amber-50 p-4 text-xs text-amber-900">
          {self
            ? 'You cannot suspend your own administrator account.'
            : 'The last active administrator cannot be suspended.'}
        </p>
      )}
      <form onSubmit={submit} aria-busy={operation.working}>
        <fieldset disabled={disabled} className="grid min-w-0 gap-4">
          <label className="field">
            Reason for {nextStatus === 'suspended' ? 'suspension' : 'reactivation'}
            <textarea
              className="input min-h-24"
              value={reason}
              required
              minLength={3}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <button className="btn btn-secondary justify-self-start" type="submit">
            {operation.working
              ? 'Please wait...'
              : `Review ${nextStatus === 'suspended' ? 'suspension' : 'reactivation'}`}
          </button>
        </fieldset>
      </form>
      <OperationErrors error={operation.error} />
      {operation.review && (
        <AdministratorReviewDialog
          review={operation.review}
          working={operation.working}
          onClose={operation.closeReview}
          onConfirm={operation.confirm}
        />
      )}
    </section>
  )
}
