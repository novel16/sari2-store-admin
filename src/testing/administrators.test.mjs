import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { after, beforeEach, test } from 'node:test'
import { pathToFileURL } from 'node:url'
import axios from 'axios'
import { act, createElement } from 'react'
import { installDom } from './dom.mjs'
import { createSourceModule } from './sourceModule.mjs'

const require = createRequire(import.meta.url),
  source = createSourceModule(import.meta.url)
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
const auth = 'data:text/javascript,export const useAuth=()=>globalThis.__administratorAuth'
const errors = await source('../api/errors.ts', { axios: import.meta.resolve('axios') })
const httpUrl = await source(
  '../api/http.ts',
  { axios: import.meta.resolve('axios') },
  { 'import.meta.env.VITE_API_URL': "'http://localhost:8000'" },
)
const { http } = await import(httpUrl)
const apiUrl = await source('../administrators/api.ts', {
  axios: import.meta.resolve('axios'),
  '../api/http': httpUrl,
})
const api = await import(apiUrl)
const recoveryUrl = await source('../administrators/recovery.ts'),
  recovery = await import(recoveryUrl)
const hook = await source('../administrators/useAdministratorOperation.ts', {
  ...imports,
  '../api/errors': errors,
  '../auth/useAuth': auth,
  './api': apiUrl,
  './recovery': recoveryUrl,
})
const badge = await source('../components/StatusBadge.tsx', imports),
  dialog = await source('../components/ReviewDialog.tsx', imports),
  format = await source('../platform/format.ts')
const credentials = await source('../administrators/AdministratorCredentialsForm.tsx', imports)
const operationErrors = await source('../administrators/OperationErrors.tsx', imports)
const recoveryComponent = await source('../administrators/AdministratorRecovery.tsx', {
  ...imports,
  './AdministratorCredentialsForm': credentials,
})
const reviewComponent = await source('../administrators/AdministratorReviewDialog.tsx', {
  ...imports,
  '../components/ReviewDialog': dialog,
  '../components/StatusBadge': badge,
  '../platform/format': format,
  './AdministratorCredentialsForm': credentials,
})
const components = {
  ...imports,
  '../auth/useAuth': auth,
  './useAdministratorOperation': hook,
  './AdministratorRecovery': recoveryComponent,
  './AdministratorReviewDialog': reviewComponent,
  './OperationErrors': operationErrors,
}
const { default: Creation } = await import(
  await source('../administrators/CreateAdministrator.tsx', components)
)
const { default: Status } = await import(
  await source('../administrators/AdministratorStatusManagement.tsx', components)
)
const query = await source('../hooks/useApiQuery.ts', {
  ...imports,
  axios: import.meta.resolve('axios'),
  '../api/http': httpUrl,
  '../api/errors': errors,
  '../auth/useAuth': auth,
})
const queryState = await source('../components/QueryState.tsx', imports),
  pagination = await source('../components/Pagination.tsx', {
    ...imports,
    '../platform/format': format,
  })
const { default: History } = await import(
  await source('../administrators/AdministratorHistory.tsx', {
    ...imports,
    '../hooks/useApiQuery': query,
    './api': apiUrl,
    '../components/QueryState': queryState,
    '../components/Pagination': pagination,
    '../components/StatusBadge': badge,
    '../platform/format': format,
  })
)
const settingsApi = await source('../settings/api.ts', { '../api/http': httpUrl })
const settingImports = {
  ...imports,
  '../api/errors': errors,
  '../auth/useAuth': auth,
  '../administrators/OperationErrors': operationErrors,
  './api': settingsApi,
}
const { default: Profile } = await import(
  await source('../settings/ProfileForm.tsx', settingImports)
)
const { default: Password } = await import(
  await source('../settings/PasswordForm.tsx', settingImports)
)

const scope = { kind: 'create' }
const review = {
  kind: 'create',
  name: 'New Admin',
  email: 'new@example.test',
  reason: 'Additional platform coverage',
  review_token: 'encrypted-review',
  expires_at: '2030-01-01T00:00:00Z',
}
const pending = { requestKey: 'df7c6a40-f8d1-4238-81bd-4d8cf1cdf2a1', review }
const administrator = {
  id: 8,
  name: review.name,
  email: review.email,
  status: 'active',
  created_at: '2026-10-18T00:00:00Z',
  updated_at: '2026-10-18T00:00:00Z',
}
const event = {
  id: 3,
  action: 'created',
  administrator: { id: 8, name: review.name, email: review.email },
  from_status: null,
  to_status: 'active',
  reason: review.reason,
  actor: { id: 5, name: 'Existing Admin' },
  created_at: '2026-10-18T00:00:00Z',
}
const result = { data: administrator, event, meta: { replayed: false } }
const response = (config, data) => ({ data, status: 200, statusText: 'OK', headers: {}, config })
const failure = (config, status, code, fields) =>
  new axios.AxiosError('Rejected', undefined, config, undefined, {
    status,
    data: { code, message: code, errors: fields },
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
async function fill(input, value) {
  assert.ok(input)
  await act(async () => {
    const prototype =
      input.tagName === 'TEXTAREA'
        ? dom.window.HTMLTextAreaElement.prototype
        : dom.window.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value)
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  })
}
async function submit(form) {
  await act(async () =>
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })),
  )
}
async function fillCredentials(container, creating = true) {
  const inputs = [...container.querySelectorAll('input[type=password]')]
  if (creating) {
    await fill(inputs[0], 'NewPass123!')
    await fill(inputs[1], 'NewPass123!')
  }
  await fill(inputs.at(-1), 'CurrentPass123!')
}
async function mount(t, Component = Creation, props = {}) {
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
  await act(async () => root.render(createElement(Component, { onSaved() {}, ...props })))
  await flush()
  return { container, unmount }
}
beforeEach(() => {
  sessionStorage.clear()
  globalThis.__administratorAuth = {
    user: {
      id: 5,
      name: 'Existing Admin',
      email: 'old@example.test',
      status: 'active',
      platform_role: 'platform_admin',
    },
    refresh: async () => {},
    updateUser() {},
  }
  http.defaults.adapter = async (config) => response(config, {})
})

test('mounted creation requires server review and explicit credentialed confirmation; recovery never stores passwords', async (t) => {
  const writes = []
  let saved = 0
  http.defaults.adapter = async (config) => {
    if (config.method !== 'post') return response(config, {})
    writes.push(config)
    if (config.url.endsWith('/creation-preview')) return response(config, { data: review })
    const raw = sessionStorage.getItem('admin-administrators:v1:5:create')
    assert.ok(raw)
    assert.doesNotMatch(raw, /Pass123|password/)
    assert.equal(JSON.parse(config.data).current_password, 'CurrentPass123!')
    assert.equal(JSON.parse(config.data).password, 'NewPass123!')
    return response(config, result)
  }
  const { container } = await mount(t, Creation, { onSaved: () => saved++ })
  await fill(container.querySelector('[name=name]'), review.name)
  await fill(container.querySelector('[name=email]'), review.email)
  await fill(container.querySelector('textarea'), review.reason)
  await submit(container.querySelector('form'))
  assert.equal(writes.length, 1)
  assert.equal(container.querySelector('dialog').open, true)
  assert.match(container.querySelector('dialog').textContent, /independent and has no store/)
  await fillCredentials(container.querySelector('dialog'))
  await submit(container.querySelector('dialog form'))
  assert.equal(writes.length, 2)
  assert.equal(saved, 1)
  assert.equal(recovery.readAdministratorOperation(5, scope).pending, null)
})

test('pending creation checks committed result without any password or second write', async (t) => {
  recovery.saveAdministratorOperation(5, scope, pending)
  const calls = []
  http.defaults.adapter = async (config) => {
    calls.push(config)
    return response(config, { ...result, meta: { replayed: true } })
  }
  const { container } = await mount(t)
  assert.equal(container.querySelector('[name=name]').closest('fieldset').disabled, true)
  await click(button(container, 'Check saved status'))
  assert.equal(calls.length, 1)
  assert.match(calls[0].url, /operations\/by-key\//)
  assert.equal(calls[0].method, 'get')
  assert.equal(recovery.readAdministratorOperation(5, scope).pending, null)
})

test('retry after remount looks up first and reuses exact key with re-entered volatile passwords', async (t) => {
  recovery.saveAdministratorOperation(5, scope, pending)
  const calls = []
  http.defaults.adapter = async (config) => {
    calls.push(config)
    if (config.url.includes('/by-key/')) throw failure(config, 404, 'not_found')
    if (config.method === 'post') throw new axios.AxiosError('Lost connection', undefined, config)
    return response(config, {})
  }
  const first = await mount(t)
  await fillCredentials(first.container)
  await submit(first.container.querySelector('form'))
  assert.match(calls[0].url, /by-key/)
  assert.equal(calls.at(-1).method, 'post')
  const firstWrite = JSON.parse(calls.at(-1).data)
  assert.equal(firstWrite.request_key, pending.requestKey)
  assert.ok(
    [...first.container.querySelectorAll('input[type=password]')].every(
      (input) => input.value === '',
    ),
  )
  await first.unmount()
  const second = await mount(t)
  assert.ok(
    [...second.container.querySelectorAll('input[type=password]')].every(
      (input) => input.value === '',
    ),
  )
  http.defaults.adapter = async (config) =>
    response(config, { ...result, meta: { replayed: true } })
  await click(button(second.container, 'Check saved status'))
  assert.equal(recovery.readAdministratorOperation(5, scope).pending, null)
})

test('definitive expired rejection releases recovery while keeping nonsecret creation fields', async (t) => {
  recovery.saveAdministratorOperation(5, scope, pending)
  http.defaults.adapter = async (config) => {
    if (config.url.includes('/by-key/')) throw failure(config, 404, 'not_found')
    if (config.method === 'post') throw failure(config, 409, 'administrator_review_expired')
    return response(config, {})
  }
  const { container } = await mount(t)
  await fillCredentials(container)
  await submit(container.querySelector('form'))
  assert.equal(recovery.readAdministratorOperation(5, scope).pending, null)
  assert.equal(container.querySelector('[name=name]').value, review.name)
  assert.equal(container.querySelector('textarea').value, review.reason)
  assert.equal(container.querySelector('fieldset').disabled, false)
})

test('unknown outcome, CSRF failure, key conflict, and lookup 404 keep recovery frozen', async (t) => {
  recovery.saveAdministratorOperation(5, scope, pending)
  let mode = 'lookup'
  http.defaults.adapter = async (config) => {
    if (config.url.includes('/by-key/')) throw failure(config, 404, 'not_found')
    if (mode === 'csrf') throw failure(config, 422, 'validation')
    if (config.method === 'post')
      throw failure(config, mode === 'server' ? 500 : 409, 'administrator_key_conflict')
    return response(config, {})
  }
  const { container } = await mount(t)
  await click(button(container, 'Check saved status'))
  for (const next of ['csrf', 'server', 'conflict']) {
    mode = next
    await fillCredentials(container)
    await submit(container.querySelector('form'))
    assert.deepEqual(recovery.readAdministratorOperation(5, scope).pending, pending)
  }
})

test('late creation completion after navigation preserves recovery for a verified lookup', async (t) => {
  recovery.saveAdministratorOperation(5, scope, pending)
  let finish
  http.defaults.adapter = (config) =>
    Promise.resolve(
      config.url.includes('/by-key/') ? response(config, result) : response(config, {}),
    )
  const first = await mount(t)
  http.defaults.adapter = (config) =>
    new Promise((resolve) => {
      finish = () => resolve(response(config, result))
    })
  await click(button(first.container, 'Check saved status'))
  await first.unmount()
  await act(async () => finish())
  assert.deepEqual(recovery.readAdministratorOperation(5, scope).pending, pending)
})

test('wrong administrator or actor result cannot clear the pending operation', async (t) => {
  recovery.saveAdministratorOperation(5, scope, pending)
  http.defaults.adapter = async (config) =>
    response(config, { ...result, event: { ...event, actor: { id: 99, name: 'Someone else' } } })
  const { container } = await mount(t)
  await click(button(container, 'Check saved status'))
  assert.deepEqual(recovery.readAdministratorOperation(5, scope).pending, pending)
  assert.match(container.textContent, /result could not be verified/)
})

test('corrupt or changed recovery prevents any new request', async (t) => {
  recovery.saveAdministratorOperation(5, scope, pending)
  let calls = 0
  http.defaults.adapter = async (config) => {
    calls++
    return response(config, {})
  }
  const { container } = await mount(t)
  sessionStorage.setItem('admin-administrators:v1:5:create', '{broken')
  await click(button(container, 'Check saved status'))
  assert.equal(calls, 0)
  assert.match(container.textContent, /No request was sent/)
})

test('self suspension and last active administrator are blocked in the mounted status form', async (t) => {
  const self = await mount(t, Status, {
    administrator: { ...administrator, id: 5 },
    activeCount: 2,
  })
  assert.equal(self.container.querySelector('fieldset').disabled, true)
  assert.match(self.container.textContent, /cannot suspend your own/)
  const last = await mount(t, Status, { administrator, activeCount: 1 })
  assert.equal(last.container.querySelector('fieldset').disabled, true)
  assert.match(last.container.textContent, /last active administrator/)
})

test('administrator suspension requires review, reason, and current password before its immutable event is accepted', async (t) => {
  const statusReview = {
    kind: 'status',
    administrator: {
      id: 8,
      name: administrator.name,
      email: administrator.email,
      status: 'active',
    },
    from_status: 'active',
    to_status: 'suspended',
    reason: 'Coverage has ended',
    active_administrators: 2,
    review_token: 'status-token',
    expires_at: '2030-01-01T00:00:00Z',
  }
  const writes = []
  let saved = 0
  http.defaults.adapter = async (config) => {
    if (config.method !== 'post') return response(config, {})
    writes.push(config)
    if (config.url.endsWith('/status-preview')) return response(config, { data: statusReview })
    assert.equal(JSON.parse(config.data).current_password, 'CurrentPass123!')
    assert.equal(Object.hasOwn(JSON.parse(config.data), 'password'), false)
    return response(config, {
      data: { ...administrator, status: 'suspended' },
      event: {
        ...event,
        action: 'status_changed',
        from_status: 'active',
        to_status: 'suspended',
        reason: statusReview.reason,
      },
      meta: { replayed: false },
    })
  }
  const { container } = await mount(t, Status, {
    administrator,
    activeCount: 2,
    onSaved: () => saved++,
  })
  await fill(container.querySelector('textarea'), statusReview.reason)
  await submit(container.querySelector('form'))
  assert.equal(writes.length, 1)
  assert.match(
    container.querySelector('dialog').textContent,
    /including existing signed-in sessions/,
  )
  await fillCredentials(container.querySelector('dialog'), false)
  await submit(container.querySelector('dialog form'))
  assert.equal(writes.length, 2)
  assert.equal(saved, 1)
  assert.equal(recovery.readAdministratorOperation(5, { kind: 'status', id: 8 }).pending, null)
})

test('retry finds an already committed creation before considering a different re-entered password', async (t) => {
  recovery.saveAdministratorOperation(5, scope, pending)
  const calls = []
  http.defaults.adapter = async (config) => {
    calls.push(config)
    return response(config, { ...result, meta: { replayed: true } })
  }
  const { container } = await mount(t)
  await fillCredentials(container)
  await submit(container.querySelector('form'))
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'get')
  assert.equal(recovery.readAdministratorOperation(5, scope).pending, null)
})

test('credential rejection after an uncertain creation retains the exact request until its original committed result is found', async (t) => {
  recovery.saveAdministratorOperation(5, scope, pending)
  const calls = []
  let committed = false
  http.defaults.adapter = async (config) => {
    calls.push(config)
    if (config.url.includes('/by-key/')) {
      if (!committed) throw failure(config, 404, 'not_found')
      return response(config, { ...result, meta: { replayed: true } })
    }
    if (config.method === 'post') {
      // The original request commits after the retry's lookup but before its
      // different credentials fail proof, which runs before key replay.
      committed = true
      throw failure(config, 422, 'validation', {
        current_password: ['The current password is incorrect.'],
      })
    }
    return response(config, {})
  }
  let saved = 0
  const { container } = await mount(t, Creation, { onSaved: () => saved++ })
  await fillCredentials(container)
  await submit(container.querySelector('form'))
  assert.deepEqual(recovery.readAdministratorOperation(5, scope).pending, pending)
  assert.equal(container.querySelector('[name=name]').closest('fieldset').disabled, true)
  assert.match(container.textContent, /current password is incorrect/)
  assert.equal(saved, 0)
  assert.equal(
    JSON.parse(calls.find((request) => request.method === 'post').data).request_key,
    pending.requestKey,
  )
  await click(button(container, 'Check saved status'))
  assert.equal(saved, 1)
  assert.equal(recovery.readAdministratorOperation(5, scope).pending, null)
  assert.equal(calls.filter((request) => request.method === 'post').length, 1)
})

test('administrator audit history paginates independently and renders actor snapshots', async (t) => {
  const calls = []
  http.defaults.adapter = async (config) => {
    calls.push(config.url)
    const page = Number(new URL(config.url, 'http://local').searchParams.get('page'))
    return response(config, {
      data: [{ ...event, id: page, reason: `Audit page ${page}` }],
      meta: { current_page: page, last_page: 2, total: 11, per_page: 10, from: 1, to: 10 },
    })
  }
  const { container } = await mount(t, History, { id: 8 })
  assert.match(container.textContent, /Existing Admin/)
  assert.match(container.textContent, /Administrator created/)
  await click(container.querySelector('[aria-label="Next page"]'))
  await flush()
  assert.match(container.textContent, /Audit page 2/)
  assert.match(calls.at(-1), /8\/history\?page=2/)
})

test('profile email change requires current password, updates auth in place and clears proof', async (t) => {
  let updated, written
  globalThis.__administratorAuth.updateUser = (value) => {
    updated = value
  }
  http.defaults.adapter = async (config) => {
    if (config.method === 'patch') {
      written = JSON.parse(config.data)
      return response(config, {
        data: {
          ...globalThis.__administratorAuth.user,
          name: 'Updated Admin',
          email: 'updated@example.test',
        },
      })
    }
    return response(config, {})
  }
  const { container } = await mount(t, Profile)
  assert.equal(container.querySelector('input[type=password]'), null)
  await fill(container.querySelector('[name=name]'), 'Updated Admin')
  await fill(container.querySelector('[name=email]'), 'updated@example.test')
  assert.equal(container.querySelector('input[type=password]').required, true)
  await fill(container.querySelector('input[type=password]'), 'CurrentPass123!')
  await submit(container.querySelector('form'))
  assert.equal(written.current_password, 'CurrentPass123!')
  assert.equal(updated.email, 'updated@example.test')
  assert.match(container.textContent, /Profile saved/)
  assert.equal(container.querySelector('input[type=password]').value, '')
})

test('password change clears all credentials on failure and displays server proof errors', async (t) => {
  http.defaults.adapter = async (config) => {
    if (config.method === 'patch')
      throw failure(config, 422, 'validation', {
        current_password: ['The current password is incorrect.'],
      })
    return response(config, {})
  }
  const { container } = await mount(t, Password)
  await fill(container.querySelector('[name=current_password]'), 'WrongPass123!')
  await fill(container.querySelector('[name=password]'), 'NewPass123!')
  await fill(container.querySelector('[name=password_confirmation]'), 'NewPass123!')
  await submit(container.querySelector('form'))
  assert.ok([...container.querySelectorAll('input')].every((input) => input.value === ''))
  assert.match(container.textContent, /current password is incorrect/)
})

test('only definitive administrator mutation responses release recovery', () => {
  const config = { method: 'post', url: '/api/v1/admin/administrators' }
  assert.equal(
    api.definitiveAdministratorRejection(failure(config, 422, 'validation'), scope),
    false,
  )
  for (const field of ['current_password', 'password', 'password_confirmation', 'unrecognized'])
    assert.equal(
      api.definitiveAdministratorRejection(
        failure(config, 422, 'validation', { [field]: ['Invalid value.'] }),
        scope,
      ),
      false,
    )
  assert.equal(
    api.definitiveAdministratorRejection(
      failure(config, 422, 'validation', { email: ['This email is already registered.'] }),
      scope,
    ),
    true,
  )
  assert.equal(
    api.definitiveAdministratorRejection(
      failure(config, 422, 'validation', {
        email: ['Duplicate email.'],
        current_password: ['Invalid proof.'],
      }),
      scope,
    ),
    false,
  )
  assert.equal(
    api.definitiveAdministratorRejection(failure(config, 409, 'administrator_last_active'), scope),
    true,
  )
  for (const [request, status, code] of [
    [{ method: 'get', url: '/sanctum/csrf-cookie' }, 422, 'validation'],
    [config, 409, 'administrator_key_conflict'],
    [config, 403, 'forbidden'],
    [config, 500, 'administrator_review_stale'],
  ])
    assert.equal(api.definitiveAdministratorRejection(failure(request, status, code), scope), false)
})
