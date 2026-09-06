import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeTextFields } from '@/lib/text-format'
import { syncFurnitureVendorAccountsForProject } from '@/lib/vendor-furniture-sync'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const projectId = searchParams.get('projectId')
    const summary = searchParams.get('summary') === 'true'
    const where: { vendorId?: string; projectId?: string } = {}
    if (vendorId) where.vendorId = vendorId
    if (projectId) where.projectId = projectId

    const accounts = summary
      ? await prisma.vendorAccount.findMany({
          where,
          select: {
            id: true,
            projectId: true,
            status: true,
            project: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: 'desc' },
        })
      : await prisma.vendorAccount.findMany({
          where,
          include: {
            project: true,
            furnitureItems: {
              orderBy: [{ area: 'asc' }, { description: 'asc' }],
            },
          },
          orderBy: { updatedAt: 'desc' },
        })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Failed to fetch vendor accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch vendor accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const normalizedBody = normalizeTextFields(body, ['notes'])
    const vendorId = normalizedBody.vendorId as string | undefined
    const projectId = normalizedBody.projectId as string | undefined

    if (!vendorId || !projectId) {
      return NextResponse.json({ error: 'vendorId and projectId are required' }, { status: 400 })
    }

    const openingBalance = Number(normalizedBody.openingBalance) || 0
    const account = await prisma.$transaction(async (tx) => {
      const createdAccount = await tx.vendorAccount.create({
        data: {
          vendorId,
          projectId,
          openingBalance,
          currentBalance: openingBalance,
          status: normalizedBody.status || 'active',
          notes: normalizedBody.notes,
        },
        include: {
          vendor: true,
          project: true,
          furnitureItems: true,
        },
      })

      if (openingBalance !== 0) {
        await tx.vendor.update({
          where: { id: vendorId },
          data: {
            balance: { increment: openingBalance },
          },
        })
      }

      if (createdAccount.vendor.category?.trim().toLowerCase() === 'furniture') {
        await syncFurnitureVendorAccountsForProject(tx, projectId)
      }

      const refreshedAccount = await tx.vendorAccount.findUnique({
        where: { id: createdAccount.id },
        include: {
          vendor: true,
          project: true,
          furnitureItems: {
            orderBy: [
              { area: 'asc' },
              { description: 'asc' },
            ],
          },
        },
      })

      if (!refreshedAccount) {
        throw new Error('Vendor account not found after create')
      }

      return refreshedAccount
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Failed to create vendor account:', error)
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json({ error: 'A vendor account already exists for this project' }, { status: 409 })
    }
    const message = error instanceof Error ? error.message : 'Failed to create vendor account'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
