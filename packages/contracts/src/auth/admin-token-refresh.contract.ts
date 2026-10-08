import { z } from 'zod'
import { AdminAuthSessionSchema } from './admin-password-login.contract'

// refresh 阶段不再重新提交邮箱密码，只提交当前持有的 refresh token。
export const AdminTokenRefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
})

export type AdminTokenRefreshRequest = z.infer<
  typeof AdminTokenRefreshRequestSchema
>

// 刷新成功后返回一组新的 access/refresh token，并带回最新 session 视图。
export const AdminTokenRefreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresInSec: z.number().int().positive(),
  refreshExpiresInSec: z.number().int().positive(),
  session: AdminAuthSessionSchema,
})

export type AdminTokenRefreshResponse = z.infer<
  typeof AdminTokenRefreshResponseSchema
>
