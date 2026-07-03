import { hash } from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError } from '@/lib/api-error'
import { userSchema } from '@/lib/validation'
import { getSessionPayloadFromRequest } from '@/lib/tenant-db'

export async function GET(request: NextRequest) {
  const session = getSessionPayloadFromRequest(request)
  if (!session?.firmId) return NextResponse.json({ error: 'Firm session is required.' }, { status: 401 })

  const users = await prisma.user.findMany({
    where: { firmId: session.firmId },
    select: { id: true, username: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionPayloadFromRequest(request)
    if (!session?.firmId) return NextResponse.json({ error: 'Firm session is required.' }, { status: 401 })

    const input = userSchema.parse(await request.json())
    const user = await prisma.user.create({
      data: {
        firmId: session.firmId,
        username: input.username,
        email: input.email || null,
        name: input.name,
        passwordHash: await hash(input.password, 12),
        role: input.role,
      },
      select: { id: true, username: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return apiError(error, 'Failed to create user.')
  }
}
