import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { safeReturnTo } from './access'
import SessionGate from './SessionGate'
import PageLoading from '../components/PageLoading'
export default function RequireAdmin() {
  const { user, loading, error } = useAuth(),
    location = useLocation()
  if (loading) return <PageLoading />
  if (error) return <SessionGate />
  if (!user)
    return (
      <Navigate
        to="/login"
        replace
        state={{ returnTo: safeReturnTo(`${location.pathname}${location.search}${location.hash}`) }}
      />
    )
  return <Outlet />
}
