import { z } from 'zod'

export const CreateSubscriptionPlanRequestSchema = z.object({
  code: z.string().trim().min(1).max(80),
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

export const CreateSubscriptionPlanResponseSchema = z.object({
  id: z.string(),
})

export type CreateSubscriptionPlanRequest = z.infer<typeof CreateSubscriptionPlanRequestSchema>
export type CreateSubscriptionPlanResponse = z.infer<typeof CreateSubscriptionPlanResponseSchema>
