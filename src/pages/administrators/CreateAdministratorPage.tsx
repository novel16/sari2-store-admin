import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import CreateAdministrator from '../../administrators/CreateAdministrator'
import PageHeader from '../../components/PageHeader'

export default function CreateAdministratorPage() {
  const { user } = useAuth(),
    navigate = useNavigate()
  return (
    <>
      <Link
        className="mb-6 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-brand"
        to="/administrators"
      >
        <ArrowLeft size={14} />
        All administrators
      </Link>
      <PageHeader
        eyebrow="Platform access"
        title="Create administrator"
        description="Review the new account before setting its password and confirming."
      />
      <CreateAdministrator
        key={user?.id}
        onSaved={(result) =>
          navigate(`/administrators/${result.data.id}`, { replace: true, state: { created: true } })
        }
      />
    </>
  )
}
