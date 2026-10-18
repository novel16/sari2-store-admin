import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, CheckCheck, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { authApi } from '../../auth/api'
import { toApiError } from '../../api/errors'
import type { ApiError } from '../../api/errors'
import RecoveryLayout from './RecoveryLayout'
import RecoveryError from './RecoveryError'

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const busy = useRef(false)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current) return
    const form = event.currentTarget
    if (!form.reportValidity()) return
    const email = String(new FormData(form).get('email') ?? '')
      .trim()
      .toLowerCase()
    busy.current = true
    setPending(true)
    setError(null)
    try {
      await authApi.forgotPassword(email)
      if (mounted.current) setSubmitted(true)
    } catch (failure) {
      if (mounted.current) setError(toApiError(failure))
    } finally {
      busy.current = false
      if (mounted.current) setPending(false)
    }
  }

  return (
    <RecoveryLayout
      title={submitted ? 'Check your inbox.' : 'Forgot your password?'}
      description={
        submitted
          ? 'The next step is on its way, if your email is registered.'
          : 'Enter your email address to request a password reset link.'
      }
    >
      {submitted ? (
        <div className="rounded-2xl border border-brand/15 bg-brand/5 p-6 text-center">
          <CheckCheck size={28} className="mx-auto mb-4 text-brand" />
          <p role="status" className="mb-5 text-sm leading-relaxed text-slate-600">
            If an account matches that email address, you’ll receive a password reset link. Check
            your spam folder too.
          </p>
          <Link to="/login" className="btn btn-primary w-full">
            Back to sign in <ArrowRight size={16} />
          </Link>
          <button
            type="button"
            className="mt-5 text-xs text-brand underline underline-offset-4"
            onClick={() => {
              setSubmitted(false)
              setError(null)
            }}
          >
            Try a different email
          </button>
        </div>
      ) : (
        <form onSubmit={(event) => void submit(event)} aria-busy={pending}>
          <fieldset disabled={pending} className="space-y-5">
            <label className="field">
              <span>Email address</span>
              <input
                name="email"
                type="email"
                className="input"
                required
                maxLength={254}
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(error?.fields.email)}
                aria-describedby={error?.fields.email ? 'recovery-email-error' : undefined}
              />
              {error?.fields.email?.[0] && (
                <small id="recovery-email-error" className="text-red-700">
                  {error.fields.email[0]}
                </small>
              )}
            </label>
            <RecoveryError error={error} />
            <button type="submit" className="btn btn-primary w-full">
              {pending ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <ArrowRight size={16} />
              )}
              {pending ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </fieldset>
        </form>
      )}
    </RecoveryLayout>
  )
}
