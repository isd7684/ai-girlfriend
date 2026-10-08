import { z } from 'zod'

export const LatestDefaultAvatarResponseSchema = z.object({
  key: z.string().nullable(),
  updatedAtMs: z.number().int().nonnegative().nullable(),
})

export const AvatarUploadResponseSchema = z.object({
  key: z.string(),
  updatedAtMs: z.number().int().nonnegative(),
})

export type LatestDefaultAvatarResponse = z.infer<typeof LatestDefaultAvatarResponseSchema>
export type AvatarUploadResponse = z.infer<typeof AvatarUploadResponseSchema>
