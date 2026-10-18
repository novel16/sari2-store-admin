import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAdmin from '../auth/RequireAdmin'
import RouteBoundary from './RouteBoundary'
import AdminLayout from '../layouts/AdminLayout'

const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'))
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'))
const AccountsPage = lazy(() => import('../pages/accounts/AccountsPage'))
const AccountDetailsPage = lazy(() => import('../pages/accounts/AccountDetailsPage'))
const StoresPage = lazy(() => import('../pages/stores/StoresPage'))
const StoreDetailsPage = lazy(() => import('../pages/stores/StoreDetailsPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
const PlansPage = lazy(() => import('../pages/plans/PlansPage'))
const PlanEditorPage = lazy(() => import('../pages/plans/PlanEditorPage'))
const AccountSubscriptionPage = lazy(() => import('../pages/subscriptions/AccountSubscriptionPage'))
const AdministratorsPage = lazy(() => import('../pages/administrators/AdministratorsPage'))
const CreateAdministratorPage = lazy(
  () => import('../pages/administrators/CreateAdministratorPage'),
)
const AdministratorDetailsPage = lazy(
  () => import('../pages/administrators/AdministratorDetailsPage'),
)
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'))
const ActivityPage = lazy(() => import('../pages/activity/ActivityPage'))
const SubscriptionMonitoringPage = lazy(
  () => import('../pages/subscriptions/SubscriptionMonitoringPage'),
)

export default function AppRoutes() {
  return (
    <RouteBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
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
            <Route path="/administrators" element={<AdministratorsPage />} />
            <Route path="/administrators/new" element={<CreateAdministratorPage />} />
            <Route path="/administrators/:administratorId" element={<AdministratorDetailsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/subscriptions" element={<SubscriptionMonitoringPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </RouteBoundary>
  )
}
