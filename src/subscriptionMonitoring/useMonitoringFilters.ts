import { useSearchParams } from 'react-router-dom'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { monitoringPath, readMonitoringFilters } from './filters'
import type { MonitoringFilters } from './types'

export function useMonitoringFilters() {
  const [params, setParams] = useSearchParams()
  const filters = readMonitoringFilters(params)
  const debounced = useDebouncedValue(filters.q)
  function change(key: keyof MonitoringFilters, value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value && value !== 'all') next.set(key, value)
        else next.delete(key)
        if (key !== 'page') next.delete('page')
        return next
      },
      { replace: key !== 'page' },
    )
  }
  return {
    filters,
    change,
    reset: () => setParams({}, { replace: true }),
    searching: filters.q !== debounced,
    path: monitoringPath({ ...filters, q: debounced }),
  }
}
