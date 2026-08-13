import type { ImportedQuotationItem, ImportedQuotationPayload } from './quotation-import'

type PdfWord = {
  page: number
  x: number
  y: number
  width: number
  pageWidth: number
  text: string
}

type PdfRow = {
  page: number
  y: number
  pageWidth: number
  words: PdfWord[]
}

type PdfColumns = {
  serialStart: number
  descriptionStart: number
  lengthStart: number
  widthStart: number
  unitStart: number
  rateStart: number
  amountStart: number
  amountEnd: number
}

function normalizeText(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function normalizeKey(value: unknown) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function parseNumber(value: unknown) {
  const match = normalizeText(value).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)
  const parsed = match ? Number(match[0]) : 0
  return Number.isFinite(parsed) ? parsed : 0
}

function joinWords(words: PdfWord[]) {
  return normalizeText(
    [...words]
      .sort((left, right) => left.x - right.x)
      .map((word) => word.text)
      .join(' '),
  )
}

function buildRows(words: PdfWord[]) {
  const rows: PdfRow[] = []

  for (const word of [...words].sort((left, right) => left.page - right.page || left.y - right.y || left.x - right.x)) {
    const recentRows = rows.slice(-5)
    const matchingRow = recentRows.find((row) => row.page === word.page && Math.abs(row.y - word.y) <= 3.2)
    if (matchingRow) {
      matchingRow.words.push(word)
      matchingRow.y = (matchingRow.y + word.y) / 2
    } else {
      rows.push({ page: word.page, y: word.y, pageWidth: word.pageWidth, words: [word] })
    }
  }

  return rows.sort((left, right) => left.page - right.page || left.y - right.y)
}

function wordsInRange(row: PdfRow, startRatio: number, endRatio: number) {
  return row.words.filter((word) => {
    const xRatio = word.x / row.pageWidth
    return xRatio >= startRatio && xRatio < endRatio
  })
}

function rowCell(row: PdfRow, startRatio: number, endRatio: number) {
  return joinWords(wordsInRange(row, startRatio, endRatio))
}

function rowText(row: PdfRow) {
  return joinWords(row.words)
}

function detectColumns(headerRow: PdfRow): PdfColumns {
  const keyedWords = headerRow.words.map((word) => ({ ...word, key: normalizeKey(word.text) }))
  const serial = keyedWords.find((word) => word.key === 'sr no')
  const description = keyedWords.find((word) => word.key === 'item description')
  const sizes = keyedWords.filter((word) => word.key === 'size').sort((left, right) => left.x - right.x)
  const unit = keyedWords.find((word) => word.key === 'unit')
  const rate = keyedWords.find((word) => word.key === 'rate')
  const amount = keyedWords.find((word) => word.key === 'amount')
  if (!serial || !description || sizes.length < 2 || !unit || !rate || !amount) {
    throw new Error('Could not determine the PDF quotation columns from its table header.')
  }

  const pageWidth = headerRow.pageWidth
  const serialStart = Math.max(0, serial.x / pageWidth - 0.01)
  const descriptionStart = Math.max(serialStart, description.x / pageWidth - 0.062)
  const lengthStart = sizes[0].x / pageWidth - 0.033
  const widthStart = sizes[1].x / pageWidth - 0.017
  const unitStart = unit.x / pageWidth - 0.022
  const rateStart = rate.x / pageWidth - 0.028
  const amountStart = amount.x / pageWidth - 0.024

  return {
    serialStart,
    descriptionStart,
    lengthStart,
    widthStart,
    unitStart,
    rateStart,
    amountStart,
    amountEnd: Math.min(0.98, amountStart + 0.13),
  }
}

function cleanClientName(value: string) {
  return normalizeText(value)
    .replace(/^(?:mrs?\.?\s*\/\s*ms\.?\s*)/i, '')
    .replace(/^(?:mr|mrs|ms|miss)\.?\s+/i, '')
    .replace(/\s+(?:sir|madam)\.?$/i, '')
}

function projectNameFromFile(fileName: string) {
  return normalizeText(
    fileName
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b(?:final|quotation|quote|change|changed|edited|editied)\b/gi, ' '),
  )
}

function sectionForText(text: string) {
  const key = normalizeKey(text)
  if (/\bpop work\b/.test(key)) return { category: 'POP', area: 'Full Flat', titleOnly: true }
  if (key.includes('electrical work')) return { category: 'Electrical', area: 'Full Flat', titleOnly: false }
  if (key.includes('painting work')) return { category: 'Painting', area: 'Full Flat', titleOnly: true }
  if (key.includes('living room')) return { category: 'Furniture', area: 'Living Room', titleOnly: true }
  if (key === 'kitchen') return { category: 'Furniture', area: 'Kitchen', titleOnly: true }
  if (key.includes('master') && key.includes('bed room')) return { category: 'Furniture', area: 'Master Bedroom', titleOnly: true }
  if (key.includes('children') && key.includes('bed room')) return { category: 'Furniture', area: 'Children Bedroom', titleOnly: true }
  if (key === 'bathroom') return { category: 'Furniture', area: 'Bathroom', titleOnly: true }
  return null
}

function isIgnoredTableRow(text: string) {
  const key = normalizeKey(text)
  return (
    key.includes('all below cost would be calculated') ||
    key.includes('will decide after final design') ||
    key === 'total amount' ||
    key.includes('interior execution fees') ||
    key.includes('grand total')
  )
}

function makeItem(
  category: string,
  area: string,
  description: string,
  lengthText: string,
  widthText: string,
  unitText: string,
  rateText: string,
  amountText: string,
): ImportedQuotationItem {
  const length = parseNumber(lengthText)
  const width = parseNumber(widthText)
  const quantityMatch = unitText.match(/(\d+(?:\.\d+)?)\s*(?:units?|nos?)/i)
  const quantity = quantityMatch ? parseNumber(quantityMatch[1]) || 1 : 1

  return {
    category,
    area: category === 'Furniture' ? area : 'Full Flat',
    description: normalizeText(description),
    quantity: String(quantity),
    lengthIn: length > 0 && width > 0 ? String(length) : '0',
    widthIn: length > 0 && width > 0 ? String(width) : '0',
    rate: String(parseNumber(rateText) || 0),
    total: Number(parseNumber(amountText).toFixed(2)),
    manualTotal: true,
  }
}

function extractTerms(rows: PdfRow[], termsStartIndex: number) {
  if (termsStartIndex < 0) return []
  const numberedTerms = new Map<number, string>()

  for (const row of rows.slice(termsStartIndex + 1)) {
    const text = rowText(row)
    const match = text.match(/^\s*(\d{1,2})\s+(.+)/)
    if (!match) continue
    const number = Number(match[1])
    const description = normalizeText(match[2])
    if (number > 0 && number <= 99 && description) numberedTerms.set(number, description)
  }

  return [...numberedTerms.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, description]) => description)
}

function parseTrailingItems(rows: PdfRow[], tableEndIndex: number, termsStartIndex: number) {
  const items: ImportedQuotationItem[] = []
  const warnings: string[] = []
  const trailingRows = rows.filter((_, index) => index > tableEndIndex && (termsStartIndex < 0 || index > termsStartIndex))

  for (const row of trailingRows) {
    const text = rowText(row)
    const match = text.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*=\s*([\d,]+)\s*\/?-?\s*$/i)
    if (!match) continue
    const length = parseNumber(match[2])
    const width = parseNumber(match[3])
    const total = parseNumber(match[4])
    const rate = length > 0 && width > 0 ? total / (length * width) : 0
    items.push({
      category: 'Furniture',
      area: 'Add Ons',
      description: normalizeText(match[1]),
      quantity: '1',
      lengthIn: String(length),
      widthIn: String(width),
      rate: String(Number(rate.toFixed(2))),
      total: Number(total.toFixed(2)),
      manualTotal: true,
    })
    warnings.push(`The unstructured item on PDF page ${row.page} was imported under Add Ons. Please verify it before saving.`)
  }

  return { items, warnings }
}

export async function parseQuotationPdfBuffer(buffer: Buffer, fileName: string): Promise<ImportedQuotationPayload> {
  const [{ getDocument }, workerModule] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.mjs'),
  ])
  ;(globalThis as typeof globalThis & { pdfjsWorker?: typeof workerModule }).pdfjsWorker = workerModule
  const document = await getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise
  if (document.numPages > 50) {
    await document.destroy()
    throw new Error('This PDF has too many pages. Please upload a quotation with 50 pages or fewer.')
  }
  const words: PdfWord[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 1 })
    const textContent = await page.getTextContent()
    for (const item of textContent.items) {
      if (!('str' in item)) continue
      const text = normalizeText(item.str)
      if (!text) continue
      words.push({
        page: pageNumber,
        x: item.transform[4],
        y: viewport.height - item.transform[5],
        width: item.width,
        pageWidth: viewport.width,
        text,
      })
    }
  }
  await document.destroy()

  if (words.reduce((total, word) => total + word.text.length, 0) < 80) {
    throw new Error('This PDF appears to be scanned or image-only. Please upload a selectable-text PDF or use the original Excel file.')
  }

  const rows = buildRows(words)
  const headerIndex = rows.findIndex((row) => {
    const key = normalizeKey(rowText(row))
    return key.includes('sr no') && key.includes('item description') && key.includes('amount')
  })
  if (headerIndex < 0) {
    throw new Error('Could not detect a quotation table in this PDF. Please use a Space Shashtra quotation PDF or import the original Excel file.')
  }
  const columns = detectColumns(rows[headerIndex])

  const termsStartIndex = rows.findIndex((row) => normalizeKey(rowText(row)).includes('terms and conditions'))
  const tableEndIndex = rows.findIndex((row, index) => index > headerIndex && normalizeKey(rowText(row)).includes('total amount'))
  const effectiveTableEnd = tableEndIndex > headerIndex ? tableEndIndex : (termsStartIndex > headerIndex ? termsStartIndex : rows.length)
  const allText = rows.map(rowText).join('\n')
  const warnings: string[] = []

  const quotationNo = allText.match(/\bQN\s*[|:#-]?\s*([A-Za-z0-9\-/]+)/i)?.[1] || ''
  const clientRow = rows.find((row) => /mrs?\.?\s*\/\s*ms\.?/i.test(rowText(row)))
  const projectName = projectNameFromFile(fileName)
  let clientName = clientRow
    ? cleanClientName(rowCell(clientRow, columns.descriptionStart, columns.lengthStart))
    : ''
  if (clientName && !clientName.includes(' ')) {
    const projectWords = projectName.split(' ').filter(Boolean)
    if (projectWords.length >= 2 && normalizeKey(projectWords[0]) === normalizeKey(clientName)) {
      clientName = `${clientName} ${projectWords[1]}`
      warnings.push('The client surname was inferred from the PDF file name. Please verify the matched client.')
    }
  }
  const executionRow = rows.find((row) => normalizeKey(rowText(row)).includes('interior execution fees'))
  const executionFeePercent = executionRow ? parseNumber(rowText(executionRow).match(/\d+(?:\.\d+)?\s*%/)?.[0]) || null : null
  const discountMatch = allText.match(/\bdiscount\s*[:\-]?\s*([\d,]+(?:\.\d+)?)/i)
  const discount = discountMatch ? parseNumber(discountMatch[1]) : 0
  const terms = extractTerms(rows, termsStartIndex)
  const items: ImportedQuotationItem[] = []
  let currentCategory = 'Furniture'
  let currentArea = 'Living Room'

  for (const row of rows.slice(headerIndex + 1, effectiveTableEnd)) {
    const text = rowText(row)
    const section = sectionForText(text)
    const descriptionCell = rowCell(row, columns.descriptionStart, columns.lengthStart)
    const lengthCell = rowCell(row, columns.lengthStart, columns.widthStart)
    const widthCell = rowCell(row, columns.widthStart, columns.unitStart)
    const unitCell = rowCell(row, columns.unitStart, columns.rateStart)
    const rateCell = rowCell(row, columns.rateStart, columns.amountStart)
    const amountCell = rowCell(row, columns.amountStart, columns.amountEnd)

    if (section) {
      currentCategory = section.category
      currentArea = section.area
      if (section.titleOnly) continue
    }
    if (isIgnoredTableRow(text)) continue

    const description = descriptionCell || (section && !section.titleOnly ? text.replace(/\b\d[\d,]*(?:\.\d+)?\b.*$/i, '') : '')
    if (!description) continue
    const hasUsefulValue = Boolean(lengthCell || widthCell || unitCell || rateCell || amountCell)
    const serialCell = rowCell(row, columns.serialStart, columns.descriptionStart)
    if (!hasUsefulValue && !/^\d+$/.test(serialCell) && currentCategory === 'Furniture') continue

    items.push(makeItem(currentCategory, currentArea, description, lengthCell, widthCell, unitCell, rateCell, amountCell))
  }

  const trailing = parseTrailingItems(rows, effectiveTableEnd, termsStartIndex)
  const mainTableTotal = items.reduce((sum, item) => sum + item.total, 0)
  items.push(...trailing.items)
  warnings.push(...trailing.warnings)

  const statedTotalRow = tableEndIndex >= 0 ? rows[tableEndIndex] : null
  const statedTotal = statedTotalRow
    ? parseNumber(rowCell(statedTotalRow, columns.amountStart, columns.amountEnd))
    : 0
  const importedTotal = items.reduce((sum, item) => sum + item.total, 0)
  if (statedTotal > 0 && Math.abs(mainTableTotal - statedTotal) > 0.5) {
    warnings.push(`The PDF states a base total of Rs. ${statedTotal.toFixed(2)}, but its main item rows total Rs. ${mainTableTotal.toFixed(2)}.`)
  }
  if (statedTotal > 0 && Math.abs(importedTotal - statedTotal) > 0.5 && trailing.items.length > 0) {
    warnings.push(`The PDF page after the terms contains additional item(s) not included in the stated base total. Including them makes the imported total Rs. ${importedTotal.toFixed(2)} instead of Rs. ${statedTotal.toFixed(2)}.`)
  }

  if (!clientName) warnings.push('Client name was not detected automatically. Please select the client in the quotation form.')
  if (!quotationNo) warnings.push('Quotation number was not detected. A new number will be generated if you leave it empty.')
  if (terms.length === 0) warnings.push('Terms and conditions were not detected in the PDF. Default terms will be used.')
  if (discount > 0) {
    warnings.push(`This PDF applies a discount of Rs. ${discount.toFixed(2)} after the execution fee. The current quotation form has no discount field, so verify the final total before saving.`)
  }
  warnings.push('PDF positions can vary between templates. Review all imported rows, areas, rates, and totals before saving.')

  if (items.length === 0) throw new Error('No quotation items were found in the PDF.')

  return {
    quotationNo,
    clientName,
    projectName,
    notes: discount > 0 ? `Imported PDF discount: Rs. ${discount.toFixed(2)} (not automatically applied).` : '',
    executionFeePercent,
    terms,
    items,
    warnings,
  }
}
