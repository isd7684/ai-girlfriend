import { z } from 'zod'

export const DisableSubscriptionPlanRequestSchema = z.object({
  planId: z.string().min(1),
})

export type DisableSubscriptionPlanRequest = z.infer<typeof DisableSubscriptionPlanRequestSchema>
