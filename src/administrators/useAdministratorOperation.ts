import { useEffect, useRef, useState } from 'react'
import { ApiError, toApiError } from '../api/errors'
import { useAuth } from '../auth/useAuth'
import {
  confirmAdministratorOperation,
  definitiveAdministratorRejection,
  findAdministratorOperation,
  isOperationNotFound,
  previewAdministratorStatus,
  previewCreation,
} from './api'
import {
  clearAdministratorOperation,
  readAdministratorOperation,
  saveAdministratorOperation,
  validAdministratorReview,
} from './recovery'
import type {
  AdministratorCredentials,
  AdministratorResult,
  AdministratorReview,
  AdministratorStatus,
  OperationScope,
  PendingAdministratorOperation,
} from './types'

export function useAdministratorOperation(
  scope: OperationScope,
  onSaved: (result: AdministratorResult) => void,
) {
  const { user, refresh } = useAuth()
  const actorId = user?.id ?? 0
  const [recovery, setRecovery] = useState(() => readAdministratorOperation(actorId, scope))
  const [review, setReview] = useState<AdministratorReview>()
  const [error, setError] = useState<ApiError>()
  const [working, setWorking] = useState(false)
  const busy = useRef(false),
    mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  function report(failure: unknown) {
    const next = toApiError(failure)
    setError(next)
    if (next.status === 401 || next.status === 403) void refresh()
  }
  async function preview(input: {
    name?: string
    email?: string
    reason: string
    status?: AdministratorStatus
  }) {
    if (!user || busy.current || recovery.pending || recovery.blocked) return
    busy.current = true
    setWorking(true)
    setError(undefined)
    try {
      const reason = input.reason.trim()
      const result =
        scope.kind === 'create'
          ? await previewCreation({
              name: input.name?.trim() ?? '',
              email: input.email?.trim().toLowerCase() ?? '',
              reason,
            })
          : await previewAdministratorStatus(scope.id, input.status!, reason)
      if (!mounted.current) return
      if (
        !validAdministratorReview(result.data, scope) ||
        result.data.reason !== reason ||
        (result.data.kind === 'create'
          ? result.data.name !== input.name?.trim() ||
            result.data.email !== input.email?.trim().toLowerCase()
          : result.data.to_status !== input.status)
      )
        throw new ApiError('The review response could not be verified. Please review again.')
      setReview(result.data)
    } catch (failure) {
      if (mounted.current) report(failure)
    } finally {
      busy.current = false
      if (mounted.current) setWorking(false)
    }
  }
  function verify(result: AdministratorResult, pending: PendingAdministratorOperation) {
    const { data, event } = result,
      reviewed = pending.review
    return (
      Number.isSafeInteger(data?.id) &&
      data.id > 0 &&
      Number.isSafeInteger(event?.id) &&
      event.id > 0 &&
      event.actor?.id === actorId &&
      event.administrator?.id === data.id &&
      data.name === event.administrator.name &&
      data.email === event.administrator.email &&
      data.status === event.to_status &&
      event.reason === reviewed.reason &&
      (reviewed.kind === 'create'
        ? event.action === 'created' &&
          event.from_status === null &&
          event.to_status === 'active' &&
          event.administrator.name === reviewed.name &&
          event.administrator.email === reviewed.email
        : event.action === 'status_changed' &&
          data.id === reviewed.administrator.id &&
          event.administrator.name === reviewed.administrator.name &&
          event.administrator.email === reviewed.administrator.email &&
          event.from_status === reviewed.from_status &&
          event.to_status === reviewed.to_status)
    )
  }
  async function run(
    pending: PendingAdministratorOperation,
    mode: 'confirm' | 'check' | 'retry',
    credentials?: AdministratorCredentials,
  ) {
    if (busy.current) return
    const stored = readAdministratorOperation(actorId, scope)
    if (stored.blocked || JSON.stringify(stored.pending) !== JSON.stringify(pending)) {
      setRecovery({ pending: stored.pending, blocked: true })
      setError(
        new ApiError(
          'The saved recovery request changed or became unavailable. No request was sent. Restore browser recovery before continuing.',
        ),
      )
      return
    }
    busy.current = true
    setWorking(true)
    setError(undefined)
    let mutation = false
    try {
      let result: AdministratorResult | undefined
      if (mode !== 'confirm') {
        try {
          result = await findAdministratorOperation(pending.requestKey)
        } catch (failure) {
          if (mode !== 'retry' || !isOperationNotFound(failure)) throw failure
        }
      }
      if (!result) {
        if (!mounted.current) return
        mutation = true
        result = await confirmAdministratorOperation(scope, pending, credentials!)
      }
      if (!mounted.current) return
      if (!verify(result, pending))
        throw new ApiError(
          'The result could not be verified. Keep this request and check its status again.',
        )
      if (!clearAdministratorOperation(actorId, scope, pending.requestKey))
        throw new ApiError(
          'Saved successfully, but browser recovery could not be cleared. Check saved status before another change.',
        )
      setRecovery({ pending: null, blocked: false })
      setReview(undefined)
      onSaved(result)
    } catch (failure) {
      if (!mounted.current) return
      if (
        mutation &&
        definitiveAdministratorRejection(failure, scope) &&
        clearAdministratorOperation(actorId, scope, pending.requestKey)
      ) {
        setRecovery({ pending: null, blocked: false })
        setReview(undefined)
      }
      report(failure)
    } finally {
      busy.current = false
      if (mounted.current) setWorking(false)
    }
  }
  function confirm(credentials: AdministratorCredentials) {
    if (!review || recovery.pending || recovery.blocked || busy.current) return
    const pending = { requestKey: crypto.randomUUID(), review }
    if (!saveAdministratorOperation(actorId, scope, pending)) {
      setRecovery(readAdministratorOperation(actorId, scope))
      setReview(undefined)
      setError(
        new ApiError(
          'Browser recovery could not be saved. No request was sent. Enable browser storage and review again.',
        ),
      )
      return
    }
    setRecovery({ pending, blocked: false })
    setReview(undefined)
    void run(pending, 'confirm', credentials)
  }
  return {
    ...recovery,
    review,
    error,
    working,
    preview,
    confirm,
    closeReview: () => {
      if (!busy.current) setReview(undefined)
    },
    check: () => {
      if (recovery.pending) void run(recovery.pending, 'check')
    },
    retry: (credentials: AdministratorCredentials) => {
      if (recovery.pending) void run(recovery.pending, 'retry', credentials)
    },
  }
}
