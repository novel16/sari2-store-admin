import { useSearchParams } from 'react-router-dom'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { paymentsPath, readPaymentFilters } from './filters'
import type { PaymentFilters } from './types'

export function usePaymentFilters() {
  const [params, setParams] = useSearchParams()
  const filters = readPaymentFilters(params)
  const debounced = useDebouncedValue(filters.q)
  function change(key: keyof PaymentFilters, value: string) {
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
    path: paymentsPath({ ...filters, q: debounced }),
  }
}
