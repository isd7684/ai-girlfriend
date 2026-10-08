import { z } from 'zod'

export const WebPasswordLoginRequestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export type WebPasswordLoginRequest = z.infer<
  typeof WebPasswordLoginRequestSchema
>

export const WebAuthSessionSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  app: z.literal('web'),
  roles: z.array(z.string()),
  expiresAtMs: z.number().int().positive(),
})

export type WebAuthSession = z.infer<typeof WebAuthSessionSchema>

export const WebPasswordLoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresInSec: z.number().int().positive(),
  refreshExpiresInSec: z.number().int().positive(),
  session: WebAuthSessionSchema,
})

export type WebPasswordLoginResponse = z.infer<
  typeof WebPasswordLoginResponseSchema
>
