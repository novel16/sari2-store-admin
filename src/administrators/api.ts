import axios from 'axios'
import { http, postWithCsrf } from '../api/http'
import type {
  AdministratorCredentials,
  AdministratorResult,
  AdministratorReview,
  AdministratorStatus,
  OperationScope,
  PendingAdministratorOperation,
} from './types'

export const administratorsPath = '/api/v1/admin/administrators'
export const confirmationPath = (scope: OperationScope) =>
  scope.kind === 'create' ? administratorsPath : `${administratorsPath}/${scope.id}/status-changes`

export const previewCreation = (input: { name: string; email: string; reason: string }) =>
  postWithCsrf<{ data: AdministratorReview }>(`${administratorsPath}/creation-preview`, input)
export const previewAdministratorStatus = (
  id: number,
  status: AdministratorStatus,
  reason: string,
) =>
  postWithCsrf<{ data: AdministratorReview }>(`${administratorsPath}/${id}/status-preview`, {
    status,
    reason,
  })
export const confirmAdministratorOperation = (
  scope: OperationScope,
  pending: PendingAdministratorOperation,
  credentials: AdministratorCredentials,
) =>
  postWithCsrf<AdministratorResult>(confirmationPath(scope), {
    request_key: pending.requestKey,
    review_token: pending.review.review_token,
    ...credentials,
  })
export async function findAdministratorOperation(requestKey: string) {
  return (
    await http.get<AdministratorResult>(`${administratorsPath}/operations/by-key/${requestKey}`)
  ).data
}
export function definitiveAdministratorRejection(failure: unknown, scope: OperationScope) {
  if (
    !axios.isAxiosError(failure) ||
    failure.config?.method?.toLowerCase() !== 'post' ||
    failure.config.url !== confirmationPath(scope)
  )
    return false
  const payload = failure.response?.data as { code?: string; errors?: unknown } | undefined
  const fields = payload?.errors
  // Credentials are checked before idempotency lookup. A rejected retry cannot prove
  // that the original request did not commit, so keep its review and request key.
  const businessValidation =
    failure.response?.status === 422 &&
    fields !== null &&
    typeof fields === 'object' &&
    !Array.isArray(fields) &&
    Object.keys(fields).length > 0 &&
    Object.keys(fields).every((field) =>
      ['name', 'email', 'reason', 'status', 'review_token'].includes(field),
    )
  return (
    businessValidation ||
    (failure.response?.status === 409 &&
      [
        'administrator_review_used',
        'administrator_review_invalid',
        'administrator_review_expired',
        'administrator_review_stale',
        'administrator_no_change',
        'administrator_self_suspend',
        'administrator_last_active',
      ].includes(payload?.code ?? ''))
  )
}
export const isOperationNotFound = (failure: unknown) =>
  axios.isAxiosError(failure) &&
  failure.config?.method?.toLowerCase() === 'get' &&
  failure.response?.status === 404
