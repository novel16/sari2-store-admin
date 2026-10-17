export function pageNumber(value: string | null) {
  return value && /^[1-9]\d*$/.test(value) && Number(value) <= 1000000 ? Number(value) : 1
}
export function recordId(value: string | undefined | null) {
  return value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
    ? Number(value)
    : null
}
export function directoryQuery(q: string, status: string, page: number, accountId?: number | null) {
  const query = new URLSearchParams({ q: q.trim(), status, page: String(page), per_page: '20' })
  if (accountId) query.set('account_id', String(accountId))
  return query.toString()
}
