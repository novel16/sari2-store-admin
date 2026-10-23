import { http, writeWithCsrf } from '../api/http'
import type { SiteContent, WebsiteDocument } from './types'

const base = '/api/v1/admin/website'
export const websiteApi = {
  save: (version: number, content: SiteContent, note: string) =>
    writeWithCsrf<{ data: WebsiteDocument }>('patch', base, {
      expected_version: version,
      content,
      change_note: note,
    }),
  publish: (version: number, note: string) =>
    writeWithCsrf<{ data: WebsiteDocument }>('post', base + '/publish', {
      expected_version: version,
      change_note: note,
    }),
  restore: (version: number, id: number) =>
    writeWithCsrf<{ data: WebsiteDocument }>('post', base + '/restore/' + id, {
      expected_version: version,
      change_note: `Restore website revision ${id} to draft`,
    }),
  upload: async (file: File) => {
    const body = new FormData()
    body.append('image', file)
    return writeWithCsrf<{ data: { url: string } }>('post', base + '/media', body)
  },
  history: async (page: number) => (await http.get(base + '/history', { params: { page } })).data,
}
