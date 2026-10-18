import type { PendingStatusChange, StatusReview, StatusTarget } from './types'

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>
export type RecoveryState = { pending: PendingStatusChange | null; blocked: boolean }
const key = (adminId: number, target: Pick<StatusTarget, 'type' | 'id'>) =>
  `admin-status:v1:${adminId}:${target.type}:${target.id}`
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i
const status = (value: unknown) => value === 'active' || value === 'suspended'

export function validStatusReview(
  value: unknown,
  target: Pick<StatusTarget, 'type' | 'id' | 'accountId'>,
): value is StatusReview {
  const review = value as StatusReview | null
  return Boolean(
    review &&
    review.target_type === target.type &&
    review.target_id === target.id &&
    review.account_id === target.accountId &&
    typeof review.target_name === 'string' &&
    status(review.from_status) &&
    status(review.to_status) &&
    review.from_status !== review.to_status &&
    typeof review.reason === 'string' &&
    review.reason.trim().length >= 3 &&
    review.reason.length <= 500 &&
    (review.parent_status === null || typeof review.parent_status === 'string') &&
    typeof review.review_token === 'string' &&
    review.review_token.length > 0 &&
    review.review_token.length <= 30000 &&
    Number.isFinite(Date.parse(review.expires_at)) &&
    review.impact?.child_statuses_preserved === true &&
    typeof review.impact.owner_access_blocked === 'boolean' &&
    [
      review.impact.affected_store_count,
      review.impact.active_store_count,
      review.impact.suspended_store_count,
    ].every((value) => Number.isSafeInteger(value) && value >= 0),
  )
}

export function readStatusChange(
  adminId: number,
  target: StatusTarget,
  storage?: Storage,
): RecoveryState {
  try {
    const raw = (storage ?? sessionStorage).getItem(key(adminId, target))
    if (raw === null) return { pending: null, blocked: false }
    const value = JSON.parse(raw) as PendingStatusChange
    if (!uuid.test(value?.requestKey ?? '') || !validStatusReview(value?.review, target))
      return { pending: null, blocked: true }
    return { pending: value, blocked: false }
  } catch {
    return { pending: null, blocked: true }
  }
}

export function saveStatusChange(
  adminId: number,
  target: StatusTarget,
  value: PendingStatusChange,
  storage?: Storage,
) {
  try {
    if (!uuid.test(value.requestKey) || !validStatusReview(value.review, target)) return false
    const targetStorage = storage ?? sessionStorage
    const existing = readStatusChange(adminId, target, targetStorage)
    if (
      existing.blocked ||
      (existing.pending && JSON.stringify(existing.pending) !== JSON.stringify(value))
    )
      return false
    const serialized = JSON.stringify(value)
    targetStorage.setItem(key(adminId, target), serialized)
    return targetStorage.getItem(key(adminId, target)) === serialized
  } catch {
    return false
  }
}

export function clearStatusChange(
  adminId: number,
  target: StatusTarget,
  requestKey: string,
  storage?: Storage,
) {
  try {
    const targetStorage = storage ?? sessionStorage
    if (readStatusChange(adminId, target, targetStorage).pending?.requestKey !== requestKey)
      return false
    targetStorage.removeItem(key(adminId, target))
    return targetStorage.getItem(key(adminId, target)) === null
  } catch {
    return false
  }
}
