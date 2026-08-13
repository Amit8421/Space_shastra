import { NextRequest, NextResponse } from 'next/server'
import { parseQuotationPdfBuffer } from '@/lib/quotation-pdf-import'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Please upload a PDF quotation file.' }, { status: 400 })
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported by PDF Import.' }, { status: 400 })
    }
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'The PDF is too large. Please upload a file smaller than 15 MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return NextResponse.json({ error: 'The uploaded file is not a valid PDF.' }, { status: 400 })
    }
    const parsedQuotation = await parseQuotationPdfBuffer(buffer, file.name)
    return NextResponse.json(parsedQuotation)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import the PDF quotation.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
