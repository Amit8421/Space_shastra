import { compare, hash } from 'bcryptjs'
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, AUTH_MAX_AGE_SECONDS, getAdminEmail, getAdminPassword } from '@/lib/auth-config'
import { createSessionToken } from '@/lib/auth-token'
import { prisma } from '@/lib/db'
import { hashToken } from '@/lib/audit'
import { loginSchema, validationError } from '@/lib/validation'
import { clearLoginRateLimit, checkLoginRateLimit } from '@/lib/auth-rate-limit'

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })

  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const rateLimitKey = `${forwardedFor}:${parsed.data.email}`
  const rateLimit = checkLoginRateLimit(rateLimitKey)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    )
  }

  let user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  const userCount = await prisma.user.count()
  if (!user && userCount === 0 && parsed.data.email === getAdminEmail().toLowerCase()) {
    const bootstrapPassword = getAdminPassword()
    if (bootstrapPassword && parsed.data.password === bootstrapPassword) {
      user = await prisma.user.create({
        data: {
          email: parsed.data.email,
          name: 'Administrator',
          passwordHash: await hash(bootstrapPassword, 12),
          role: 'ADMIN',
        },
      })
    }
  }

  if (!user || !user.isActive || !(await compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
  }

  clearLoginRateLimit(rateLimitKey)
  const sessionId = randomUUID()
  const token = createSessionToken({
    sessionId,
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
  const expiresAt = new Date(Date.now() + AUTH_MAX_AGE_SECONDS * 1000)
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    prisma.session.create({ data: { id: sessionId, userId: user.id, tokenHash: hashToken(token), expiresAt } }),
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ])

  const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: AUTH_MAX_AGE_SECONDS,
    path: '/',
  })
  return response
}
