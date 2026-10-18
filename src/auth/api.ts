import { http, postWithCsrf } from '../api/http'
import type { AuthMessage, LoginInput, ResetPasswordInput, UserResponse } from './types'
export const authApi = {
  async me() {
    return (await http.get<UserResponse>('/api/v1/admin/me')).data.data
  },
  async login(input: LoginInput) {
    return (await postWithCsrf<UserResponse>('/admin/login', input)).data
  },
  logout: () => postWithCsrf<void>('/logout'),
  forgotPassword: (email: string) => postWithCsrf<AuthMessage>('/forgot-password', { email }),
  resetPassword: (input: ResetPasswordInput) => postWithCsrf<AuthMessage>('/reset-password', input),
}
