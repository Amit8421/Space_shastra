export const DEFAULT_EXECUTION_FEE_PERCENT = 6

type QuotationTotalInput = {
  amount?: number | string | null
  executionFeePercent?: number | string | null
  discount?: number | string | null
}

export function getExecutionFeePercent(quotation: Pick<QuotationTotalInput, 'executionFeePercent'>) {
  const value = quotation.executionFeePercent
  if (value === null || value === undefined || value === '') {
    return DEFAULT_EXECUTION_FEE_PERCENT
  }

  const percentage = Number(value)
  return Number.isFinite(percentage) ? percentage : DEFAULT_EXECUTION_FEE_PERCENT
}

export function getQuotationGrandTotal(quotation: QuotationTotalInput) {
  const subtotal = Number(quotation.amount || 0)
  const safeSubtotal = Number.isFinite(subtotal) ? subtotal : 0
  const discountValue = Number(quotation.discount || 0)
  const discount = Number.isFinite(discountValue) ? Math.max(0, discountValue) : 0
  const grandTotal = Math.max(0, safeSubtotal * (1 + getExecutionFeePercent(quotation) / 100) - discount)
  return Math.round((grandTotal + Number.EPSILON) * 100) / 100
}
