export interface ResetLink {
  email: string
  token: string
}

export function resetLinkFromSearch(search: string): ResetLink | null {
  const params = new URLSearchParams(search)
  if (params.getAll('email').length !== 1 || params.getAll('token').length !== 1) return null
  const email = params.get('email')?.trim() ?? ''
  const token = params.get('token') ?? ''
  if (
    email.length > 254 ||
    Array.from(email).some(
      (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    ) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^[a-f\d]{64}$/i.test(token)
  )
    return null
  return { email: email.toLowerCase(), token }
}

export function passwordRecoveryFields(password: string, confirmation: string) {
  const fields: Record<string, string[]> = {}
  if (Array.from(password).length < 8)
    fields.password = ['Use at least 8 characters for your new password.']
  else if (password.includes('\0'))
    fields.password = ['Your password cannot contain a null character.']
  else if (new TextEncoder().encode(password).byteLength > 72)
    fields.password = [
      'Use a shorter password. Emoji and accented letters count toward the 72-byte limit.',
    ]
  if (password !== confirmation)
    fields.password_confirmation = ['Please enter the same password in both fields.']
  return fields
}
