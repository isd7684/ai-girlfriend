import { z } from 'zod'

export const SubscriptionPlanListItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.string(),
  billingPeriod: z.enum(['month', 'year', 'one_time']),
  maxAgents: z.number().int().nonnegative(),
  supportsGroupChat: z.boolean(),
  supportsMultiAgentLinkage: z.boolean(),
  supportsDiscoverSquare: z.boolean(),
  supportsAgentTimeEvolution: z.boolean(),
  status: z.enum(['active', 'disabled', 'deleted']),
  createdAtMs: z.number().int().nonnegative(),
  updatedAtMs: z.number().int().nonnegative(),
  deletedAtMs: z.number().int().nonnegative().nullable(),
})

export const SubscriptionPlanListResponseSchema = z.object({
  items: z.array(SubscriptionPlanListItemSchema),
})

export type SubscriptionPlanListItem = z.infer<typeof SubscriptionPlanListItemSchema>
export type SubscriptionPlanListResponse = z.infer<typeof SubscriptionPlanListResponseSchema>
