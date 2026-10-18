import { writeWithCsrf } from '../api/http'
import type { AdminUser } from '../auth/types'

export const updateAdminProfile = (input: {
  name: string
  email: string
  current_password?: string
}) => writeWithCsrf<{ data: AdminUser }>('patch', '/api/v1/admin/profile', input)
export const changeAdminPassword = (input: {
  current_password: string
  password: string
  password_confirmation: string
}) => writeWithCsrf<{ message: string }>('patch', '/api/v1/admin/password', input)
