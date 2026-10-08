import { z } from 'zod'

export const DeleteRoleRequestSchema = z.object({
  roleId: z.string().min(1),
})

export type DeleteRoleRequest = z.infer<typeof DeleteRoleRequestSchema>
