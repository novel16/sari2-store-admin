import { useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import QueryState from '../../components/QueryState'
import { useApiQuery } from '../../hooks/useApiQuery'
import { toApiError } from '../../api/errors'
import type { ApiError } from '../../api/errors'
import { useAuth } from '../../auth/useAuth'
import { websiteApi } from '../../website/api'
import type { WebsiteDocument } from '../../website/types'
import WebsiteEditor from '../../website/WebsiteEditor'
import WebsiteHistory from '../../website/WebsiteHistory'

export default function WebsitePage() {
  const result = useApiQuery<{ data: WebsiteDocument }>('/api/v1/admin/website'),
    doc = result.data?.data
  const [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [error, setError] = useState<ApiError | null>(null),
    [message, setMessage] = useState('')
  const locked = useRef(false),
    { refresh } = useAuth()
  async function run(action: () => Promise<unknown>, success: string) {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setError(null)
    setMessage('')
    try {
      await action()
      setDirty(false)
      setMessage(success)
      result.reload()
    } catch (failure) {
      const next = toApiError(failure)
      setError(next)
      if (next.status === 401 || next.status === 403) await refresh()
    } finally {
      locked.current = false
      setBusy(false)
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="PUBLIC WEBSITE"
        title="Website content & SEO"
        description="Manage your public pages, search metadata and published content."
        actions={
          <button
            className="btn btn-secondary"
            disabled={busy || dirty || result.loading}
            onClick={result.reload}
          >
            <RefreshCw size={15} />
            Reload latest
          </button>
        }
      />
      {message && (
        <p role="status" className="mb-5 rounded-xl bg-green-50 p-4 text-sm text-green-900">
          {message}
        </p>
      )}
      <QueryState loading={result.loading} error={result.error} retry={result.reload} />
      {doc && (
        <>
          <WebsiteEditor
            key={doc.version}
            document={doc}
            busy={busy}
            error={error}
            onDirty={setDirty}
            onSave={(content, note) =>
              void run(
                () => websiteApi.save(doc.version, content, note),
                'Draft saved. Preview it before publishing.',
              )
            }
            onPublish={(note) =>
              void run(
                () => websiteApi.publish(doc.version, note),
                'Published. Public HTML and SEO will refresh on the next website request.',
              )
            }
          />
          <WebsiteHistory
            key={`history:${doc.version}`}
            busy={busy || dirty}
            onRestore={(id) =>
              void run(
                () => websiteApi.restore(doc.version, id),
                'Revision restored to draft. Preview and publish when ready.',
              )
            }
          />
        </>
      )}
    </>
  )
}
