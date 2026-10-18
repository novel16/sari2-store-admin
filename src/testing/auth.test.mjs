import assert from 'node:assert/strict'
import test from 'node:test'
import axios from 'axios'
import { createSourceModule } from './sourceModule.mjs'

const sourceModule = createSourceModule(import.meta.url)
const axiosUrl = import.meta.resolve('axios')
const access = await import(await sourceModule('../auth/access.ts'))
const { http, postWithCsrf } = await import(
  await sourceModule(
    '../api/http.ts',
    { axios: axiosUrl },
    { 'import.meta.env.VITE_API_URL': "'http://localhost:8000/'" },
  )
)
const { authApi } = await import(
  await sourceModule('../auth/api.ts', {
    '../api/http': await sourceModule(
      '../api/http.ts',
      { axios: axiosUrl },
      { 'import.meta.env.VITE_API_URL': "'http://localhost:8000/'" },
    ),
  })
)
const { toApiError } = await import(await sourceModule('../api/errors.ts', { axios: axiosUrl }))

test('only an active platform administrator can access the admin app', () => {
  assert.equal(access.canAccessAdmin({ platform_role: 'platform_admin', status: 'active' }), true)
  for (const user of [
    { platform_role: null, status: 'active' },
    { platform_role: 'owner', status: 'active' },
    { platform_role: 'platform_admin', status: 'suspended' },
  ])
    assert.equal(access.canAccessAdmin(user), false)
})

test('return paths only allow known internal admin pages', () => {
  for (const path of [
    '/dashboard',
    '/accounts?status=suspended&page=2',
    '/stores/12#details',
    '/administrators',
    '/administrators/new',
    '/administrators/8',
    '/settings',
    '/activity?module=plans&cursor=opaque-value',
  ])
    assert.equal(access.safeReturnTo(path), path)
  for (const path of [
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/login',
    '/accounts/0',
    '/accounts/x',
    '/administrators/0',
    '/administrators/8/password',
    '/settings/password',
    '/%2f%2fevil.test',
    '/stores\n/1',
    null,
    {},
  ])
    assert.equal(access.safeReturnTo(path), '/dashboard')
  assert.equal(access.returnToFromState({ returnTo: '/accounts/4' }), '/accounts/4')
  assert.equal(access.returnToFromState(undefined), '/dashboard')
})

function adapter(respond) {
  const calls = []
  http.defaults.adapter = async (config) => {
    calls.push({ url: config.url, method: config.method, data: config.data })
    return { data: respond(config, calls), status: 200, statusText: 'OK', headers: {}, config }
  }
  return calls
}
function failure(status, data) {
  return new axios.AxiosError('Request failed', undefined, undefined, undefined, { status, data })
}

test('admin authentication uses credentialed cookies, CSRF, and the admin login endpoint', async () => {
  assert.equal(http.defaults.baseURL, 'http://localhost:8000')
  assert.equal(http.defaults.withCredentials, true)
  assert.equal(http.defaults.withXSRFToken, true)
  const user = { id: 1, platform_role: 'platform_admin', status: 'active' }
  const calls = adapter(() => ({ data: user }))
  assert.deepEqual(
    await authApi.login({
      email: 'admin@example.test',
      password: 'example-password',
      remember: true,
    }),
    user,
  )
  assert.deepEqual(
    calls.map((call) => [call.method, call.url]),
    [
      ['get', '/sanctum/csrf-cookie'],
      ['post', '/admin/login'],
    ],
  )
  assert.equal(JSON.parse(calls[1].data).remember, true)
  assert.deepEqual(await authApi.me(), user)
  await authApi.logout()
  assert.equal(calls.at(-1).url, '/logout')
})

test('an expired CSRF token retries once, with a freshly issued token', async () => {
  let posts = 0
  const calls = adapter((config) => {
    if (config.method === 'post' && ++posts === 1) throw failure(419)
    return { ok: true }
  })
  assert.deepEqual(await postWithCsrf('/admin/login', {}), { ok: true })
  assert.equal(posts, 2)
  assert.equal(calls.filter((call) => call.url === '/sanctum/csrf-cookie').length, 2)
})

test('persistent CSRF errors are bounded and network errors never replay login', async () => {
  const calls = adapter((config) => {
    if (config.method === 'post') throw failure(419)
    return {}
  })
  await assert.rejects(postWithCsrf('/admin/login', {}))
  assert.equal(calls.filter((call) => call.method === 'post').length, 2)
  const offline = adapter((config) => {
    if (config.method === 'post') throw new axios.AxiosError('Offline')
    return {}
  })
  await assert.rejects(postWithCsrf('/admin/login', {}))
  assert.equal(offline.filter((call) => call.method === 'post').length, 1)
})

test('API errors preserve safe validation messages without leaking server exceptions', () => {
  const validation = toApiError(
    failure(422, { errors: { email: ['Wrong credentials.', 42], password: 'invalid' } }),
  )
  assert.equal(validation.status, 422)
  assert.deepEqual(validation.fields, { email: ['Wrong credentials.'] })
  assert.equal(
    toApiError(failure(500, { message: 'SQL password=secret' })).message.includes('secret'),
    false,
  )
  for (const status of [401, 403, 404, 419, 429])
    assert.equal(toApiError(failure(status)).status, status)
  assert.match(toApiError(new axios.AxiosError('Offline')).message, /connect/)
})
