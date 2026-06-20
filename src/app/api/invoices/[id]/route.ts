import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeTextField } from '@/lib/text-format'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { items, ...invoiceFields } = body
    const data: any = {
      ...invoiceFields,
      notes: normalizeTextField(invoiceFields.notes),
    }

    if (items) {
      data.items = {
        deleteMany: {},
        create: items.map((item: any) => ({
          ...item,
          description: normalizeTextField(item.description),
        })),
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data,
      include: { client: true, project: true, items: true, payments: true },
    })
    return NextResponse.json(invoice)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.invoice.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
