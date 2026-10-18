export type ActivityModule =
  | 'all'
  | 'administrators'
  | 'accounts'
  | 'stores'
  | 'plans'
  | 'subscriptions'
export type ActivityAction =
  | 'all'
  | 'created'
  | 'suspended'
  | 'reactivated'
  | 'plan_version_recorded'
  | 'activated'
  | 'renewed'
export interface ActivityFilters {
  q: string
  module: ActivityModule
  action: ActivityAction
  actor_id: number | null
  date_from: string
  date_to: string
}
export interface ActivityEntry {
  id: string
  source: string
  source_id: number
  module: Exclude<ActivityModule, 'all'>
  action: Exclude<ActivityAction, 'all'>
  occurred_at: string
  actor: { id: number | null; name: string; name_recorded: boolean }
  target: {
    type: 'administrator' | 'account' | 'store' | 'plan'
    id: number
    name: string
    path: string
  }
  reason: string | null
  changes: { from_status: string | null; to_status: string | null }
  details: { plan_version?: number; plan_name?: string; months?: number }
}
export interface ActivityResponse {
  data: ActivityEntry[]
  meta: {
    per_page: number
    next_cursor: string | null
    prev_cursor: string | null
    filters: ActivityFilters
    time_zone: 'Asia/Manila'
  }
}
