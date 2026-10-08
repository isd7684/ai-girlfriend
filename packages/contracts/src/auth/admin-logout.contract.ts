import { z } from 'zod'

// logout 走的是当前 refresh token 对应的 session 撤销，所以请求体里只需要 token 本身。
export const AdminLogoutRequestSchema = z.object({
  refreshToken: z.string().min(1),
})

export type AdminLogoutRequest = z.infer<typeof AdminLogoutRequestSchema>

// 前端只需要知道这次登出是否完成，不需要额外业务数据。
export const AdminLogoutResponseSchema = z.object({
  success: z.literal(true),
})

export type AdminLogoutResponse = z.infer<typeof AdminLogoutResponseSchema>
