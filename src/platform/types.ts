export interface Owner {
  id: number
  name: string
  email: string
  status: string
}
export interface AccountRecord {
  id: number
  name: string
  status: string
  owner: Owner
  stores_count: number
  members_count: number
  created_at: string
  updated_at: string
}
export interface StoreRecord {
  id: number
  account_id: number
  name: string
  slug: string
  status: string
  phone: string | null
  address: string | null
  account: { id: number; name: string; status: string; owner: Owner }
  created_at: string
  updated_at: string
}
export interface PageMeta {
  current_page: number
  last_page: number
  total: number
  per_page: number
  from: number | null
  to: number | null
}
export interface PageResponse<T> {
  data: T[]
  meta: PageMeta
}
export interface StatusCounts {
  total: number
  active: number
  suspended: number
}
export interface Overview {
  summary: {
    accounts: StatusCounts
    stores: StatusCounts
    users: StatusCounts
    administrators: StatusCounts
  }
  registrations: { date: string; accounts: number }[]
  date_from: string
  date_to: string
  timezone: string
  generated_at: string
  recent_accounts: AccountRecord[]
  recent_stores: StoreRecord[]
}
