import * as XLSX from 'xlsx'

export type ImportedQuotationItem = {
  area: string
  category: string
  description: string
  quantity: string
  lengthIn: string
  widthIn: string
  rate: string
  total: number
}

export type ImportedQuotationPayload = {
  quotationNo: string
  clientName: string
  projectName: string
  notes: string
  items: ImportedQuotationItem[]
  warnings: string[]
}

const HEADER_ALIASES: Record<string, string[]> = {
  area: ['area', 'room', 'location', 'space'],
  category: ['category', 'work type', 'type', 'item type'],
  description: ['description', 'item description', 'particular', 'particulars', 'item', 'details', 'scope'],
  quantity: ['qty', 'quantity', 'nos', 'no', 'units'],
  lengthIn: ['length', 'length ft', 'length(ft)', 'length feet', 'length foot', 'length in', 'length(in)', 'length inch', 'length inches', 'l'],
  widthIn: ['width', 'width ft', 'width(ft)', 'width feet', 'width foot', 'width in', 'width(in)', 'width inch', 'width inches', 'w'],
  rate: ['rate', 'unit rate', 'price', 'amount rate'],
  total: ['total', 'amount', 'line total', 'value'],
}

const AREA_LABEL_MAP: Record<string, string> = {
  entrance: 'Entrance',
  living: 'Living Room',
  'living room': 'Living Room',
  kitchen: 'Kitchen',
  'dining area': 'Dining Area',
  'kids bed': 'Children Bedroom',
  'kids bedroom': 'Children Bedroom',
  'master bed': 'Master Bedroom',
  'master bedroom': 'Master Bedroom',
  'parents room': 'Guest Bedroom',
  'parent room': 'Guest Bedroom',
}

function normalizeText(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeKey(value: unknown) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function asNumber(value: unknown) {
  const normalized = String(value ?? '')
    .replace(/,/g, '')
    .replace(/₹/g, '')
    .replace(/\$/g, '')
    .trim()

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function scoreHeaderRow(row: unknown[]) {
  const normalizedCells = row.map((cell) => normalizeKey(cell))
  let score = 0

  for (const aliases of Object.values(HEADER_ALIASES)) {
    if (aliases.some((alias) => normalizedCells.includes(alias))) {
      score += 1
    }
  }

  return score
}

function findHeaderRow(rows: unknown[][]) {
  let bestIndex = -1
  let bestScore = 0

  rows.slice(0, 30).forEach((row, index) => {
    const score = scoreHeaderRow(row)
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })

  return bestScore >= 3 ? bestIndex : -1
}

function resolveHeaderMap(headerRow: unknown[]) {
  const headerMap: Record<string, number> = {}
  const normalizedHeaders = headerRow.map((cell) => normalizeKey(cell))

  Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
    const headerIndex = normalizedHeaders.findIndex((header) => aliases.includes(header))
    if (headerIndex >= 0) {
      headerMap[field] = headerIndex
    }
  })

  return headerMap
}

function extractMetadata(rows: unknown[][]) {
  const metadata = {
    quotationNo: '',
    clientName: '',
    projectName: '',
    notes: '',
  }

  const candidateLines = rows
    .slice(0, 20)
    .map((row) => row.map((cell) => normalizeText(cell)).filter(Boolean).join(' | '))
    .filter(Boolean)

  for (const line of candidateLines) {
    const lower = line.toLowerCase()

    if (!metadata.quotationNo && (lower.includes('quotation') || lower.includes('quote'))) {
      const match = line.match(/(?:quotation|quote)(?:\s*no|\s*#| number)?\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i)
      if (match) metadata.quotationNo = match[1].trim()
    }

    if (!metadata.clientName && (lower.includes('client') || lower.startsWith('to '))) {
      const match = line.match(/(?:client|to)\s*[:\-]?\s*(.+)$/i)
      if (match) metadata.clientName = match[1].trim()
    }

    if (!metadata.projectName && (lower.includes('project') || lower.includes('site'))) {
      const match = line.match(/(?:project|site)\s*[:\-]?\s*(.+)$/i)
      if (match) metadata.projectName = match[1].trim()
    }
  }

  return metadata
}

function looksLikeSectionRow(row: unknown[]) {
  const srNo = normalizeText(row[1])
  const description = normalizeText(row[2])
  const title = normalizeText(row[1] || row[2])
  const sizeA = normalizeText(row[7])
  const sizeB = normalizeText(row[8])
  const unit = normalizeText(row[9])
  const rate = normalizeText(row[10])
  const total = normalizeText(row[11])

  if (!title) return false
  if (!description && title && !/^\d+$/.test(title)) return true
  if (description && srNo) return false
  if (normalizeKey(title).includes('all below cost would be calculated')) return false

  const occupiedValueColumns = [sizeA, sizeB, unit, rate, total].filter((value) => {
    const normalized = normalizeKey(value)
    return Boolean(normalized) && normalized !== '0' && normalized !== '-'
  })
  return occupiedValueColumns.length === 0 || (occupiedValueColumns.length === 1 && total === '-')
}

function normalizeAreaLabel(value: string) {
  const normalized = normalizeKey(value)
  return AREA_LABEL_MAP[normalized] || normalizeText(value)
}

function inferCategoryFromSection(sectionTitle: string) {
  const normalized = normalizeKey(sectionTitle)
  if (normalized.includes('electrical')) return 'Electrical'
  if (normalized.includes('painting')) return 'Painting'
  if (normalized.includes('pop')) return 'POP'
  return 'Furniture'
}

function isIgnoredDescription(description: string) {
  const normalized = normalizeKey(description)
  return [
    'total amount',
    'interior execution fees supervision designing',
    'terms and conditions',
    'payment details',
  ].includes(normalized)
}

function shouldStopStructuredImport(row: unknown[]) {
  const rowText = row.map((cell) => normalizeKey(cell)).filter(Boolean).join(' ')

  return (
    rowText.includes('terms and conditions') ||
    rowText.includes('payment details') ||
    rowText.includes('a c name') ||
    rowText.includes('axis bank') ||
    rowText.includes('ifsc')
  )
}

function parseStructuredQuotationSheet(rows: unknown[][], fileName: string) {
  const metadata = extractMetadata(rows)
  const warnings: string[] = []
  const items: ImportedQuotationItem[] = []

  let currentSection = ''
  let currentCategory = 'Furniture'

  for (let index = 9; index < rows.length; index += 1) {
    const row = rows[index]
    if (shouldStopStructuredImport(row)) {
      break
    }

    const srNo = normalizeText(row[1])
    const description = normalizeText(row[2])
    const sizeA = asNumber(row[7])
    const sizeB = asNumber(row[8])
    const unit = asNumber(row[9])
    const rate = asNumber(row[10])
    const total = asNumber(row[11])

    if (looksLikeSectionRow(row)) {
      const title = normalizeText(row[1] || row[2])
      if (!title) continue
      currentSection = normalizeAreaLabel(title)
      currentCategory = inferCategoryFromSection(title)
      continue
    }

    if (!description || isIgnoredDescription(description)) {
      continue
    }

    if (!srNo && !total && !rate && !unit) {
      continue
    }

    const area = currentCategory === 'Furniture'
      ? currentSection || 'Living Room'
      : 'Full Flat'

    const quantity = unit > 0 && !sizeA && !sizeB && !rate ? unit : 1
    const inferredRate = !rate && unit > 0 && sizeB > 0 && !sizeA ? unit : rate
    const hasLengthWidth = sizeA > 0 && sizeB > 0
    const lineUnit = hasLengthWidth ? unit || Number((sizeA * sizeB).toFixed(2)) : 0
    const computedTotal = lineUnit > 0 && inferredRate > 0 ? lineUnit * inferredRate : quantity * inferredRate

    items.push({
      area,
      category: currentCategory,
      description,
      quantity: String(quantity || 1),
      lengthIn: hasLengthWidth ? String(sizeA) : '0',
      widthIn: hasLengthWidth ? String(sizeB) : '0',
      rate: String(inferredRate || 0),
      total: Number((total || computedTotal).toFixed(2)),
    })
  }

  if (!metadata.projectName) {
    const fileStem = fileName.replace(/\.[^.]+$/, '')
    metadata.projectName = fileStem
    warnings.push('Project name was not detected in the sheet, so the file name was used as a helper value.')
  }

  if (!metadata.clientName) {
    const titleRow = rows.find((row) => normalizeKey(row[1]) === 'mrs ms')
    const candidate = titleRow ? normalizeText(titleRow[2]) : ''
    if (candidate) {
      metadata.clientName = candidate
    }
  }

  const qnRow = rows.find((row) => normalizeText(row[11]).toLowerCase().includes('qn'))
  const qnValue = qnRow ? normalizeText(qnRow[11]).match(/qn[^0-9a-z]*([a-z0-9\-\/]+)/i)?.[1] : ''
  if (qnValue) {
    metadata.quotationNo = qnValue
  }

  if (items.length === 0) {
    throw new Error('No quotation items were found in the structured sheet.')
  }

  return {
    quotationNo: metadata.quotationNo,
    clientName: metadata.clientName,
    projectName: metadata.projectName,
    notes: metadata.notes,
    items,
    warnings,
  } satisfies ImportedQuotationPayload
}

function buildImportedItem(row: unknown[], headerMap: Record<string, number>): ImportedQuotationItem | null {
  const description = normalizeText(row[headerMap.description])
  const category = normalizeText(row[headerMap.category] ?? 'Furniture')
  const quantity = asNumber(row[headerMap.quantity] ?? 1) || 1
  const lengthFt = asNumber(row[headerMap.lengthIn])
  const widthFt = asNumber(row[headerMap.widthIn])
  const rate = asNumber(row[headerMap.rate])
  const area = normalizeText(row[headerMap.area] ?? (category.toLowerCase() === 'furniture' ? 'Living Room' : 'Full Flat'))

  if (!description) return null

  const sizeSqFt = lengthFt > 0 && widthFt > 0 ? lengthFt * widthFt : 0
  const computedTotal = sizeSqFt > 0 ? sizeSqFt * rate * quantity : quantity * rate
  const fileTotal = asNumber(row[headerMap.total])
  const total = Number((fileTotal || computedTotal).toFixed(2))

  return {
    area,
    category: category || 'Furniture',
    description,
    quantity: String(quantity),
    lengthIn: lengthFt > 0 ? String(lengthFt) : '0',
    widthIn: widthFt > 0 ? String(widthFt) : '0',
    rate: String(rate || 0),
    total,
  }
}

export function parseQuotationImportBuffer(buffer: Buffer, fileName: string) {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    raw: false,
    cellDates: false,
  })

  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) {
    throw new Error('No worksheet found in the uploaded file.')
  }

  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  }) as unknown[][]

  const hasStructuredHeader = rows.some((row) => normalizeKey(row[1]) === 'sr no' && normalizeKey(row[2]) === 'item description')
  if (hasStructuredHeader) {
    return parseStructuredQuotationSheet(rows, fileName)
  }

  const headerRowIndex = findHeaderRow(rows)
  if (headerRowIndex === -1) {
    throw new Error('Could not detect the quotation items table. Please make sure the file has columns like Description, Qty, Length, Width, Rate, or Total.')
  }

  const headerMap = resolveHeaderMap(rows[headerRowIndex] || [])
  if (headerMap.description === undefined) {
    throw new Error('Description column is required in the import file.')
  }

  const items = rows
    .slice(headerRowIndex + 1)
    .map((row) => buildImportedItem(row, headerMap))
    .filter((item): item is ImportedQuotationItem => Boolean(item))

  if (items.length === 0) {
    throw new Error('No quotation items were found in the uploaded file.')
  }

  const metadata = extractMetadata(rows)
  const warnings: string[] = []

  if (headerMap.category === undefined) {
    warnings.push('Category column was not detected. Imported rows defaulted to Furniture.')
  }

  if (headerMap.area === undefined) {
    warnings.push('Area column was not detected. Furniture rows defaulted to Living Room and other rows to Full Flat.')
  }

  if (!metadata.clientName) {
    warnings.push('Client name was not detected automatically. Please select the client in the quotation form.')
  }

  if (!metadata.projectName) {
    warnings.push('Project name was not detected automatically. Please select the project in the quotation form.')
  }

  if (!metadata.quotationNo) {
    warnings.push(`Quotation number was not detected in ${fileName}. A new quotation number will be auto-generated if you leave it empty.`)
  }

  return {
    quotationNo: metadata.quotationNo,
    clientName: metadata.clientName,
    projectName: metadata.projectName,
    notes: metadata.notes,
    items,
    warnings,
  } satisfies ImportedQuotationPayload
}
