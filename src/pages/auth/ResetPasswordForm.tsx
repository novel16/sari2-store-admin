import { ArrowRight, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ApiError } from '../../api/errors'
import type { ResetLink } from '../../auth/passwordRecovery'
import RecoveryError from './RecoveryError'

interface Props {
  link: ResetLink
  pending: boolean
  error: ApiError | null
  reset: (link: ResetLink, form: HTMLFormElement) => Promise<void>
}

export default function ResetPasswordForm({ link, pending, error, reset }: Props) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void reset(link, event.currentTarget)
      }}
      aria-busy={pending}
    >
      <fieldset disabled={pending} className="space-y-5">
        <label className="field">
          <span>Email address</span>
          <input
            className="input bg-slate-50"
            type="email"
            value={link.email}
            autoComplete="username"
            readOnly
          />
        </label>
        {(['password', 'password_confirmation'] as const).map((name) => (
          <label className="field" key={name}>
            <span>{name === 'password' ? 'New password' : 'Confirm new password'}</span>
            <input
              className="input"
              name={name}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              aria-invalid={Boolean(error?.fields[name])}
              aria-describedby={
                error?.fields[name]
                  ? `${name}-error`
                  : name === 'password'
                    ? 'password-help'
                    : undefined
              }
            />
            {error?.fields[name]?.[0] && (
              <small id={`${name}-error`} className="text-red-700">
                {error.fields[name][0]}
              </small>
            )}
          </label>
        ))}
        <p id="password-help" className="text-[11px] leading-relaxed text-slate-500">
          Use at least 8 characters and at most 72 bytes. Emoji and accented letters use more than
          one byte.
        </p>
        <RecoveryError error={error} />
        {error && (!error.status || error.status >= 500) && (
          <p className="flex flex-wrap gap-4 text-xs font-medium text-brand">
            <Link to="/login" className="underline">
              Try signing in
            </Link>
            <Link to="/forgot-password" className="underline">
              Request a new link
            </Link>
          </p>
        )}
        {error?.fields.token?.length || error?.fields.email?.length ? (
          <p className="text-xs leading-relaxed text-red-700">
            {error.fields.token?.[0] ?? error.fields.email?.[0]}{' '}
            <Link to="/forgot-password" className="font-semibold underline">
              Request a new reset link.
            </Link>
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary w-full">
          {pending ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          {pending ? 'Resetting password...' : 'Reset password'}
        </button>
      </fieldset>
    </form>
  )
}
