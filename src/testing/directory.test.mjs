import assert from 'node:assert/strict'
import test from 'node:test'
import { createSourceModule } from './sourceModule.mjs'

const sourceModule = createSourceModule(import.meta.url)
const { pageNumber, recordId, directoryQuery } = await import(
  await sourceModule('../platform/directory.ts')
)
const { dayLabel, shortDate, initials } = await import(await sourceModule('../platform/format.ts'))

test('directory pages and record IDs reject malformed URL input', () => {
  for (const input of [null, '', '0', '-1', '1e2', '1.5', 'Infinity', '1000001'])
    assert.equal(pageNumber(input), 1)
  assert.equal(pageNumber('24'), 24)
  assert.equal(pageNumber('1000000'), 1000000)
  for (const input of [undefined, null, '', '0', '-1', '1.5', '9007199254740992', 'abc'])
    assert.equal(recordId(input), null)
  assert.equal(recordId('42'), 42)
})

test('directory queries retain filters and safely encode search terms', () => {
  const query = new URLSearchParams(directoryQuery('  Maria & Sons  ', 'active', 2, 17))
  assert.equal(query.get('q'), 'Maria & Sons')
  assert.equal(query.get('status'), 'active')
  assert.equal(query.get('page'), '2')
  assert.equal(query.get('account_id'), '17')
  assert.equal(query.get('per_page'), '20')
  assert.equal(new URLSearchParams(directoryQuery('', 'all', 1)).has('account_id'), false)
})

test('directory dates consistently display Philippine time across UTC day boundaries', () => {
  assert.match(shortDate('2026-10-15T16:30:00Z'), /16/)
  assert.match(dayLabel('2026-10-16'), /16/)
  assert.equal(initials(' Maria  Reyes '), 'MR')
})
