import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api-error'
import { prisma } from '@/lib/db'
import { provisionFirmSchema, schemaNameForFirmSlug, slugifyFirm } from '@/lib/tenant-db'
import { firmSchema } from '@/lib/validation'

export async function GET() {
  const firms = await prisma.firm.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      schemaName: true,
      status: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(firms)
}

export async function POST(request: NextRequest) {
  try {
    const input = firmSchema.parse(await request.json())
    const slug = slugifyFirm(input.slug)
    const schemaName = schemaNameForFirmSlug(slug)
    const adminPassword = input.adminPassword || randomBytes(12).toString('base64url')
    const existingFirm = await prisma.firm.findFirst({
      where: {
        OR: [{ slug }, { schemaName }],
      },
    })
    if (existingFirm) {
      return NextResponse.json({ error: 'A firm with this code already exists.' }, { status: 409 })
    }

    await provisionFirmSchema(schemaName)

    const firm = await prisma.firm.create({
      data: {
        name: input.name,
        slug,
        schemaName,
        users: {
          create: {
            username: input.adminUsername,
            name: input.adminName,
            passwordHash: await hash(adminPassword, 12),
            role: 'ADMIN',
          },
        },
      },
      include: {
        users: {
          select: { id: true, username: true, name: true, role: true },
          take: 1,
        },
      },
    })

    return NextResponse.json({
      firm: { id: firm.id, name: firm.name, slug: firm.slug, schemaName: firm.schemaName },
      adminUser: firm.users[0],
      temporaryPassword: adminPassword,
    }, { status: 201 })
  } catch (error) {
    return apiError(error, 'Failed to create firm.')
  }
}
