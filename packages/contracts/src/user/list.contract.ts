import { z } from 'zod'

export const UserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

export const UserListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatarKey: z.string().nullable(),
  roles: z.array(z.string()),
  status: z.enum(['active', 'suspended', 'deleted']),
  createdAtMs: z.number().int().nonnegative(),
  updatedAtMs: z.number().int().nonnegative(),
  lastLoginAtMs: z.number().int().nonnegative().nullable(),
})

export const UserListResponseSchema = z.object({
  items: z.array(UserListItemSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})

export type UserListQuery = z.infer<typeof UserListQuerySchema>
export type UserListItem = z.infer<typeof UserListItemSchema>
export type UserListResponse = z.infer<typeof UserListResponseSchema>
