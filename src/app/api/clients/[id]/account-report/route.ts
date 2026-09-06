import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getQuotationGrandTotal } from '@/lib/quotation-total'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [projects, quotations, transactions] = await Promise.all([
      prisma.project.findMany({
        where: { clientId: params.id },
        select: { id: true, name: true, clientId: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quotation.findMany({
        where: { clientId: params.id, status: 'accepted' },
        select: { amount: true, executionFeePercent: true, discount: true },
      }),
      prisma.transaction.findMany({
        where: { clientId: params.id },
        select: {
          id: true,
          type: true,
          description: true,
          amount: true,
          date: true,
          project: { select: { id: true, name: true } },
          client: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { date: 'desc' },
      }),
    ])

    const acceptedTotal = Math.round(
      quotations.reduce((sum, quotation) => sum + getQuotationGrandTotal(quotation), 0) * 100,
    ) / 100
    const paymentsTotal = transactions
      .filter((transaction) => transaction.type === 'credit payment' || transaction.type === 'payment')
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
    const remainingTotal = Math.round((acceptedTotal - paymentsTotal + Number.EPSILON) * 100) / 100

    return NextResponse.json({
      projects,
      transactions,
      summary: { acceptedTotal, paymentsTotal, remainingTotal },
    })
  } catch (error) {
    console.error('Failed to fetch client account report:', error)
    return NextResponse.json({ error: 'Failed to fetch client account report' }, { status: 500 })
  }
}
