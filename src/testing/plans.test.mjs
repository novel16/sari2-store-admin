import assert from 'node:assert/strict'
import test from 'node:test'
import { createSourceModule } from './sourceModule.mjs'
const sourceModule = createSourceModule(import.meta.url)
const { priceCentavos, statusLabel } = await import(await sourceModule('../plans/format.ts'))
const { safeReturnTo } = await import(await sourceModule('../auth/access.ts'))
test('plan prices convert decimal pesos exactly and reject malformed input', () => {
  for (const [input, expected] of [
    ['49', 4900],
    ['149.00', 14900],
    ['0.01', 1],
    ['49.9', 4990],
    ['1000000.00', 100000000],
  ])
    assert.equal(priceCentavos(input), expected)
  for (const input of ['', '-1', '1e2', '49.999', '1,000', '1000000.01', 'Infinity'])
    assert.equal(priceCentavos(input), null)
  assert.equal(statusLabel('coming_soon'), 'Coming soon')
})
test('protected plan links retain safe return paths', () => {
  for (const path of ['/plans', '/plans/new', '/plans/4', '/plans?page=2'])
    assert.equal(safeReturnTo(path), path)
  assert.equal(safeReturnTo('/plans/delete'), '/dashboard')
})
test('plan writes use CSRF with exact integer prices and optimistic versions', async () => {
  const httpUrl = await sourceModule(
    '../api/http.ts',
    { axios: import.meta.resolve('axios') },
    { 'import.meta.env.VITE_API_URL': "'http://localhost:8000'" },
  )
  const { http } = await import(httpUrl)
  const { savePlan } = await import(
    await sourceModule('../plans/api.ts', { '../api/http': httpUrl })
  )
  const calls = []
  http.defaults.adapter = async (config) => {
    calls.push(config)
    return {
      data: { data: { id: 4, version: 3 } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
  await savePlan({ monthly_price_centavos: 4900, expected_version: 2 }, 4)
  assert.equal(calls[0].url, '/sanctum/csrf-cookie')
  assert.equal(calls[1].method, 'patch')
  assert.equal(calls[1].url, '/api/v1/admin/plans/4')
  assert.deepEqual(JSON.parse(calls[1].data), { monthly_price_centavos: 4900, expected_version: 2 })
})
