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
  if (body.action !== 'inspect') {
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
