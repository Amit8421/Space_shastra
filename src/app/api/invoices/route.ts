import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeTextField } from '@/lib/text-format'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const invoices = await prisma.invoice.findMany({
      where: clientId ? { clientId } : {},
      include: { client: true, project: true, items: true, payments: true },
      orderBy: { issueDate: 'desc' },
    })
    return NextResponse.json(invoices)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const items = Array.isArray(body.items)
      ? body.items.map((item: any) => ({
          ...item,
          description: normalizeTextField(item.description),
        }))
      : []
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: body.invoiceNo,
        clientId: body.clientId,
        projectId: body.projectId,
        amount: body.amount,
        status: body.status || 'pending',
        notes: normalizeTextField(body.notes),
        items: {
          create: items,
        },
      },
      include: { client: true, project: true, items: true, payments: true },
    })
    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
