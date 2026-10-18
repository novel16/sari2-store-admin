import { CheckCheck, LoaderCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { resetLinkFromSearch } from '../../auth/passwordRecovery'
import { usePasswordReset } from '../../auth/usePasswordReset'
import RecoveryLayout from './RecoveryLayout'
import RecoveryError from './RecoveryError'
import ResetPasswordForm from './ResetPasswordForm'

export default function ResetPasswordPage() {
  const location = useLocation()
  const link = resetLinkFromSearch(location.search)
  const reset = usePasswordReset()
  return (
    <RecoveryLayout
      title={reset.complete ? 'Your password is reset.' : 'Choose a new password.'}
      description="Use a unique password to keep your administrator account safe."
    >
      {reset.complete ? (
        <div className="space-y-5 rounded-2xl border border-brand/15 bg-brand/5 p-6 text-center">
          <CheckCheck size={28} className="mx-auto text-brand" />
          <p role="status" className="text-sm leading-relaxed text-slate-600">
            Your new password is ready. We’ll sign out any account in this browser so you can sign
            in with the right account.
          </p>
          <RecoveryError error={reset.error} />
          <button
            type="button"
            className="btn btn-primary w-full"
            disabled={reset.pending}
            onClick={() => void reset.finishSignOut()}
          >
            {reset.pending && <LoaderCircle size={16} className="animate-spin" />}
            {reset.pending ? 'Finishing securely...' : 'Continue to sign in'}
          </button>
        </div>
      ) : link ? (
        <ResetPasswordForm
          link={link}
          pending={reset.pending}
          error={reset.error}
          reset={reset.reset}
        />
      ) : (
        <p
          role="alert"
          className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm leading-relaxed text-orange-900"
        >
          This reset link is incomplete or invalid.{' '}
          <Link to="/forgot-password" className="font-semibold underline">
            Request a new password reset link.
          </Link>
        </p>
      )}
    </RecoveryLayout>
  )
}
