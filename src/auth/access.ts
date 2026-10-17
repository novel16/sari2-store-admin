import type { AdminUser } from './types'
export const canAccessAdmin = (user: AdminUser) =>
  user.platform_role === 'platform_admin' && user.status === 'active'
export function safeReturnTo(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    Array.from(value).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  )
    return '/dashboard'
  try {
    const url = new URL(value, 'http://local.invalid')
    if (
      url.origin !== 'http://local.invalid' ||
      !/^\/(dashboard|accounts(?:\/[1-9]\d*(?:\/subscription)?)?|stores(?:\/[1-9]\d*)?|plans(?:\/(?:new|[1-9]\d*))?)$/.test(
        url.pathname,
      )
    )
      return '/dashboard'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/dashboard'
  }
}
export function returnToFromState(state: unknown) {
  return state && typeof state === 'object' && 'returnTo' in state
    ? safeReturnTo(state.returnTo)
    : '/dashboard'
}
