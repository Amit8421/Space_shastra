import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeTextFields } from '@/lib/text-format'

export async function GET(_request: NextRequest) {
  try {
    const purchases = await prisma.purchase.findMany({
      include: { vendor: true, project: true },
      orderBy: { purchaseDate: 'desc' },
    })
    return NextResponse.json(purchases)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = normalizeTextFields(body, ['items', 'notes'])
    const purchase = await prisma.purchase.create({
      data,
      include: { vendor: true, project: true },
    })
    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
  }
}
