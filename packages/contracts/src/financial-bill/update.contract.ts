import { z } from 'zod'
import { FinancialBillPayloadSchema } from './create.contract'

export const UpdateFinancialBillRequestSchema = FinancialBillPayloadSchema.extend({
  billId: z.string().min(1),
}).refine((value) => value.refundAmountCents <= value.paidAmountCents, {
  message: 'Refund amount cannot exceed paid amount',
  path: ['refundAmountCents'],
}).refine((value) => value.isRefunded || value.refundAmountCents === 0, {
  message: 'Refund amount must be 0 when the bill is not refunded',
  path: ['refundAmountCents'],
})

export const UpdateFinancialBillResponseSchema = z.object({
  success: z.boolean(),
  id: z.string(),
})

export type UpdateFinancialBillRequest = z.infer<typeof UpdateFinancialBillRequestSchema>
export type UpdateFinancialBillResponse = z.infer<typeof UpdateFinancialBillResponseSchema>
