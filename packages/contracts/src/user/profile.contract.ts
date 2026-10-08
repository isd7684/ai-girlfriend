import { z } from 'zod'

export const UserProfileResponseSchema = z.object({
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

export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>
