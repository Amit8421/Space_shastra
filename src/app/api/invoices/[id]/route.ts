import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError } from '@/lib/api-error'
import { calculateDocumentTotals, money } from '@/lib/money'
import { normalizeTextField } from '@/lib/text-format'
import { invoiceSchema } from '@/lib/validation'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const data = {
      invoiceNo: body.invoiceNo,
      clientId: body.clientId,
      projectId: body.projectId,
      issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
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
        deleteMany: {},
        create: items,
      },
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data,
      include: { client: true, project: true, items: true, payments: true },
    })
    return NextResponse.json(invoice)
  } catch (error) {
    return apiError(error, 'Failed to update invoice')
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
