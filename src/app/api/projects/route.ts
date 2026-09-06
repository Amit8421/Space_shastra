import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeTextFields } from '@/lib/text-format'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const summary = searchParams.get('summary') === 'true'
    const where = clientId ? { clientId } : {}
    const projects = summary
      ? await prisma.project.findMany({
          where,
          select: { id: true, name: true, clientId: true },
          orderBy: { createdAt: 'desc' },
        })
      : await prisma.project.findMany({
          where,
          include: { client: true },
          orderBy: { createdAt: 'desc' },
        })
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = normalizeTextFields(body, ['name', 'description', 'address', 'city'])
    const project = await prisma.project.create({
      data,
      include: { client: true },
    })
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
