import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { returnToFromState } from '../../auth/access'
import SessionGate from '../../auth/SessionGate'
import PageLoading from '../../components/PageLoading'
import LoginForm from './LoginForm'
export default function LoginPage() {
  useEffect(() => {
    document.title = 'Sign in · Sarisari Admin'
  }, [])
  const { user, loading, error } = useAuth(),
    location = useLocation()
  if (loading) return <PageLoading />
  if (error) return <SessionGate />
  if (user) return <Navigate to={returnToFromState(location.state)} replace />
  return <LoginForm />
}
