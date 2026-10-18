import AdministratorCredentialsForm from './AdministratorCredentialsForm'
import type { AdministratorCredentials, PendingAdministratorOperation } from './types'

export default function AdministratorRecovery({
  pending,
  blocked,
  working,
  onCheck,
  onRetry,
}: {
  pending: PendingAdministratorOperation | null
  blocked: boolean
  working: boolean
  onCheck: () => void
  onRetry: (credentials: AdministratorCredentials) => void
}) {
  if (blocked)
    return (
      <p
        role="alert"
        className="mb-5 rounded-xl bg-red-50 p-4 text-xs leading-relaxed text-red-700"
      >
        Browser recovery is unavailable or contains an unreadable pending request. Keep this browser
        data and restore recovery before another change.
      </p>
    )
  if (!pending) return null
  return (
    <div
      role="status"
      className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900"
    >
      <h3 className="font-semibold">Pending administrator confirmation</h3>
      <p className="mt-2">
        A previous request may have reached the server. Check saved status first. Passwords are
        never saved in browser recovery.
      </p>
      <p className="mt-2 break-words">
        {pending.review.kind === 'create'
          ? `Create ${pending.review.name} (${pending.review.email})`
          : `${pending.review.to_status === 'active' ? 'Reactivate' : 'Suspend'} ${pending.review.administrator.name}`}
        : {pending.review.reason}
      </p>
      <button className="btn btn-secondary mt-4" type="button" onClick={onCheck} disabled={working}>
        Check saved status
      </button>
      <p className="mt-4">
        To retry, re-enter your password
        {pending.review.kind === 'create' ? ' and the new administrator password' : ''}. The system
        checks for an existing result before sending the same confirmation. A saved creation keeps
        its original password.
      </p>
      <AdministratorCredentialsForm
        creating={pending.review.kind === 'create'}
        working={working}
        label="Retry same confirmation"
        onSubmit={onRetry}
      />
      <p className="mt-3 break-all text-[11px]">Request: {pending.requestKey}</p>
    </div>
  )
}
