import { createHmac, timingSafeEqual } from 'crypto'
import { AUTH_MAX_AGE_SECONDS, getAuthSecret } from './auth-config'

export type SessionPayload = {
  sessionId: string
  userId: string
  email: string
  name: string
  role: 'ADMIN' | 'MANAGER' | 'VIEWER'
  exp: number
}

const base64UrlEncode = (value: string) =>
  Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

const base64UrlDecode = (value: string) =>
  Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()

const sign = (payload: string, secret: string) =>
  createHmac('sha256', secret).update(payload).digest('base64url')

export function createSessionToken(input: Omit<SessionPayload, 'exp'>) {
  const secret = getAuthSecret()
  if (!secret) {
    throw new Error('AUTH_SECRET is required.')
  }

  const payload = base64UrlEncode(
    JSON.stringify({ ...input, exp: Date.now() + AUTH_MAX_AGE_SECONDS * 1000 }),
  )
  return `${payload}.${sign(payload, secret)}`
}

export function verifySessionToken(token?: string | null) {
  const secret = getAuthSecret()
  if (!token || !secret) return null

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expectedSignature = sign(payload, secret)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as SessionPayload
    if (
      typeof parsed.exp !== 'number' || parsed.exp <= Date.now() ||
      !parsed.sessionId || !parsed.userId || !parsed.email ||
      !['ADMIN', 'MANAGER', 'VIEWER'].includes(parsed.role)
    ) return null
    return parsed
  } catch {
    return null
  }
}
