import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { activityPath, dateError, defaultDates, readFilters } from './filters'
import type { ActivityFilters } from './types'

export function useActivityFilters() {
  const [dates] = useState(() => defaultDates())
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params, dates)
  const debounced = useDebouncedValue(filters.q)
  const error = dateError(filters.date_from, filters.date_to)
  function change(key: keyof ActivityFilters | 'cursor', value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value && value !== 'all') next.set(key, value)
        else next.delete(key)
        if (key !== 'cursor') next.delete('cursor')
        return next
      },
      { replace: key !== 'cursor' },
    )
  }
  function reset() {
    setParams({}, { replace: true })
  }
  return {
    filters,
    error,
    change,
    reset,
    searching: filters.q !== debounced,
    path: error ? null : activityPath({ ...filters, q: debounced }, params.get('cursor')),
  }
}
