import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth-config'
import { verifySessionToken } from '@/lib/auth-token'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const payload = verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: {
      firm: { select: { id: true, name: true, slug: true, schemaName: true } },
      user: { select: { id: true, username: true, email: true, name: true, role: true, isActive: true } },
    },
  })
  if (!session || session.expiresAt <= new Date() || !session.user.isActive) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }
  return NextResponse.json({ user: session.user, firm: session.firm })
}
