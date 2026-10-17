import { createContext } from 'react'
import type { ApiError } from '../api/errors'
import type { AdminUser, LoginInput } from './types'
export interface AuthState {
  user: AdminUser | null
  loading: boolean
  error: ApiError | null
  refresh: () => Promise<void>
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
}
export const AuthContext = createContext<AuthState | null>(null)
