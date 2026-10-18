import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, toApiError } from '../api/errors'
import { AuthContext } from './AuthContext'
import { authApi } from './api'
import { canAccessAdmin } from './access'
import type { AdminUser, LoginInput } from './types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<ApiError | null>(null)
  const version = useRef(0)
  const invalidate = useCallback(() => {
    version.current++
  }, [])
  const load = useCallback(async (current: number) => {
    try {
      const value = await authApi.me()
      if (!canAccessAdmin(value))
        throw new ApiError('Platform administrator access is required.', 403)
      if (current === version.current) {
        setUser(value)
        setError(null)
      }
      return null
    } catch (failure) {
      if (current !== version.current) return
      const next = toApiError(failure)
      setUser(null)
      setError(next.status === 401 ? null : next)
      return next.status === 401 ? null : next
    } finally {
      if (current === version.current) setLoading(false)
    }
  }, [])
  useEffect(() => {
    void load(++version.current)
    return invalidate
  }, [load, invalidate])
  const refresh = useCallback(
    async (options?: { throwOnError?: boolean }) => {
      setLoading(true)
      setError(null)
      const failure = await load(++version.current)
      if (failure && options?.throwOnError) throw failure
    },
    [load],
  )
  const login = useCallback(async (input: LoginInput) => {
    try {
      const value = await authApi.login(input)
      if (!canAccessAdmin(value))
        throw new ApiError('Platform administrator access is required.', 403)
      version.current++
      setUser(value)
      setError(null)
    } catch (failure) {
      throw toApiError(failure)
    }
  }, [])
  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (failure) {
      const next = toApiError(failure)
      if (next.status !== 401) throw next
    }
    version.current++
    setUser(null)
    setError(null)
  }, [])
  const updateUser = useCallback((next: AdminUser) => {
    if (!canAccessAdmin(next)) return
    version.current++
    setUser((current) => (current?.id === next.id ? next : current))
  }, [])
  const value = useMemo(
    () => ({ user, loading, error, refresh, login, logout, updateUser }),
    [user, loading, error, refresh, login, logout, updateUser],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
