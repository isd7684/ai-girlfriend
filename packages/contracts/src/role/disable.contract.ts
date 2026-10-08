import { z } from 'zod'

export const DisableRoleRequestSchema = z.object({
  roleId: z.string().min(1),
})

export type DisableRoleRequest = z.infer<typeof DisableRoleRequestSchema>
