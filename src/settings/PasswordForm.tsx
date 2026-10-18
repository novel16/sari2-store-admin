import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { toApiError } from '../api/errors'
import type { ApiError } from '../api/errors'
import { useAuth } from '../auth/useAuth'
import OperationErrors from '../administrators/OperationErrors'
import { changeAdminPassword } from './api'

export default function PasswordForm() {
  const { refresh } = useAuth()
  const [current, setCurrent] = useState(''),
    [password, setPassword] = useState(''),
    [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<ApiError>(),
    [success, setSuccess] = useState(''),
    [working, setWorking] = useState(false)
  const busy = useRef(false),
    mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current) return
    busy.current = true
    setWorking(true)
    setError(undefined)
    setSuccess('')
    const input = { current_password: current, password, password_confirmation: confirmation }
    setCurrent('')
    setPassword('')
    setConfirmation('')
    try {
      await changeAdminPassword(input)
      if (mounted.current) setSuccess('Password changed. Other sessions have been signed out.')
    } catch (failure) {
      if (mounted.current) {
        const next = toApiError(failure)
        setError(next)
        if (next.status === 401 || next.status === 403) void refresh()
      }
    } finally {
      busy.current = false
      if (mounted.current) setWorking(false)
    }
  }
  return (
    <section className="panel p-5 sm:p-7">
      <h2 className="font-display text-lg font-bold">Change password</h2>
      <p className="mb-6 mt-2 text-xs leading-relaxed text-slate-500">
        Use a unique password. Other signed-in sessions will be revoked after the change.
      </p>
      <form onSubmit={(event) => void submit(event)} aria-busy={working}>
        <fieldset disabled={working} className="grid min-w-0 gap-5">
          <label className="field">
            Your current password
            <input
              name="current_password"
              type="password"
              className="input"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              required
              maxLength={128}
            />
          </label>
          <label className="field">
            New password
            <input
              name="password"
              type="password"
              className="input"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              maxLength={128}
            />
          </label>
          <label className="field">
            Confirm new password
            <input
              name="password_confirmation"
              type="password"
              className="input"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
              minLength={8}
              maxLength={128}
            />
          </label>
          <button className="btn btn-primary justify-self-start" type="submit">
            {working ? 'Changing password...' : 'Change password'}
          </button>
        </fieldset>
      </form>
      <OperationErrors error={error} />
      {success && (
        <p role="status" className="mt-4 text-sm text-brand">
          {success}
        </p>
      )}
    </section>
  )
}
