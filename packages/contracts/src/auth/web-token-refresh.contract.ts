import { z } from 'zod'
import { WebAuthSessionSchema } from './web-password-login.contract'

export const WebTokenRefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
})

export type WebTokenRefreshRequest = z.infer<
  typeof WebTokenRefreshRequestSchema
>

export const WebTokenRefreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresInSec: z.number().int().positive(),
  refreshExpiresInSec: z.number().int().positive(),
  session: WebAuthSessionSchema,
})

export type WebTokenRefreshResponse = z.infer<
  typeof WebTokenRefreshResponseSchema
>
