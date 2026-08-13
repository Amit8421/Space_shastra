import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeTextField } from '@/lib/text-format'
import { normalizeQuotationTerms } from '@/lib/quotation-terms'
import { getQuotationGrandTotal } from '@/lib/quotation-total'
import { syncFurnitureVendorAccountsForProject } from '@/lib/vendor-furniture-sync'

export const maxDuration = 60

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { items, terms: submittedTerms, ...quotationFields } = body
    const normalizedTerms = normalizeQuotationTerms(submittedTerms)

    // Fetch current quotation to check status and client changes
    const currentQuotation = await prisma.quotation.findUnique({
      where: { id: params.id },
    })

    if (!currentQuotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    const quotation = await prisma.$transaction(async (tx) => {
      const data: any = {
        ...quotationFields,
        executionFeePercent: Number(quotationFields.executionFeePercent) || 0,
        discount: Math.max(0, Number(quotationFields.discount) || 0),
        notes: normalizeTextField(quotationFields.notes),
        ...(normalizedTerms !== undefined ? { terms: normalizedTerms } : {}),
      }

      await tx.quotation.update({
        where: { id: params.id },
        data,
      })

      if (Array.isArray(items)) {
        const normalizedItems = items.map((item: any) => ({
          id: typeof item.id === 'string' ? item.id : null,
          data: {
            area: item.area,
            category: item.category,
            description: normalizeTextField(item.description),
            quantity: Number(item.quantity) || 0,
            lengthCm: item.lengthCm !== undefined ? Number(item.lengthCm) || 0 : null,
            widthCm: item.widthCm !== undefined ? Number(item.widthCm) || 0 : null,
            rate: item.rate !== undefined ? Number(item.rate) || 0 : null,
            areaSqFt: item.areaSqFt !== undefined ? Number(item.areaSqFt) || 0 : null,
            total: Number(item.total) || 0,
          },
        }))

        if (currentQuotation.status !== 'accepted') {
          await tx.quotationItem.deleteMany({
            where: { quotationId: params.id },
          })

          if (normalizedItems.length > 0) {
            await tx.quotationItem.createMany({
              data: normalizedItems.map((item) => ({
                quotationId: params.id,
                ...item.data,
              })),
            })
          }
        } else {
          // Accepted quotation item IDs are retained because vendor furniture
          // rates are linked to them.
          const existingItems = await tx.quotationItem.findMany({
            where: { quotationId: params.id },
            select: { id: true },
          })
          const existingItemIds = new Set(existingItems.map((item) => item.id))
          const nextExistingItemIds = new Set<string>()
          const itemOperations = normalizedItems.map((item) => {
            if (item.id && existingItemIds.has(item.id)) {
              nextExistingItemIds.add(item.id)
              return tx.quotationItem.update({
                where: { id: item.id },
                data: item.data,
              })
            }

            return tx.quotationItem.create({
              data: {
                quotationId: params.id,
                ...item.data,
              },
            })
          })

          await Promise.all(itemOperations)

          const removedItemIds = existingItems
            .map((item) => item.id)
            .filter((itemId) => !nextExistingItemIds.has(itemId))

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
      const wasAccepted = currentQuotation.status === 'accepted'
      const isAccepted = quotationWithItems.status === 'accepted'
      const oldAcceptedTotal = getQuotationGrandTotal(currentQuotation)
      const newAcceptedTotal = getQuotationGrandTotal(quotationWithItems)

      if (wasAccepted && oldClientId && (!isAccepted || oldClientId !== newClientId)) {
        await tx.client.update({
          where: { id: oldClientId },
          data: {
            balance: {
              decrement: oldAcceptedTotal,
            },
          },
        })
      }

      if (isAccepted && newClientId && (!wasAccepted || oldClientId !== newClientId)) {
        await tx.client.update({
          where: { id: newClientId },
          data: {
            balance: {
              increment: newAcceptedTotal,
            },
          },
        })
      }

      if (wasAccepted && isAccepted && oldClientId === newClientId) {
        const diff = Math.round((newAcceptedTotal - oldAcceptedTotal + Number.EPSILON) * 100) / 100
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
      }

      if (wasAccepted || isAccepted) {
        await syncFurnitureVendorAccountsForProject(tx, quotationWithItems.projectId)
        if (currentQuotation.projectId !== quotationWithItems.projectId) {
          await syncFurnitureVendorAccountsForProject(tx, currentQuotation.projectId)
        }
      }

      return quotationWithItems
    }, {
      maxWait: 10000,
      timeout: 45000,
    })

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('Failed to update quotation:', error)
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
        const acceptedTotal = getQuotationGrandTotal(quotation)
        await tx.client.update({
          where: { id: quotation.clientId },
          data: {
            balance: {
              decrement: acceptedTotal,
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
