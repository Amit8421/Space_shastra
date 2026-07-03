import { compare, hash } from 'bcryptjs'
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, AUTH_MAX_AGE_SECONDS, getAdminPassword, getAdminUsername, getDefaultFirmName, getDefaultFirmSlug } from '@/lib/auth-config'
import { createSessionToken } from '@/lib/auth-token'
import { prisma } from '@/lib/db'
import { hashToken } from '@/lib/audit'
import { loginSchema, validationError } from '@/lib/validation'
import { clearLoginRateLimit, checkLoginRateLimit } from '@/lib/auth-rate-limit'
import { provisionFirmSchema, schemaNameForFirmSlug, slugifyFirm } from '@/lib/tenant-db'

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })

  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const firmSlug = slugifyFirm(parsed.data.firm)
  const username = parsed.data.username
  const rateLimitKey = `${forwardedFor}:${firmSlug}:${username}`
  const rateLimit = checkLoginRateLimit(rateLimitKey)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    )
  }

  let firm = await prisma.firm.findUnique({ where: { slug: firmSlug } })
  const firmCount = await prisma.firm.count()
  if (!firm && firmCount === 0 && firmSlug === slugifyFirm(getDefaultFirmSlug())) {
    const bootstrapPassword = getAdminPassword()
    if (bootstrapPassword && username === getAdminUsername().toLowerCase() && parsed.data.password === bootstrapPassword) {
      const schemaName = schemaNameForFirmSlug(firmSlug)
      await provisionFirmSchema(schemaName)
      firm = await prisma.firm.create({
        data: {
          name: getDefaultFirmName(),
          slug: firmSlug,
          schemaName,
        },
      })
      await prisma.user.create({
        data: {
          firmId: firm.id,
          username,
          name: 'Administrator',
          passwordHash: await hash(bootstrapPassword, 12),
          role: 'ADMIN',
        },
      })
    }
  }

  const user = firm
    ? await prisma.user.findUnique({
        where: {
          firmId_username: {
            firmId: firm.id,
            username,
          },
        },
        include: { firm: true },
      })
    : null

  if (!user || !user.isActive || !(await compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid firm, username, or password.' }, { status: 401 })
  }
  if (!user.firm) {
    return NextResponse.json({ error: 'Firm is not active for this user.' }, { status: 401 })
  }

  clearLoginRateLimit(rateLimitKey)
  const sessionId = randomUUID()
  const token = createSessionToken({
    sessionId,
    userId: user.id,
    firmId: user.firmId || user.firm.id,
    firmSlug: user.firm.slug,
    firmName: user.firm.name,
    firmSchema: user.firm.schemaName,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
  })
  const expiresAt = new Date(Date.now() + AUTH_MAX_AGE_SECONDS * 1000)
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    prisma.session.create({ data: { id: sessionId, userId: user.id, firmId: user.firmId, tokenHash: hashToken(token), expiresAt } }),
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ])

  const response = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      firm: { id: user.firm.id, name: user.firm.name, slug: user.firm.slug },
    },
  })
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
