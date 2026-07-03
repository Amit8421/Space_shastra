import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/tenant-prisma-proxy'
import { normalizeTextFields } from '@/lib/text-format'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = normalizeTextFields(body, ['items', 'notes'])
    const purchase = await prisma.purchase.update({
      where: { id: params.id },
      data,
      include: { vendor: true, project: true },
    })
    return NextResponse.json(purchase)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.purchase.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ message: 'Purchase deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete purchase' }, { status: 500 })
  }
}

