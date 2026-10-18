import ReviewDialog from '../components/ReviewDialog'
import StatusBadge from '../components/StatusBadge'
import { dateTime } from '../platform/format'
import AdministratorCredentialsForm from './AdministratorCredentialsForm'
import type { AdministratorCredentials, AdministratorReview } from './types'

export default function AdministratorReviewDialog({
  review,
  working,
  onClose,
  onConfirm,
}: {
  review: AdministratorReview
  working: boolean
  onClose: () => void
  onConfirm: (credentials: AdministratorCredentials) => void
}) {
  const creating = review.kind === 'create'
  return (
    <ReviewDialog
      title={creating ? 'Review new administrator' : 'Review administrator status'}
      onClose={onClose}
      dismissible={!working}
    >
      <p className="break-words text-sm font-semibold">
        {creating ? review.name : review.administrator.name}
      </p>
      <p className="mt-1 break-words text-xs text-slate-500">
        {creating ? review.email : review.administrator.email}
      </p>
      {!creating && (
        <div className="my-4 flex items-center gap-3 text-xs">
          <StatusBadge status={review.from_status} />
          <span>to</span>
          <StatusBadge status={review.to_status} />
        </div>
      )}
      <p className="my-4 rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        {creating
          ? 'This administrator will have platform management access. The account is independent and has no store or owner membership.'
          : review.to_status === 'suspended'
            ? 'This administrator will lose platform access, including existing signed-in sessions.'
            : 'This administrator will regain platform access.'}
      </p>
      <p className="text-xs font-semibold">Reason</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">{review.reason}</p>
      <p className="mt-4 text-[11px] text-slate-400">
        Review expires {dateTime(review.expires_at)} (PHT). Confirmation records an audit event.
      </p>
      <AdministratorCredentialsForm
        creating={creating}
        working={working}
        onSubmit={onConfirm}
        label={
          creating
            ? 'Confirm create administrator'
            : `Confirm ${review.to_status === 'suspended' ? 'suspension' : 'reactivation'}`
        }
      />
      <button className="btn btn-secondary mt-3" type="button" onClick={onClose} disabled={working}>
        Back to form
      </button>
    </ReviewDialog>
  )
}
