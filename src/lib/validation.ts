import { z } from 'zod'

const optionalText = z.string().trim().max(2000).optional().nullable()
const requiredText = z.string().trim().min(1, 'This field is required.').max(500)
const id = z.string().trim().min(1)
const decimalString = z.union([z.string(), z.number()]).transform((value, context) => {
  const normalized = typeof value === 'number' ? value.toString() : value.trim()
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid amount with at most 2 decimal places.' })
    return z.NEVER
  }
  return normalized
})
const nonNegativeMoney = decimalString.refine((value) => Number(value) >= 0, 'Amount cannot be negative.')

export const loginSchema = z.object({
  firm: z.string().trim().toLowerCase().min(2).max(80),
  username: z.string().trim().toLowerCase().min(2).max(80),
  password: z.string().min(8).max(200),
})

export const userSchema = z.object({
  firmId: z.string().optional(),
  username: z.string().trim().toLowerCase().min(2).max(80),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
  name: requiredText,
  password: z.string().min(10).max(200),
  role: z.enum(['ADMIN', 'MANAGER', 'VIEWER']),
})

export const firmSchema = z.object({
  name: requiredText,
  slug: z.string().trim().toLowerCase().min(2).max(80).regex(/^[a-z0-9-]+$/, 'Use only lowercase letters, numbers, and hyphens.'),
  adminUsername: z.string().trim().toLowerCase().min(2).max(80),
  adminName: requiredText.default('Administrator'),
  adminPassword: z.string().min(10).max(200).optional(),
})

export const invoiceItemSchema = z.object({
  description: requiredText,
  quantity: z.coerce.number().positive(),
  unitPrice: nonNegativeMoney,
})

export const gstFieldsSchema = z.object({
  gstType: z.enum(['NONE', 'CGST_SGST', 'IGST']).default('CGST_SGST'),
  gstRate: z.preprocess((value) => value ?? 18, z.coerce.number().min(0).max(100, 'GST rate must be between 0 and 100.')),
  placeOfSupply: optionalText,
})

export const invoiceSchema = z.object({
  invoiceNo: z.string().trim().min(1, 'Invoice number is required.').max(100),
  clientId: id,
  projectId: id,
  issueDate: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled']).default('pending'),
  notes: optionalText,
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice item is required.'),
}).and(gstFieldsSchema)

export const quotationItemSchema = z.object({
  id: z.string().optional(),
  description: requiredText,
  quantity: z.coerce.number().positive(),
  area: requiredText,
  category: requiredText,
  lengthCm: z.coerce.number().nonnegative().optional().nullable(),
  widthCm: z.coerce.number().nonnegative().optional().nullable(),
  areaSqFt: z.coerce.number().nonnegative().optional().nullable(),
  rate: nonNegativeMoney.optional().nullable(),
  total: nonNegativeMoney.optional(),
})

export const quotationSchema = z.object({
  quotationNo: z.string().trim().min(1, 'Quotation number is required.').max(100),
  clientId: id,
  projectId: id,
  issueDate: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).default('draft'),
  notes: optionalText,
  executionFeePercent: z.union([z.string(), z.number()]).transform(Number).refine((value) => value >= 0 && value <= 100),
  items: z.array(quotationItemSchema).min(1, 'At least one quotation item is required.'),
}).and(gstFieldsSchema)

export function validationError(error: z.ZodError) {
  return {
    error: 'Please correct the highlighted fields.',
    fields: error.flatten().fieldErrors,
  }
}
