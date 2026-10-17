import assert from 'node:assert/strict'
import test from 'node:test'
import axios from 'axios'
import { createSourceModule } from './sourceModule.mjs'

const sourceModule = createSourceModule(import.meta.url)
const httpUrl = await sourceModule(
  '../api/http.ts',
  { axios: import.meta.resolve('axios') },
  {
    'import.meta.env.VITE_API_URL': "'http://localhost:8000'",
  },
)
const { http } = await import(httpUrl)
const api = await import(await sourceModule('../subscriptions/api.ts', { '../api/http': httpUrl }))
const { safeReturnTo } = await import(await sourceModule('../auth/access.ts'))
const { toApiError } = await import(
  await sourceModule('../api/errors.ts', { axios: import.meta.resolve('axios') })
)

test('subscription links retain the account scope and reject arbitrary nested pages', () => {
  assert.equal(safeReturnTo('/accounts/12/subscription'), '/accounts/12/subscription')
  assert.equal(safeReturnTo('/accounts/12/subscription/delete'), '/dashboard')
  assert.equal(api.subscriptionPath(12), '/api/v1/admin/accounts/12/subscription')
})

test('review and confirmation use CSRF and keep the same confirmation key when retried', async () => {
  const calls = []
  let confirmations = 0
  http.defaults.adapter = async (config) => {
    calls.push(config)
    if (config.url.endsWith('/activations') && confirmations++ === 0)
      throw new axios.AxiosError('Connection lost')
    return { data: { data: { id: 3 } }, status: 200, statusText: 'OK', headers: {}, config }
  }
  await api.previewSubscription(12, { plan_id: 2, amount_centavos: 4900 })
  const confirm = () => api.confirmSubscription(12, 'server-reviewed-quote', 'same-request-key')
  await assert.rejects(confirm())
  assert.equal(confirmations, 1)
  await confirm()
  const writes = calls.filter((call) => call.method === 'post')
  assert.equal(writes[0].url, '/api/v1/admin/accounts/12/subscription/preview')
  assert.deepEqual(JSON.parse(writes[1].data), {
    quote: 'server-reviewed-quote',
    request_key: 'same-request-key',
  })
  assert.equal(writes[1].data, writes[2].data)
  assert.equal(calls.filter((call) => call.url === '/sanctum/csrf-cookie').length, 3)
})

test('conflicts show actionable review errors while server exceptions stay private', () => {
  const failure = (status, message) =>
    new axios.AxiosError('Failure', undefined, undefined, undefined, { status, data: { message } })
  assert.equal(
    toApiError(failure(409, 'This review expired. Review again.')).message,
    'This review expired. Review again.',
  )
  assert.doesNotMatch(toApiError(failure(500, 'database secret')).message, /secret/)
})
