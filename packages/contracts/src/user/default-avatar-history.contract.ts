import { z } from 'zod'

export const DefaultAvatarHistoryItemSchema = z.object({
  id: z.string(),
  key: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  createdByUserId: z.string().nullable(),
  createdAtMs: z.number().int().nonnegative(),
})

export const DefaultAvatarHistoryResponseSchema = z.object({
  items: z.array(DefaultAvatarHistoryItemSchema),
})

export type DefaultAvatarHistoryItem = z.infer<typeof DefaultAvatarHistoryItemSchema>
export type DefaultAvatarHistoryResponse = z.infer<typeof DefaultAvatarHistoryResponseSchema>
