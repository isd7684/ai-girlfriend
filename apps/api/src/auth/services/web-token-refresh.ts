import { WebTokenRefreshResponseSchema, type WebTokenRefreshRequest } from '@repo/contracts'
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
import { issueTokenPair, verifyRefreshToken } from '@/auth/jwt'
import {
  findRefreshTokenForSession,
  getWebRolesForUser,
  insertRefreshToken,
  markRefreshTokenUsed,
  revokeSession,
  updateRefreshRotation,
} from '@/auth/repository'
import { hashTokenJti } from '@/auth/token-hash'

export async function handleWebTokenRefresh(params: {
  c: Context<{ Bindings: ApiBindings }>
  payload: WebTokenRefreshRequest
}) {
  const { c, payload } = params
  const db = getDb(c.env.DB)
  const env = getApiEnv(c.env)

  let claims

  try {
    claims = await verifyRefreshToken({
      token: payload.refreshToken,
      secret: env.JWT_REFRESH_SECRET,
      expectedApp: 'web',
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

  if (!currentToken || currentToken.applicationCode !== 'web') {
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

  if (!markedUsed) {
    await revokeSession({
      db: db,
      sessionId: currentToken.sessionId,
      revokedAtMs: nowMs,
      reason: 'refresh_token_replay',
    })

    throw refreshTokenReplayedError()
  }

  const roles = await getWebRolesForUser(db, claims.sub)

  if (!roles.includes('web_user')) {
    await revokeSession({
      db: db,
      sessionId: currentToken.sessionId,
      revokedAtMs: nowMs,
      reason: 'web_role_missing',
    })

    throw adminRoleRequiredError()
  }

  const refreshExpiresAtMs = nowMs + env.REFRESH_TOKEN_TTL_SEC * 1000
  const session = {
    sessionId: currentToken.sessionId,
    userId: claims.sub,
    app: 'web' as const,
    roles,
    expiresAtMs: refreshExpiresAtMs,
  }

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

  return WebTokenRefreshResponseSchema.parse({
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    tokenType: 'Bearer',
    expiresInSec: env.ACCESS_TOKEN_TTL_SEC,
    refreshExpiresInSec: env.REFRESH_TOKEN_TTL_SEC,
    session,
  })
}
