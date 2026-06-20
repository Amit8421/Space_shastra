import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeTextFields } from '@/lib/text-format'

export async function GET(_request: NextRequest) {
  try {
    const projects = await prisma.project.findMany({
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
