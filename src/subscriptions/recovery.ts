import type { SubscriptionReview } from './types'

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>
export interface PendingConfirmation {
  review: SubscriptionReview
  requestKey: string
}
const storageKey = (userId: number, accountId: number) =>
  `subscription-confirmation:${userId}:${accountId}`

export function loadConfirmation(
  userId: number,
  accountId: number,
  storage?: Storage,
): PendingConfirmation | null {
  try {
    const raw = (storage ?? sessionStorage).getItem(storageKey(userId, accountId))
    if (!raw) return null
    const value = JSON.parse(raw) as PendingConfirmation,
      review = value?.review,
      proposal = review?.proposal,
      settlement = review?.settlement
    if (
      !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value?.requestKey ?? '') ||
      typeof review?.quote !== 'string' ||
      !review.quote ||
      review.quote.length > 20000 ||
      !Number.isFinite(Date.parse(review.expires_at)) ||
      proposal?.account_id !== accountId ||
      typeof proposal.account_name !== 'string' ||
      !['activate', 'renew'].includes(proposal.action) ||
      !Number.isInteger(proposal.months) ||
      proposal.months < 1 ||
      proposal.months > 12 ||
      !Number.isInteger(proposal.plan_version) ||
      !Number.isSafeInteger(proposal.total_centavos) ||
      !Number.isFinite(Date.parse(proposal.starts_at)) ||
      !Number.isFinite(Date.parse(proposal.ends_at)) ||
      typeof proposal.terms?.name !== 'string' ||
      !Number.isSafeInteger(proposal.terms.monthly_price_centavos) ||
      !(
        proposal.terms.active_product_limit === null ||
        Number.isInteger(proposal.terms.active_product_limit)
      ) ||
      !['manual_payment', 'complimentary'].includes(settlement?.settlement_method) ||
      !Number.isSafeInteger(settlement.amount_centavos) ||
      typeof settlement.reason !== 'string' ||
      !(settlement.payment_reference === null || typeof settlement.payment_reference === 'string')
    )
      return null
    return value
  } catch {
    return null
  }
}

export function saveConfirmation(
  userId: number,
  accountId: number,
  value: PendingConfirmation,
  storage?: Storage,
): boolean {
  try {
    const previous = loadConfirmation(userId, accountId, storage)
    if (previous && previous.requestKey !== value.requestKey) return false
    const target = storage ?? sessionStorage
    target.setItem(storageKey(userId, accountId), JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function clearConfirmation(
  userId: number,
  accountId: number,
  requestKey: string,
  storage?: Storage,
): void {
  try {
    if (loadConfirmation(userId, accountId, storage)?.requestKey === requestKey)
      (storage ?? sessionStorage).removeItem(storageKey(userId, accountId))
  } catch {
    /* The server remains authoritative if browser storage is unavailable. */
  }
}
