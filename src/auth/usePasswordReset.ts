import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, toApiError } from '../api/errors'
import { authApi } from './api'
import { passwordRecoveryFields } from './passwordRecovery'
import type { ResetLink } from './passwordRecovery'
import { useAuth } from './useAuth'

export function usePasswordReset() {
  const { logout, refresh } = useAuth()
  const navigate = useNavigate()
  const [complete, setComplete] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const busy = useRef(false)
  const mounted = useRef(false)
  const resetComplete = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  async function finish() {
    if (!mounted.current) return
    await logout()
    if (!mounted.current) return
    await refresh({ throwOnError: true })
    if (mounted.current) navigate('/login', { replace: true, state: { passwordReset: true } })
  }

  async function finishSignOut() {
    if (!mounted.current || busy.current || !resetComplete.current) return
    busy.current = true
    setPending(true)
    setError(null)
    try {
      await finish()
    } catch (failure) {
      if (mounted.current) setError(toApiError(failure))
    } finally {
      busy.current = false
      if (mounted.current) setPending(false)
    }
  }

  async function reset(link: ResetLink, form: HTMLFormElement) {
    if (!mounted.current || busy.current || resetComplete.current) return
    const data = new FormData(form)
    const password = String(data.get('password') ?? '')
    const confirmation = String(data.get('password_confirmation') ?? '')
    const fields = passwordRecoveryFields(password, confirmation)
    if (Object.keys(fields).length) {
      setError(new ApiError('Please check the highlighted fields.', 422, fields))
      return
    }
    if (!form.reportValidity()) return
    busy.current = true
    setPending(true)
    setError(null)
    form.reset()
    try {
      await authApi.resetPassword({ ...link, password, password_confirmation: confirmation })
      resetComplete.current = true
      if (mounted.current) {
        setComplete(true)
        // Retire the used token before any session request or completion retry.
        navigate('/reset-password', { replace: true, state: null })
      }
      await finish()
    } catch (failure) {
      if (mounted.current) {
        const next = toApiError(failure)
        setError(
          !resetComplete.current && (!next.status || next.status >= 500)
            ? new ApiError(
                'We could not confirm whether your password changed. Try signing in with the new password or request a new link.',
                next.status,
              )
            : next,
        )
      }
    } finally {
      busy.current = false
      if (mounted.current) setPending(false)
    }
  }

  return { complete, pending, error, reset, finishSignOut }
}
