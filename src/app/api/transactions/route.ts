import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/tenant-prisma-proxy'
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

  let account = await tx.vendorAccount.findUnique({
    where: {
      vendorId_projectId: {
        vendorId: payload.vendorId,
        projectId: payload.projectId,
      },
    },
  })

  if (!account) {
    account = await tx.vendorAccount.create({
      data: {
        vendorId: payload.vendorId,
        projectId: payload.projectId,
        openingBalance: 0,
        currentBalance: 0,
        status: 'active',
        notes: 'Auto-created from transaction entry',
      },
    })
  }

  await tx.vendorAccountEntry.create({
    data: {
      vendorAccountId: account.id,
      type: entryType,
      amount: payload.amount,
      description: payload.description || '',
      date: payload.date,
    },
  })

  await tx.vendorAccount.update({
    where: { id: account.id },
    data: {
      currentBalance: entryType === 'payment'
        ? { decrement: payload.amount }
        : { increment: payload.amount },
    },
  })

  await tx.vendor.update({
    where: { id: payload.vendorId },
    data: {
      balance: entryType === 'payment'
        ? { decrement: payload.amount }
        : { increment: payload.amount },
    },
  })
}

async function validateVendorProjectAccount(vendorId?: string | null, projectId?: string | null) {
  if (!vendorId) {
    return null
  }

  if (!projectId) {
    return 'Project is required for vendor-linked payments.'
  }

  const vendorAccount = await prisma.vendorAccount.findUnique({
    where: {
      vendorId_projectId: {
        vendorId,
        projectId,
      },
    },
  })

  if (!vendorAccount) {
    return 'No vendor project account exists for this vendor and project.'
  }

  return null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const transactions = await prisma.transaction.findMany({
      where: clientId ? { clientId } : {},
      include: { vendor: true, project: true, client: true },
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
      const vendorPaymentError = await validateVendorProjectAccount(normalizedBody.vendorId, normalizedBody.projectId)
      if (vendorPaymentError) {
        return NextResponse.json({ error: vendorPaymentError }, { status: 400 })
      }
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
        include: { vendor: true, project: true, client: true },
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
    return NextResponse.json({ error: 'Failed to create transaction', details: String(error) }, { status: 500 })
  }
}

