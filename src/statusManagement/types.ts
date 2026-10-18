export type ManagedStatus = 'active' | 'suspended'
export interface StatusTarget {
  type: 'account' | 'store'
  id: number
  accountId: number
  name: string
  status: string
  parentStatus?: string
  ownerStatus: string
}
export interface StatusReview {
  target_type: StatusTarget['type']
  target_id: number
  target_name: string
  account_id: number
  from_status: ManagedStatus
  to_status: ManagedStatus
  reason: string
  parent_status: string | null
  impact: {
    affected_store_count: number
    active_store_count: number
    suspended_store_count: number
    owner_access_blocked: boolean
    child_statuses_preserved: true
  }
  review_token: string
  expires_at: string
}
export interface StatusChange {
  id: number
  target_type: StatusTarget['type']
  target_id: number
  target_name: string
  account_id: number
  from_status: ManagedStatus
  to_status: ManagedStatus
  reason: string
  actor: { id: number; name: string }
  created_at: string
}
export interface StatusResult {
  data: StatusChange
  meta: { replayed: boolean }
}
export interface PendingStatusChange {
  requestKey: string
  review: StatusReview
}
