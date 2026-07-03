import { createHash } from 'crypto'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME } from './auth-config'
import { verifySessionToken } from './auth-token'

const hiddenKeys = new Set(['password', 'passwordHash', 'token', 'tokenHash', 'authSecret'])

export function sanitizeAuditValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (Array.isArray(value)) return value.map(sanitizeAuditValue)
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        hiddenKeys.has(key) ? '[REDACTED]' : sanitizeAuditValue(nested),
      ]),
    )
  }
  return value
}

export function getAuditRequestContext() {
  try {
    const payload = verifySessionToken(cookies().get(AUTH_COOKIE_NAME)?.value)
    const requestHeaders = headers()
    return {
      userId: payload?.userId,
      ipAddress: requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: requestHeaders.get('user-agent'),
    }
  } catch {
    return { userId: undefined, ipAddress: undefined, userAgent: undefined }
  }
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
