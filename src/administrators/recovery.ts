import type { AdministratorReview, OperationScope, PendingAdministratorOperation } from './types'

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>
export type AdministratorRecovery = {
  pending: PendingAdministratorOperation | null
  blocked: boolean
}
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i
const status = (value: unknown) => value === 'active' || value === 'suspended'
const text = (value: unknown, max: number, min = 1) =>
  typeof value === 'string' && value.trim().length >= min && value.length <= max
const exactKeys = (value: object, keys: string[]) =>
  Object.keys(value).every((key) => keys.includes(key))
const key = (actorId: number, scope: OperationScope) =>
  `admin-administrators:v1:${actorId}:${scope.kind === 'create' ? 'create' : `status:${scope.id}`}`

export function validAdministratorReview(
  value: unknown,
  scope: OperationScope,
): value is AdministratorReview {
  const review = value as AdministratorReview | null
  if (
    !review ||
    typeof review !== 'object' ||
    review.kind !== scope.kind ||
    !text(review.reason, 500, 3) ||
    !text(review.review_token, 30000) ||
    !Number.isFinite(Date.parse(review.expires_at))
  )
    return false
  if (review.kind === 'create')
    return (
      exactKeys(review, ['kind', 'name', 'email', 'reason', 'review_token', 'expires_at']) &&
      text(review.name, 120) &&
      text(review.email, 254)
    )
  return (
    scope.kind === 'status' &&
    exactKeys(review, [
      'kind',
      'administrator',
      'from_status',
      'to_status',
      'reason',
      'active_administrators',
      'review_token',
      'expires_at',
    ]) &&
    review.administrator?.id === scope.id &&
    exactKeys(review.administrator, ['id', 'name', 'email', 'status']) &&
    text(review.administrator.name, 120) &&
    text(review.administrator.email, 254) &&
    status(review.administrator.status) &&
    review.administrator.status === review.from_status &&
    status(review.to_status) &&
    review.to_status !== review.from_status &&
    Number.isSafeInteger(review.active_administrators) &&
    review.active_administrators >= 0
  )
}
export function readAdministratorOperation(
  actorId: number,
  scope: OperationScope,
  storage?: Storage,
): AdministratorRecovery {
  try {
    const raw = (storage ?? sessionStorage).getItem(key(actorId, scope))
    if (raw === null) return { pending: null, blocked: false }
    const value = JSON.parse(raw) as PendingAdministratorOperation
    if (
      !value ||
      !exactKeys(value, ['requestKey', 'review']) ||
      !uuid.test(value.requestKey ?? '') ||
      !validAdministratorReview(value.review, scope)
    )
      return { pending: null, blocked: true }
    return { pending: value, blocked: false }
  } catch {
    return { pending: null, blocked: true }
  }
}
export function saveAdministratorOperation(
  actorId: number,
  scope: OperationScope,
  value: PendingAdministratorOperation,
  storage?: Storage,
) {
  try {
    if (
      !exactKeys(value, ['requestKey', 'review']) ||
      !uuid.test(value.requestKey) ||
      !validAdministratorReview(value.review, scope)
    )
      return false
    const target = storage ?? sessionStorage
    const existing = readAdministratorOperation(actorId, scope, target)
    if (
      existing.blocked ||
      (existing.pending && JSON.stringify(existing.pending) !== JSON.stringify(value))
    )
      return false
    const serialized = JSON.stringify(value)
    target.setItem(key(actorId, scope), serialized)
    return target.getItem(key(actorId, scope)) === serialized
  } catch {
    return false
  }
}
export function clearAdministratorOperation(
  actorId: number,
  scope: OperationScope,
  requestKey: string,
  storage?: Storage,
) {
  try {
    const target = storage ?? sessionStorage
    if (readAdministratorOperation(actorId, scope, target).pending?.requestKey !== requestKey)
      return false
    target.removeItem(key(actorId, scope))
    return target.getItem(key(actorId, scope)) === null
  } catch {
    return false
  }
}
