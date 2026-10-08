import { z } from 'zod'

export const SetCurrentDefaultAvatarRequestSchema = z.object({
  key: z.string().min(1),
})

export const SetCurrentDefaultAvatarResponseSchema = z.object({
  key: z.string(),
  updatedAtMs: z.number().int().nonnegative(),
})

export type SetCurrentDefaultAvatarRequest = z.infer<typeof SetCurrentDefaultAvatarRequestSchema>
export type SetCurrentDefaultAvatarResponse = z.infer<typeof SetCurrentDefaultAvatarResponseSchema>
