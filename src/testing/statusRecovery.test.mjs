import assert from 'node:assert/strict'
import test from 'node:test'
import { createSourceModule } from './sourceModule.mjs'

const sourceModule = createSourceModule(import.meta.url)
const recovery = await import(await sourceModule('../statusManagement/recovery.ts'))
const target = { type: 'account', id: 12, accountId: 12 }
const pending = {
  requestKey: 'df7c6a40-f8d1-4238-81bd-4d8cf1cdf2a1',
  review: {
    target_type: 'account',
    target_id: 12,
    target_name: 'Test account',
    account_id: 12,
    from_status: 'active',
    to_status: 'suspended',
    reason: 'Owner requested suspension',
    parent_status: null,
    impact: {
      affected_store_count: 2,
      active_store_count: 1,
      suspended_store_count: 1,
      owner_access_blocked: true,
      child_statuses_preserved: true,
    },
    review_token: 'encrypted-server-review',
    expires_at: '2020-01-01T00:00:00Z',
  },
}
function memory() {
  const data = new Map()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  }
}

test('status recovery scopes admin, entity type and target and retains expired exact requests', () => {
  const storage = memory()
  assert.equal(recovery.saveStatusChange(5, target, pending, storage), true)
  assert.deepEqual(recovery.readStatusChange(5, target, storage), { pending, blocked: false })
  assert.equal(recovery.readStatusChange(6, target, storage).pending, null)
  assert.equal(recovery.readStatusChange(5, { ...target, id: 13 }, storage).pending, null)
  assert.equal(recovery.readStatusChange(5, { ...target, type: 'store' }, storage).pending, null)
  assert.equal(
    recovery.saveStatusChange(
      5,
      target,
      { ...pending, review: { ...pending.review, review_token: 'replacement' } },
      storage,
    ),
    false,
  )
  assert.equal(recovery.clearStatusChange(5, target, 'other-key', storage), false)
  assert.deepEqual(recovery.readStatusChange(5, target, storage).pending, pending)
  assert.equal(recovery.clearStatusChange(5, target, pending.requestKey, storage), true)
  assert.equal(recovery.readStatusChange(5, target, storage).pending, null)
})

test('corrupted and foreign recovery blocks replacements rather than erasing uncertainty', () => {
  for (const value of [
    null,
    {},
    { ...pending, requestKey: 'invalid' },
    { ...pending, review: { ...pending.review, target_id: 99 } },
    { ...pending, review: { ...pending.review, impact: {} } },
  ]) {
    const storage = memory()
    storage.setItem('admin-status:v1:5:account:12', JSON.stringify(value))
    assert.equal(recovery.readStatusChange(5, target, storage).blocked, true)
    assert.equal(recovery.saveStatusChange(5, target, pending, storage), false)
    assert.equal(recovery.clearStatusChange(5, target, pending.requestKey, storage), false)
  }
})

test('storage read, write and verification failures block submission', () => {
  assert.equal(
    recovery.readStatusChange(5, target, {
      getItem() {
        throw new Error('disabled')
      },
    }).blocked,
    true,
  )
  assert.equal(
    recovery.saveStatusChange(5, target, pending, {
      getItem: () => null,
      setItem() {
        throw new Error('full')
      },
    }),
    false,
  )
  assert.equal(
    recovery.saveStatusChange(5, target, pending, { getItem: () => null, setItem() {} }),
    false,
  )
})
