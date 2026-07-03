import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/tenant-prisma-proxy'
import { apiError } from '@/lib/api-error'
import { calculateDocumentTotals, money } from '@/lib/money'
import { normalizeTextField } from '@/lib/text-format'
import { quotationSchema } from '@/lib/validation'
import { syncFurnitureVendorAccountsForProject } from '@/lib/vendor-furniture-sync'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = quotationSchema.parse(await request.json())
    const items = body.items.map((item) => ({
      id: item.id,
      area: item.area,
      category: item.category,
      description: normalizeTextField(item.description),
      quantity: Number(item.quantity),
      lengthCm: item.lengthCm ?? null,
      widthCm: item.widthCm ?? null,
      rate: item.rate === undefined || item.rate === null ? null : money(item.rate),
      areaSqFt: item.areaSqFt ?? null,
      total: money(item.total ?? 0),
    }))
    const subtotal = items.reduce((sum, item) => sum.add(item.total), money(0))
    const totals = calculateDocumentTotals({
      subtotal,
      executionFeePercent: body.executionFeePercent,
      gstRate: body.gstRate,
      gstType: body.gstType,
    })

    // Fetch current quotation to check status and client changes
    const currentQuotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: { client: true },
    })

    if (!currentQuotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    const quotation = await prisma.$transaction(async (tx) => {
      const data = {
        quotationNo: body.quotationNo,
        clientId: body.clientId,
        projectId: body.projectId,
        issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        subtotal: totals.subtotal,
        executionFeePercent: totals.executionFeePercent,
        executionFeeAmount: totals.executionFeeAmount,
        taxableAmount: totals.taxableAmount,
        gstType: totals.gstType,
        gstRate: totals.gstRate,
        cgstAmount: totals.cgstAmount,
        sgstAmount: totals.sgstAmount,
        igstAmount: totals.igstAmount,
        amount: totals.amount,
        placeOfSupply: normalizeTextField(body.placeOfSupply),
        status: body.status,
        notes: normalizeTextField(body.notes),
      }

      await tx.quotation.update({
        where: { id: params.id },
        data,
      })

      const existingItems = await tx.quotationItem.findMany({
        where: { quotationId: params.id },
        select: { id: true },
      })

      const existingItemIds = new Set(existingItems.map((item) => item.id))
      const nextItemIds = new Set<string>()

      for (const item of items) {
        const { id, ...normalizedItem } = item

        if (id && existingItemIds.has(id)) {
          nextItemIds.add(id)
          await tx.quotationItem.update({
            where: { id },
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
        const diff = quotationWithItems.amount.sub(currentQuotation.amount)
        if (!diff.isZero() && newClientId) {
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
    return apiError(error, 'Failed to update quotation')
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

