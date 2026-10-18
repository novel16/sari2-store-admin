import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { after, test } from 'node:test'
import { pathToFileURL } from 'node:url'
import { act, createElement, lazy } from 'react'
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
const loadingUrl = await sourceModule('../components/PageLoading.tsx', imports)
const { default: RouteBoundary } = await import(
  await sourceModule('../routes/RouteBoundary.tsx', {
    ...imports,
    '../components/PageLoading': loadingUrl,
  }),
)
const dom = installDom('http://localhost:3001')
after(() => dom.cleanup())
const { createRoot } = await import('react-dom/client')

async function mount(t, child) {
  const container = document.createElement('div')
  document.body.append(container)
  const caught = []
  const root = createRoot(container, { onCaughtError: (error) => caught.push(error) })
  t.after(async () => {
    await act(async () => root.unmount())
    container.remove()
  })
  await act(async () => root.render(createElement(RouteBoundary, null, child)))
  return { container, caught }
}

function expectRecovery(container) {
  const alert = container.querySelector('[role=alert]')
  assert.ok(alert)
  assert.match(alert.textContent, /This page could not open/)
  assert.equal(alert.querySelector('button').textContent, 'Reload page')
  assert.equal(alert.querySelector('a').getAttribute('href'), '/dashboard')
}

test('route content renders normally inside the boundary', async (t) => {
  const { container, caught } = await mount(t, createElement('h1', null, 'Sales history'))
  assert.equal(container.textContent, 'Sales history')
  assert.equal(container.querySelector('[role=alert]'), null)
  assert.equal(caught.length, 0)
})

test('a pending lazy page shows loading and then renders its resolved content', async (t) => {
  let resolve
  const Page = lazy(() => new Promise((done) => { resolve = done }))
  const { container, caught } = await mount(t, createElement(Page))
  assert.ok(container.querySelector('[role=status]'))
  await act(async () => resolve({ default: () => createElement('h1', null, 'Page ready') }))
  assert.equal(container.textContent, 'Page ready')
  assert.equal(container.querySelector('[role=status]'), null)
  assert.equal(caught.length, 0)
})

test('a rejected lazy import replaces loading with usable recovery actions', async (t) => {
  let reject
  const failure = new Error('Unable to fetch private-chunk-name.js')
  const Page = lazy(() => new Promise((_, fail) => { reject = fail }))
  const { container, caught } = await mount(t, createElement(Page))
  await act(async () => reject(failure))
  expectRecovery(container)
  assert.equal(container.querySelector('[role=status]'), null)
  assert.deepEqual(caught, [failure])
  assert.doesNotMatch(container.textContent, /private-chunk-name/)
})

test('a page rendering failure is caught without exposing its error details', async (t) => {
  const failure = new Error('Private record details')
  function BrokenPage() {
    throw failure
  }
  const { container, caught } = await mount(t, createElement(BrokenPage))
  expectRecovery(container)
  assert.deepEqual(caught, [failure])
  assert.doesNotMatch(container.textContent, /Private record details/)
})
