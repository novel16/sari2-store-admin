import type { ActivityEntry, ActivityFilters } from './types'

export const modules = {
  all: 'All modules',
  administrators: 'Administrators',
  accounts: 'Accounts',
  stores: 'Stores',
  plans: 'Plans',
  subscriptions: 'Subscriptions',
} as const
export const actions = {
  all: 'All actions',
  created: 'Created',
  suspended: 'Suspended',
  reactivated: 'Reactivated',
  plan_version_recorded: 'Plan version recorded',
  activated: 'Activated',
  renewed: 'Renewed',
} as const
export function defaultDates(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((item) => item.type === type)!.value
  const date_to = `${part('year')}-${part('month')}-${part('day')}`
  const start = new Date(`${date_to}T00:00:00Z`)
  start.setUTCDate(start.getUTCDate() - 29)
  return { date_from: start.toISOString().slice(0, 10), date_to }
}
export function readFilters(
  params: URLSearchParams,
  dates: ReturnType<typeof defaultDates>,
): ActivityFilters {
  const actor = params.get('actor_id')
  return {
    q: params.get('q') ?? '',
    module: Object.hasOwn(modules, params.get('module') ?? '')
      ? (params.get('module') as ActivityFilters['module'])
      : 'all',
    action: Object.hasOwn(actions, params.get('action') ?? '')
      ? (params.get('action') as ActivityFilters['action'])
      : 'all',
    actor_id:
      actor !== null && /^(0|[1-9]\d*)$/.test(actor) && Number.isSafeInteger(Number(actor))
        ? Number(actor)
        : null,
    date_from: params.get('date_from') ?? dates.date_from,
    date_to: params.get('date_to') ?? dates.date_to,
  }
}
const validDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value
export function dateError(from: string, to: string) {
  if (!validDate(from) || !validDate(to)) return 'Choose a valid start date and end date.'
  const days = (Date.parse(to) - Date.parse(from)) / 86400000
  if (days < 0) return 'The end date must be on or after the start date.'
  if (days > 365) return 'Choose a date range of 366 days or fewer.'
  return ''
}
export function activityPath(filters: ActivityFilters, cursor: string | null) {
  const params = new URLSearchParams({
    q: filters.q.trim(),
    module: filters.module,
    action: filters.action,
    date_from: filters.date_from,
    date_to: filters.date_to,
    per_page: '20',
  })
  if (filters.actor_id !== null) params.set('actor_id', String(filters.actor_id))
  if (cursor) params.set('cursor', cursor)
  return `/api/v1/admin/activity?${params}`
}
export function targetPath(target: ActivityEntry['target']) {
  if (!Number.isSafeInteger(target.id) || target.id < 1) return null
  const base = {
    administrator: 'administrators',
    account: 'accounts',
    store: 'stores',
    plan: 'plans',
  }[target.type]
  if (!base) return null
  const expected = `/${base}/${target.id}`
  return target.path === expected ||
    (target.type === 'account' && target.path === `${expected}/subscription`)
    ? target.path
    : null
}
