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
  ['react', 'react/jsx-runtime', 'lucide-react', 'react-router-dom'].map((name) => [
    name,
    pathToFileURL(require.resolve(name)).href,
  ]),
)
const dom = installDom('http://localhost:3001')
after(() => dom.cleanup())
const { createRoot } = await import('react-dom/client')
const { MemoryRouter, useLocation } = await import(imports['react-router-dom'])
const errorsUrl = await sourceModule('../api/errors.ts', { axios: import.meta.resolve('axios') })
const httpUrl = await sourceModule(
  '../api/http.ts',
  { axios: import.meta.resolve('axios') },
  {
    'import.meta.env.VITE_API_URL': "'http://localhost:8000'",
  },
)
const { http } = await import(httpUrl)
const formatUrl = await sourceModule('../platform/format.ts')
const directoryUrl = await sourceModule('../platform/directory.ts')
const filtersUrl = await sourceModule('../subscriptionMonitoring/filters.ts', {
  '../platform/directory': directoryUrl,
})
const filters = await import(filtersUrl)
const { safeReturnTo } = await import(await sourceModule('../auth/access.ts'))
const queryUrl = await sourceModule('../hooks/useApiQuery.ts', {
  ...imports,
  axios: import.meta.resolve('axios'),
  '../api/http': httpUrl,
  '../api/errors': errorsUrl,
  '../auth/useAuth': 'data:text/javascript,export const useAuth=()=>globalThis.__monitoringAuth',
})
const hookUrl = await sourceModule('../subscriptionMonitoring/useMonitoringFilters.ts', {
  ...imports,
  '../hooks/useDebouncedValue': await sourceModule('../hooks/useDebouncedValue.ts', imports),
  './filters': filtersUrl,
})
const controlsUrl = await sourceModule('../subscriptionMonitoring/MonitoringFilters.tsx', {
  ...imports,
  './filters': filtersUrl,
})
const summaryUrl = await sourceModule('../subscriptionMonitoring/MonitoringSummary.tsx', {
  ...imports,
  '../platform/format': formatUrl,
})
const tableUrl = await sourceModule('../subscriptionMonitoring/MonitoringTable.tsx', {
  ...imports,
  '../components/StatusBadge': await sourceModule('../components/StatusBadge.tsx', imports),
  '../platform/format': formatUrl,
  './filters': filtersUrl,
})
const { default: Workspace } = await import(
  await sourceModule('../subscriptionMonitoring/MonitoringWorkspace.tsx', {
    ...imports,
    '../components/EmptyState': await sourceModule('../components/EmptyState.tsx', imports),
    '../components/PageHeader': await sourceModule('../components/PageHeader.tsx', imports),
    '../components/Pagination': await sourceModule('../components/Pagination.tsx', {
      ...imports,
      '../platform/format': formatUrl,
    }),
    '../components/QueryState': await sourceModule('../components/QueryState.tsx', imports),
    '../hooks/useApiQuery': queryUrl,
    '../platform/format': formatUrl,
    './MonitoringFilters': controlsUrl,
    './MonitoringSummary': summaryUrl,
    './MonitoringTable': tableUrl,
    './useMonitoringFilters': hookUrl,
  })
)

const row = {
  account: { id: 12, name: 'Reyes Stores', status: 'active' },
  owner: { id: 9, name: 'Ana Reyes', email: 'ana@example.test', status: 'active' },
  state: 'active_basic',
  is_expiring: false,
  is_paid: true,
  current: {
    subscription_id: 10,
    plan: { code: 'basic', name: 'Basic at purchase' },
    starts_at: '2026-10-01T00:00:00Z',
    ends_at: '2026-10-20T00:00:00Z',
  },
  coverage_ends_at: '2026-12-20T00:00:00Z',
  next_period: {
    id: 11,
    plan: { code: 'basic', name: 'Renewal snapshot' },
    starts_at: '2026-10-20T00:00:00Z',
    ends_at: '2026-11-20T00:00:00Z',
  },
  scheduled_periods: 2,
  last_paid_ended_at: null,
}
const reply = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} })
function response(config, rows = [row], meta = {}, summary = {}) {
  return reply(config, {
    data: rows,
    summary: {
      total: 9,
      active_basic: 4,
      expiring: 2,
      expired_paid: 1,
      free: 4,
      other_paid: 0,
      ...summary,
    },
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: rows.length,
      from: rows.length ? 1 : null,
      to: rows.length || null,
      filters: {},
      time_zone: 'Asia/Manila',
      generated_at: '2026-10-18T04:00:00Z',
      ...meta,
    },
  })
}
let calls, handler, refreshes
beforeEach(() => {
  calls = []
  refreshes = 0
  localStorage.clear()
  sessionStorage.clear()
  globalThis.__monitoringAuth = {
    refresh: async () => {
      refreshes++
    },
  }
  handler = (config) => response(config)
  http.defaults.adapter = async (config) => {
    calls.push(config)
    return handler(config)
  }
})
const latest = () => new URL(calls.at(-1).url, 'http://localhost:8000').searchParams
const button = (container, text) =>
  [...container.querySelectorAll('button')].find((node) => node.textContent === text)
const field = (container, label) =>
  [...container.querySelectorAll('label')]
    .find((node) => node.firstChild.textContent.trim() === label)
    ?.querySelector('input,select')
async function click(node) {
  assert.ok(node)
  await act(async () => node.click())
}
async function change(node, value) {
  assert.ok(node)
  await act(async () => {
    const proto =
      node.tagName === 'SELECT'
        ? dom.window.HTMLSelectElement.prototype
        : dom.window.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, value)
    node.dispatchEvent(
      new dom.window.Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }),
    )
  })
}
async function flush(delay = 0) {
  await act(async () => new Promise((resolve) => setTimeout(resolve, delay)))
}
function Location() {
  const location = useLocation()
  return createElement(
    'output',
    { 'data-location': true },
    `${location.pathname}${location.search}`,
  )
}
async function mount(t, path = '/subscriptions') {
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
        { initialEntries: [path] },
        createElement(Workspace),
        createElement(Location),
      ),
    ),
  )
  await flush()
  return container
}

test('monitoring URLs normalize invalid filters and allow only the subscriptions landing page', () => {
  assert.deepEqual(
    filters.readMonitoringFilters(
      new URLSearchParams('status=unknown&expiry_days=90&account_status=other&page=-2'),
    ),
    {
      q: '',
      status: 'all',
      expiry_days: '7',
      account_status: 'all',
      page: 1,
    },
  )
  assert.equal(
    safeReturnTo('/subscriptions?status=expiring&expiry_days=30&page=2'),
    '/subscriptions?status=expiring&expiry_days=30&page=2',
  )
  assert.equal(safeReturnTo('/subscriptions/12'), '/dashboard')
})

test('directory defaults to seven days, links existing management and makes only reads without storage', async (t) => {
  const container = await mount(t)
  assert.equal(latest().get('expiry_days'), '7')
  assert.equal(latest().get('status'), 'all')
  assert.equal(latest().get('per_page'), '20')
  assert.match(container.textContent, /Ana Reyes/)
  assert.equal(
    container
      .querySelector('a[aria-label="Manage subscription for Reyes Stores"]')
      .getAttribute('href'),
    '/accounts/12/subscription',
  )
  assert.equal(container.querySelector('a[href="/accounts/12"]').textContent, 'Reyes Stores')
  assert.ok(calls.every((config) => config.method === 'get'))
  assert.equal(localStorage.length, 0)
  assert.equal(sessionStorage.length, 0)
})

test('saved current and renewal names and server-computed continuous coverage are displayed separately', async (t) => {
  const container = await mount(t)
  const table = container.querySelector('table')
  assert.match(table.textContent, /Basic at purchase/)
  assert.match(table.textContent, /Renewal snapshot/)
  assert.match(table.textContent, /Dec 20, 2026/)
  assert.match(table.textContent, /Current period ends Oct 20, 2026/)
  assert.match(table.textContent, /2 scheduled periods/)
  assert.doesNotMatch(table.textContent, /Expiring soon/)
  assert.match(container.textContent, /PHT/)
})

test('status, window and account status stay in URL and reset pagination', async (t) => {
  const container = await mount(t, '/subscriptions?page=3')
  for (const [label, value, query] of [
    ['Subscription status', 'expiring', 'status'],
    ['Expiry window', '30', 'expiry_days'],
    ['Account status', 'suspended', 'account_status'],
  ]) {
    await change(field(container, label), value)
    assert.equal(latest().get(query), value)
    assert.equal(latest().get('page'), '1')
    assert.match(
      container.querySelector('[data-location]').textContent,
      new RegExp(`${query}=${value}`),
    )
  }
})

test('debounced search encodes names, resets page and clear filters restores defaults', async (t) => {
  const container = await mount(
    t,
    '/subscriptions?status=free&expiry_days=30&page=4&account_status=suspended',
  )
  await change(field(container, 'Search account or owner'), '  Reyes & Sons  ')
  assert.doesNotMatch(container.querySelector('[data-location]').textContent, /page=/)
  await flush(330)
  assert.equal(latest().get('q'), 'Reyes & Sons')
  assert.equal(latest().get('status'), 'free')
  await click(button(container, 'Clear filters'))
  await flush(330)
  assert.equal(container.querySelector('[data-location]').textContent, '/subscriptions')
  assert.equal(latest().get('expiry_days'), '7')
  assert.equal(latest().get('account_status'), 'all')
})

test('pagination preserves filters and refresh repeats the visible page', async (t) => {
  handler = (config) =>
    response(config, [row], {
      current_page: Number(new URL(config.url, 'http://local').searchParams.get('page')),
      last_page: 3,
      total: 41,
    })
  const container = await mount(t, '/subscriptions?status=active_basic&expiry_days=30&q=Reyes')
  await click(container.querySelector('[aria-label="Next page"]'))
  assert.equal(latest().get('page'), '2')
  assert.equal(latest().get('status'), 'active_basic')
  assert.equal(latest().get('q'), 'Reyes')
  await click(button(container, 'Refresh'))
  assert.equal(latest().get('page'), '2')
  await click(container.querySelector('[aria-label="Previous page"]'))
  assert.equal(latest().get('page'), '1')
})

test('summary totals are supplied by server and cards filter the list without hiding overlapping counts', async (t) => {
  handler = (config) => response(config, [row], {}, { other_paid: 3, total: 12 })
  const container = await mount(t, '/subscriptions?page=3&expiry_days=30')
  const summary = container.querySelector('[aria-label="Subscription summary"]')
  assert.match(summary.textContent, /12 accounts match/)
  assert.match(summary.textContent, /ignore the subscription status filter/)
  assert.match(summary.textContent, /overlaps active paid/)
  const expiring = [...summary.querySelectorAll('button')].find((node) =>
    node.textContent.startsWith('Expiring soon'),
  )
  await click(expiring)
  assert.equal(latest().get('status'), 'expiring')
  assert.equal(latest().get('expiry_days'), '30')
  assert.equal(latest().get('page'), '1')
  assert.equal(
    container
      .querySelector('[aria-label="Subscription summary"] button[aria-pressed="true"]')
      .textContent.startsWith('Expiring soon'),
    true,
  )
  assert.match(
    container.querySelector('[aria-label="Subscription summary"]').textContent,
    /Other paid/,
  )
})

test('expired, future-only free and open-ended other paid states remain distinct from account suspension', async (t) => {
  handler = (config) =>
    response(config, [
      {
        ...row,
        account: { id: 1, name: 'Expired', status: 'suspended' },
        state: 'expired_paid',
        is_paid: false,
        owner: { ...row.owner, status: 'suspended' },
        current: {
          subscription_id: null,
          plan: { code: 'free', name: 'Free' },
          starts_at: null,
          ends_at: null,
        },
        coverage_ends_at: null,
        next_period: null,
        scheduled_periods: 0,
        last_paid_ended_at: '2026-10-16T00:00:00Z',
      },
      {
        ...row,
        account: { id: 2, name: 'Future only', status: 'active' },
        state: 'free',
        is_paid: false,
        current: {
          subscription_id: null,
          plan: { code: 'free', name: 'Free' },
          starts_at: null,
          ends_at: null,
        },
        coverage_ends_at: null,
      },
      {
        ...row,
        account: { id: 3, name: 'Legacy', status: 'suspended' },
        state: 'other_paid',
        coverage_ends_at: null,
        current: { ...row.current, plan: { code: 'legacy', name: 'Legacy paid' }, ends_at: null },
        next_period: null,
        scheduled_periods: 0,
      },
    ])
  const container = await mount(t)
  const rows = container.querySelectorAll('tbody tr')
  assert.match(rows[0].textContent, /Expired paid/)
  assert.match(rows[0].textContent, /Last paid period ended Oct 16, 2026/)
  assert.match(rows[0].textContent, /Owner suspended/)
  assert.match(rows[1].textContent, /No active paid coverage/)
  assert.match(rows[1].textContent, /Renewal snapshot/)
  assert.match(rows[2].textContent, /Other paid/)
  assert.match(rows[2].textContent, /No expiry recorded/)
  assert.match(rows[2].textContent, /Suspended/)
})

test('loading, empty results and sanitized server errors provide retry and reset', async (t) => {
  let resolve
  handler = (config) =>
    new Promise((done) => {
      resolve = () => done(response(config, []))
    })
  const container = await mount(t)
  assert.match(container.querySelector('[role=status]').textContent, /Loading/)
  await act(async () => resolve())
  assert.match(container.textContent, /No subscriptions found/)
  handler = (config) => {
    throw new axios.AxiosError('db password=secret', undefined, config, undefined, {
      status: 500,
      data: { message: 'db password=secret' },
    })
  }
  await click(button(container, 'Refresh'))
  assert.match(container.textContent, /temporarily unavailable/)
  assert.doesNotMatch(container.textContent, /password=secret/)
  handler = (config) => response(config)
  await click(button(container, 'Try again'))
  assert.match(container.textContent, /Reyes Stores/)
})

test('lost administrator access invokes the shared authentication refresh', async (t) => {
  handler = (config) => {
    throw new axios.AxiosError('Forbidden', undefined, config, undefined, {
      status: 403,
      data: { message: 'Administrator access is required.' },
    })
  }
  const container = await mount(t)
  assert.equal(refreshes, 1)
  assert.match(container.querySelector('[role=alert]').textContent, /platform administrator access/)
  assert.equal(container.querySelector('table'), null)
})
