import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAdmin from '../auth/RequireAdmin'
import RouteBoundary from './RouteBoundary'
import AdminLayout from '../layouts/AdminLayout'

const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'))
const AccountsPage = lazy(() => import('../pages/accounts/AccountsPage'))
const AccountDetailsPage = lazy(() => import('../pages/accounts/AccountDetailsPage'))
const StoresPage = lazy(() => import('../pages/stores/StoresPage'))
const StoreDetailsPage = lazy(() => import('../pages/stores/StoreDetailsPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
const PlansPage = lazy(() => import('../pages/plans/PlansPage'))
const PlanEditorPage = lazy(() => import('../pages/plans/PlanEditorPage'))
const AccountSubscriptionPage = lazy(() => import('../pages/subscriptions/AccountSubscriptionPage'))

export default function AppRoutes() {
  return (
    <RouteBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/accounts/:accountId" element={<AccountDetailsPage />} />
            <Route path="/accounts/:accountId/subscription" element={<AccountSubscriptionPage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/stores/:storeId" element={<StoreDetailsPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/plans/new" element={<PlanEditorPage key="new" create />} />
            <Route path="/plans/:planId" element={<PlanEditorPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </RouteBoundary>
  )
}
