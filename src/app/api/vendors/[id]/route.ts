import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/tenant-prisma-proxy'
import { normalizeTextFields } from '@/lib/text-format'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = normalizeTextFields(body, ['name', 'category'])
    const vendor = await prisma.vendor.update({
      where: { id: params.id },
      data,
    })
    return NextResponse.json(vendor)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.vendor.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ message: 'Vendor deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 })
  }
}

