import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth-config'
import { verifySessionToken } from '@/lib/auth-token'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const payload = verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value)
  if (payload) await prisma.session.deleteMany({ where: { id: payload.sessionId } })
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
