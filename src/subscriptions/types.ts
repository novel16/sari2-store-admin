import type { Plan, PlanVersion } from '../plans/types'

export type PlanTerms = PlanVersion['terms']
export interface Period {
  id: number
  plan: PlanTerms
  starts_at: string
  ends_at: string | null
}
export interface SubscriptionOverview {
  account: { id: number; name: string; status: string }
  current: { plan: PlanTerms; starts_at: string | null; ends_at: string | null }
  renewal: {
    mode: 'manual'
    auto_renew: false
    next_period: Period | null
    scheduled_periods: number
    last_paid_ended_at: string | null
  }
  available_plan: Plan | null
}
export interface PreviewInput {
  plan_id: number
  months: number
  settlement_method: 'manual_payment' | 'complimentary'
  amount_centavos: number
  payment_reference?: string
  payment_verified?: boolean
  reason: string
}
export interface Proposal {
  account_id: number
  account_name: string
  action: 'activate' | 'renew'
  plan_version: number
  terms: PlanTerms
  months: number
  total_centavos: number
  starts_at: string
  ends_at: string
}
export interface SubscriptionReview {
  quote: string
  expires_at: string
  proposal: Proposal
  settlement: Pick<PreviewInput, 'settlement_method' | 'amount_centavos' | 'reason'> & {
    payment_reference: string | null
  }
}
export interface Activation {
  id: number
  subscription_id: number
  action: 'activate' | 'renew'
  settlement_method: 'manual_payment' | 'complimentary'
  amount_centavos: number
  months: number
  payment_reference: string | null
  reason: string
  snapshot: Proposal
  actor: { id: number; name: string }
  created_at: string
}
