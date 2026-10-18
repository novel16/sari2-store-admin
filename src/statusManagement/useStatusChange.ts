import { useEffect, useRef, useState } from 'react'
import { ApiError, toApiError } from '../api/errors'
import { useAuth } from '../auth/useAuth'
import { confirmStatus, definitiveStatusRejection, findStatusChange, previewStatus } from './api'
import {
  clearStatusChange,
  readStatusChange,
  saveStatusChange,
  validStatusReview,
} from './recovery'
import type {
  ManagedStatus,
  PendingStatusChange,
  StatusResult,
  StatusReview,
  StatusTarget,
} from './types'

export function useStatusChange(target: StatusTarget, onSaved: () => void) {
  const { user, refresh } = useAuth()
  const adminId = user?.id ?? 0
  const [recovery, setRecovery] = useState(() => readStatusChange(adminId, target))
  const [review, setReview] = useState<StatusReview>()
  const [error, setError] = useState<ApiError>()
  const [working, setWorking] = useState(false)
  const mounted = useRef(false)
  const busy = useRef(false)
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

  async function preview(status: ManagedStatus, reason: string) {
    if (!user || busy.current || recovery.pending || recovery.blocked) return
    busy.current = true
    setWorking(true)
    setError(undefined)
    try {
      const response = await previewStatus(target, status, reason.trim())
      if (!mounted.current) return
      if (
        !validStatusReview(response.data, target) ||
        response.data.to_status !== status ||
        response.data.reason !== reason.trim()
      )
        throw new ApiError('The review response could not be verified. Please review again.')
      setReview(response.data)
    } catch (failure) {
      if (mounted.current) report(failure)
    } finally {
      busy.current = false
      if (mounted.current) setWorking(false)
    }
  }

  async function run(pending: PendingStatusChange, lookup: boolean) {
    if (busy.current) return
    const stored = readStatusChange(adminId, target)
    if (stored.blocked || JSON.stringify(stored.pending) !== JSON.stringify(pending)) {
      setRecovery({ pending: stored.pending, blocked: true })
      setError(
        new ApiError(
          'The saved recovery request changed or became unavailable. No request was sent. Reload after restoring browser recovery.',
        ),
      )
      return
    }
    busy.current = true
    setWorking(true)
    setError(undefined)
    try {
      const result: StatusResult = lookup
        ? await findStatusChange(target, pending.requestKey)
        : await confirmStatus(target, pending)
      if (!mounted.current) return
      const saved = result.data
      if (
        saved?.target_type !== target.type ||
        saved.target_id !== target.id ||
        saved.account_id !== target.accountId ||
        saved.from_status !== pending.review.from_status ||
        saved.to_status !== pending.review.to_status ||
        saved.reason !== pending.review.reason ||
        saved.actor?.id !== adminId ||
        !Number.isSafeInteger(saved.id)
      )
        throw new ApiError(
          'The result could not be verified. Keep this request and check its status again.',
        )
      if (!clearStatusChange(adminId, target, pending.requestKey))
        throw new ApiError(
          'The status change was saved, but browser recovery could not be cleared. Check its status again before starting another change.',
        )
      setRecovery({ pending: null, blocked: false })
      setReview(undefined)
      onSaved()
    } catch (failure) {
      if (!mounted.current) return
      if (
        !lookup &&
        definitiveStatusRejection(failure, target) &&
        clearStatusChange(adminId, target, pending.requestKey)
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

  function confirm() {
    if (!review || recovery.pending || recovery.blocked || busy.current) return
    const pending: PendingStatusChange = { requestKey: crypto.randomUUID(), review }
    if (!saveStatusChange(adminId, target, pending)) {
      setRecovery(readStatusChange(adminId, target))
      setReview(undefined)
      setError(
        new ApiError(
          'Browser recovery could not be saved. No status change was sent. Enable browser storage and try again.',
        ),
      )
      return
    }
    setRecovery({ pending, blocked: false })
    setReview(undefined)
    void run(pending, false)
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
    retry: () => {
      if (recovery.pending) void run(recovery.pending, false)
    },
    check: () => {
      if (recovery.pending) void run(recovery.pending, true)
    },
  }
}
