import { z } from 'zod'

export const RoleListItemSchema = z.object({
  id: z.string(),
  applicationCode: z.string(),
  code: z.string(),
  name: z.string(),
  status: z.enum(['active', 'disabled', 'deleted']),
  isProtected: z.boolean(),
  createdAtMs: z.number().int().nonnegative(),
  updatedAtMs: z.number().int().nonnegative(),
  disabledAtMs: z.number().int().nonnegative().nullable(),
  deletedAtMs: z.number().int().nonnegative().nullable(),
})

export const RoleListResponseSchema = z.object({
  items: z.array(RoleListItemSchema),
})

export type RoleListItem = z.infer<typeof RoleListItemSchema>
export type RoleListResponse = z.infer<typeof RoleListResponseSchema>
