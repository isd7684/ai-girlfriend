import { uuidv7 } from 'uuidv7'
import {
  BizCode,
  WebGithubAuthUrlResponseSchema,
  WebGithubTicketLoginResponseSchema,
} from '@repo/contracts'
import type { Context } from 'hono'
import type { ApiBindings } from '@/bindings'
import { getDb } from '@/db/client'
import { getApiEnv } from '@/env'
import { adminRoleRequiredError, authMethodDisabledError, authUnauthorizedError } from '@/auth/errors'
import { issueTokenPair } from '@/auth/jwt'
import { getIp, getUserAgent, normalizeEmail } from '@/auth/request-context'
import {
  consumeOauthLoginTicket,
  createGithubWebUser,
  createWebSession,
  ensureUserHasRole,
  findPrimaryEmailIdByUserId,
  findRoleIdByCode,
  findUserByNormalizedEmail,
  findUserProfileById,
  findWebUserByGithubAccount,
  getWebApplicationId,
  getWebRolesForUser,
  insertOauthLoginTicket,
  insertRefreshToken,
  isGithubLoginEnabledForWeb,
  linkGithubAccountToUser,
  updateUserAvatarKey,
} from '@/auth/repository'
import { hashTokenJti } from '@/auth/token-hash'
import { AppError } from '@/lib/app-error'
import { assertAvatarFile, buildUserAvatarKey } from '@/lib/avatar-storage'

const githubAuthorizeUrl = 'https://github.com/login/oauth/authorize'
const githubAccessTokenUrl = 'https://github.com/login/oauth/access_token'
const githubUserUrl = 'https://api.github.com/user'
const githubUserEmailsUrl = 'https://api.github.com/user/emails'
const oauthTicketTtlMs = 2 * 60 * 1000

type GithubEmail = {
  email: string
  primary: boolean
  verified: boolean
  visibility: string | null
}

type GithubUser = {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string | null
}

function getGithubOAuthConfig(c: Context<{ Bindings: ApiBindings }>) {
  const env = getApiEnv(c.env)

  if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET) {
    throw authMethodDisabledError('GitHub login is not configured')
  }

  return {
    env,
    clientId: env.GITHUB_OAUTH_CLIENT_ID,
    clientSecret: env.GITHUB_OAUTH_CLIENT_SECRET,
    callbackUrl: env.GITHUB_OAUTH_CALLBACK_URL ?? new URL('/auth/web/github/callback', c.req.url).toString(),
  }
}

function base64UrlEncode(input: Uint8Array) {
  let binary = ''

  for (const value of input) {
    binary += String.fromCharCode(value)
  }

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

async function signStatePayload(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))

  return base64UrlEncode(new Uint8Array(signature))
}

async function createOAuthState(secret: string) {
  const nonce = uuidv7()
  const issuedAtMs = Date.now()
  const payload = `${nonce}.${issuedAtMs}`
  const signature = await signStatePayload(payload, secret)

  return `${payload}.${signature}`
}

async function verifyOAuthState(state: string, secret: string) {
  const parts = state.split('.')

  if (parts.length !== 3) {
    throw authUnauthorizedError('GitHub state is invalid')
  }

  const nonce = parts[0]
  const issuedAtValue = parts[1]
  const signature = parts[2]
  const issuedAtMs = Number(issuedAtValue)

  if (!nonce || !signature || !Number.isFinite(issuedAtMs) || Date.now() - issuedAtMs > 10 * 60 * 1000) {
    throw authUnauthorizedError('GitHub state is expired')
  }

  const expectedSignature = await signStatePayload(`${nonce}.${issuedAtMs}`, secret)

  if (signature !== expectedSignature) {
    throw authUnauthorizedError('GitHub state is invalid')
  }
}

async function fetchGithubAccessToken(params: {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
}) {
  const response = await fetch(githubAccessTokenUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
    }),
  })
  const payload = await response.json() as {
    access_token?: string
    error?: string
    error_description?: string
  }

  if (!response.ok || !payload.access_token) {
    throw new AppError(
      BizCode.AUTH_UNAUTHORIZED,
      payload.error_description ?? 'GitHub authorization failed',
      401,
    )
  }

  return payload.access_token
}

async function fetchGithubJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${accessToken}`,
      'user-agent': 'ai-agent-web',
      'x-github-api-version': '2022-11-28',
    },
  })

  if (!response.ok) {
    throw new AppError(BizCode.AUTH_UNAUTHORIZED, 'Unable to read GitHub profile', 401)
  }

  return await response.json() as T
}

function pickVerifiedGithubEmail(user: GithubUser, emails: GithubEmail[]) {
  const primaryEmail = emails.find((item) => item.primary && item.verified)
  const firstVerifiedEmail = emails.find((item) => item.verified)
  const fallbackEmail = user.email ? { email: user.email, verified: true } : null
  const selectedEmail = primaryEmail ?? firstVerifiedEmail ?? fallbackEmail

  if (!selectedEmail?.email) {
    throw new AppError(BizCode.AUTH_UNAUTHORIZED, 'GitHub account has no verified email', 401)
  }

  return selectedEmail.email
}

async function syncGithubAvatarIfMissing(params: {
  c: Context<{ Bindings: ApiBindings }>
  userId: string
  avatarUrl: string | null
}) {
  const { c, userId, avatarUrl } = params

  if (!avatarUrl) {
    return
  }

  const db = getDb(c.env.DB)
  const profile = await findUserProfileById(db, userId)

  if (!profile || profile.avatarKey) {
    return
  }

  try {
    const response = await fetch(avatarUrl, {
      headers: {
        accept: 'image/jpeg,image/png,image/webp',
        'user-agent': 'ai-agent-web',
      },
    })

    if (!response.ok) {
      return
    }

    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()

    if (!contentType) {
      return
    }

    const avatarBytes = await response.arrayBuffer()
    const avatarFile = new File([avatarBytes], 'github-avatar', { type: contentType })
    const extension = assertAvatarFile(avatarFile)
    const nowMs = Date.now()
    const avatarKey = buildUserAvatarKey(userId, avatarFile, nowMs)

    await c.env.AVATAR_BUCKET.put(avatarKey, avatarBytes, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
        contentDisposition: `inline; filename="github-avatar.${extension}"`,
      },
    })

    await updateUserAvatarKey({
      db,
      userId,
      avatarKey,
      updatedAtMs: nowMs,
    })
  } catch (error) {
    console.warn('Unable to sync GitHub avatar', error)
  }
}

async function resolveGithubWebUser(params: {
  c: Context<{ Bindings: ApiBindings }>
  githubUser: GithubUser
  email: string
}) {
  const db = getDb(params.c.env.DB)
  const nowMs = Date.now()
  const providerUserId = String(params.githubUser.id)
  const providerLogin = params.githubUser.login || null
  const existingGithubUser = await findWebUserByGithubAccount(db, providerUserId)

  if (existingGithubUser) {
    if (existingGithubUser.userStatus !== 'active') {
      throw authUnauthorizedError('GitHub account is not available')
    }

    return existingGithubUser.userId
  }

  const normalizedEmail = normalizeEmail(params.email)
  const existingEmailUser = await findUserByNormalizedEmail(db, normalizedEmail)
  const webRoleId = await findRoleIdByCode(db, 'web_user')

  if (!webRoleId) {
    throw adminRoleRequiredError()
  }

  if (existingEmailUser) {
    if (existingEmailUser.userStatus !== 'active') {
      throw authUnauthorizedError('GitHub account is not available')
    }

    await linkGithubAccountToUser({
      db,
      oauthAccountId: uuidv7(),
      userId: existingEmailUser.userId,
      emailId: existingEmailUser.emailId,
      providerUserId,
      providerLogin,
      nowMs,
    })
    await ensureUserHasRole({
      db,
      bindingId: uuidv7(),
      userId: existingEmailUser.userId,
      roleId: webRoleId,
      nowMs,
    })

    return existingEmailUser.userId
  }

  const userId = uuidv7()
  const emailId = uuidv7()
  const displayName = params.githubUser.name?.trim() || params.githubUser.login || params.email

  await createGithubWebUser({
    db,
    userId,
    emailId,
    oauthAccountId: uuidv7(),
    roleBindingId: uuidv7(),
    webRoleId,
    email: params.email,
    normalizedEmail,
    displayName,
    providerUserId,
    providerLogin,
    nowMs,
  })

  return userId
}

async function issueWebSessionForUser(params: {
  c: Context<{ Bindings: ApiBindings }>
  userId: string
}) {
  const { c, userId } = params
  const db = getDb(c.env.DB)
  const env = getApiEnv(c.env)
  const roles = await getWebRolesForUser(db, userId)

  if (!roles.includes('web_user')) {
    const webRoleId = await findRoleIdByCode(db, 'web_user')

    if (!webRoleId) {
      throw adminRoleRequiredError()
    }

    await ensureUserHasRole({
      db,
      bindingId: uuidv7(),
      userId,
      roleId: webRoleId,
      nowMs: Date.now(),
    })
  }

  const nextRoles = roles.includes('web_user') ? roles : await getWebRolesForUser(db, userId)
  const applicationId = await getWebApplicationId(db)
  const nowMs = Date.now()
  const refreshExpiresAtMs = nowMs + env.REFRESH_TOKEN_TTL_SEC * 1000
  const session = await createWebSession({
    db,
    userId,
    applicationId,
    userAgent: getUserAgent(c),
    ip: getIp(c),
    nowMs,
    expiresAtMs: refreshExpiresAtMs,
    roles: nextRoles,
  })
  const tokenPair = await issueTokenPair({
    session,
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtlSec: env.ACCESS_TOKEN_TTL_SEC,
    refreshTtlSec: env.REFRESH_TOKEN_TTL_SEC,
  })

  await insertRefreshToken({
    db,
    tokenId: tokenPair.refreshJti,
    sessionId: session.sessionId,
    jtiHash: await hashTokenJti(tokenPair.refreshJti),
    parentTokenId: null,
    issuedAtMs: nowMs,
    expiresAtMs: refreshExpiresAtMs,
  })

  return WebGithubTicketLoginResponseSchema.parse({
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    tokenType: 'Bearer',
    expiresInSec: env.ACCESS_TOKEN_TTL_SEC,
    refreshExpiresInSec: env.REFRESH_TOKEN_TTL_SEC,
    session,
  })
}

export async function buildWebGithubAuthUrl(c: Context<{ Bindings: ApiBindings }>) {
  const db = getDb(c.env.DB)

  if (!(await isGithubLoginEnabledForWeb(db))) {
    throw authMethodDisabledError('GitHub login is disabled')
  }

  const { env, clientId, callbackUrl } = getGithubOAuthConfig(c)
  const state = await createOAuthState(env.JWT_REFRESH_SECRET)
  const url = new URL(githubAuthorizeUrl)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', callbackUrl)
  url.searchParams.set('scope', 'read:user user:email')
  url.searchParams.set('state', state)
  url.searchParams.set('allow_signup', 'true')

  return WebGithubAuthUrlResponseSchema.parse({
    url: url.toString(),
    state,
  })
}

export async function handleWebGithubCallback(c: Context<{ Bindings: ApiBindings }>) {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')
  const errorDescription = c.req.query('error_description')
  const { env, clientId, clientSecret, callbackUrl } = getGithubOAuthConfig(c)
  const callbackResultUrl = new URL('/login/github/callback', env.WEB_ORIGIN)

  if (error) {
    callbackResultUrl.searchParams.set('error', errorDescription ?? error)
    return c.redirect(callbackResultUrl.toString())
  }

  if (!code || !state) {
    callbackResultUrl.searchParams.set('error', 'GitHub callback payload is invalid')
    return c.redirect(callbackResultUrl.toString())
  }

  try {
    await verifyOAuthState(state, env.JWT_REFRESH_SECRET)

    const accessToken = await fetchGithubAccessToken({
      code,
      clientId,
      clientSecret,
      redirectUri: callbackUrl,
    })
    const [githubUser, githubEmails] = await Promise.all([
      fetchGithubJson<GithubUser>(githubUserUrl, accessToken),
      fetchGithubJson<GithubEmail[]>(githubUserEmailsUrl, accessToken),
    ])
    const email = pickVerifiedGithubEmail(githubUser, githubEmails)
    const userId = await resolveGithubWebUser({ c, githubUser, email })
    await syncGithubAvatarIfMissing({ c, userId, avatarUrl: githubUser.avatar_url })
    const db = getDb(c.env.DB)
    const applicationId = await getWebApplicationId(db)
    const ticket = uuidv7()
    const nowMs = Date.now()

    await insertOauthLoginTicket({
      db,
      id: uuidv7(),
      ticketHash: await hashTokenJti(ticket),
      userId,
      applicationId,
      provider: 'github',
      createdAtMs: nowMs,
      expiresAtMs: nowMs + oauthTicketTtlMs,
    })

    callbackResultUrl.searchParams.set('ticket', ticket)
    callbackResultUrl.searchParams.set('state', state)
  } catch (oauthError) {
    callbackResultUrl.searchParams.set(
      'error',
      oauthError instanceof Error ? oauthError.message : 'GitHub login failed',
    )
  }

  return c.redirect(callbackResultUrl.toString())
}

export async function handleWebGithubTicketLogin(params: {
  c: Context<{ Bindings: ApiBindings }>
  ticket: string
}) {
  const db = getDb(params.c.env.DB)
  const ticket = await consumeOauthLoginTicket({
    db,
    ticketHash: await hashTokenJti(params.ticket),
    provider: 'github',
    nowMs: Date.now(),
  })

  if (!ticket) {
    throw authUnauthorizedError('GitHub login ticket is invalid')
  }

  const primaryEmailId = await findPrimaryEmailIdByUserId(db, ticket.userId)

  if (!primaryEmailId) {
    throw authUnauthorizedError('GitHub account profile is unavailable')
  }

  return issueWebSessionForUser({
    c: params.c,
    userId: ticket.userId,
  })
}
