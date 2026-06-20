import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(_request: NextRequest) {
  try {
    const clients = await prisma.client.findMany({
      select: { id: true },
    })

    const results = [] as Array<{ id: string; oldBalance: number; newBalance: number }>

    for (const client of clients) {
      const acceptedResult = await prisma.quotation.aggregate({
        where: { clientId: client.id, status: 'accepted' },
        _sum: { amount: true },
      })

      const paymentsResult = await prisma.transaction.aggregate({
        where: {
          clientId: client.id,
          type: { in: ['credit payment', 'payment'] },
        },
        _sum: { amount: true },
      })

      const acceptedTotal = acceptedResult._sum.amount ?? 0
      const paymentsTotal = paymentsResult._sum.amount ?? 0
      const expectedBalance = acceptedTotal - paymentsTotal

      const clientRecord = await prisma.client.findUnique({
        where: { id: client.id },
        select: { balance: true },
      })

      const oldBalance = clientRecord?.balance ?? 0

      if (oldBalance !== expectedBalance) {
        await prisma.client.update({
          where: { id: client.id },
          data: { balance: expectedBalance },
        })
      }

      results.push({ id: client.id, oldBalance, newBalance: expectedBalance })
    }

    return NextResponse.json({
      reconciled: results.length,
      details: results,
    })
  } catch (error) {
    console.error('Balance reconciliation error:', error)
    return NextResponse.json({ error: 'Failed to reconcile balances', details: String(error) }, { status: 500 })
  }
}
