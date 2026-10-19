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
  ['react', 'react/jsx-runtime', 'lucide-react', 'react-router-dom'].map((name) => [
    name,
    pathToFileURL(require.resolve(name)).href,
  ]),
)
const dom = installDom('http://localhost:3001')
after(() => dom.cleanup())
const { createRoot } = await import('react-dom/client')
const { MemoryRouter, useLocation } = await import(imports['react-router-dom'])
const httpUrl = await source(
  '../api/http.ts',
  { axios: import.meta.resolve('axios') },
  { 'import.meta.env.VITE_API_URL': "'http://localhost:8000'" },
)
const { http } = await import(httpUrl)
const formatUrl = await source('../platform/format.ts')
const filtersUrl = await source('../subscriptionPayments/filters.ts', {
  '../platform/directory': await source('../platform/directory.ts'),
})
const { readPaymentFilters, paymentsPath } = await import(filtersUrl)
const { safeReturnTo } = await import(await source('../auth/access.ts'))
const queryUrl = await source('../hooks/useApiQuery.ts', {
  ...imports,
  axios: import.meta.resolve('axios'),
  '../api/http': httpUrl,
  '../api/errors': await source('../api/errors.ts', { axios: import.meta.resolve('axios') }),
  '../auth/useAuth': 'data:text/javascript,export const useAuth=()=>globalThis.__billingAdminAuth',
})
const { default: Workspace } = await import(
  await source('../subscriptionPayments/PaymentsWorkspace.tsx', {
    ...imports,
    '../hooks/useApiQuery': queryUrl,
    '../components/PageHeader': await source('../components/PageHeader.tsx', imports),
    '../components/QueryState': await source('../components/QueryState.tsx', imports),
    '../components/EmptyState': await source('../components/EmptyState.tsx', imports),
    '../components/Pagination': await source('../components/Pagination.tsx', {
      ...imports,
      '../platform/format': formatUrl,
    }),
    './PaymentControls': await source('../subscriptionPayments/PaymentControls.tsx', {
      ...imports,
      './filters': filtersUrl,
    }),
    './PaymentsTable': await source('../subscriptionPayments/PaymentsTable.tsx', {
      ...imports,
      '../platform/format': formatUrl,
      './filters': filtersUrl,
    }),
    './usePaymentFilters': await source('../subscriptionPayments/usePaymentFilters.ts', {
      ...imports,
      '../hooks/useDebouncedValue': await source('../hooks/useDebouncedValue.ts', imports),
      './filters': filtersUrl,
    }),
  })
)
const payment = {
  id: '8e0a7515-2d4c-493a-bd38-399b5192818a',
  account: { id: 12, name: 'Reyes Stores', status: 'active' },
  owner: { id: 9, name: 'Ana Reyes', email: 'ana@example.test' },
  plan: { name: 'Basic saved' },
  months: 2,
  amount_centavos: 9800,
  payment_status: 'paid',
  fulfillment_status: 'needs_attention',
  created_at: '2026-10-18T04:00:00Z',
  paid_at: '2026-10-18T04:01:00Z',
  fulfilled_at: null,
  issue_code: 'account_suspended',
}
const reply = (config, rows = [payment], meta = {}) => ({
  config,
  data: {
    data: rows,
    meta: {
      current_page: 1,
      last_page: 1,
      total: rows.length,
      from: rows.length ? 1 : null,
      to: rows.length || null,
      per_page: 20,
      ...meta,
    },
  },
  status: 200,
  statusText: 'OK',
  headers: {},
})
let calls, handler
beforeEach(() => {
  calls = []
  localStorage.clear()
  sessionStorage.clear()
  globalThis.__billingAdminAuth = { refresh: async () => {} }
  handler = (config) => reply(config)
  http.defaults.adapter = async (config) => {
    calls.push(config)
    return handler(config)
  }
})
function Location() {
  return createElement('output', { 'data-location': true }, useLocation().search)
}
async function mount(t, entry = '/subscription-payments') {
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
        { initialEntries: [entry] },
        createElement(Workspace),
        createElement(Location),
      ),
    ),
  )
  return container
}
const button = (container, label) =>
  [...container.querySelectorAll('button')].find(
    (element) => element.textContent === label || element.getAttribute('aria-label') === label,
  )
const click = (element) =>
  act(async () => {
    assert.ok(element)
    element.click()
  })
async function select(container, index, value) {
  await act(async () => {
    const element = container.querySelectorAll('select')[index]
    element.value = value
    element.dispatchEvent(new Event('change', { bubbles: true }))
  })
}
const latest = () => new URL(calls.at(-1).url, 'http://localhost:8000').searchParams

test('payment filter paths sanitize statuses and preserve encoded search and pagination', () => {
  const parsed = readPaymentFilters(
    new URLSearchParams('q=A%26B&payment_status=evil&fulfillment_status=fulfilled&page=3'),
  )
  assert.equal(parsed.payment_status, 'all')
  assert.equal(parsed.fulfillment_status, 'fulfilled')
  assert.equal(new URL(paymentsPath(parsed), 'http://localhost').searchParams.get('q'), 'A&B')
  assert.equal(
    safeReturnTo('/subscription-payments?payment_status=paid'),
    '/subscription-payments?payment_status=paid',
  )
})
test('payment list distinguishes verified payment and activation with safe related links and no writes', async (t) => {
  const container = await mount(t)
  assert.match(container.textContent, /Reyes Stores/)
  assert.match(container.textContent, /Basic saved/)
  assert.match(container.textContent, /98\.00/)
  assert.match(container.textContent, /Needs attention/)
  assert.match(container.textContent, /Avoid a second charge/)
  assert.match(container.textContent, /12:00 PM/)
  assert.equal(
    container.querySelector('a[href="/accounts/12/subscription"]').textContent,
    'View subscription',
  )
  assert.ok(calls.every((config) => config.method === 'get'))
  assert.equal(localStorage.length + sessionStorage.length, 0)
  assert.ok(
    ![...container.querySelectorAll('button')].some((element) =>
      /mark.*paid/i.test(element.textContent),
    ),
  )
})
test('payment and activation filters reset the current page and preserve each other', async (t) => {
  const container = await mount(t, '/subscription-payments?page=3')
  await select(container, 0, 'paid')
  assert.equal(latest().get('page'), '1')
  assert.equal(latest().get('payment_status'), 'paid')
  await select(container, 1, 'needs_attention')
  assert.equal(latest().get('payment_status'), 'paid')
  assert.equal(latest().get('fulfillment_status'), 'needs_attention')
  assert.ok(!container.querySelector('[data-location]').textContent.includes('page=3'))
})
test('pagination preserves payment filters and refresh repeats the current read', async (t) => {
  handler = (config) =>
    reply(config, [payment], {
      current_page: Number(new URL(config.url, 'http://localhost').searchParams.get('page')),
      last_page: 3,
      total: 44,
    })
  const container = await mount(t, '/subscription-payments?payment_status=paid')
  await click(button(container, 'Next page'))
  assert.equal(latest().get('page'), '2')
  assert.equal(latest().get('payment_status'), 'paid')
  const path = calls.at(-1).url
  await click(button(container, 'Refresh'))
  assert.equal(calls.at(-1).url, path)
})
test('debounced search safely encodes owner names and resets pagination', async (t) => {
  const container = await mount(t, '/subscription-payments?page=2')
  await act(async () => {
    const input = container.querySelector('input')
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Ana & Co')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => new Promise((resolve) => setTimeout(resolve, 350)))
  assert.equal(latest().get('q'), 'Ana & Co')
  assert.equal(latest().get('page'), '1')
})
test('empty records offer a filter reset', async (t) => {
  handler = (config) => reply(config, [])
  const container = await mount(t, '/subscription-payments?payment_status=failed')
  assert.match(container.textContent, /No payments found/)
  await click(button(container, 'Reset filters'))
  assert.equal(latest().get('payment_status'), 'all')
})
test('provider errors stay sanitized and can retry the same read', async (t) => {
  handler = (config) => {
    throw new axios.AxiosError('Private provider credentials', 'ERR_BAD_RESPONSE', config, null, {
      status: 500,
      data: { message: 'Private provider credentials' },
    })
  }
  const container = await mount(t)
  assert.ok(container.querySelector('[role=alert]'))
  assert.ok(!container.textContent.includes('Private provider credentials'))
  handler = (config) => reply(config)
  await click(button(container, 'Try again'))
  assert.match(container.textContent, /Reyes Stores/)
})
