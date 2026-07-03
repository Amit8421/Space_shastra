import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const page = Math.max(1, Number(new URL(request.url).searchParams.get('page')) || 1)
  const pageSize = 50
  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      include: { user: { select: { name: true, username: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count(),
  ])
  return NextResponse.json({ items, page, pageSize, total })
}
