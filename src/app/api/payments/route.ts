import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeTextField } from '@/lib/text-format'

export async function GET(_request: NextRequest) {
  try {
    const payments = await prisma.payment.findMany({
      include: { invoice: { include: { client: true } } },
      orderBy: { paymentDate: 'desc' },
    })
    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payment = await prisma.payment.create({
      data: {
        invoiceId: body.invoiceId,
        amount: body.amount,
        method: body.method,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        notes: normalizeTextField(body.notes),
      },
      include: { invoice: { include: { client: true } } },
    })

    // Update client balance: subtract payment amount
    await prisma.client.update({
      where: { id: payment.invoice.clientId },
      data: {
        balance: {
          decrement: payment.amount,
        },
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
