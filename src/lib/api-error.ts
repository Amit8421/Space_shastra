import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { validationError } from './validation'

export function apiError(error: unknown, fallback = 'Something went wrong.') {
  console.error(fallback, error)

  if (error instanceof ZodError) {
    return NextResponse.json(validationError(error), { status: 400 })
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'A record with the same unique value already exists.' }, { status: 409 })
    if (error.code === 'P2025') return NextResponse.json({ error: 'The requested record was not found.' }, { status: 404 })
    if (error.code === 'P2003') return NextResponse.json({ error: 'This record is still referenced by other data.' }, { status: 409 })
  }
  return NextResponse.json({ error: fallback }, { status: 500 })
}
