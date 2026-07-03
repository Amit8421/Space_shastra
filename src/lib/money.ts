import { Prisma } from '@prisma/client'

export type DecimalInput = Prisma.Decimal | number | string | null | undefined
export type GstTypeValue = 'NONE' | 'CGST_SGST' | 'IGST'

export const decimal = (value: DecimalInput) => new Prisma.Decimal(value ?? 0)
export const money = (value: DecimalInput) => decimal(value).toDecimalPlaces(2)

export function calculateDocumentTotals(input: {
  subtotal: DecimalInput
  executionFeePercent?: DecimalInput
  gstRate?: DecimalInput
  gstType?: GstTypeValue
}) {
  const subtotal = money(input.subtotal)
  const executionFeePercent = decimal(input.executionFeePercent)
  const executionFeeAmount = money(subtotal.mul(executionFeePercent).div(100))
  const taxableAmount = money(subtotal.add(executionFeeAmount))
  const gstRate = decimal(input.gstRate ?? 18)
  const gstType = input.gstType ?? 'CGST_SGST'
  const taxAmount = gstType === 'NONE' ? money(0) : money(taxableAmount.mul(gstRate).div(100))
  const cgstAmount = gstType === 'CGST_SGST' ? money(taxAmount.div(2)) : money(0)
  const sgstAmount = gstType === 'CGST_SGST' ? money(taxAmount.sub(cgstAmount)) : money(0)
  const igstAmount = gstType === 'IGST' ? taxAmount : money(0)

  return {
    subtotal,
    executionFeePercent,
    executionFeeAmount,
    taxableAmount,
    gstType,
    gstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    amount: money(taxableAmount.add(taxAmount)),
  }
}

export const formatInr = (value: DecimalInput) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(decimal(value).toNumber())
