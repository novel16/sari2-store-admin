import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { http } from '../api/http'
import { toApiError } from '../api/errors'
import type { ApiError } from '../api/errors'
import { useAuth } from '../auth/useAuth'

export function useApiQuery<T>(path: string | null) {
  const { refresh } = useAuth(),
    [revision, setRevision] = useState(0),
    [state, setState] = useState<{ key: string; data?: T; error?: ApiError }>({ key: '' })
  const key = `${path}:${revision}`,
    reload = useCallback(() => setRevision((value) => value + 1), [])
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    void http.get<T>(path, { signal: controller.signal }).then(
      (response) => {
        if (!controller.signal.aborted) setState({ key, data: response.data })
      },
      (failure) => {
        if (controller.signal.aborted || axios.isCancel(failure)) return
        const error = toApiError(failure)
        setState({ key, error })
        if (error.status === 401 || error.status === 403) void refresh()
      },
    )
    return () => controller.abort()
  }, [path, key, refresh])
  const current = state.key === key
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : undefined,
    loading: Boolean(path) && (!current || (!state.data && !state.error)),
    reload,
  }
}
