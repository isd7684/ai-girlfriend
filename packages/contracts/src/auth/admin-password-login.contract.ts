import { z } from 'zod'

// 登录接口只接收最小输入：邮箱负责定位账号，密码负责校验本地凭证。
export const AdminPasswordLoginRequestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export type AdminPasswordLoginRequest = z.infer<
  typeof AdminPasswordLoginRequestSchema
>

// 这里抽出 session 结构，是为了让登录成功和刷新成功共用同一份返回类型。
export const AdminAuthSessionSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  app: z.literal('admin'),
  roles: z.array(z.string()),
  expiresAtMs: z.number().int().positive(),
})

export type AdminAuthSession = z.infer<typeof AdminAuthSessionSchema>

// 登录成功除了 access token，还要把 refresh token 和当前 session 基本信息一起返回给 admin BFF。
export const AdminPasswordLoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresInSec: z.number().int().positive(),
  refreshExpiresInSec: z.number().int().positive(),
  session: AdminAuthSessionSchema,
})

export type AdminPasswordLoginResponse = z.infer<
  typeof AdminPasswordLoginResponseSchema
>
