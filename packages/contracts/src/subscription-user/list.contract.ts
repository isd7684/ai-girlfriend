import { z } from 'zod'

export const SubscriptionUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

export const SubscriptionUserListItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string().email(),
  userStatus: z.enum(['active', 'suspended', 'deleted']),
  planId: z.string(),
  planCode: z.string(),
  planName: z.string(),
  planPrice: z.string(),
  planBillingPeriod: z.enum(['month', 'year', 'one_time']),
  assignedAtMs: z.number().int().nonnegative(),
  assignedByUserId: z.string().nullable(),
})

export const SubscriptionUserListResponseSchema = z.object({
  items: z.array(SubscriptionUserListItemSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})

export type SubscriptionUserListQuery = z.infer<typeof SubscriptionUserListQuerySchema>
export type SubscriptionUserListItem = z.infer<typeof SubscriptionUserListItemSchema>
export type SubscriptionUserListResponse = z.infer<typeof SubscriptionUserListResponseSchema>
