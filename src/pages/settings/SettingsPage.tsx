import { useAuth } from '../../auth/useAuth'
import PageHeader from '../../components/PageHeader'
import PasswordForm from '../../settings/PasswordForm'
import ProfileForm from '../../settings/ProfileForm'

export default function SettingsPage() {
  const { user } = useAuth()
  return (
    <>
      <PageHeader
        eyebrow="My account"
        title="Profile & security"
        description="Manage your own platform administrator identity and password."
      />
      <div key={user?.id} className="grid items-start gap-6 xl:grid-cols-2">
        <ProfileForm />
        <PasswordForm />
      </div>
    </>
  )
}
