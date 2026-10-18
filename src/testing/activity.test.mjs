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
const authUrl = 'data:text/javascript,export const useAuth=()=>globalThis.__activityAuth'
const errorsUrl = await sourceModule('../api/errors.ts', { axios: import.meta.resolve('axios') })
const httpUrl = await sourceModule(
  '../api/http.ts',
  { axios: import.meta.resolve('axios') },
  { 'import.meta.env.VITE_API_URL': "'http://localhost:8000'" },
)
const { http } = await import(httpUrl)
const queryUrl = await sourceModule('../hooks/useApiQuery.ts', {
  ...imports,
  axios: import.meta.resolve('axios'),
  '../api/http': httpUrl,
  '../api/errors': errorsUrl,
  '../auth/useAuth': authUrl,
})
const debounceUrl = await sourceModule('../hooks/useDebouncedValue.ts', imports)
const filtersUrl = await sourceModule('../activity/filters.ts')
const filters = await import(filtersUrl)
const useFiltersUrl = await sourceModule('../activity/useActivityFilters.ts', {
  ...imports,
  '../hooks/useDebouncedValue': debounceUrl,
  './filters': filtersUrl,
})
const actorUrl = await sourceModule('../activity/ActivityActorPicker.tsx', {
  ...imports,
  '../administrators/api':
    'data:text/javascript,export const administratorsPath="/api/v1/admin/administrators"',
  '../hooks/useApiQuery': queryUrl,
  '../hooks/useDebouncedValue': debounceUrl,
})
const controlsUrl = await sourceModule('../activity/ActivityFilters.tsx', {
  ...imports,
  './filters': filtersUrl,
  './ActivityActorPicker': actorUrl,
})
const timelineUrl = await sourceModule('../activity/ActivityTimeline.tsx', {
  ...imports,
  '../platform/format': await sourceModule('../platform/format.ts'),
  './filters': filtersUrl,
})
const { default: Workspace } = await import(
  await sourceModule('../activity/ActivityWorkspace.tsx', {
    ...imports,
    '../hooks/useApiQuery': queryUrl,
    './useActivityFilters': useFiltersUrl,
    './ActivityFilters': controlsUrl,
    './ActivityTimeline': timelineUrl,
    '../components/PageHeader': await sourceModule('../components/PageHeader.tsx', imports),
    '../components/QueryState': await sourceModule('../components/QueryState.tsx', imports),
    '../components/EmptyState': await sourceModule('../components/EmptyState.tsx', imports),
  })
)

const entry = {
  id: 'status_change:4',
  source: 'status_change',
  source_id: 4,
  module: 'stores',
  action: 'suspended',
  occurred_at: '2026-10-17T16:30:00Z',
  actor: { id: 8, name: 'Historical name', name_recorded: true },
  target: { type: 'store', id: 12, name: 'Corner store', path: '/stores/12' },
  reason: 'Owner requested suspension',
  changes: { from_status: 'active', to_status: 'suspended' },
  details: {},
}
const response = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} })
const directory = {
  data: [{ id: 8, name: 'Current name', email: 'admin@example.test', status: 'suspended' }],
  meta: { current_page: 1, last_page: 1, total: 1, per_page: 20 },
}
let calls, activityHandler
function activity(config, entries = [entry], meta = {}) {
  return response(config, {
    data: entries,
    meta: {
      per_page: 20,
      next_cursor: null,
      prev_cursor: null,
      time_zone: 'Asia/Manila',
      filters: {},
      ...meta,
    },
  })
}
beforeEach(() => {
  calls = []
  sessionStorage.clear()
  localStorage.clear()
  globalThis.__activityAuth = { refresh: async () => {} }
  activityHandler = (config) => activity(config)
  http.defaults.adapter = async (config) => {
    calls.push(config)
    if (config.url.startsWith('/api/v1/admin/activity?')) return activityHandler(config)
    if (/\/administrators\/\d+$/.test(config.url))
      return response(config, {
        data: { id: Number(config.url.split('/').at(-1)), name: 'Selected administrator' },
      })
    return response(config, directory)
  }
})
const activityCalls = () => calls.filter((call) => call.url.startsWith('/api/v1/admin/activity?'))
const latest = () => new URL(activityCalls().at(-1).url, 'http://localhost:8000').searchParams
const button = (container, text) =>
  [...container.querySelectorAll('button')].find((node) => node.textContent === text)
const field = (container, text) =>
  [...container.querySelectorAll('label')]
    .find((node) => node.firstChild.textContent.trim() === text)
    ?.querySelector('input,select')
async function click(node) {
  assert.ok(node)
  await act(async () => node.click())
}
async function change(node, value) {
  assert.ok(node)
  await act(async () => {
    const prototype =
      node.tagName === 'SELECT'
        ? dom.window.HTMLSelectElement.prototype
        : dom.window.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, value)
    node.dispatchEvent(
      new dom.window.Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }),
    )
  })
}
async function flush(delay = 0) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, delay))
  })
}
function Location() {
  const location = useLocation()
  return createElement('output', { 'data-location': true }, location.search)
}
async function mount(t, path = '/activity') {
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

test('default date window follows Manila midnight and validation counts inclusive days', () => {
  assert.deepEqual(filters.defaultDates(new Date('2026-10-17T16:01:00Z')), {
    date_from: '2026-09-19',
    date_to: '2026-10-18',
  })
  assert.equal(filters.dateError('2024-01-01', '2024-12-31'), '')
  assert.match(filters.dateError('2024-01-01', '2025-01-01'), /366/)
  assert.match(filters.dateError('2026-02-30', '2026-03-01'), /valid/)
  assert.match(filters.dateError('2026-10-19', '2026-10-18'), /on or after/)
})

test('timeline uses recorded actor names, reasons and internal target links without writes or browser storage', async (t) => {
  const container = await mount(t)
  assert.match(container.textContent, /By Historical name/)
  assert.match(container.textContent, /Owner requested suspension/)
  assert.match(container.textContent, /Oct 18, 2026/)
  assert.equal(container.querySelector('a[href="/stores/12"]').textContent, 'View store')
  assert.ok(calls.every((call) => call.method === 'get'))
  assert.equal(sessionStorage.length, 0)
  assert.equal(localStorage.length, 0)
  assert.equal(latest().get('per_page'), '20')
})

test('opaque next and previous cursors are navigable while preserving URL filters', async (t) => {
  activityHandler = (config) => {
    const cursor = new URL(config.url, 'http://local').searchParams.get('cursor')
    return activity(
      config,
      [entry],
      cursor ? { prev_cursor: 'previous+opaque/=' } : { next_cursor: 'next+opaque/=' },
    )
  }
  const container = await mount(
    t,
    '/activity?module=stores&date_from=2026-10-01&date_to=2026-10-18',
  )
  assert.equal(button(container, 'Previous').disabled, true)
  await click(button(container, 'Next'))
  assert.equal(latest().get('cursor'), 'next+opaque/=')
  assert.equal(latest().get('module'), 'stores')
  assert.match(container.querySelector('[data-location]').textContent, /cursor=/)
  await click(button(container, 'Previous'))
  assert.equal(latest().get('cursor'), 'previous+opaque/=')
})

test('module, action, actor and date changes reset pagination and remain in the URL', async (t) => {
  const container = await mount(t, '/activity?cursor=old&date_from=2026-10-01&date_to=2026-10-18')
  for (const [label, value, query] of [
    ['Module', 'accounts', 'module'],
    ['Action', 'reactivated', 'action'],
    ['Performed by', '0', 'actor_id'],
    ['From (PHT)', '2026-10-02', 'date_from'],
    ['To (PHT)', '2026-10-19', 'date_to'],
  ]) {
    await change(field(container, label), value)
    assert.equal(latest().get(query), value)
    assert.equal(latest().has('cursor'), false)
  }
  assert.match(container.querySelector('[data-location]').textContent, /actor_id=0/)
})

test('debounced activity search encodes values and clears stale cursors immediately', async (t) => {
  const container = await mount(t, '/activity?cursor=old')
  await change(field(container, 'Search activity'), '  Reyes & Sons  ')
  assert.doesNotMatch(container.querySelector('[data-location]').textContent, /cursor=/)
  await flush(330)
  assert.equal(latest().get('q'), 'Reyes & Sons')
  assert.equal(latest().has('cursor'), false)
})

test('refresh returns to newest records with filters preserved, clear filters resets all', async (t) => {
  const container = await mount(
    t,
    '/activity?cursor=old&module=stores&actor_id=8&date_from=2026-10-01&date_to=2026-10-18',
  )
  await click(button(container, 'Refresh'))
  assert.equal(latest().has('cursor'), false)
  assert.equal(latest().get('actor_id'), '8')
  assert.equal(latest().get('module'), 'stores')
  await click(button(container, 'Clear filters'))
  assert.equal(container.querySelector('[data-location]').textContent, '')
  assert.equal(latest().get('module'), 'all')
  assert.equal(latest().has('actor_id'), false)
})

test('invalid dates suppress reads until corrected and expose field validation', async (t) => {
  const container = await mount(t, '/activity?date_from=2026-10-19&date_to=2026-10-18')
  assert.equal(activityCalls().length, 0)
  assert.match(container.querySelector('[role=alert]').textContent, /on or after/)
  assert.equal(field(container, 'From (PHT)').getAttribute('aria-invalid'), 'true')
  await change(field(container, 'To (PHT)'), '2026-10-20')
  assert.equal(activityCalls().length, 1)
})

test('loading, sanitized errors, retry and empty results have usable recovery', async (t) => {
  let resolve
  activityHandler = (config) =>
    new Promise((done) => {
      resolve = () => done(activity(config, []))
    })
  const container = await mount(t)
  assert.match(
    container.querySelector('section[aria-label="Platform activity"]').textContent,
    /Loading/,
  )
  await act(async () => resolve())
  assert.match(container.textContent, /No activity found/)
  activityHandler = (config) => {
    throw new axios.AxiosError('SQL password=secret', undefined, config, undefined, {
      status: 500,
      data: { message: 'SQL password=secret' },
    })
  }
  await click(button(container, 'Refresh'))
  assert.match(container.textContent, /temporarily unavailable/)
  assert.doesNotMatch(container.textContent, /password=secret/)
  activityHandler = (config) => activity(config)
  await click(button(container, 'Try again'))
  assert.match(container.textContent, /Historical name/)
})

test('administrator search includes suspended users and selected URL IDs outside the first result page', async (t) => {
  const container = await mount(t, '/activity?actor_id=99')
  assert.equal(field(container, 'Performed by').value, '99')
  assert.match(field(container, 'Performed by').textContent, /Selected administrator/)
  assert.match(field(container, 'Performed by').textContent, /Current name \(suspended\)/)
  assert.equal(calls.filter((call) => call.url.endsWith('/administrators/99')).length, 1)
  await change(field(container, 'Search administrators'), 'Current & Name')
  await flush(330)
  const request = calls
    .filter((call) => call.url.startsWith('/api/v1/admin/administrators?'))
    .at(-1)
  const query = new URL(request.url, 'http://local').searchParams
  assert.equal(query.get('q'), 'Current & Name')
  assert.equal(query.has('status'), false)
  assert.equal(latest().get('actor_id'), '99')
})

test('legacy missing names and plan history labels never pretend to record creation', async (t) => {
  activityHandler = (config) =>
    activity(config, [
      {
        ...entry,
        id: 'plan_version:2',
        module: 'plans',
        action: 'plan_version_recorded',
        actor: { id: 8, name: 'Administrator #8', name_recorded: false },
        target: { type: 'plan', id: 2, name: 'Starter', path: '/plans/2' },
        changes: { from_status: null, to_status: null },
        details: { plan_version: 3 },
      },
    ])
  const container = await mount(t)
  const timeline = container.querySelector('ol')
  assert.match(timeline.textContent, /Plan version recorded/)
  assert.match(timeline.textContent, /Administrator #8 \(name not recorded\)/)
  assert.match(timeline.textContent, /Version 3/)
  assert.doesNotMatch(timeline.textContent, /Created|Current name/)
})

test('untrusted target URLs never create external or mismatched record links', async (t) => {
  for (const path of [
    'https://evil.test',
    '//evil.test',
    '/stores/12?redirect=evil',
    '/stores/99',
    '/\\evil.test',
  ])
    assert.equal(filters.targetPath({ type: 'store', id: 12, path }), null)
  assert.equal(
    filters.targetPath({ type: 'account', id: 12, path: '/accounts/12/subscription' }),
    '/accounts/12/subscription',
  )
  activityHandler = (config) =>
    activity(config, [{ ...entry, target: { ...entry.target, path: 'https://evil.test' } }])
  const container = await mount(t)
  assert.equal(container.querySelector('ol a'), null)
  assert.match(container.querySelector('ol').textContent, /Corner store/)
})
