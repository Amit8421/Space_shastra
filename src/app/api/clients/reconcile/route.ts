import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getQuotationGrandTotal } from '@/lib/quotation-total'

export async function POST(_request: NextRequest) {
  try {
    const [clients, acceptedQuotations, payments] = await Promise.all([
      prisma.client.findMany({
        select: { id: true, balance: true },
      }),
      prisma.quotation.findMany({
        where: { status: 'accepted' },
        select: { clientId: true, amount: true, executionFeePercent: true, discount: true },
      }),
      prisma.transaction.findMany({
        where: { type: { in: ['credit payment', 'payment'] } },
        select: { clientId: true, amount: true },
      }),
    ])

    const acceptedTotals = new Map<string, number>()
    acceptedQuotations.forEach((quotation) => {
      acceptedTotals.set(
        quotation.clientId,
        (acceptedTotals.get(quotation.clientId) || 0) + getQuotationGrandTotal(quotation),
      )
    })

    const paymentTotals = new Map<string, number>()
    payments.forEach((payment) => {
      if (!payment.clientId) return
      paymentTotals.set(payment.clientId, (paymentTotals.get(payment.clientId) || 0) + Number(payment.amount || 0))
    })

    const results = clients.map((client) => {
      const acceptedTotal = acceptedTotals.get(client.id) || 0
      const paymentsTotal = paymentTotals.get(client.id) || 0
      const expectedBalance = Math.round((acceptedTotal - paymentsTotal + Number.EPSILON) * 100) / 100
      return { id: client.id, oldBalance: client.balance, newBalance: expectedBalance }
    })
    const changedResults = results.filter((result) => Math.abs(result.oldBalance - result.newBalance) >= 0.005)

    if (changedResults.length > 0) {
      await prisma.$transaction(
        changedResults.map((result) =>
          prisma.client.update({
            where: { id: result.id },
            data: { balance: result.newBalance },
          }),
        ),
      )
    }

    return NextResponse.json({
      reconciled: changedResults.length,
      details: results,
    })
  } catch (error) {
    console.error('Balance reconciliation error:', error)
    return NextResponse.json({ error: 'Failed to reconcile balances', details: String(error) }, { status: 500 })
  }
}
