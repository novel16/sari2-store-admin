import axios from 'axios'
import { http, postWithCsrf } from '../api/http'
import type {
  ManagedStatus,
  PendingStatusChange,
  StatusResult,
  StatusReview,
  StatusTarget,
} from './types'

export const statusPath = (target: Pick<StatusTarget, 'type' | 'id'>) =>
  `/api/v1/admin/${target.type === 'account' ? 'accounts' : 'stores'}/${target.id}`

export const previewStatus = (target: StatusTarget, status: ManagedStatus, reason: string) =>
  postWithCsrf<{ data: StatusReview }>(`${statusPath(target)}/status-preview`, { status, reason })

export const confirmStatus = (target: StatusTarget, pending: PendingStatusChange) =>
  postWithCsrf<StatusResult>(`${statusPath(target)}/status-changes`, {
    request_key: pending.requestKey,
    review_token: pending.review.review_token,
  })

export async function findStatusChange(target: StatusTarget, requestKey: string) {
  return (await http.get<StatusResult>(`${statusPath(target)}/status-changes/by-key/${requestKey}`))
    .data
}

// A failed CSRF request or an unknown outcome cannot prove the write was rejected.
export function definitiveStatusRejection(failure: unknown, target: StatusTarget) {
  if (
    !axios.isAxiosError(failure) ||
    failure.config?.method?.toLowerCase() !== 'post' ||
    failure.config.url !== `${statusPath(target)}/status-changes`
  )
    return false
  const status = failure.response?.status
  const code = (failure.response?.data as { code?: string } | undefined)?.code
  return (
    status === 422 ||
    (status === 409 &&
      [
        'status_review_stale',
        'status_review_expired',
        'status_review_used',
        'status_parent_suspended',
        'status_no_change',
        'status_actor_unavailable',
        'status_review_invalid',
      ].includes(code ?? ''))
  )
}
