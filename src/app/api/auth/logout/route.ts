import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth-config'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  })
  return response
}
