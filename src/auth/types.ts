export interface AdminUser {
  id: number
  name: string
  email: string
  platform_role: string
  status: string
}
export interface UserResponse {
  data: AdminUser
}
export interface LoginInput {
  email: string
  password: string
  remember: boolean
}
export interface ResetPasswordInput {
  email: string
  token: string
  password: string
  password_confirmation: string
}
export interface AuthMessage {
  message: string
}
