import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  AdminLogoutRequestSchema,
  AdminPasswordLoginRequestSchema,
  AdminTokenRefreshRequestSchema,
  buildSuccess,
} from '@repo/contracts'
import type { ApiBindings } from '@/bindings'
import { buildValidationErrorHandler } from '@/auth/http'
import { handleAdminLogout } from '@/auth/services/admin-logout'
import { handleAdminPasswordLogin } from '@/auth/services/admin-password-login'
import { handleAdminTokenRefresh } from '@/auth/services/admin-token-refresh'
import { createApiMeta } from '@/lib/api-meta'

const adminAuthRoute = new Hono<{ Bindings: ApiBindings }>()

// 读这个文件时，可以把它当成“接口目录”。
// 它只负责 4 件事：
// 1. 定义 URL
// 2. 挂请求校验
// 3. 调用对应的 service
// 4. 把 service 返回值包装成统一响应
// 真正的业务流程不要在这里找，分别在下面 3 个 service 文件里：
// - handleAdminPasswordLogin
// - handleAdminTokenRefresh
// - handleAdminLogout
adminAuthRoute.post(
  '/password/login',
  zValidator(
    'json',
    AdminPasswordLoginRequestSchema,
    buildValidationErrorHandler('Invalid admin login payload'),
  ),
  async (c) => {
    const payload = c.req.valid('json')
    const res = await handleAdminPasswordLogin({ c, payload })

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

adminAuthRoute.post(
  '/token/refresh',
  zValidator(
    'json',
    AdminTokenRefreshRequestSchema,
    buildValidationErrorHandler('Invalid admin refresh payload'),
  ),
  async (c) => {
    const payload = c.req.valid('json')
    const res = await handleAdminTokenRefresh({ c, payload })

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

adminAuthRoute.post(
  '/logout',
  zValidator(
    'json',
    AdminLogoutRequestSchema,
    buildValidationErrorHandler('Invalid admin logout payload'),
  ),
  async (c) => {
    const payload = c.req.valid('json')
    const res = await handleAdminLogout({ c, payload })

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

export default adminAuthRoute

