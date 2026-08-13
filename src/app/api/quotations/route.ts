import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeTextField } from '@/lib/text-format'
import { normalizeQuotationTerms } from '@/lib/quotation-terms'
import { getQuotationGrandTotal } from '@/lib/quotation-total'
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
    const body = await request.json()
    const items = Array.isArray(body.items)
      ? body.items.map((item: any) => ({
          ...item,
          description: normalizeTextField(item.description),
        }))
      : []
    const terms = normalizeQuotationTerms(body.terms)
    const quotation = await prisma.$transaction(async (tx) => {
      const createdQuotation = await tx.quotation.create({
        data: {
          quotationNo: body.quotationNo,
          clientId: body.clientId,
          projectId: body.projectId,
          amount: body.amount,
          executionFeePercent: Number(body.executionFeePercent) || 0,
          discount: Math.max(0, Number(body.discount) || 0),
          status: body.status || 'draft',
          notes: normalizeTextField(body.notes),
          ...(terms !== undefined ? { terms } : {}),
          items: {
            create: items,
          },
        },
        include: { client: true, project: true, items: true },
      })

      if (body.status === 'accepted' && body.clientId) {
        const acceptedTotal = getQuotationGrandTotal(createdQuotation)
        await tx.client.update({
          where: { id: body.clientId },
          data: {
            balance: {
              increment: acceptedTotal,
            },
          },
        })
      }

      if (body.status === 'accepted') {
        await syncFurnitureVendorAccountsForProject(tx, body.projectId)
      }

      return createdQuotation
    })

    return NextResponse.json(quotation, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 })
  }
}
