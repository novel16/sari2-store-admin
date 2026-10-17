import { AlertCircle, LoaderCircle } from 'lucide-react'
import type { ApiError } from '../api/errors'
export default function QueryState({
  loading,
  error,
  retry,
}: {
  loading: boolean
  error?: ApiError
  retry: () => void
}) {
  if (loading)
    return (
      <div
        role="status"
        className="flex min-h-44 items-center justify-center gap-3 p-6 text-sm text-slate-500"
      >
        <LoaderCircle className="animate-spin" size={18} />
        Loading platform records…
      </div>
    )
  if (error)
    return (
      <div role="alert" className="flex flex-col items-center gap-3 p-8 text-center">
        <AlertCircle className="text-amber-600" size={24} />
        <p className="max-w-lg text-sm text-slate-600">{error.message}</p>
        {Object.values(error.fields)
          .flat()
          .map((message, index) => (
            <p key={index} className="text-xs text-slate-500">
              {message}
            </p>
          ))}
        <button className="btn btn-secondary" onClick={retry}>
          Try again
        </button>
      </div>
    )
  return null
}
