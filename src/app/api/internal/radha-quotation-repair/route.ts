import { createHash, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TARGET_QUOTATION_NO = 'QT-1785528162472'
const EXPECTED_TOKEN_HASH = '005cfc5ae381a7137e87c289ff2c4af21b3324a5d7f586ebc760757958c7fd21'

function hasValidRepairToken(request: NextRequest) {
  const token = request.headers.get('x-repair-token') || ''
  const actual = Buffer.from(createHash('sha256').update(token).digest('hex'))
  const expected = Buffer.from(EXPECTED_TOKEN_HASH)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

function normalize(value: unknown) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export async function POST(request: NextRequest) {
  if (!hasValidRepairToken(request)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  if (body.action !== 'inspect' && body.action !== 'apply') {
    return NextResponse.json({ error: 'Unsupported repair action' }, { status: 400 })
  }

  const quotation = await prisma.quotation.findUnique({
    where: { quotationNo: TARGET_QUOTATION_NO },
    include: { client: true, project: true, items: { orderBy: { createdAt: 'asc' } } },
  })

  if (!quotation) {
    return NextResponse.json({ error: 'Target quotation not found' }, { status: 404 })
  }

  const clientName = normalize(`${quotation.client.firstName} ${quotation.client.lastName}`)
  const projectName = normalize(quotation.project.name)
  if (!clientName.includes('radha') || !clientName.includes('rung') || !projectName.includes('anshul')) {
    return NextResponse.json({ error: 'Target identity check failed' }, { status: 409 })
  }

  if (body.action === 'apply') {
    if (quotation.status !== 'draft') {
      return NextResponse.json({ error: 'Repair stopped because the quotation is no longer a draft' }, { status: 409 })
    }

    const extraStorage = quotation.items.find((item) => normalize(item.description) === 'extra storage')
    const tvUnit = quotation.items.find((item) => normalize(item.description) === 't v unit')
    const floorGuard = quotation.items.find((item) => normalize(item.description) === 'floor guard')
    if (!extraStorage || !tvUnit) {
      return NextResponse.json({ error: 'Required quotation items were not found' }, { status: 409 })
    }

    const repaired = await prisma.$transaction(async (tx) => {
      await tx.quotationItem.update({
        where: { id: extraStorage.id },
        data: { quantity: 1, lengthCm: 6.1, widthCm: 8, rate: 1350, areaSqFt: 48.8, total: 65880 },
      })
      await tx.quotationItem.update({
        where: { id: tvUnit.id },
        data: { quantity: 1, lengthCm: 5.7, widthCm: 7, rate: 1400, areaSqFt: 39.9, total: 55860 },
      })
      if (floorGuard) {
        await tx.quotationItem.delete({ where: { id: floorGuard.id } })
      }
      await tx.quotation.update({
        where: { id: quotation.id },
        data: { amount: 1553055, executionFeePercent: 7, discount: 0 },
      })

      const updated = await tx.quotation.findUnique({
        where: { id: quotation.id },
        include: { items: true },
      })
      if (!updated) throw new Error('Quotation could not be verified after repair')

      const itemTotal = updated.items.reduce((sum, item) => sum + item.total, 0)
      if (Math.abs(itemTotal - 1553055) > 0.01 || updated.items.length !== 49) {
        throw new Error('Post-repair total verification failed')
      }

      return { quotation: updated, itemTotal }
    })

    return NextResponse.json({
      ok: true,
      quotationNo: repaired.quotation.quotationNo,
      amount: repaired.quotation.amount,
      executionFeePercent: repaired.quotation.executionFeePercent,
      discount: repaired.quotation.discount,
      itemTotal: repaired.itemTotal,
      itemCount: repaired.quotation.items.length,
      grandTotal: repaired.quotation.amount * 1.07,
      updatedAt: repaired.quotation.updatedAt,
    })
  }

  return NextResponse.json({
    id: quotation.id,
    quotationNo: quotation.quotationNo,
    client: `${quotation.client.firstName} ${quotation.client.lastName}`,
    project: quotation.project.name,
    amount: quotation.amount,
    executionFeePercent: quotation.executionFeePercent,
    discount: quotation.discount,
    status: quotation.status,
    notes: quotation.notes,
    terms: quotation.terms,
    updatedAt: quotation.updatedAt,
    items: quotation.items.map((item) => ({
      id: item.id,
      area: item.area,
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      lengthCm: item.lengthCm,
      widthCm: item.widthCm,
      rate: item.rate,
      areaSqFt: item.areaSqFt,
      total: item.total,
    })),
  })
}
