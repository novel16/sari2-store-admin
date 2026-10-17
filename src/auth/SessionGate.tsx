import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from './useAuth'
import { toApiError } from '../api/errors'
import Brand from '../components/Brand'

export default function SessionGate() {
  const { error, refresh, logout } = useAuth(),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState('')
  async function signOut() {
    if (busy) return
    setBusy(true)
    try {
      await logout()
    } catch (error) {
      setFailure(toApiError(error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-5">
      <section className="panel w-full max-w-lg p-7 sm:p-10">
        <Brand />
        <ShieldAlert className="mb-5 mt-10 text-amber-600" size={32} />
        <h1 className="font-display text-2xl font-bold">
          {error?.status === 403
            ? 'Administrator access required'
            : 'Unable to restore your session'}
        </h1>
        <p role="alert" className="my-4 text-sm leading-relaxed text-slate-500">
          {failure || error?.message}
        </p>
        <p className="mb-6 text-xs leading-relaxed text-slate-500">
          You can retry, or sign out the current browser session to use another account.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" disabled={busy} onClick={() => void refresh()}>
            Retry
          </button>
          <button className="btn btn-secondary" disabled={busy} onClick={() => void signOut()}>
            {busy ? 'Signing out…' : 'Sign out current session'}
          </button>
        </div>
      </section>
    </main>
  )
}
