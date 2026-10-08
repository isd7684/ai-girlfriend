import { z } from 'zod'

export const DeleteSubscriptionPlanRequestSchema = z.object({
  planId: z.string().min(1),
})

export type DeleteSubscriptionPlanRequest = z.infer<typeof DeleteSubscriptionPlanRequestSchema>
