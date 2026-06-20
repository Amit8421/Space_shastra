import { Prisma } from '@prisma/client'

const FURNITURE_CATEGORY = 'furniture'

type SyncClient = Prisma.TransactionClient

type FurnitureSourceItem = {
  id: string
  quotationId: string
  area: string
  category: string
  description: string
  quantity: number
  lengthCm: number | null
  widthCm: number | null
  areaSqFt: number | null
  rate: number | null
}

function isFurnitureCategory(category?: string | null) {
  return category?.trim().toLowerCase() === FURNITURE_CATEGORY
}

function getLineUnitValue(item: {
  quantity: number
  lengthCm?: number | null
  widthCm?: number | null
  areaSqFt?: number | null
}) {
  const quantity = Number(item.quantity) || 0
  const storedArea = Number(item.areaSqFt || 0)
  const lengthFt = Number(item.lengthCm || 0)
  const widthFt = Number(item.widthCm || 0)
  const measuredArea = lengthFt > 0 && widthFt > 0 ? lengthFt * widthFt : 0
  const areaValue = storedArea || measuredArea

  return areaValue > 0 ? areaValue * Math.max(quantity, 1) : quantity
}

function calculateVendorTotal(
  item: {
    quantity: number
    lengthCm?: number | null
    widthCm?: number | null
    areaSqFt?: number | null
  },
  vendorRate: number,
) {
  return Number((getLineUnitValue(item) * vendorRate).toFixed(2))
}

async function applyFurnitureOpeningBalance(
  tx: SyncClient,
  account: {
    id: string
    vendorId: string
    openingBalance: number
    currentBalance: number
  },
  nextOpeningBalance: number,
) {
  const roundedOpeningBalance = Number(nextOpeningBalance.toFixed(2))
  const delta = Number((roundedOpeningBalance - Number(account.openingBalance || 0)).toFixed(2))

  await tx.vendorAccount.update({
    where: { id: account.id },
    data: {
      openingBalance: roundedOpeningBalance,
      currentBalance: Number((Number(account.currentBalance || 0) + delta).toFixed(2)),
    },
  })

  if (delta !== 0) {
    await tx.vendor.update({
      where: { id: account.vendorId },
      data: {
        balance: {
          increment: delta,
        },
      },
    })
  }
}

async function syncFurnitureItemsForAccount(
  tx: SyncClient,
  account: {
    id: string
    vendorId: string
    openingBalance: number
    currentBalance: number
    furnitureItems: Array<{
      id: string
      quotationItemId: string | null
      vendorRate: number
    }>
  },
  sourceItems: FurnitureSourceItem[],
) {
  const currentItemsByQuotationItemId = new Map(
    account.furnitureItems
      .filter((item) => item.quotationItemId)
      .map((item) => [item.quotationItemId as string, item]),
  )

  const activeSourceIds = new Set(sourceItems.map((item) => item.id))

  for (const sourceItem of sourceItems) {
    const existingItem = currentItemsByQuotationItemId.get(sourceItem.id)
    const vendorRate = Number(existingItem?.vendorRate || 0)
    const vendorTotal = calculateVendorTotal(sourceItem, vendorRate)

    if (existingItem) {
      await tx.vendorAccountFurnitureItem.update({
        where: { id: existingItem.id },
        data: {
          quotationId: sourceItem.quotationId,
          area: sourceItem.area,
          category: sourceItem.category,
          description: sourceItem.description,
          quantity: sourceItem.quantity,
          lengthCm: sourceItem.lengthCm,
          widthCm: sourceItem.widthCm,
          areaSqFt: sourceItem.areaSqFt,
          quotationRate: sourceItem.rate,
          vendorTotal,
        },
      })
      continue
    }

    await tx.vendorAccountFurnitureItem.create({
      data: {
        vendorAccountId: account.id,
        quotationId: sourceItem.quotationId,
        quotationItemId: sourceItem.id,
        area: sourceItem.area,
        category: sourceItem.category,
        description: sourceItem.description,
        quantity: sourceItem.quantity,
        lengthCm: sourceItem.lengthCm,
        widthCm: sourceItem.widthCm,
        areaSqFt: sourceItem.areaSqFt,
        quotationRate: sourceItem.rate,
        vendorRate,
        vendorTotal,
      },
    })
  }

  const staleFurnitureItems = account.furnitureItems
    .filter((item) => !item.quotationItemId || !activeSourceIds.has(item.quotationItemId))
    .map((item) => item.id)

  if (staleFurnitureItems.length > 0) {
    await tx.vendorAccountFurnitureItem.deleteMany({
      where: {
        id: {
          in: staleFurnitureItems,
        },
      },
    })
  }

  const refreshedFurnitureItems = await tx.vendorAccountFurnitureItem.findMany({
    where: { vendorAccountId: account.id },
  })

  const nextOpeningBalance = refreshedFurnitureItems.reduce(
    (sum, item) => sum + Number(item.vendorTotal || 0),
    0,
  )

  await applyFurnitureOpeningBalance(tx, account, nextOpeningBalance)
}

export async function syncFurnitureVendorAccountsForProject(tx: SyncClient, projectId: string) {
  const latestAcceptedQuotation = await tx.quotation.findFirst({
    where: {
      projectId,
      status: 'accepted',
    },
    include: {
      items: true,
    },
    orderBy: [
      { issueDate: 'desc' },
      { updatedAt: 'desc' },
    ],
  })

  const sourceItems = (latestAcceptedQuotation?.items || [])
    .filter((item) => isFurnitureCategory(item.category))
    .map((item) => ({
      id: item.id,
      quotationId: item.quotationId,
      area: item.area,
      category: item.category,
      description: item.description,
      quantity: Number(item.quantity || 0),
      lengthCm: item.lengthCm,
      widthCm: item.widthCm,
      areaSqFt: item.areaSqFt,
      rate: item.rate,
    }))

  const furnitureAccounts = await tx.vendorAccount.findMany({
    where: {
      projectId,
      vendor: {
        category: {
          equals: 'Furniture',
          mode: 'insensitive',
        },
      },
    },
    include: {
      furnitureItems: true,
    },
  })

  for (const account of furnitureAccounts) {
    await syncFurnitureItemsForAccount(tx, account, sourceItems)
  }
}

export async function updateFurnitureVendorRates(
  tx: SyncClient,
  accountId: string,
  furnitureItems: Array<{ id: string; vendorRate: number }>,
) {
  const account = await tx.vendorAccount.findUnique({
    where: { id: accountId },
    include: {
      furnitureItems: true,
      vendor: true,
    },
  })

  if (!account) {
    throw new Error('Vendor account not found')
  }

  const updatesById = new Map(
    furnitureItems.map((item) => [item.id, Number(item.vendorRate || 0)]),
  )

  for (const item of account.furnitureItems) {
    if (!updatesById.has(item.id)) continue

    const vendorRate = updatesById.get(item.id) || 0
    const vendorTotal = calculateVendorTotal(item, vendorRate)

    await tx.vendorAccountFurnitureItem.update({
      where: { id: item.id },
      data: {
        vendorRate,
        vendorTotal,
      },
    })
  }

  const refreshedFurnitureItems = await tx.vendorAccountFurnitureItem.findMany({
    where: { vendorAccountId: accountId },
  })

  const nextOpeningBalance = refreshedFurnitureItems.reduce(
    (sum, item) => sum + Number(item.vendorTotal || 0),
    0,
  )

  await applyFurnitureOpeningBalance(tx, account, nextOpeningBalance)
}
