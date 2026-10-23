import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Upload } from 'lucide-react'
import type { ApiError } from '../api/errors'
import { toApiError } from '../api/errors'
import { websiteApi } from './api'
import type { SiteContent, WebsiteDocument } from './types'
import ContentListEditor from './ContentListEditor'

const labels: Record<string, string> = {
  name: 'Brand name',
  tagline: 'Tagline',
  title: 'SEO title',
  description: 'Meta description',
  eyebrow: 'Eyebrow',
  headline: 'Main heading',
  intro: 'Introduction',
  cta_label: 'Signup button label',
  features_title: 'Features heading',
  features_intro: 'Features introduction',
  steps_title: 'How it works heading',
  pricing_title: 'Pricing section heading',
  pricing_intro: 'Pricing section introduction',
  faq_title: 'FAQ heading',
  final_title: 'Final call to action heading',
  final_intro: 'Final call to action text',
}
function previewImage(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value, clientUrl)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}
const clientUrl = (import.meta.env.VITE_CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '')

export default function WebsiteEditor({
  document: doc,
  busy,
  error,
  onSave,
  onPublish,
  onDirty,
}: {
  document: WebsiteDocument
  busy: boolean
  error: ApiError | null
  onSave: (content: SiteContent, note: string) => void
  onPublish: (note: string) => void
  onDirty: (dirty: boolean) => void
}) {
  const [content, setContent] = useState(() => structuredClone(doc.draft)),
    [note, setNote] = useState(''),
    [uploading, setUploading] = useState(false),
    [uploadError, setUploadError] = useState('')
  const dirty = JSON.stringify(content) !== JSON.stringify(doc.draft),
    disabled = busy || uploading
  useEffect(() => onDirty(dirty), [dirty, onDirty])
  function updateGroup(group: 'brand' | 'home' | 'pricing', field: string, value: string) {
    setContent((current) => ({ ...current, [group]: { ...current[group], [field]: value } }))
  }
  async function upload(field: 'hero_url' | 'og_image_url' | 'logo_url', file: File) {
    setUploading(true)
    setUploadError('')
    try {
      const reply = await websiteApi.upload(file)
      setContent((current) => ({
        ...current,
        media: { ...current.media, [field]: reply.data.url },
      }))
    } catch (failure) {
      setUploadError(toApiError(failure).message)
    } finally {
      setUploading(false)
    }
  }
  function moveSection(index: number, direction: number) {
    const order = [...content.sections.order]
    ;[order[index], order[index + direction]] = [order[index + direction], order[index]]
    setContent((current) => ({ ...current, sections: { ...current.sections, order } }))
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (!disabled && note.trim().length >= 3) onSave(content, note)
      }}
    >
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0 space-y-6">
          {(['brand', 'home', 'pricing'] as const).map((group) => (
            <fieldset key={group} className="panel p-5 sm:p-6" disabled={disabled}>
              <legend className="sr-only">{group} content</legend>
              <h2 className="text-base font-semibold capitalize">
                {group === 'home'
                  ? 'Landing page'
                  : group === 'pricing'
                    ? 'Pricing page'
                    : 'Branding'}
              </h2>
              {Object.entries(content[group]).map(([field, value]) => (
                <label key={field} className="mt-4 block text-xs font-medium">
                  {labels[field] || field}
                  <textarea
                    className="input mt-2 w-full"
                    rows={field === 'description' || field.endsWith('intro') ? 3 : 2}
                    required
                    value={value}
                    maxLength={
                      field === 'title'
                        ? 120
                        : field === 'description'
                          ? 320
                          : group === 'brand'
                            ? field === 'name'
                              ? 80
                              : 120
                            : field === 'eyebrow'
                              ? 100
                              : field === 'cta_label'
                                ? 60
                                : field === 'intro'
                                  ? 600
                                  : field.endsWith('intro')
                                    ? 400
                                    : 140
                    }
                    aria-invalid={Boolean(error?.fields[`content.${group}.${field}`])}
                    onChange={(event) => updateGroup(group, field, event.target.value)}
                  />
                  {(field === 'title' || field === 'description') && (
                    <span className="mt-1 block text-[11px] text-slate-500">
                      {value.length} characters ·{' '}
                      {field === 'title'
                        ? 'Aim for a clear, specific title.'
                        : 'Describe what visitors will find on this page.'}
                    </span>
                  )}
                </label>
              ))}
            </fieldset>
          ))}
          <ContentListEditor
            title="Features"
            items={content.features}
            fields={['title', 'body']}
            disabled={disabled}
            onChange={(value) =>
              setContent((current) => ({ ...current, features: value as SiteContent['features'] }))
            }
          />
          <ContentListEditor
            title="Steps"
            items={content.steps}
            fields={['title', 'body']}
            disabled={disabled}
            onChange={(value) =>
              setContent((current) => ({ ...current, steps: value as SiteContent['steps'] }))
            }
          />
          <ContentListEditor
            title="FAQ"
            items={content.faqs}
            fields={['question', 'answer']}
            disabled={disabled}
            onChange={(value) =>
              setContent((current) => ({ ...current, faqs: value as SiteContent['faqs'] }))
            }
          />
          <fieldset className="panel p-5 sm:p-6" disabled={disabled}>
            <h2 className="text-base font-semibold">Sections</h2>
            <p className="mt-2 text-xs text-slate-500">
              Change the landing page order or hide a section. Pricing keeps its own public page.
            </p>
            <div className="mt-4 space-y-3">
              {content.sections.order.map((name, index) => (
                <div
                  key={name}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3"
                >
                  <label className="flex items-center gap-3 text-sm capitalize">
                    <input
                      type="checkbox"
                      checked={!content.sections.hidden.includes(name)}
                      onChange={(event) =>
                        setContent((current) => ({
                          ...current,
                          sections: {
                            ...current.sections,
                            hidden: event.target.checked
                              ? current.sections.hidden.filter((value) => value !== name)
                              : [...current.sections.hidden, name],
                          },
                        }))
                      }
                    />
                    {name === 'steps' ? 'How it works' : name}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Move ${name} section up`}
                      disabled={index === 0}
                      onClick={() => moveSection(index, -1)}
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Move ${name} section down`}
                      disabled={index === content.sections.order.length - 1}
                      onClick={() => moveSection(index, 1)}
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
          <fieldset className="panel p-5 sm:p-6" disabled={disabled}>
            <h2 className="text-base font-semibold">Images</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Upload PNG, JPEG or WebP up to 5 MB, or use an HTTP(S) image URL. Use a 1200 × 630
              image for social sharing.
            </p>
            {(['logo_url', 'hero_url', 'og_image_url'] as const).map((field) => (
              <div key={field} className="mt-5 border-t border-slate-100 pt-4">
                <label className="block text-xs font-medium">
                  {field === 'logo_url'
                    ? 'Logo'
                    : field === 'hero_url'
                      ? 'Hero image'
                      : 'Social sharing image'}{' '}
                  URL
                  <input
                    className="input mt-2 w-full"
                    value={content.media[field] || ''}
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        media: { ...current.media, [field]: event.target.value || null },
                      }))
                    }
                  />
                </label>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-forest">
                  <Upload size={15} />
                  {uploading ? 'Uploading…' : 'Upload image'}
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void upload(field, file)
                      event.target.value = ''
                    }}
                  />
                </label>
                {previewImage(content.media[field]) && (
                  <img
                    src={previewImage(content.media[field])!}
                    alt="Image preview"
                    className="mt-3 max-h-40 max-w-full rounded-xl border border-slate-200 object-contain"
                  />
                )}
              </div>
            ))}
            {(['hero_alt', 'og_image_alt'] as const).map((field) => (
              <label key={field} className="mt-4 block text-xs font-medium">
                {field === 'hero_alt' ? 'Hero image description' : 'Social image description'}
                <input
                  className="input mt-2 w-full"
                  required
                  maxLength={250}
                  value={content.media[field]}
                  onChange={(event) =>
                    setContent((current) => ({
                      ...current,
                      media: { ...current.media, [field]: event.target.value },
                    }))
                  }
                />
              </label>
            ))}
            {uploadError && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {uploadError}
              </p>
            )}
          </fieldset>
          <fieldset className="panel p-5 sm:p-6" disabled={disabled}>
            <h2 className="text-base font-semibold">Footer & contact</h2>
            <label className="mt-4 block text-xs font-medium">
              Footer description
              <input
                className="input mt-2 w-full"
                required
                maxLength={300}
                value={content.footer.description}
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    footer: { ...current.footer, description: event.target.value },
                  }))
                }
              />
            </label>
            <label className="mt-4 block text-xs font-medium">
              Contact email (optional)
              <input
                type="email"
                className="input mt-2 w-full"
                maxLength={254}
                value={content.footer.contact_email || ''}
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    footer: { ...current.footer, contact_email: event.target.value || null },
                  }))
                }
              />
            </label>
          </fieldset>
        </div>
        <aside className="space-y-5 xl:sticky xl:top-24">
          <section className="panel p-5">
            <h2 className="text-sm font-semibold">Publishing</h2>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Editing version {doc.version} · Published version {doc.published_version}. Save your
              draft before previewing or publishing.
            </p>
            <label className="mt-4 block text-xs font-medium">
              Change note
              <textarea
                className="input mt-2 w-full"
                rows={3}
                minLength={3}
                maxLength={255}
                required
                value={note}
                disabled={disabled}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            <button
              className="btn btn-primary mt-4 w-full"
              type="submit"
              disabled={disabled || !dirty || note.trim().length < 3}
            >
              {busy ? 'Saving…' : 'Save draft'}
            </button>
            <a
              className="btn btn-secondary mt-3 w-full"
              href={`${clientUrl}/website-preview`}
              target="_blank"
              rel="noreferrer"
            >
              Preview saved draft
            </a>
            <button
              className="btn btn-primary mt-3 w-full"
              type="button"
              disabled={
                disabled ||
                dirty ||
                note.trim().length < 3 ||
                JSON.stringify(doc.draft) === JSON.stringify(doc.published)
              }
              onClick={() => onPublish(note)}
            >
              {busy ? 'Working…' : 'Publish saved draft'}
            </button>
            {dirty && (
              <p className="mt-3 text-xs text-amber-700">
                You have unsaved changes. Preview shows the last saved draft.
              </p>
            )}
          </section>
          <section className="panel p-5">
            <h2 className="text-sm font-semibold">Search preview</h2>
            <p className="mt-4 break-all text-[11px] text-slate-500">{doc.site_url}/</p>
            <p className="mt-2 text-lg text-blue-800">{content.home.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {content.home.description}
            </p>
            <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
              Canonical URLs, sitemap, language links and schema are generated from the public
              routes. Published content and plan changes update the public pages and search
              metadata together.
            </p>
            <a
              className="mt-4 block text-xs font-semibold text-forest"
              href={`${clientUrl}/sitemap.xml`}
              target="_blank"
              rel="noreferrer"
            >
              View sitemap
            </a>
            <a
              className="mt-3 block text-xs font-semibold text-forest"
              href={`${clientUrl}/robots.txt`}
              target="_blank"
              rel="noreferrer"
            >
              View robots.txt
            </a>
          </section>
          {error && (
            <section role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              <p>{error.message}</p>
              {Object.entries(error.fields).map(([field, messages]) => (
                <p className="mt-2 text-xs" key={field}>
                  {field}: {messages.join(' ')}
                </p>
              ))}
            </section>
          )}
        </aside>
      </div>
    </form>
  )
}
