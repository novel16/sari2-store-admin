import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSourceModule } from './sourceModule.mjs'

const {
  readAdministratorOperation: read,
  saveAdministratorOperation: save,
  clearAdministratorOperation: clear,
  validAdministratorReview: valid,
} = await import(await createSourceModule(import.meta.url)('../administrators/recovery.ts'))
const scope = { kind: 'create' }
const review = {
  kind: 'create',
  name: 'New administrator',
  email: 'admin@example.test',
  reason: 'Second administrator coverage',
  review_token: 'review-token',
  expires_at: '2030-01-01T00:00:00Z',
}
const pending = { requestKey: 'df7c6a40-f8d1-4238-81bd-4d8cf1cdf2a1', review }
function storage() {
  const data = new Map()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  }
}

test('administrator recovery isolates actors and targets and only clears the exact request', () => {
  const target = storage()
  assert.equal(save(5, scope, pending, target), true)
  assert.deepEqual(read(5, scope, target).pending, pending)
  assert.equal(read(6, scope, target).pending, null)
  assert.equal(read(5, { kind: 'status', id: 8 }, target).pending, null)
  assert.equal(clear(5, scope, 'another-key', target), false)
  assert.equal(
    save(5, scope, { ...pending, requestKey: 'df7c6a40-f8d1-4238-81bd-4d8cf1cdf2a2' }, target),
    false,
  )
  assert.equal(clear(5, scope, pending.requestKey, target), true)
})

test('credentials and unexpected properties can never be persisted in administrator recovery', () => {
  const target = storage()
  for (const value of [
    { ...pending, password: 'secret' },
    { ...pending, current_password: 'secret' },
    { ...pending, review: { ...review, password: 'secret' } },
  ])
    assert.equal(save(5, scope, value, target), false)
  assert.equal(target.data.size, 0)
  assert.equal(save(5, scope, pending, target), true)
  assert.doesNotMatch([...target.data.values()].join(''), /password|secret/)
})

test('corrupt and unavailable browser storage block new administrator operations', () => {
  const target = storage()
  target.data.set('admin-administrators:v1:5:create', '{broken')
  assert.deepEqual(read(5, scope, target), { pending: null, blocked: true })
  assert.equal(save(5, scope, pending, target), false)
  const broken = {
    getItem() {
      throw new Error('blocked')
    },
    setItem() {
      throw new Error('blocked')
    },
    removeItem() {
      throw new Error('blocked')
    },
  }
  assert.equal(read(5, scope, broken).blocked, true)
  assert.equal(save(5, scope, pending, broken), false)
  assert.equal(clear(5, scope, pending.requestKey, broken), false)
})

test('status recovery validates reviewed identity and preserves expired reviews for result lookup', () => {
  const statusReview = {
    kind: 'status',
    administrator: { id: 8, name: 'Admin', email: 'admin@example.test', status: 'active' },
    from_status: 'active',
    to_status: 'suspended',
    reason: 'Coverage ended',
    active_administrators: 2,
    review_token: 'token',
    expires_at: '2020-01-01T00:00:00Z',
  }
  assert.equal(valid(statusReview, { kind: 'status', id: 8 }), true)
  assert.equal(valid(statusReview, { kind: 'status', id: 9 }), false)
  assert.equal(valid({ ...statusReview, to_status: 'active' }, { kind: 'status', id: 8 }), false)
  assert.equal(
    valid(
      { ...statusReview, administrator: { ...statusReview.administrator, password: 'secret' } },
      { kind: 'status', id: 8 },
    ),
    false,
  )
})
