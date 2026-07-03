import { hash } from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError } from '@/lib/api-error'
import { userSchema } from '@/lib/validation'

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  try {
    const input = userSchema.parse(await request.json())
    const user = await prisma.user.create({
      data: { email: input.email, name: input.name, passwordHash: await hash(input.password, 12), role: input.role },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return apiError(error, 'Failed to create user.')
  }
}
