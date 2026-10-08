import { z } from 'zod'

export const DeleteFinancialBillRequestSchema = z.object({
  billId: z.string().min(1),
})

export const DeleteFinancialBillResponseSchema = z.object({
  success: z.boolean(),
  id: z.string(),
})

export type DeleteFinancialBillRequest = z.infer<typeof DeleteFinancialBillRequestSchema>
export type DeleteFinancialBillResponse = z.infer<typeof DeleteFinancialBillResponseSchema>
