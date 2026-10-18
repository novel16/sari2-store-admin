import type { PageMeta } from '../platform/types'

export type AdministratorStatus = 'active' | 'suspended'
export interface Administrator {
  id: number
  name: string
  email: string
  status: AdministratorStatus
  created_at: string
  updated_at: string
}
export interface AdministratorEvent {
  id: number
  action: 'created' | 'status_changed'
  administrator: Pick<Administrator, 'id' | 'name' | 'email'>
  from_status: AdministratorStatus | null
  to_status: AdministratorStatus
  reason: string
  actor: { id: number | null; name: string }
  created_at: string
}
interface ReviewBase {
  reason: string
  review_token: string
  expires_at: string
}
export interface CreationReview extends ReviewBase {
  kind: 'create'
  name: string
  email: string
}
export interface AdministratorStatusReview extends ReviewBase {
  kind: 'status'
  administrator: Pick<Administrator, 'id' | 'name' | 'email' | 'status'>
  from_status: AdministratorStatus
  to_status: AdministratorStatus
  active_administrators: number
}
export type AdministratorReview = CreationReview | AdministratorStatusReview
export type OperationScope = { kind: 'create' } | { kind: 'status'; id: number }
export interface PendingAdministratorOperation {
  requestKey: string
  review: AdministratorReview
}
export interface AdministratorCredentials {
  current_password: string
  password?: string
  password_confirmation?: string
}
export interface AdministratorResult {
  data: Administrator
  event: AdministratorEvent
  meta: { replayed: boolean }
}
export interface AdministratorDirectory {
  data: Administrator[]
  meta: PageMeta & { active_administrators: number }
}
