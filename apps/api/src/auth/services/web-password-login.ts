import { WebPasswordLoginResponseSchema } from '@repo/contracts'
import type { ApiBindings } from '@/bindings'
import { getDb } from '@/db/client'
import { getApiEnv } from '@/env'
import {
  adminRoleRequiredError,
  authMethodDisabledError,
  invalidCredentialsError,
} from '@/auth/errors'
import { issueTokenPair } from '@/auth/jwt'
import { verifyPasswordHash } from '@/auth/password'
import { getIp, getUserAgent, normalizeEmail } from '@/auth/request-context'
import {
  createWebSession,
  findLoginUserByNormalizedEmail,
  getWebApplicationId,
  getWebRolesForUser,
  insertRefreshToken,
  isPasswordLoginEnabledForWeb,
} from '@/auth/repository'
import { hashTokenJti } from '@/auth/token-hash'
import type { Context } from 'hono'
import type { WebPasswordLoginRequest } from '@repo/contracts'

export async function handleWebPasswordLogin(params: {
  c: Context<{ Bindings: ApiBindings }>
  payload: WebPasswordLoginRequest
}) {
  const { c, payload } = params
  const db = getDb(c.env.DB)
  const env = getApiEnv(c.env)

  if (!(await isPasswordLoginEnabledForWeb(db))) {
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

  if (!isPasswordValid || loginUser.userStatus !== 'active') {
    throw invalidCredentialsError()
  }

  const roles = await getWebRolesForUser(db, loginUser.userId)

  if (!roles.includes('web_user')) {
    throw adminRoleRequiredError()
  }

  const applicationId = await getWebApplicationId(db)
  const nowMs = Date.now()
  const refreshExpiresAtMs = nowMs + env.REFRESH_TOKEN_TTL_SEC * 1000
  const session = await createWebSession({
    db: db,
    userId: loginUser.userId,
    applicationId,
    userAgent: getUserAgent(c),
    ip: getIp(c),
    nowMs,
    expiresAtMs: refreshExpiresAtMs,
    roles,
  })

  const tokenPair = await issueTokenPair({
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

  return WebPasswordLoginResponseSchema.parse({
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    tokenType: 'Bearer',
    expiresInSec: env.ACCESS_TOKEN_TTL_SEC,
    refreshExpiresInSec: env.REFRESH_TOKEN_TTL_SEC,
    session,
  })
}
