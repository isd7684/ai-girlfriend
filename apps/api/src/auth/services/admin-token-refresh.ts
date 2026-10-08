import { AdminTokenRefreshResponseSchema, type AdminTokenRefreshRequest } from '@repo/contracts'
import type { Context } from 'hono'
import type { ApiBindings } from '@/bindings'
import { getDb } from '@/db/client'
import { getApiEnv } from '@/env'
import {
  adminRoleRequiredError,
  refreshTokenInvalidError,
  refreshTokenReplayedError,
  sessionRevokedError,
} from '@/auth/errors'
import { issueAdminTokenPair, verifyRefreshToken } from '@/auth/jwt'
import {
  findRefreshTokenForSession,
  getAdminRolesForUser,
  insertRefreshToken,
  markRefreshTokenUsed,
  revokeSession,
  updateRefreshRotation,
} from '@/auth/repository'
import { hashTokenJti } from '@/auth/token-hash'

// 读 refresh 流程时，重点看两段：
// 1. 旧 refresh token 的合法性检查
// 2. old token -> new token 的 rotation 写入顺序
// 这也是整条认证链里最容易写乱的地方。
export async function handleAdminTokenRefresh(params: {
  c: Context<{ Bindings: ApiBindings }>
  payload: AdminTokenRefreshRequest
}) {
  const { c, payload } = params
  const db = getDb(c.env.DB)
  const env = getApiEnv(c.env)

  let claims

  try {
    claims = await verifyRefreshToken({
      token: payload.refreshToken,
      secret: env.JWT_REFRESH_SECRET,
    })
  } catch {
    throw refreshTokenInvalidError()
  }

  const nowMs = Date.now()
  const jtiHash = await hashTokenJti(claims.jti)
  const currentToken = await findRefreshTokenForSession({
    db: db,
    jtiHash,
    sessionId: claims.sid,
  })

  if (!currentToken || currentToken.applicationCode !== 'admin') {
    throw refreshTokenInvalidError()
  }

  if (currentToken.sessionRevokedAtMs !== null) {
    throw sessionRevokedError()
  }

  if (currentToken.revokedAtMs !== null || currentToken.expiresAtMs <= nowMs) {
    throw refreshTokenInvalidError()
  }

  if (currentToken.usedAtMs !== null) {
    await revokeSession({
      db: db,
      sessionId: currentToken.sessionId,
      revokedAtMs: nowMs,
      reason: 'refresh_token_replay',
    })

    throw refreshTokenReplayedError()
  }

  const markedUsed = await markRefreshTokenUsed({
    db: db,
    tokenId: currentToken.tokenId,
    usedAtMs: nowMs,
  })

  // rotation 先抢占旧 token 的 used 标记，再创建新 token，能把并发刷新压成只有一个成功分支。
  if (!markedUsed) {
    await revokeSession({
      db: db,
      sessionId: currentToken.sessionId,
      revokedAtMs: nowMs,
      reason: 'refresh_token_replay',
    })

    throw refreshTokenReplayedError()
  }

  const roles = await getAdminRolesForUser(db, claims.sub)

  // refresh 时重新查角色，是为了让后台权限变更能在下一次续签时立刻生效。
  if (roles.length === 0) {
    await revokeSession({
      db: db,
      sessionId: currentToken.sessionId,
      revokedAtMs: nowMs,
      reason: 'admin_role_missing',
    })

    throw adminRoleRequiredError()
  }

  const refreshExpiresAtMs = nowMs + env.REFRESH_TOKEN_TTL_SEC * 1000
  const session = {
    sessionId: currentToken.sessionId,
    userId: claims.sub,
    app: 'admin' as const,
    roles,
    expiresAtMs: refreshExpiresAtMs,
  }

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
    sessionId: currentToken.sessionId,
    jtiHash: await hashTokenJti(tokenPair.refreshJti),
    parentTokenId: currentToken.tokenId,
    issuedAtMs: nowMs,
    expiresAtMs: refreshExpiresAtMs,
  })

  await updateRefreshRotation({
    db: db,
    oldTokenId: currentToken.tokenId,
    newTokenId: tokenPair.refreshJti,
    sessionId: currentToken.sessionId,
    lastSeenAtMs: nowMs,
  })

  return AdminTokenRefreshResponseSchema.parse({
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    tokenType: 'Bearer',
    expiresInSec: env.ACCESS_TOKEN_TTL_SEC,
    refreshExpiresInSec: env.REFRESH_TOKEN_TTL_SEC,
    session,
  })
}
