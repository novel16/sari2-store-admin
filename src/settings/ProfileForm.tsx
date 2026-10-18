import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, toApiError } from '../api/errors'
import { useAuth } from '../auth/useAuth'
import OperationErrors from '../administrators/OperationErrors'
import { updateAdminProfile } from './api'

export default function ProfileForm() {
  const { user, updateUser, refresh } = useAuth()
  const [name, setName] = useState(user?.name ?? ''),
    [email, setEmail] = useState(user?.email ?? ''),
    [password, setPassword] = useState('')
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
  const emailChanged = email.trim().toLowerCase() !== user?.email.toLowerCase()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current) return
    busy.current = true
    setWorking(true)
    setError(undefined)
    setSuccess('')
    const proof = password
    setPassword('')
    try {
      const result = await updateAdminProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        ...(emailChanged ? { current_password: proof } : {}),
      })
      if (!mounted.current) return
      if (
        result.data.id !== user?.id ||
        result.data.platform_role !== 'platform_admin' ||
        result.data.status !== 'active'
      )
        throw new ApiError(
          'The saved profile could not be verified. Refresh your session before editing again.',
        )
      updateUser(result.data)
      setName(result.data.name)
      setEmail(result.data.email)
      setSuccess('Profile saved.')
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
      <h2 className="font-display text-lg font-bold">My profile</h2>
      <p className="mb-6 mt-2 text-xs leading-relaxed text-slate-500">
        Changing your sign-in email requires your current password.
      </p>
      <form onSubmit={(event) => void submit(event)} aria-busy={working}>
        <fieldset disabled={working} className="grid min-w-0 gap-5">
          <label className="field">
            Full name
            <input
              name="name"
              className="input"
              value={name}
              required
              maxLength={120}
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="field">
            Sign-in email
            <input
              name="email"
              className="input"
              type="email"
              value={email}
              required
              maxLength={254}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {emailChanged && (
            <label className="field">
              Your current password
              <input
                name="current_password"
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                required
                maxLength={128}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          )}
          <button className="btn btn-primary justify-self-start" type="submit">
            {working ? 'Saving...' : 'Save profile'}
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
