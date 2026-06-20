import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, AUTH_MAX_AGE_SECONDS, getAdminPassword } from '@/lib/auth-config'
import { createSessionToken } from '@/lib/auth-token'

export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({ password: '' }))
  const adminPassword = getAdminPassword()

  if (!adminPassword) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD is not configured.' }, { status: 500 })
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: createSessionToken(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: AUTH_MAX_AGE_SECONDS,
    path: '/',
  })
  return response
}
