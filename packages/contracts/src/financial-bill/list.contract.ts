import { z } from 'zod'

export const FinancialBillListQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})

export const FinancialBillMonthSchema = z.object({
  month: z.string(),
  billCount: z.number().int().nonnegative(),
  paidAmountCents: z.number().int().nonnegative(),
  refundAmountCents: z.number().int().nonnegative(),
  netRevenueCents: z.number().int(),
})

export const FinancialBillListItemSchema = z.object({
  id: z.string(),
  wechatNickname: z.string(),
  email: z.string().email(),
  paidAmountCents: z.number().int().nonnegative(),
  paidAtMs: z.number().int().nonnegative(),
  billingMonth: z.string(),
  isRefunded: z.boolean(),
  refundAmountCents: z.number().int().nonnegative(),
  netRevenueCents: z.number().int(),
  note: z.string().nullable(),
  createdByUserId: z.string().nullable(),
  createdAtMs: z.number().int().nonnegative(),
  updatedAtMs: z.number().int().nonnegative(),
})

export const FinancialBillListResponseSchema = z.object({
  selectedMonth: z.string().nullable(),
  months: z.array(FinancialBillMonthSchema),
  items: z.array(FinancialBillListItemSchema),
  totalPaidAmountCents: z.number().int().nonnegative(),
  totalRefundAmountCents: z.number().int().nonnegative(),
  totalNetRevenueCents: z.number().int(),
})

export type FinancialBillListQuery = z.infer<typeof FinancialBillListQuerySchema>
export type FinancialBillMonth = z.infer<typeof FinancialBillMonthSchema>
export type FinancialBillListItem = z.infer<typeof FinancialBillListItemSchema>
export type FinancialBillListResponse = z.infer<typeof FinancialBillListResponseSchema>
