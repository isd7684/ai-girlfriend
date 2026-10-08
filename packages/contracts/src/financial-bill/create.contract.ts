import { z } from 'zod'

export const FinancialBillPayloadSchema = z.object({
  wechatNickname: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  paidAmountCents: z.number().int().nonnegative(),
  paidAtMs: z.number().int().nonnegative(),
  billingMonth: z.string().regex(/^\d{4}-\d{2}$/),
  isRefunded: z.boolean().default(false),
  refundAmountCents: z.number().int().nonnegative().default(0),
  note: z.string().trim().max(500).optional().default(''),
})

export const CreateFinancialBillRequestSchema = FinancialBillPayloadSchema.refine((value) => value.refundAmountCents <= value.paidAmountCents, {
  message: 'Refund amount cannot exceed paid amount',
  path: ['refundAmountCents'],
}).refine((value) => value.isRefunded || value.refundAmountCents === 0, {
  message: 'Refund amount must be 0 when the bill is not refunded',
  path: ['refundAmountCents'],
})

export const CreateFinancialBillResponseSchema = z.object({
  id: z.string(),
})

export type CreateFinancialBillRequest = z.infer<typeof CreateFinancialBillRequestSchema>
export type CreateFinancialBillResponse = z.infer<typeof CreateFinancialBillResponseSchema>
