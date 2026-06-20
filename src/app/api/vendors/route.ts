import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeTextFields } from '@/lib/text-format'

export async function GET(_request: NextRequest) {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(vendors)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = normalizeTextFields(body, ['name', 'category'])
    const vendor = await prisma.vendor.create({
      data,
    })
    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 })
  }
}
