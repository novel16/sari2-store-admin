import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { after, beforeEach, test } from 'node:test'
import { pathToFileURL } from 'node:url'
import axios from 'axios'
import { act, createElement } from 'react'
import { installDom } from './dom.mjs'
import { createSourceModule } from './sourceModule.mjs'

const dom = installDom('http://localhost:3001')
after(() => dom.cleanup())
const require = createRequire(import.meta.url)
const imports = Object.fromEntries(
  ['react', 'react/jsx-runtime', 'lucide-react', 'react-router-dom'].map((name) => [
    name,
    pathToFileURL(require.resolve(name)).href,
  ]),
)
const { createRoot } = await import('react-dom/client')
const { MemoryRouter, useLocation, useNavigate } = await import(imports['react-router-dom'])
const sourceModule = createSourceModule(import.meta.url)
const errorsUrl = await sourceModule('../api/errors.ts', { axios: import.meta.resolve('axios') })
const httpUrl = await sourceModule(
  '../api/http.ts',
  { axios: import.meta.resolve('axios') },
  { 'import.meta.env.VITE_API_URL': "'http://localhost:8000'" },
)
const { http } = await import(httpUrl)
const apiUrl = await sourceModule('../auth/api.ts', { '../api/http': httpUrl })
const contextUrl = await sourceModule('../auth/AuthContext.ts', imports)
const useAuthUrl = await sourceModule('../auth/useAuth.ts', {
  ...imports,
  './AuthContext': contextUrl,
})
const providerUrl = await sourceModule('../auth/AuthProvider.tsx', {
  ...imports,
  '../api/errors': errorsUrl,
  './AuthContext': contextUrl,
  './api': apiUrl,
  './access': await sourceModule('../auth/access.ts'),
})
const { AuthProvider } = await import(providerUrl)
const recoveryUrl = await sourceModule('../auth/passwordRecovery.ts')
const recovery = await import(recoveryUrl)
const layoutUrl = await sourceModule('../pages/auth/RecoveryLayout.tsx', {
  ...imports,
  '../../components/Brand': await sourceModule('../components/Brand.tsx', imports),
})
const recoveryErrorUrl = await sourceModule('../pages/auth/RecoveryError.tsx', imports)
const forgotUrl = await sourceModule('../pages/auth/ForgotPasswordPage.tsx', {
  ...imports,
  '../../auth/api': apiUrl,
  '../../api/errors': errorsUrl,
  './RecoveryLayout': layoutUrl,
  './RecoveryError': recoveryErrorUrl,
})
const resetHookUrl = await sourceModule('../auth/usePasswordReset.ts', {
  ...imports,
  '../api/errors': errorsUrl,
  './api': apiUrl,
  './passwordRecovery': recoveryUrl,
  './useAuth': useAuthUrl,
})
const resetFormUrl = await sourceModule('../pages/auth/ResetPasswordForm.tsx', {
  ...imports,
  './RecoveryError': recoveryErrorUrl,
})
const resetUrl = await sourceModule('../pages/auth/ResetPasswordPage.tsx', {
  ...imports,
  '../../auth/passwordRecovery': recoveryUrl,
  '../../auth/usePasswordReset': resetHookUrl,
  './RecoveryLayout': layoutUrl,
  './RecoveryError': recoveryErrorUrl,
  './ResetPasswordForm': resetFormUrl,
})
const loginFormUrl = await sourceModule(
  '../pages/auth/LoginForm.tsx',
  {
    ...imports,
    '../../components/Brand': await sourceModule('../components/Brand.tsx', imports),
    '../../auth/useAuth': useAuthUrl,
    '../../api/errors': errorsUrl,
  },
  { 'import.meta.env.VITE_CLIENT_URL': "'http://localhost:3000'" },
)
const loadingUrl = await sourceModule('../components/PageLoading.tsx', imports)
const gateUrl = await sourceModule('../auth/SessionGate.tsx', {
  ...imports,
  './useAuth': useAuthUrl,
  '../api/errors': errorsUrl,
  '../components/Brand': await sourceModule('../components/Brand.tsx', imports),
})
const loginUrl = await sourceModule('../pages/auth/LoginPage.tsx', {
  ...imports,
  '../../auth/useAuth': useAuthUrl,
  '../../auth/access': await sourceModule('../auth/access.ts'),
  '../../auth/SessionGate': gateUrl,
  '../../components/PageLoading': loadingUrl,
  './LoginForm': loginFormUrl,
})
const inlineModule = (source) =>
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const outletUrl = inlineModule(
  `import {createElement} from '${imports.react}';import {Outlet} from '${imports['react-router-dom']}';export default function Layout(){return createElement(Outlet)}`,
)
const otherPageUrl = inlineModule("export default function Page(){return 'Protected page'}")
const pageImports = Object.fromEntries(
  [
    'dashboard/DashboardPage',
    'accounts/AccountsPage',
    'accounts/AccountDetailsPage',
    'stores/StoresPage',
    'stores/StoreDetailsPage',
    'NotFoundPage',
    'plans/PlansPage',
    'plans/PlanEditorPage',
    'subscriptions/AccountSubscriptionPage',
    'administrators/AdministratorsPage',
    'administrators/CreateAdministratorPage',
    'administrators/AdministratorDetailsPage',
    'settings/SettingsPage',
    'activity/ActivityPage',
    'subscriptions/SubscriptionMonitoringPage',
  ].map((name) => [`../pages/${name}`, otherPageUrl]),
)
const { default: AppRoutes } = await import(
  await sourceModule('../routes/AppRoutes.tsx', {
    ...imports,
    ...pageImports,
    '../auth/RequireAdmin': await sourceModule('../auth/RequireAdmin.tsx', {
      ...imports,
      './useAuth': useAuthUrl,
      '../components/PageLoading': loadingUrl,
      './SessionGate': gateUrl,
      './access': await sourceModule('../auth/access.ts'),
    }),
    './RouteBoundary': await sourceModule('../routes/RouteBoundary.tsx', {
      ...imports,
      '../components/PageLoading': loadingUrl,
    }),
    '../layouts/AdminLayout': outletUrl,
    '../pages/auth/LoginPage': loginUrl,
    '../pages/auth/ForgotPasswordPage': forgotUrl,
    '../pages/auth/ResetPasswordPage': resetUrl,
  })
)

const token = 'ab'.repeat(32)
const email = 'admin+recovery@example.test'
const password = 'my-new-private-password'
const resetPath = `/reset-password?token=${token}&email=${encodeURIComponent(email)}`
const admin = {
  id: 1,
  name: 'Administrator',
  email,
  status: 'active',
  platform_role: 'platform_admin',
}
const response = (config, data = {}) => ({
  config,
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
})
const failure = (status, data = {}) =>
  new axios.AxiosError('Request failed', undefined, undefined, undefined, { status, data })
let calls, respond, initialUser
beforeEach(() => {
  calls = []
  initialUser = null
  localStorage.clear()
  sessionStorage.clear()
  respond = (config) => {
    if (config.url === '/api/v1/admin/me') {
      if (initialUser) return response(config, { data: initialUser })
      throw failure(401)
    }
    return response(config, { message: 'Internal account-specific text must not be rendered.' })
  }
  http.defaults.adapter = async (config) => {
    calls.push(config)
    return respond(config)
  }
})
function Location() {
  const location = useLocation()
  const navigate = useNavigate()
  return createElement(
    'aside',
    null,
    createElement(
      'output',
      { 'data-location': true },
      JSON.stringify({
        path: location.pathname + location.search + location.hash,
        state: location.state,
      }),
    ),
    createElement('button', { 'data-back': true, onClick: () => navigate(-1) }, 'Go back'),
    createElement(
      'button',
      { 'data-other-page': true, onClick: () => navigate('/settings') },
      'Open another page',
    ),
  )
}
async function flush(delay = 0) {
  await act(async () => new Promise((resolve) => setTimeout(resolve, delay)))
}
async function mount(t, path = '/forgot-password') {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  t.after(async () => {
    await act(async () => root.unmount())
    container.remove()
  })
  await act(async () =>
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries: ['/dashboard', path] },
        createElement(AuthProvider, null, createElement(AppRoutes), createElement(Location)),
      ),
    ),
  )
  await flush()
  return container
}
async function change(node, value) {
  assert.ok(node)
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(
      node,
      value,
    )
    node.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  })
}
async function submit(container) {
  const form = container.querySelector('form')
  assert.ok(form)
  await act(async () =>
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })),
  )
  await flush()
}
async function fillReset(container, next = password, confirmation = next) {
  await change(container.querySelector('[name=password]'), next)
  await change(container.querySelector('[name=password_confirmation]'), confirmation)
}
const location = (container) => JSON.parse(container.querySelector('[data-location]').textContent)
const posts = (path) =>
  calls.filter((call) => call.method === 'post' && (!path || call.url === path))
const button = (container, text) =>
  [...container.querySelectorAll('button')].find((node) => node.textContent === text)

test('reset link parser accepts standard Laravel tokens and rejects ambiguous or malformed links', () => {
  assert.deepEqual(
    recovery.resetLinkFromSearch(
      `?email=${encodeURIComponent('Admin+Recovery@Example.test')}&token=${token.toUpperCase()}`,
    ),
    { email, token: token.toUpperCase() },
  )
  for (const search of [
    '',
    '?token=x',
    `?email=x&token=${token}`,
    `?email=a%00b@example.test&token=${token}`,
    `?email=${email}&token=${'x'.repeat(64)}`,
    `?email=${email}&token=${token}&token=${token}`,
    `?email=${email}&email=x@example.test&token=${token}`,
    `?email=${'a'.repeat(255)}@example.test&token=${token}`,
  ])
    assert.equal(recovery.resetLinkFromSearch(search), null)
})

test('password validation follows Unicode length, UTF-8 bcrypt bytes, null, and confirmation rules', () => {
  assert.deepEqual(recovery.passwordRecoveryFields('a'.repeat(72), 'a'.repeat(72)), {})
  assert.deepEqual(recovery.passwordRecoveryFields('😀'.repeat(18), '😀'.repeat(18)), {})
  for (const value of ['short', '😀'.repeat(4), '😀'.repeat(19), 'a'.repeat(73), 'long\0password'])
    assert.ok(recovery.passwordRecoveryFields(value, value).password)
  assert.ok(recovery.passwordRecoveryFields(password, 'different').password_confirmation)
})

test('forgot page remains public with a signed-in admin and sends normalized email with generic success copy', async (t) => {
  initialUser = admin
  const container = await mount(t)
  await change(container.querySelector('[name=email]'), '  ADMIN+RECOVERY@EXAMPLE.TEST  ')
  await submit(container)
  assert.equal(location(container).path, '/forgot-password')
  assert.deepEqual(JSON.parse(posts('/forgot-password')[0].data), { email })
  assert.ok(calls.find((call) => call.url === '/sanctum/csrf-cookie'))
  assert.match(container.querySelector('[role=status]').textContent, /If an account matches/)
  assert.doesNotMatch(container.textContent, /Internal account-specific/)
  assert.equal(localStorage.length, 0)
  assert.equal(sessionStorage.length, 0)
  await act(async () => button(container, 'Try a different email').click())
  assert.equal(container.querySelector('[name=email]').value, '')
})

for (const [label, status, expected] of [
  ['validation', 422, /highlighted fields/],
  ['rate limit', 429, /Too many attempts/],
  ['CSRF expiration', 419, /secure session has expired/],
  ['network failure', undefined, /Unable to connect/],
])
  test(`forgot form presents ${label} safely without claiming an email was sent`, async (t) => {
    respond = (config) => {
      if (config.url === '/api/v1/admin/me') throw failure(401)
      if (config.url === '/forgot-password') {
        if (!status) throw new axios.AxiosError('Secret connection details')
        throw failure(status, {
          message: 'Private server text',
          errors: { email: ['Enter a valid email.'] },
        })
      }
      return response(config)
    }
    const container = await mount(t)
    await change(container.querySelector('[name=email]'), email)
    await submit(container)
    assert.match(container.querySelector('[role=alert]').textContent, expected)
    assert.doesNotMatch(
      container.textContent,
      /Private server text|Secret connection details|Check your inbox/,
    )
    assert.equal(posts('/forgot-password').length, status === 419 ? 2 : 1)
    if (status === 422)
      assert.equal(container.querySelector('[name=email]').getAttribute('aria-invalid'), 'true')
  })

test('malformed reset links display recovery without a form or automatic writes', async (t) => {
  for (const path of [
    '/reset-password',
    `/reset-password?token=${token}`,
    '/reset-password?token=invalid&email=admin@example.test',
  ]) {
    await t.test(path, async (child) => {
      const container = await mount(child, path)
      assert.match(container.querySelector('[role=alert]').textContent, /incomplete or invalid/)
      assert.equal(container.querySelector('form'), null)
      assert.equal(posts().length, 0)
      assert.equal(
        container.querySelector('a[href="/forgot-password"]').textContent,
        'Request a new password reset link.',
      )
    })
  }
})

test('reset form rejects mismatched, short, null, or oversized Unicode passwords before posting', async (t) => {
  const container = await mount(t, resetPath)
  for (const [next, confirmation, message] of [
    [password, 'different', /same password/],
    ['short', 'short', /at least 8/],
    ['😀'.repeat(19), '😀'.repeat(19), /72-byte/],
    ['long\0password', 'long\0password', /null character/],
  ]) {
    await fillReset(container, next, confirmation)
    await submit(container)
    assert.match(container.textContent, message)
    assert.equal(posts('/reset-password').length, 0)
  }
})

test('reset stays public with an owner session, then signs out and refreshes before showing admin login success', async (t) => {
  let signedOut = false
  respond = (config) => {
    if (config.url === '/api/v1/admin/me') {
      if (!signedOut) throw failure(403)
      throw failure(401)
    }
    if (config.url === '/logout') {
      signedOut = true
      return response(config)
    }
    return response(config, { message: 'Password reset.' })
  }
  const container = await mount(t, resetPath + '#private-fragment')
  assert.ok(container.querySelector('form'))
  assert.equal(container.querySelector('input[type=email]').readOnly, true)
  assert.equal(container.querySelector('input[name=token]'), null)
  assert.equal(posts().length, 0)
  await fillReset(container)
  await submit(container)
  assert.deepEqual(JSON.parse(posts('/reset-password')[0].data), {
    email,
    token,
    password,
    password_confirmation: password,
  })
  assert.equal(posts('/logout').length, 1)
  assert.equal(calls.at(-1).url, '/api/v1/admin/me')
  assert.deepEqual(location(container), { path: '/login', state: { passwordReset: true } })
  assert.match(
    container.querySelector('[role=status]').textContent,
    /Sign in with your new password/,
  )
  assert.equal(container.querySelector('[name=password]').value, '')
  assert.equal(
    container.querySelector('a[href="/forgot-password"]').textContent,
    'Forgot password?',
  )
  assert.equal(localStorage.length, 0)
  assert.equal(sessionStorage.length, 0)
  await act(async () => container.querySelector('[data-back]').click())
  assert.deepEqual(location(container), { path: '/login', state: { returnTo: '/dashboard' } })
  assert.doesNotMatch(JSON.stringify(location(container)), new RegExp(token))
})

test('expired or reused reset links show the server validation and a new-link action without signing out', async (t) => {
  respond = (config) => {
    if (config.url === '/api/v1/admin/me') throw failure(401)
    if (config.url === '/reset-password')
      throw failure(422, { errors: { email: ['This password reset token is invalid.'] } })
    return response(config)
  }
  const container = await mount(t, resetPath)
  await fillReset(container)
  await submit(container)
  assert.match(container.textContent, /This password reset token is invalid/)
  assert.ok(container.querySelector('a[href="/forgot-password"]'))
  assert.equal(posts('/reset-password').length, 1)
  assert.equal(posts('/logout').length, 0)
  assert.equal(container.querySelector('[name=password]').value, '')
  assert.equal(container.querySelector('[name=password_confirmation]').value, '')
})

for (const status of [undefined, 503])
  test(`an ambiguous reset ${status || 'network'} response offers sign-in and new-link actions without replay`, async (t) => {
    respond = (config) => {
      if (config.url === '/api/v1/admin/me') throw failure(401)
      if (config.url === '/reset-password')
        throw status
          ? failure(status, { message: 'Private SQL credentials' })
          : new axios.AxiosError('Offline secret')
      return response(config)
    }
    const container = await mount(t, resetPath)
    await fillReset(container)
    await submit(container)
    assert.match(
      container.querySelector('[role=alert]').textContent,
      /could not confirm whether your password changed/,
    )
    assert.ok(
      [...container.querySelectorAll('a')].find((node) => node.textContent === 'Try signing in'),
    )
    assert.ok(
      [...container.querySelectorAll('a')].find(
        (node) => node.textContent === 'Request a new link',
      ),
    )
    assert.equal(posts('/reset-password').length, 1)
    assert.equal(posts('/logout').length, 0)
    assert.equal(container.querySelector('[name=password]').value, '')
    assert.doesNotMatch(container.textContent, /Private SQL|Offline secret/)
  })

test('a reset CSRF failure refreshes once and completes without automatic login', async (t) => {
  let attempts = 0
  respond = (config) => {
    if (config.url === '/api/v1/admin/me') throw failure(401)
    if (config.url === '/reset-password' && ++attempts === 1) throw failure(419)
    return response(config)
  }
  const container = await mount(t, resetPath)
  await fillReset(container)
  await submit(container)
  assert.equal(posts('/reset-password').length, 2)
  assert.equal(calls.filter((call) => call.url === '/sanctum/csrf-cookie').length, 3)
  assert.equal(location(container).path, '/login')
  assert.equal(posts('/admin/login').length, 0)
})

for (const status of [419, 429])
  test(`persistent reset ${status} failure remains bounded and does not finish sign-out`, async (t) => {
    respond = (config) => {
      if (config.url === '/api/v1/admin/me') throw failure(401)
      if (config.url === '/reset-password') throw failure(status)
      return response(config)
    }
    const container = await mount(t, resetPath)
    await fillReset(container)
    await submit(container)
    assert.match(
      container.querySelector('[role=alert]').textContent,
      status === 419 ? /secure session has expired/ : /Too many attempts/,
    )
    assert.equal(posts('/reset-password').length, status === 419 ? 2 : 1)
    assert.equal(posts('/logout').length, 0)
    assert.equal(location(container).path, resetPath)
  })

test('a logout network failure retires the reset token and retries only completion; logout 401 is expected', async (t) => {
  let logoutAttempts = 0
  respond = (config) => {
    if (config.url === '/api/v1/admin/me') throw failure(401)
    if (config.url === '/logout') {
      if (++logoutAttempts === 1) throw new axios.AxiosError('Connection lost')
      throw failure(401)
    }
    return response(config)
  }
  const container = await mount(t, resetPath)
  await fillReset(container)
  await submit(container)
  assert.deepEqual(location(container), { path: '/reset-password', state: null })
  assert.equal(container.querySelector('form'), null)
  assert.match(container.textContent, /sign out any account in this browser/)
  assert.match(container.querySelector('[role=alert]').textContent, /Unable to connect/)
  assert.doesNotMatch(container.innerHTML, new RegExp(token))
  await act(async () => button(container, 'Continue to sign in').click())
  await flush()
  assert.equal(posts('/reset-password').length, 1)
  assert.equal(posts('/logout').length, 2)
  assert.equal(location(container).path, '/login')
})

test('strict completion refresh failures remain retryable without replaying the completed reset', async (t) => {
  let reads = 0
  respond = (config) => {
    if (config.url === '/api/v1/admin/me') {
      if (++reads === 2) throw new axios.AxiosError('Offline')
      throw failure(401)
    }
    if (config.url === '/logout') throw failure(401)
    return response(config)
  }
  const container = await mount(t, resetPath)
  await fillReset(container)
  await submit(container)
  assert.equal(location(container).path, '/reset-password')
  assert.match(container.querySelector('[role=alert]').textContent, /Unable to connect/)
  await act(async () => button(container, 'Continue to sign in').click())
  await flush()
  assert.equal(posts('/reset-password').length, 1)
  assert.equal(reads, 3)
  assert.equal(location(container).path, '/login')
})

test('pending reset ignores double submission and clears volatile password fields before the request resolves', async (t) => {
  let finishReset
  respond = (config) => {
    if (config.url === '/api/v1/admin/me') throw failure(401)
    if (config.url === '/reset-password')
      return new Promise((resolve) => {
        finishReset = () => resolve(response(config))
      })
    return response(config)
  }
  const container = await mount(t, resetPath)
  await fillReset(container)
  await submit(container)
  assert.equal(container.querySelector('[name=password]').value, '')
  assert.equal(container.querySelector('fieldset').disabled, true)
  await submit(container)
  assert.equal(posts('/reset-password').length, 1)
  await act(async () => finishReset())
  await flush()
  assert.equal(location(container).path, '/login')
})

test('a late reset response after leaving the page does not log out a newer browser identity or navigate away', async (t) => {
  let finishReset
  let currentIdentity = admin
  let signedOutIdentity = null
  respond = (config) => {
    if (config.url === '/api/v1/admin/me') return response(config, { data: currentIdentity })
    if (config.url === '/reset-password')
      return new Promise((resolve) => {
        finishReset = () => resolve(response(config))
      })
    if (config.url === '/logout') signedOutIdentity = currentIdentity.id
    return response(config)
  }
  const container = await mount(t, resetPath)
  await fillReset(container)
  await submit(container)
  await act(async () => container.querySelector('[data-other-page]').click())
  await flush()
  currentIdentity = { ...admin, id: 2, name: 'Another administrator' }
  await act(async () => finishReset())
  await flush()
  assert.equal(location(container).path, '/settings')
  assert.equal(signedOutIdentity, null)
  assert.equal(posts('/logout').length, 0)
  assert.equal(calls.filter((call) => call.url === '/api/v1/admin/me').length, 1)
})

test('admin HTML applies no-referrer before resource links so token URLs are not sent as referrers', async () => {
  const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8')
  const policy = html.indexOf('<meta name="referrer" content="no-referrer"')
  assert.ok(policy > 0 && policy < html.indexOf('<link'))
})
