import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/tenant-prisma-proxy'
import { normalizeTextFields } from '@/lib/text-format'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const normalizedBody = normalizeTextFields(body, ['firstName', 'lastName'])
    const data: any = {
      firstName: normalizedBody.firstName,
      lastName: normalizedBody.lastName,
      email: normalizedBody.email,
      phone: normalizedBody.phone,
      status: normalizedBody.status,
    }

    if (normalizedBody.balance !== undefined) {
      data.balance = normalizedBody.balance
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data,
    })
    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.client.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ message: 'Client deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}

