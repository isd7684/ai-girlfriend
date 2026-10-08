import { AdminPasswordLoginResponseSchema } from '@repo/contracts'
import type { ApiBindings } from '@/bindings'
import { getDb } from '@/db/client'
import { getApiEnv } from '@/env'
import {
  adminRoleRequiredError,
  authMethodDisabledError,
  invalidCredentialsError,
} from '@/auth/errors'
import { issueAdminTokenPair } from '@/auth/jwt'
import { verifyPasswordHash } from '@/auth/password'
import { getIp, getUserAgent, normalizeEmail } from '@/auth/request-context'
import {
  createAdminSession,
  findLoginUserByNormalizedEmail,
  getAdminApplicationId,
  getAdminRolesForUser,
  insertRefreshToken,
  isPasswordLoginEnabledForAdmin,
} from '@/auth/repository'
import { hashTokenJti } from '@/auth/token-hash'
import type { Context } from 'hono'
import type { AdminPasswordLoginRequest } from '@repo/contracts'

// 读登录流程时，按下面顺序看就够了：
// 1. 这个 service：业务编排顺序
// 2. repository.ts：每一步查/写了哪些表
// 3. jwt.ts：token 里到底签了什么 claims
export async function handleAdminPasswordLogin(params: {
  c: Context<{ Bindings: ApiBindings }>
  payload: AdminPasswordLoginRequest
}) {
  const { c, payload } = params
  const db = getDb(c.env.DB)
  const env = getApiEnv(c.env)

  // 第一步先看 admin 当前策略是否允许 password 登录，不让被禁用的登录方式继续往下碰用户数据。
  if (!(await isPasswordLoginEnabledForAdmin(db))) {
    throw authMethodDisabledError()
  }

  const normalizedEmail = normalizeEmail(payload.email)
  const loginUser = await findLoginUserByNormalizedEmail(db, normalizedEmail)

  if (!loginUser) {
    throw invalidCredentialsError()
  }

  const isPasswordValid = await verifyPasswordHash({
    password: payload.password,
    passwordHash: loginUser.passwordHash,
    passwordAlgo: loginUser.passwordAlgo,
  })

  // 这里把“密码错误”和“用户状态异常”统一收敛成同一个错误，避免给外部暴露过细的账号状态信息。
  if (!isPasswordValid || loginUser.userStatus !== 'active') {
    throw invalidCredentialsError()
  }

  const roles = await getAdminRolesForUser(db, loginUser.userId)

  // 后台登录除了证明“你是谁”，还必须证明“你能不能进入 admin”。
  if (roles.length === 0) {
    throw adminRoleRequiredError()
  }

  const applicationId = await getAdminApplicationId(db)
  const nowMs = Date.now()
  const refreshExpiresAtMs = nowMs + env.REFRESH_TOKEN_TTL_SEC * 1000
  const session = await createAdminSession({
    db: db,
    userId: loginUser.userId,
    applicationId,
    userAgent: getUserAgent(c),
    ip: getIp(c),
    nowMs,
    expiresAtMs: refreshExpiresAtMs,
    roles,
  })

  const tokenPair = await issueAdminTokenPair({
    session,
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtlSec: env.ACCESS_TOKEN_TTL_SEC,
    refreshTtlSec: env.REFRESH_TOKEN_TTL_SEC,
  })

  await insertRefreshToken({
    db: db,
    tokenId: tokenPair.refreshJti,
    sessionId: session.sessionId,
    jtiHash: await hashTokenJti(tokenPair.refreshJti),
    parentTokenId: null,
    issuedAtMs: nowMs,
    expiresAtMs: refreshExpiresAtMs,
  })

  return AdminPasswordLoginResponseSchema.parse({
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    tokenType: 'Bearer',
    expiresInSec: env.ACCESS_TOKEN_TTL_SEC,
    refreshExpiresInSec: env.REFRESH_TOKEN_TTL_SEC,
    session,
  })
}
