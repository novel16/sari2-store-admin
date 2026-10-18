import { createContext } from 'react'
import type { ApiError } from '../api/errors'
import type { AdminUser, LoginInput } from './types'
export interface AuthState {
  user: AdminUser | null
  loading: boolean
  error: ApiError | null
  refresh: (options?: { throwOnError?: boolean }) => Promise<void>
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: AdminUser) => void
}
export const AuthContext = createContext<AuthState | null>(null)
