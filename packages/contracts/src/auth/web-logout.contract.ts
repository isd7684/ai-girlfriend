import { z } from 'zod'

export const WebLogoutRequestSchema = z.object({
  refreshToken: z.string().min(1),
})

export type WebLogoutRequest = z.infer<typeof WebLogoutRequestSchema>

export const WebLogoutResponseSchema = z.object({
  success: z.literal(true),
})

export type WebLogoutResponse = z.infer<typeof WebLogoutResponseSchema>
