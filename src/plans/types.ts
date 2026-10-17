export type CatalogStatus = 'draft' | 'published' | 'coming_soon' | 'retired'
export interface PlanInput {
  code: string
  name: string
  description: string | null
  monthly_price_centavos: number
  active_product_limit: number | null
  quota_scope: 'store' | 'account'
  store_limit: number
  staff_limit: number
  catalog_status: CatalogStatus
  planned_features: string[]
  featured: boolean
  sort_order: number
  expected_version?: number
  change_note: string
}
export interface Plan extends Omit<PlanInput, 'change_note' | 'expected_version'> {
  id: number
  version: number
  subscriptions_count: number
  created_at: string
  updated_at: string
}
export interface PlanVersion {
  id: number
  version: number
  terms: Pick<
    Plan,
    | 'code'
    | 'name'
    | 'monthly_price_centavos'
    | 'active_product_limit'
    | 'quota_scope'
    | 'store_limit'
    | 'staff_limit'
  >
  change_note: string | null
  actor: { id: number; name: string } | null
  created_at: string
}
