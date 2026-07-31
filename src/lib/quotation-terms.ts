import { normalizeTextField } from '@/lib/text-format'

const MAX_QUOTATION_TERMS = 100
const MAX_TERM_LENGTH = 2000

export function normalizeQuotationTerms(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined

  return value
    .slice(0, MAX_QUOTATION_TERMS)
    .map((term) => normalizeTextField(String(term)).trim().slice(0, MAX_TERM_LENGTH))
    .filter(Boolean)
}
