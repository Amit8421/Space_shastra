import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeTextFields } from '@/lib/text-format'

function getVendorEntryType(type?: string | null) {
  if (type === 'payment') return 'payment'
  if (type === 'expense' || type === 'purchase') return 'charge'
  return null
}

async function syncVendorAccountFromTransaction(tx: any, payload: {
  vendorId?: string | null
  projectId?: string | null
  type?: string | null
  amount: number
  description?: string | null
  date?: Date
}) {
  if (!payload.vendorId || !payload.projectId) return

  const entryType = getVendorEntryType(payload.type)
  if (!entryType) return

  const balanceChange = entryType === 'payment'
    ? { decrement: payload.amount }
    : { increment: payload.amount }
  const accountWhere = {
    vendorId_projectId: {
      vendorId: payload.vendorId,
      projectId: payload.projectId,
    },
  }
  const entryData = {
    type: entryType,
    amount: payload.amount,
    description: payload.description || '',
    date: payload.date,
  }

  if (entryType === 'payment') {
    try {
      await tx.vendorAccount.update({
        where: accountWhere,
        data: {
          currentBalance: balanceChange,
          entries: { create: entryData },
        },
        select: { id: true },
      })
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new Error('VENDOR_PROJECT_ACCOUNT_NOT_FOUND')
      }
      throw error
    }
  } else {
    await tx.vendorAccount.upsert({
      where: accountWhere,
      create: {
        vendorId: payload.vendorId,
        projectId: payload.projectId,
        openingBalance: 0,
        currentBalance: payload.amount,
        status: 'active',
        notes: 'Auto-created from transaction entry',
        entries: { create: entryData },
      },
      update: {
        currentBalance: balanceChange,
        entries: { create: entryData },
      },
      select: { id: true },
    })
  }

  await tx.vendor.update({
    where: { id: payload.vendorId },
    data: {
      balance: entryType === 'payment'
        ? { decrement: payload.amount }
        : { increment: payload.amount },
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const transactions = await prisma.transaction.findMany({
      where: clientId ? { clientId } : {},
      select: {
        id: true,
        type: true,
        description: true,
        amount: true,
        date: true,
        vendor: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Transactions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions', details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const normalizedBody = normalizeTextFields(body, ['description', 'notes'])
    if (normalizedBody.type === 'payment' && normalizedBody.vendorId && !normalizedBody.projectId) {
      return NextResponse.json({ error: 'Project is required for vendor-linked payments.' }, { status: 400 })
    }

    const transactionData: any = {
      type: normalizedBody.type,
      amount: Number(normalizedBody.amount),
      description: normalizedBody.description || '',
      notes: normalizedBody.notes ?? null,
      clientId: normalizedBody.clientId || null,
      vendorId: normalizedBody.vendorId || null,
      projectId: normalizedBody.projectId || null,
    }

    let transactionDate: Date | undefined
    if (normalizedBody.date) {
      const parsedDate = new Date(normalizedBody.date)
      if (!Number.isNaN(parsedDate.getTime())) {
        transactionData.date = parsedDate
        transactionDate = parsedDate
      }
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const createdTransaction = await tx.transaction.create({
        data: transactionData,
        select: {
          id: true,
          type: true,
          description: true,
          amount: true,
          date: true,
          vendor: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          client: { select: { id: true, firstName: true, lastName: true } },
        },
      })

      await syncVendorAccountFromTransaction(tx, {
        vendorId: normalizedBody.vendorId || null,
        projectId: normalizedBody.projectId || null,
        type: normalizedBody.type,
        amount: Number(normalizedBody.amount),
        description: normalizedBody.description || '',
        date: transactionDate,
      })

      if (normalizedBody.type === 'credit payment' && normalizedBody.clientId) {
        await tx.client.update({
          where: { id: normalizedBody.clientId },
          data: {
            balance: {
              decrement: Number(normalizedBody.amount) || 0,
            },
          },
        })
      }

      return createdTransaction
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Transactions POST error:', error)
    if (error instanceof Error && error.message === 'VENDOR_PROJECT_ACCOUNT_NOT_FOUND') {
      return NextResponse.json({ error: 'No vendor project account exists for this vendor and project.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create transaction', details: String(error) }, { status: 500 })
  }
}
