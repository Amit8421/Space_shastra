import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/tenant-prisma-proxy'
import { normalizeTextFields } from '@/lib/text-format'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorAccountId = searchParams.get('vendorAccountId')

    const where: any = {}
    if (vendorAccountId) where.vendorAccountId = vendorAccountId

    const entries = await prisma.vendorAccountEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(entries)
  } catch (error) {
    console.error('Failed to fetch vendor account entries:', error)
    return NextResponse.json({ error: 'Failed to fetch vendor account entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const normalizedBody = normalizeTextFields(body, ['description'])
    const amount = Number(normalizedBody.amount) || 0
    const entry = await prisma.vendorAccountEntry.create({
      data: {
        vendorAccountId: normalizedBody.vendorAccountId,
        type: normalizedBody.type,
        amount,
        description: normalizedBody.description || '',
        date: normalizedBody.date ? new Date(normalizedBody.date) : undefined,
      },
    })

    const accountUpdate: any = {}
    if (normalizedBody.type === 'payment') {
      accountUpdate.currentBalance = { decrement: amount }
    } else {
      accountUpdate.currentBalance = { increment: amount }
    }

    const account = await prisma.vendorAccount.update({
      where: { id: normalizedBody.vendorAccountId },
      data: accountUpdate,
      include: { vendor: true },
    })

    if (account.vendorId) {
      const vendorBalanceUpdate: any = {}
      if (normalizedBody.type === 'payment') {
        vendorBalanceUpdate.balance = { decrement: amount }
      } else {
        vendorBalanceUpdate.balance = { increment: amount }
      }
      await prisma.vendor.update({
        where: { id: account.vendorId },
        data: vendorBalanceUpdate,
      })
    }

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Failed to create vendor account entry:', error)
    return NextResponse.json({ error: 'Failed to create vendor account entry' }, { status: 500 })
  }
}

