import { z } from 'zod'

export const CreateRoleRequestSchema = z.object({
  applicationCode: z.enum(['admin', 'web']),
  code: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(120),
})

export const CreateRoleResponseSchema = z.object({
  id: z.string(),
})

export type CreateRoleRequest = z.infer<typeof CreateRoleRequestSchema>
export type CreateRoleResponse = z.infer<typeof CreateRoleResponseSchema>
