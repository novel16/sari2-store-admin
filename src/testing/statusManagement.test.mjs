import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { after, beforeEach, test } from 'node:test'
import { pathToFileURL } from 'node:url'
import axios from 'axios'
import { act, createElement } from 'react'
import { installDom } from './dom.mjs'
import { createSourceModule } from './sourceModule.mjs'

const require = createRequire(import.meta.url)
const sourceModule = createSourceModule(import.meta.url)
const imports = Object.fromEntries(
  ['react', 'react/jsx-runtime', 'lucide-react'].map((name) => [
    name,
    pathToFileURL(require.resolve(name)).href,
  ]),
)
const dom = installDom('http://localhost:3001')
dom.window.HTMLDialogElement.prototype.showModal = function () {
  this.open = true
}
dom.window.HTMLDialogElement.prototype.close = function () {
  this.open = false
}
after(() => dom.cleanup())
const { createRoot } = await import('react-dom/client')
const authUrl = 'data:text/javascript,export const useAuth=()=>globalThis.__statusAuth'
const errorsUrl = await sourceModule('../api/errors.ts', { axios: import.meta.resolve('axios') })
const httpUrl = await sourceModule(
  '../api/http.ts',
  { axios: import.meta.resolve('axios') },
  { 'import.meta.env.VITE_API_URL': "'http://localhost:8000'" },
)
const { http } = await import(httpUrl)
const apiUrl = await sourceModule('../statusManagement/api.ts', {
  axios: import.meta.resolve('axios'),
  '../api/http': httpUrl,
})
const api = await import(apiUrl)
const recoveryUrl = await sourceModule('../statusManagement/recovery.ts')
const recovery = await import(recoveryUrl)
const hookUrl = await sourceModule('../statusManagement/useStatusChange.ts', {
  ...imports,
  '../api/errors': errorsUrl,
  '../auth/useAuth': authUrl,
  './api': apiUrl,
  './recovery': recoveryUrl,
})
const badgeUrl = await sourceModule('../components/StatusBadge.tsx', imports)
const dialogUrl = await sourceModule('../components/ReviewDialog.tsx', imports)
const formatUrl = await sourceModule('../platform/format.ts')
const reviewUrl = await sourceModule('../statusManagement/StatusReviewDialog.tsx', {
  ...imports,
  '../components/ReviewDialog': dialogUrl,
  '../components/StatusBadge': badgeUrl,
  '../platform/format': formatUrl,
})
const { default: Management } = await import(
  await sourceModule('../statusManagement/StatusManagement.tsx', {
    ...imports,
    './useStatusChange': hookUrl,
    './StatusReviewDialog': reviewUrl,
  })
)
const queryUrl = await sourceModule('../hooks/useApiQuery.ts', {
  ...imports,
  axios: import.meta.resolve('axios'),
  '../api/http': httpUrl,
  '../api/errors': errorsUrl,
  '../auth/useAuth': authUrl,
})
const queryStateUrl = await sourceModule('../components/QueryState.tsx', imports)
const paginationUrl = await sourceModule('../components/Pagination.tsx', {
  ...imports,
  '../platform/format': formatUrl,
})
const { default: History } = await import(
  await sourceModule('../statusManagement/StatusHistory.tsx', {
    ...imports,
    '../hooks/useApiQuery': queryUrl,
    './api': apiUrl,
    '../components/QueryState': queryStateUrl,
    '../components/Pagination': paginationUrl,
    '../components/StatusBadge': badgeUrl,
    '../platform/format': formatUrl,
  })
)
const target = {
  type: 'account',
  id: 12,
  accountId: 12,
  name: 'Corner account',
  status: 'active',
  ownerStatus: 'active',
}
const review = {
  target_type: 'account',
  target_id: 12,
  target_name: 'Corner account',
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
  review_token: 'encrypted-reviewed-state',
  expires_at: '2030-01-01T00:00:00Z',
}
const pending = { requestKey: 'df7c6a40-f8d1-4238-81bd-4d8cf1cdf2a1', review }
const entry = {
  id: 3,
  target_type: 'account',
  target_id: 12,
  target_name: 'Corner account',
  account_id: 12,
  from_status: 'active',
  to_status: 'suspended',
  reason: review.reason,
  actor: { id: 5, name: 'Platform admin' },
  created_at: '2026-10-18T00:00:00Z',
}
const response = (config, data) => ({ data, status: 200, statusText: 'OK', headers: {}, config })
const failure = (config, status, code) =>
  new axios.AxiosError('Rejected', undefined, config, undefined, {
    status,
    data: { code, message: code },
  })
const button = (container, text) =>
  [...container.querySelectorAll('button')].find((node) => node.textContent === text)
async function click(node) {
  assert.ok(node)
  await act(async () => node.click())
}
async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

beforeEach(() => {
  sessionStorage.clear()
  globalThis.__statusAuth = { user: { id: 5 }, refresh: async () => {} }
  http.defaults.adapter = async (config) => response(config, {})
})

async function mount(t, Component = Management, props = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  let mounted = true
  const unmount = async () => {
    if (mounted) {
      mounted = false
      await act(async () => root.unmount())
      container.remove()
    }
  }
  t.after(unmount)
  await act(async () => root.render(createElement(Component, { target, onSaved() {}, ...props })))
  await flush()
  return { container, unmount }
}

test('actual mounted form requests server review and explicit confirmation before writing', async (t) => {
  const writes = []
  let saved = 0
  http.defaults.adapter = async (config) => {
    if (config.method === 'post') {
      writes.push(config)
      if (config.url.endsWith('/status-preview')) return response(config, { data: review })
      assert.ok(recovery.readStatusChange(5, target).pending)
      return response(config, { data: entry, meta: { replayed: false } })
    }
    return response(config, {})
  }
  const { container } = await mount(t, Management, { onSaved: () => saved++ })
  const input = container.querySelector('textarea')
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, 'value').set.call(
      input,
      review.reason,
    )
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  })
  await act(async () =>
    container
      .querySelector('form')
      .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })),
  )
  assert.equal(writes.length, 1)
  assert.equal(container.querySelector('dialog').open, true)
  assert.match(
    container.querySelector('dialog').textContent,
    /All stores under this account will be unavailable/,
  )
  await click(button(container, 'Confirm suspension'))
  assert.equal(writes.length, 2)
  const body = JSON.parse(writes[1].data)
  assert.equal(body.review_token, review.review_token)
  assert.match(body.request_key, /^[a-f0-9-]{36}$/)
  assert.equal(saved, 1)
  assert.equal(recovery.readStatusChange(5, target).pending, null)
})

test('pending request survives a failed lookup and same-key retry after remount', async (t) => {
  recovery.saveStatusChange(5, target, pending)
  let posts = 0
  const requests = []
  http.defaults.adapter = async (config) => {
    if (config.url.includes('/by-key/')) throw failure(config, 404, 'not_found')
    if (config.method === 'post') {
      requests.push(JSON.parse(config.data))
      if (posts++ === 0) throw new axios.AxiosError('Lost connection', undefined, config)
      return response(config, { data: entry, meta: { replayed: true } })
    }
    return response(config, {})
  }
  const first = await mount(t)
  assert.equal(first.container.querySelector('fieldset').disabled, true)
  await click(button(first.container, 'Check saved status'))
  assert.deepEqual(recovery.readStatusChange(5, target).pending, pending)
  await click(button(first.container, 'Retry same confirmation'))
  await first.unmount()
  const second = await mount(t)
  await click(button(second.container, 'Retry same confirmation'))
  assert.equal(requests.length, 2)
  assert.deepEqual(requests[0], requests[1])
  assert.equal(requests[0].request_key, pending.requestKey)
  assert.equal(recovery.readStatusChange(5, target).pending, null)
})

test('definitive stale rejection releases pending operation and retains the reason for a fresh review', async (t) => {
  recovery.saveStatusChange(5, target, pending)
  http.defaults.adapter = async (config) => {
    if (config.method === 'post') throw failure(config, 409, 'status_review_stale')
    return response(config, {})
  }
  const { container } = await mount(t)
  await click(button(container, 'Retry same confirmation'))
  assert.equal(recovery.readStatusChange(5, target).pending, null)
  assert.equal(container.querySelector('textarea').value, review.reason)
  assert.equal(container.querySelector('fieldset').disabled, false)
  assert.equal(container.querySelector('dialog'), null)
})

test('late responses after navigation keep exact recovery available on return', async (t) => {
  recovery.saveStatusChange(5, target, pending)
  let finish
  http.defaults.adapter = (config) =>
    config.method === 'post'
      ? new Promise((resolve) => {
          finish = () => resolve(response(config, { data: entry, meta: { replayed: true } }))
        })
      : Promise.resolve(response(config, {}))
  const first = await mount(t)
  await click(button(first.container, 'Retry same confirmation'))
  await first.unmount()
  await act(async () => finish())
  assert.deepEqual(recovery.readStatusChange(5, target).pending, pending)
  const second = await mount(t)
  assert.match(second.container.textContent, /Pending status confirmation/)
})

test('inactive parent blocks store reactivation and reports owner restrictions separately', async (t) => {
  const { container } = await mount(t, Management, {
    target: {
      ...target,
      type: 'store',
      id: 4,
      status: 'suspended',
      parentStatus: 'suspended',
      ownerStatus: 'suspended',
    },
  })
  assert.equal(container.querySelector('fieldset').disabled, true)
  assert.match(container.textContent, /parent account is suspended/)
  assert.match(container.textContent, /owner user is inactive/)
  assert.match(container.textContent, /Reactivate the parent account before/)
})

test('corrupt browser recovery blocks a new status change', async (t) => {
  sessionStorage.setItem('admin-status:v1:5:account:12', '{broken')
  const { container } = await mount(t)
  assert.equal(container.querySelector('fieldset').disabled, true)
  assert.match(container.querySelector('[role=alert]').textContent, /unreadable pending request/)
})

test('history renders immutable actor/reason entries and requests the next page', async (t) => {
  const calls = []
  http.defaults.adapter = async (config) => {
    calls.push(config.url)
    const page = Number(new URL(config.url, 'http://localhost').searchParams.get('page'))
    return response(config, {
      data: [{ ...entry, id: page, reason: `Reason on page ${page}` }],
      meta: { current_page: page, last_page: 2, total: 11, per_page: 10, from: 1, to: 10 },
    })
  }
  const { container } = await mount(t, History)
  assert.match(container.textContent, /Platform admin/)
  assert.match(container.textContent, /Reason on page 1/)
  assert.equal(container.querySelector('textarea'), null)
  await click(container.querySelector('[aria-label="Next page"]'))
  await flush()
  assert.match(container.textContent, /Reason on page 2/)
  assert.match(calls.at(-1), /status-history\?page=2&per_page=10/)
})

test('storage changes after mounting block stale in-memory retry and lookup', async (t) => {
  recovery.saveStatusChange(5, target, pending)
  let calls = 0
  http.defaults.adapter = async (config) => {
    calls++
    return response(config, {})
  }
  const { container } = await mount(t)
  sessionStorage.setItem('admin-status:v1:5:account:12', '{corrupted-after-mount')
  await click(button(container, 'Retry same confirmation'))
  assert.equal(calls, 0)
  assert.equal(container.querySelector('fieldset').disabled, true)
  assert.match(container.textContent, /No request was sent/)
})

test('CSRF, server failure and key conflict retain the pending request in the mounted recovery flow', async (t) => {
  recovery.saveStatusChange(5, target, pending)
  let mode = 'csrf'
  http.defaults.adapter = async (config) => {
    if (mode === 'csrf') throw failure(config, 422, 'validation')
    if (config.method === 'post')
      throw failure(config, mode === 'server' ? 500 : 409, 'status_key_conflict')
    return response(config, {})
  }
  const { container } = await mount(t)
  for (const next of ['csrf', 'server', 'conflict']) {
    mode = next
    await click(button(container, 'Retry same confirmation'))
    assert.deepEqual(recovery.readStatusChange(5, target).pending, pending)
    assert.equal(container.querySelector('fieldset').disabled, true)
  }
})

test('a successful response for another target cannot clear the original pending operation', async (t) => {
  recovery.saveStatusChange(5, target, pending)
  let saved = 0
  http.defaults.adapter = async (config) =>
    response(
      config,
      config.method === 'post'
        ? { data: { ...entry, target_id: 999 }, meta: { replayed: true } }
        : {},
    )
  const { container } = await mount(t, Management, { onSaved: () => saved++ })
  await click(button(container, 'Retry same confirmation'))
  assert.equal(saved, 0)
  assert.deepEqual(recovery.readStatusChange(5, target).pending, pending)
  assert.match(container.textContent, /result could not be verified/)
})

test('a recovery request that disappears after mounting also blocks lookup', async (t) => {
  recovery.saveStatusChange(5, target, pending)
  let calls = 0
  http.defaults.adapter = async (config) => {
    calls++
    return response(config, {})
  }
  const { container } = await mount(t)
  sessionStorage.removeItem('admin-status:v1:5:account:12')
  await click(button(container, 'Check saved status'))
  assert.equal(calls, 0)
  assert.match(container.textContent, /No request was sent/)
})

test('only definitive mutation responses release recovery, excluding CSRF failures and key conflicts', () => {
  const post = { method: 'post', url: '/api/v1/admin/accounts/12/status-changes' }
  assert.equal(
    api.definitiveStatusRejection(failure(post, 409, 'status_review_expired'), target),
    true,
  )
  assert.equal(api.definitiveStatusRejection(failure(post, 422, 'validation'), target), true)
  for (const [config, status, code] of [
    [{ method: 'get', url: '/sanctum/csrf-cookie' }, 409, 'status_review_stale'],
    [post, 409, 'status_key_conflict'],
    [post, 404, 'not_found'],
    [post, 500, 'status_review_stale'],
  ])
    assert.equal(api.definitiveStatusRejection(failure(config, status, code), target), false)
})
