import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError } from '@/lib/api-error'
import { calculateDocumentTotals, money } from '@/lib/money'
import { normalizeTextField } from '@/lib/text-format'
import { invoiceSchema } from '@/lib/validation'

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
    const body = invoiceSchema.parse(await request.json())
    const items = body.items.map((item) => {
      const unitPrice = money(item.unitPrice)
      const quantity = Number(item.quantity)
      return {
        description: normalizeTextField(item.description),
        quantity,
        unitPrice,
        total: money(unitPrice.mul(quantity)),
      }
    })
    const subtotal = items.reduce((sum, item) => sum.add(item.total), money(0))
    const totals = calculateDocumentTotals({
      subtotal,
      gstRate: body.gstRate,
      gstType: body.gstType,
    })

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: body.invoiceNo,
        clientId: body.clientId,
        projectId: body.projectId,
        issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        subtotal: totals.subtotal,
        gstType: totals.gstType,
        gstRate: totals.gstRate,
        cgstAmount: totals.cgstAmount,
        sgstAmount: totals.sgstAmount,
        igstAmount: totals.igstAmount,
        amount: totals.amount,
        placeOfSupply: normalizeTextField(body.placeOfSupply),
        status: body.status,
        notes: normalizeTextField(body.notes),
        items: {
          create: items,
        },
      },
      include: { client: true, project: true, items: true, payments: true },
    })
    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    return apiError(error, 'Failed to create invoice')
  }
}
