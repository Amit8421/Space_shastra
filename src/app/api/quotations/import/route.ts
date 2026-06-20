import { NextRequest, NextResponse } from 'next/server'
import { parseQuotationImportBuffer } from '@/lib/quotation-import'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Please upload an Excel or CSV file.' }, { status: 400 })
    }

    const allowedExtensions = ['.xlsx', '.xls', '.csv']
    const lowerName = file.name.toLowerCase()
    const isAllowed = allowedExtensions.some((extension) => lowerName.endsWith(extension))

    if (!isAllowed) {
      return NextResponse.json({ error: 'Only .xlsx, .xls, and .csv files are supported right now.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const parsedQuotation = parseQuotationImportBuffer(buffer, file.name)

    return NextResponse.json(parsedQuotation)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import quotation file.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
