import type { ApiError } from '../api/errors'

export default function OperationErrors({ error }: { error?: ApiError }) {
  if (!error) return null
  return (
    <div
      role="alert"
      className="mt-4 space-y-2 rounded-xl bg-red-50 p-4 text-xs leading-relaxed text-red-700"
    >
      <p>{error.message}</p>
      {Object.entries(error.fields).map(([field, messages]) => (
        <p key={field}>{messages.join(' ')}</p>
      ))}
    </div>
  )
}
