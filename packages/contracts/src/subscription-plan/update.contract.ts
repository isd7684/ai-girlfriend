import { z } from 'zod'

export const UpdateSubscriptionPlanRequestSchema = z.object({
  planId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().default(''),
  price: z.string().trim().min(1).max(40),
  billingPeriod: z.enum(['month', 'year', 'one_time']),
  maxAgents: z.number().int().nonnegative(),
  supportsGroupChat: z.boolean(),
  supportsMultiAgentLinkage: z.boolean(),
  supportsDiscoverSquare: z.boolean(),
  supportsAgentTimeEvolution: z.boolean(),
})

export type UpdateSubscriptionPlanRequest = z.infer<typeof UpdateSubscriptionPlanRequestSchema>
