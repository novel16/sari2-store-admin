import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import StatusHistory from './StatusHistory'
import StatusManagement from './StatusManagement'
import type { StatusTarget } from './types'

export default function StatusWorkspace({
  target,
  onSaved,
}: {
  target: StatusTarget
  onSaved: () => void
}) {
  const { user } = useAuth()
  const [revision, setRevision] = useState(0)
  const scope = `${user?.id}:${target.type}:${target.id}`
  return (
    <>
      <StatusManagement
        key={scope}
        target={target}
        onSaved={() => {
          setRevision((value) => value + 1)
          onSaved()
        }}
      />
      <StatusHistory key={`${scope}:${revision}`} target={target} />
    </>
  )
}
