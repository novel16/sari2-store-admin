import axios from 'axios'

export const http = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, ''),
  withCredentials: true,
  withXSRFToken: true,
  timeout: 30000,
  headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
})

export async function postWithCsrf<T>(path: string, data?: unknown): Promise<T> {
  return writeWithCsrf<T>('post', path, data)
}

export async function writeWithCsrf<T>(
  method: 'post' | 'patch',
  path: string,
  data?: unknown,
): Promise<T> {
  await http.get('/sanctum/csrf-cookie')
  try {
    return (await http.request<T>({ method, url: path, data })).data
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 419) throw error
    await http.get('/sanctum/csrf-cookie')
    return (await http.request<T>({ method, url: path, data })).data
  }
}
