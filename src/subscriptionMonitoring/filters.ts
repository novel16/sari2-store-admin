import { pageNumber } from '../platform/directory'
import type { MonitoringFilters } from './types'

export const subscriptionStatuses = {
  all: 'All subscriptions',
  active_basic: 'Active Basic',
  expiring: 'Expiring soon',
  expired_paid: 'Expired paid',
  free: 'Free',
  other_paid: 'Other paid',
} as const

export function readMonitoringFilters(params: URLSearchParams): MonitoringFilters {
  const status = params.get('status')
  const accountStatus = params.get('account_status')
  return {
    q: params.get('q') ?? '',
    status:
      status && Object.hasOwn(subscriptionStatuses, status)
        ? (status as MonitoringFilters['status'])
        : 'all',
    expiry_days: params.get('expiry_days') === '30' ? '30' : '7',
    account_status:
      accountStatus === 'active' || accountStatus === 'suspended' ? accountStatus : 'all',
    page: pageNumber(params.get('page')),
  }
}

export function monitoringPath(filters: MonitoringFilters) {
  return `/api/v1/admin/subscriptions?${new URLSearchParams({
    q: filters.q.trim(),
    status: filters.status,
    expiry_days: filters.expiry_days,
    account_status: filters.account_status,
    page: String(filters.page),
    per_page: '20',
  })}`
}
