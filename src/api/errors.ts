import axios from 'axios'

export class ApiError extends Error {
  status?: number
  fields: Record<string, string[]>
  constructor(message: string, status?: number, fields: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (!axios.isAxiosError(error)) return new ApiError('Something went wrong. Please try again.')
  const status = error.response?.status,
    fields: Record<string, string[]> = {}
  if (!error.response)
    return new ApiError('Unable to connect to the platform. Check your connection and try again.')
  const payload = error.response.data as { errors?: unknown; message?: unknown } | undefined
  if (payload?.errors && typeof payload.errors === 'object')
    for (const [key, value] of Object.entries(payload.errors))
      if (Array.isArray(value))
        fields[key] = value.filter((item): item is string => typeof item === 'string')
  if (status === 422) return new ApiError('Please check the highlighted fields.', status, fields)
  if (status === 409)
    return new ApiError(
      typeof payload?.message === 'string'
        ? payload.message
        : 'This record changed. Reload before confirming.',
      status,
    )
  if (status === 401) return new ApiError('Your session has ended. Please sign in again.', status)
  if (status === 403)
    return new ApiError('This session does not have active platform administrator access.', status)
  if (status === 404) return new ApiError('This record could not be found.', status)
  if (status === 419)
    return new ApiError('Your secure session has expired. Please try again.', status)
  if (status === 429)
    return new ApiError('Too many attempts. Please wait a moment before trying again.', status)
  return new ApiError(
    'The platform service is temporarily unavailable. Please try again shortly.',
    status,
  )
}
