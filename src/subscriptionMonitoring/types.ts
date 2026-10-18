import type { PageMeta } from '../platform/types'

export type SubscriptionState = 'active_basic' | 'expired_paid' | 'free' | 'other_paid'
export type SubscriptionFilter = SubscriptionState | 'all' | 'expiring'
export interface MonitoringFilters {
  q: string
  status: SubscriptionFilter
  expiry_days: '7' | '30'
  account_status: 'all' | 'active' | 'suspended'
  page: number
}
interface PlanLabel {
  code: string
  name: string
}
export interface MonitoredSubscription {
  account: { id: number; name: string; status: string }
  owner: { id: number; name: string; email: string; status: string }
  state: SubscriptionState
  is_expiring: boolean
  is_paid: boolean
  current: {
    subscription_id: number | null
    plan: PlanLabel
    starts_at: string | null
    ends_at: string | null
  }
  coverage_ends_at: string | null
  next_period: {
    id: number
    plan: PlanLabel
    starts_at: string
    ends_at: string | null
  } | null
  scheduled_periods: number
  last_paid_ended_at: string | null
}
export interface MonitoringResponse {
  data: MonitoredSubscription[]
  summary: Record<Exclude<SubscriptionFilter, 'all'> | 'total', number>
  meta: PageMeta & {
    filters: Omit<MonitoringFilters, 'page' | 'expiry_days'> & { expiry_days: number }
    time_zone: 'Asia/Manila'
    generated_at: string
  }
}
