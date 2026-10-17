import assert from 'node:assert/strict'
import test from 'node:test'
import { createSourceModule } from './sourceModule.mjs'
const sourceModule = createSourceModule(import.meta.url)
const { loadConfirmation, saveConfirmation, clearConfirmation } = await import(
  await sourceModule('../subscriptions/recovery.ts')
)
const key = 'df7c6a40-f8d1-4238-81bd-4d8cf1cdf2a1',
  otherKey = '18a90bc9-bf89-4f26-adc9-e1becda12e56'
const pending = {
  requestKey: key,
  review: {
    quote: 'encrypted-server-review',
    expires_at: '2020-01-01T00:00:00Z',
    proposal: {
      account_id: 12,
      account_name: 'Test store',
      action: 'activate',
      plan_version: 1,
      terms: { name: 'Basic', monthly_price_centavos: 4900, active_product_limit: 500 },
      months: 1,
      total_centavos: 4900,
      starts_at: '2026-10-16T00:00:00Z',
      ends_at: '2026-11-16T00:00:00Z',
    },
    settlement: {
      settlement_method: 'complimentary',
      amount_centavos: 0,
      payment_reference: null,
      reason: 'Launch promotion',
    },
  },
}
function memory() {
  const data = new Map()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  }
}
test('pending confirmations survive reload per administrator and account, including expired review replay', () => {
  const storage = memory()
  assert.equal(saveConfirmation(5, 12, pending, storage), true)
  assert.deepEqual(loadConfirmation(5, 12, storage), pending)
  assert.equal(loadConfirmation(6, 12, storage), null)
  assert.equal(loadConfirmation(5, 13, storage), null)
  assert.equal(saveConfirmation(5, 12, { ...pending, requestKey: otherKey }, storage), false)
  clearConfirmation(5, 12, otherKey, storage)
  assert.deepEqual(loadConfirmation(5, 12, storage), pending)
  clearConfirmation(5, 12, key, storage)
  assert.equal(loadConfirmation(5, 12, storage), null)
})
test('malformed and foreign pending reviews are ignored and unavailable storage blocks writes', () => {
  for (const value of [
    null,
    {},
    { ...pending, requestKey: 'bad-key' },
    {
      ...pending,
      review: { ...pending.review, proposal: { ...pending.review.proposal, account_id: 13 } },
    },
    { ...pending, review: { ...pending.review, settlement: { amount_centavos: '4900' } } },
  ])
    assert.equal(loadConfirmation(5, 12, { getItem: () => JSON.stringify(value) }), null)
  const unavailable = {
    getItem: () => {
      throw new Error('Blocked')
    },
    setItem: () => {
      throw new Error('Full')
    },
  }
  assert.equal(loadConfirmation(5, 12, unavailable), null)
  assert.equal(saveConfirmation(5, 12, pending, unavailable), false)
})
