import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/tenant-prisma-proxy'
import { apiError } from '@/lib/api-error'
import { calculateDocumentTotals, money } from '@/lib/money'
import { normalizeTextField } from '@/lib/text-format'
import { quotationSchema } from '@/lib/validation'
import { syncFurnitureVendorAccountsForProject } from '@/lib/vendor-furniture-sync'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const where: any = {}
    if (clientId) {
      where.clientId = clientId
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: { client: true, project: true, items: true },
      orderBy: { issueDate: 'desc' },
    })
    return NextResponse.json(quotations)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = quotationSchema.parse(await request.json())
    const items = body.items.map((item) => ({
      area: item.area,
      category: item.category,
      description: normalizeTextField(item.description),
      quantity: Number(item.quantity),
      lengthCm: item.lengthCm ?? null,
      widthCm: item.widthCm ?? null,
      areaSqFt: item.areaSqFt ?? null,
      rate: item.rate === undefined || item.rate === null ? null : money(item.rate),
      total: money(item.total ?? 0),
    }))
    const subtotal = items.reduce((sum, item) => sum.add(item.total), money(0))
    const totals = calculateDocumentTotals({
      subtotal,
      executionFeePercent: body.executionFeePercent,
      gstRate: body.gstRate,
      gstType: body.gstType,
    })

    const quotation = await prisma.$transaction(async (tx) => {
      const createdQuotation = await tx.quotation.create({
        data: {
          quotationNo: body.quotationNo,
          clientId: body.clientId,
          projectId: body.projectId,
          issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          subtotal: totals.subtotal,
          executionFeePercent: totals.executionFeePercent,
          executionFeeAmount: totals.executionFeeAmount,
          taxableAmount: totals.taxableAmount,
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
        include: { client: true, project: true, items: true },
      })

      if (body.status === 'accepted') {
        await tx.client.update({
          where: { id: body.clientId },
          data: {
            balance: {
              increment: totals.amount,
            },
          },
        })
      }

      await syncFurnitureVendorAccountsForProject(tx, body.projectId)

      return createdQuotation
    })

    return NextResponse.json(quotation, { status: 201 })
  } catch (error) {
    return apiError(error, 'Failed to create quotation')
  }
}

