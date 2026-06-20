import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeTextField } from '@/lib/text-format'
import { syncFurnitureVendorAccountsForProject } from '@/lib/vendor-furniture-sync'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { items, ...quotationFields } = body

    // Fetch current quotation to check status and client changes
    const currentQuotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: { client: true },
    })

    if (!currentQuotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    const quotation = await prisma.$transaction(async (tx) => {
      const data: any = {
        ...quotationFields,
        executionFeePercent: Number(quotationFields.executionFeePercent) || 0,
        notes: normalizeTextField(quotationFields.notes),
      }

      await tx.quotation.update({
        where: { id: params.id },
        data,
      })

      if (items) {
        const existingItems = await tx.quotationItem.findMany({
          where: { quotationId: params.id },
          select: { id: true },
        })

        const existingItemIds = new Set(existingItems.map((item) => item.id))
        const nextItemIds = new Set<string>()

        for (const item of items as any[]) {
          const normalizedItem = {
            area: item.area,
            category: item.category,
            description: normalizeTextField(item.description),
            quantity: Number(item.quantity) || 0,
            lengthCm: item.lengthCm !== undefined ? Number(item.lengthCm) || 0 : null,
            widthCm: item.widthCm !== undefined ? Number(item.widthCm) || 0 : null,
            rate: item.rate !== undefined ? Number(item.rate) || 0 : null,
            areaSqFt: item.areaSqFt !== undefined ? Number(item.areaSqFt) || 0 : null,
            total: Number(item.total) || 0,
          }

          if (item.id && existingItemIds.has(item.id)) {
            nextItemIds.add(item.id)
            await tx.quotationItem.update({
              where: { id: item.id },
              data: normalizedItem,
            })
            continue
          }

          const createdItem = await tx.quotationItem.create({
            data: {
              quotationId: params.id,
              ...normalizedItem,
            },
          })
          nextItemIds.add(createdItem.id)
        }

        const removedItemIds = existingItems
          .map((item) => item.id)
          .filter((itemId) => !nextItemIds.has(itemId))

        if (removedItemIds.length > 0) {
          await tx.quotationItem.deleteMany({
            where: {
              id: {
                in: removedItemIds,
              },
            },
          })
        }
      }

      const quotationWithItems = await tx.quotation.findUnique({
        where: { id: params.id },
        include: { client: true, project: true, items: true },
      })

      if (!quotationWithItems) {
        throw new Error('Quotation not found after update')
      }

      const oldClientId = currentQuotation.clientId
      const newClientId = quotationWithItems.clientId

      if (currentQuotation.status === 'accepted' && quotationWithItems.status === 'accepted') {
        const diff = quotationWithItems.amount - currentQuotation.amount
        if (diff !== 0 && newClientId) {
          await tx.client.update({
            where: { id: newClientId },
            data: {
              balance: {
                increment: diff,
              },
            },
          })
        }
      } else {
        if (currentQuotation.status === 'accepted' && oldClientId) {
          await tx.client.update({
            where: { id: oldClientId },
            data: {
              balance: {
                decrement: currentQuotation.amount,
              },
            },
          })
        }
        if (quotationWithItems.status === 'accepted' && newClientId) {
          await tx.client.update({
            where: { id: newClientId },
            data: {
              balance: {
                increment: quotationWithItems.amount,
              },
            },
          })
        }
      }

      await syncFurnitureVendorAccountsForProject(tx, quotationWithItems.projectId)
      if (currentQuotation.projectId !== quotationWithItems.projectId) {
        await syncFurnitureVendorAccountsForProject(tx, currentQuotation.projectId)
      }

      return quotationWithItems
    })

    return NextResponse.json(quotation)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({
        where: { id: params.id },
      })

      if (!quotation) {
        throw new Error('Quotation not found')
      }

      await tx.quotation.delete({
        where: { id: params.id },
      })

      if (quotation.status === 'accepted' && quotation.clientId) {
        await tx.client.update({
          where: { id: quotation.clientId },
          data: {
            balance: {
              decrement: quotation.amount,
            },
          },
        })
      }

      await syncFurnitureVendorAccountsForProject(tx, quotation.projectId)
    })
    return NextResponse.json({ message: 'Quotation deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete quotation' }, { status: 500 })
  }
}
