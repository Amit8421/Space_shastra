const EXCLUDED_FIELD_NAMES = new Set([
  'email',
  'phone',
  'clientId',
  'vendorId',
  'projectId',
  'status',
  'type',
  'date',
  'amount',
  'openingBalance',
  'purchaseNo',
  'invoiceNo',
  'quotationNo',
  'quantity',
  'lengthIn',
  'widthIn',
  'rate',
  'unitPrice',
])

export function normalizeCapitalizedText(value: string) {
  if (!value) return value

  const firstNonSpaceIndex = value.search(/\S/)
  if (firstNonSpaceIndex === -1) return value

  const leadingWhitespace = value.slice(0, firstNonSpaceIndex)
  const content = value.slice(firstNonSpaceIndex)

  return `${leadingWhitespace}${content.charAt(0).toUpperCase()}${content.slice(1).toLowerCase()}`
}

export function normalizeTextField(value: string): string
export function normalizeTextField<T>(value: T): T
export function normalizeTextField<T>(value: T): T {
  return (typeof value === 'string' ? normalizeCapitalizedText(value) : value) as T
}

export function normalizeTextFields<T extends Record<string, any>>(
  input: T,
  fields: Array<keyof T>
) {
  return fields.reduce((acc, field) => {
    if (field in acc) {
      acc[field] = normalizeTextField(acc[field])
    }
    return acc
  }, { ...input })
}

export function shouldNormalizeTextInput(
  target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
) {
  const fieldName = target.name || ''

  if (EXCLUDED_FIELD_NAMES.has(fieldName)) {
    return false
  }

  if (target instanceof HTMLTextAreaElement) {
    return true
  }

  return target instanceof HTMLInputElement && target.type === 'text'
}

export function getNormalizedFieldValue(
  target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
) {
  return shouldNormalizeTextInput(target)
    ? normalizeCapitalizedText(target.value)
    : target.value
}
