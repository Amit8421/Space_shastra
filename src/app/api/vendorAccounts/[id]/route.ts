import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeTextFields } from '@/lib/text-format'
import { updateFurnitureVendorRates } from '@/lib/vendor-furniture-sync'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const normalizedBody = normalizeTextFields(body, ['notes'])
    const existingAccount = await prisma.vendorAccount.findUnique({
      where: { id: params.id },
      include: {
        vendor: true,
      },
    })

    if (!existingAccount) {
      return NextResponse.json({ error: 'Vendor account not found' }, { status: 404 })
    }

    const isFurnitureVendor = existingAccount.vendor.category?.trim().toLowerCase() === 'furniture'

    const updatedAccount = await prisma.$transaction(async (tx) => {
      if (Array.isArray(normalizedBody.furnitureItems) && isFurnitureVendor) {
        await updateFurnitureVendorRates(
          tx,
          params.id,
          normalizedBody.furnitureItems.map((item: any) => ({
            id: item.id,
            vendorRate: Number(item.vendorRate) || 0,
          })),
        )
      }

      let accountAfterRateSync = await tx.vendorAccount.findUnique({
        where: { id: params.id },
      })

      if (!accountAfterRateSync) {
        throw new Error('Vendor account not found after furniture sync')
      }

      if (!isFurnitureVendor) {
        const nextOpeningBalance = normalizedBody.openingBalance !== undefined
          ? Number(normalizedBody.openingBalance) || 0
          : accountAfterRateSync.openingBalance
        const openingBalanceDelta = nextOpeningBalance - accountAfterRateSync.openingBalance

        accountAfterRateSync = await tx.vendorAccount.update({
          where: { id: params.id },
          data: {
            openingBalance: nextOpeningBalance,
            currentBalance: accountAfterRateSync.currentBalance + openingBalanceDelta,
          },
        })

        if (existingAccount.vendorId && openingBalanceDelta !== 0) {
          await tx.vendor.update({
            where: { id: existingAccount.vendorId },
            data: {
              balance: { increment: openingBalanceDelta },
            },
          })
        }
      }

      const refreshedAccount = await tx.vendorAccount.update({
        where: { id: params.id },
        data: {
          notes: normalizedBody.notes ?? accountAfterRateSync.notes,
          status: normalizedBody.status || accountAfterRateSync.status,
        },
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

      return refreshedAccount
    })

    return NextResponse.json(updatedAccount)
  } catch (error) {
    console.error('Failed to update vendor account:', error)
    return NextResponse.json({ error: 'Failed to update vendor account' }, { status: 500 })
  }
}
