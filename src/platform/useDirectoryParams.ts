import { useSearchParams } from 'react-router-dom'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { pageNumber, recordId, directoryQuery } from './directory'

export function useDirectoryParams(fixedAccountId?: number) {
  const [params, setParams] = useSearchParams(),
    search = params.get('q') ?? '',
    debounced = useDebouncedValue(search)
  const status = ['active', 'suspended'].includes(params.get('status') ?? '')
      ? params.get('status')!
      : 'all',
    page = pageNumber(params.get('page'))
  const accountId = fixedAccountId ?? recordId(params.get('account_id'))
  function change(key: string, value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value && value !== 'all') next.set(key, value)
        else next.delete(key)
        if (key !== 'page') next.delete('page')
        return next
      },
      { replace: true },
    )
  }
  function reset() {
    setParams(
      (current) => {
        const next = new URLSearchParams()
        if (current.get('account_id')) next.set('account_id', current.get('account_id')!)
        return next
      },
      { replace: true },
    )
  }
  return {
    search,
    status,
    page,
    accountId,
    query: directoryQuery(debounced, status, page, accountId),
    searching: search !== debounced,
    change,
    reset,
  }
}
