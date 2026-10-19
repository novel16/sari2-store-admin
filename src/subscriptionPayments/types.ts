import type { PageMeta } from '../platform/types'

export interface SubscriptionPayment {
  id: string
  account_id: number
  plan: { id: number; version: number; code: string; name: string }
  months: number
  amount_centavos: number
  currency: 'PHP'
  payment_status: 'creating' | 'pending' | 'unknown' | 'paid' | 'expired' | 'failed'
  fulfillment_status: 'pending' | 'fulfilled' | 'needs_attention'
  created_at: string
  paid_at: string | null
  fulfilled_at: string | null
  issue_code: string | null
  subscription: { id: number; starts_at: string; ends_at: string | null } | null
  account: { id: number; name: string; status: string }
  owner: { id: number; name: string; email: string }
}
export interface PaymentFilters {
  q: string
  payment_status: 'all' | SubscriptionPayment['payment_status']
  fulfillment_status: 'all' | SubscriptionPayment['fulfillment_status']
  page: number
}
export interface PaymentsReply {
  data: SubscriptionPayment[]
  meta: PageMeta
}
