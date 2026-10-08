import type { WebLogoutRequest } from '@repo/contracts'
import type { Context } from 'hono'
import type { ApiBindings } from '@/bindings'
import { getDb } from '@/db/client'
import { getApiEnv } from '@/env'
import { refreshTokenInvalidError } from '@/auth/errors'
import { verifyRefreshToken } from '@/auth/jwt'
import { findRefreshTokenForSession, revokeSession } from '@/auth/repository'
import { hashTokenJti } from '@/auth/token-hash'

export async function handleWebLogout(params: {
  c: Context<{ Bindings: ApiBindings }>
  payload: WebLogoutRequest
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

  const currentToken = await findRefreshTokenForSession({
    db: db,
    jtiHash: await hashTokenJti(claims.jti),
    sessionId: claims.sid,
  })

  if (!currentToken || currentToken.applicationCode !== 'web') {
    throw refreshTokenInvalidError()
  }

  await revokeSession({
    db: db,
    sessionId: currentToken.sessionId,
    revokedAtMs: Date.now(),
    reason: 'logout',
  })

  return {
    success: true as const,
  }
}
