import ReviewDialog from '../components/ReviewDialog'
import StatusBadge from '../components/StatusBadge'
import { dateTime, number } from '../platform/format'
import type { StatusReview } from './types'

export default function StatusReviewDialog({
  review,
  working,
  onClose,
  onConfirm,
}: {
  review: StatusReview
  working: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <ReviewDialog title="Review status change" onClose={onClose} dismissible={!working}>
      <p className="text-sm font-semibold">{review.target_name}</p>
      <div className="my-4 flex items-center gap-3 text-sm">
        <StatusBadge status={review.from_status} />
        <span>to</span>
        <StatusBadge status={review.to_status} />
      </div>
      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-xs">
        <dt>Affected stores</dt>
        <dd className="text-right font-semibold">{number(review.impact.affected_store_count)}</dd>
        <dt>Currently active</dt>
        <dd className="text-right">{number(review.impact.active_store_count)}</dd>
        <dt>Separately suspended</dt>
        <dd className="text-right">{number(review.impact.suspended_store_count)}</dd>
      </dl>
      <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
        {review.target_type === 'account'
          ? review.to_status === 'suspended'
            ? 'All stores under this account will be unavailable, including existing signed-in owner sessions.'
            : 'The account restriction will be lifted. Stores suspended separately will stay suspended, and owner restrictions still apply.'
          : review.to_status === 'suspended'
            ? 'Only this store will become unavailable. Other stores keep their existing access.'
            : 'This store will be active. Account and owner restrictions still apply.'}{' '}
        {review.target_type === 'account'
          ? 'Individual store statuses and owner user status are preserved.'
          : 'Other store statuses and owner user status are preserved.'}
      </p>
      <p className="mb-1 mt-5 text-xs font-semibold">Reason</p>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">
        {review.reason}
      </p>
      <p className="mt-4 text-[11px] text-slate-400">
        Review expires {dateTime(review.expires_at)} (PHT). Confirming records this change in the
        audit history.
      </p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button className="btn btn-secondary" type="button" disabled={working} onClick={onClose}>
          Back
        </button>
        <button className="btn btn-primary" type="button" disabled={working} onClick={onConfirm}>
          Confirm {review.to_status === 'suspended' ? 'suspension' : 'reactivation'}
        </button>
      </div>
    </ReviewDialog>
  )
}
