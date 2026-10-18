import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { AdministratorCredentials } from './types'

export default function AdministratorCredentialsForm({
  creating,
  working,
  label,
  onSubmit,
}: {
  creating: boolean
  working: boolean
  label: string
  onSubmit: (credentials: AdministratorCredentials) => void
}) {
  const id = useId()
  const [proof, setProof] = useState(''),
    [password, setPassword] = useState(''),
    [confirmation, setConfirmation] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (working) return
    onSubmit({
      current_password: proof,
      ...(creating ? { password, password_confirmation: confirmation } : {}),
    })
    setProof('')
    setPassword('')
    setConfirmation('')
  }
  return (
    <form onSubmit={submit} className="mt-5 space-y-4" aria-busy={working}>
      <fieldset disabled={working} className="grid min-w-0 gap-4">
        {creating && (
          <>
            <label className="field" htmlFor={`${id}-password`}>
              New administrator password
              <input
                id={`${id}-password`}
                className="input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                maxLength={128}
              />
            </label>
            <label className="field" htmlFor={`${id}-confirmation`}>
              Confirm new administrator password
              <input
                id={`${id}-confirmation`}
                className="input"
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
                minLength={8}
                maxLength={128}
              />
            </label>
          </>
        )}
        <label className="field" htmlFor={`${id}-proof`}>
          Your current password
          <input
            id={`${id}-proof`}
            className="input"
            type="password"
            autoComplete="current-password"
            value={proof}
            onChange={(event) => setProof(event.target.value)}
            required
            maxLength={128}
          />
        </label>
        <button className="btn btn-primary justify-self-start" type="submit">
          {working ? 'Please wait...' : label}
        </button>
      </fieldset>
    </form>
  )
}
