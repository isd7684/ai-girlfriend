import { z } from 'zod'

export const AssignSubscriptionUserRequestSchema = z.object({
  userId: z.string().trim().min(1),
  planId: z.string().trim().min(1),
})

export const AssignSubscriptionUserResponseSchema = z.object({
  success: z.literal(true),
  userId: z.string(),
  planId: z.string(),
})

export type AssignSubscriptionUserRequest = z.infer<typeof AssignSubscriptionUserRequestSchema>
export type AssignSubscriptionUserResponse = z.infer<typeof AssignSubscriptionUserResponseSchema>
