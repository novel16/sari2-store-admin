import { useState } from 'react'
import type { FormEvent } from 'react'
import AdministratorRecovery from './AdministratorRecovery'
import AdministratorReviewDialog from './AdministratorReviewDialog'
import OperationErrors from './OperationErrors'
import { useAdministratorOperation } from './useAdministratorOperation'
import type { AdministratorResult } from './types'

export default function CreateAdministrator({
  onSaved,
}: {
  onSaved: (result: AdministratorResult) => void
}) {
  const operation = useAdministratorOperation({ kind: 'create' }, onSaved)
  const restored =
    operation.pending?.review.kind === 'create' ? operation.pending.review : undefined
  const [name, setName] = useState(restored?.name ?? ''),
    [email, setEmail] = useState(restored?.email ?? ''),
    [reason, setReason] = useState(restored?.reason ?? '')
  const disabled =
    operation.working || operation.blocked || Boolean(operation.pending || operation.review)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!disabled) void operation.preview({ name, email, reason })
  }
  return (
    <section className="panel max-w-2xl p-5 sm:p-7">
      <p className="mb-6 text-sm leading-relaxed text-slate-500">
        Create an independent platform administrator. Every active administrator can manage the
        platform and other administrators.
      </p>
      <AdministratorRecovery {...operation} onCheck={operation.check} onRetry={operation.retry} />
      <form onSubmit={submit} aria-busy={operation.working}>
        <fieldset disabled={disabled} className="grid min-w-0 gap-5">
          <label className="field">
            Full name
            <input
              className="input"
              name="name"
              autoComplete="name"
              value={name}
              required
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="field">
            Sign-in email
            <input
              className="input"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              required
              maxLength={254}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="field">
            Reason for creating this administrator
            <textarea
              className="input min-h-24"
              name="reason"
              value={reason}
              required
              minLength={3}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <button className="btn btn-primary justify-self-start" type="submit">
            {operation.working ? 'Please wait...' : 'Review new administrator'}
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
