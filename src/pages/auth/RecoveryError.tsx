import type { ApiError } from '../../api/errors'

export default function RecoveryError({ error }: { error: ApiError | null }) {
  if (!error) return null
  return (
    <p
      role="alert"
      className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-relaxed text-red-700"
    >
      {error.message}
    </p>
  )
}
