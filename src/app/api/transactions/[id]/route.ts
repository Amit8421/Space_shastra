import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/tenant-prisma-proxy'
import { normalizeTextFields } from '@/lib/text-format'

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const normalizedBody = normalizeTextFields(body, ['description', 'notes'])
    if (normalizedBody.type === 'payment' && normalizedBody.vendorId) {
      const vendorPaymentError = await validateVendorProjectAccount(normalizedBody.vendorId, normalizedBody.projectId)
      if (vendorPaymentError) {
        return NextResponse.json({ error: vendorPaymentError }, { status: 400 })
      }
    }

    const updateData: any = {
      ...normalizedBody,
      amount: normalizedBody.amount !== undefined ? Number(normalizedBody.amount) : undefined,
      date: normalizedBody.date ? new Date(normalizedBody.date) : undefined,
      vendorId: normalizedBody.vendorId || null,
      clientId: normalizedBody.clientId || null,
      projectId: normalizedBody.projectId || null,
    }

    const transaction = await prisma.transaction.update({
      where: { id: params.id },
      data: updateData,
      include: { vendor: true, project: true, client: true },
    })
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Transaction PUT error:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.transaction.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}

