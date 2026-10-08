import { uuidv7 } from 'uuidv7'
import { Hono, type Context } from 'hono'
import {
  AvatarUploadResponseSchema,
  BizCode,
  CreateUserRequestSchema,
  CreateUserResponseSchema,
  DefaultAvatarHistoryResponseSchema,
  LatestDefaultAvatarResponseSchema,
  SetCurrentDefaultAvatarRequestSchema,
  SetCurrentDefaultAvatarResponseSchema,
  UserListQuerySchema,
  UserListResponseSchema,
  UserProfileResponseSchema,
  buildSuccess,
} from '@repo/contracts'
import { zValidator } from '@hono/zod-validator'
import { authUnauthorizedError } from '@/auth/errors'
import { buildValidationErrorHandler } from '@/auth/http'
import { verifyAccessToken } from '@/auth/jwt'
import { hashPassword } from '@/auth/password'
import { normalizeEmail } from '@/auth/request-context'
import {
  createUserWithPassword,
  findDefaultAvatarHistory,
  findLatestDefaultAvatarVersion,
  findRoleIdByCode,
  findUserList,
  findUserProfileById,
  insertDefaultAvatarVersion,
  updateUserAvatarKey,
} from '@/auth/repository'
import type { ApiBindings } from '@/bindings'
import { getDb } from '@/db/client'
import { getApiEnv } from '@/env'
import { createApiMeta } from '@/lib/api-meta'
import { AppError } from '@/lib/app-error'
import { assertAvatarFile, buildDefaultAvatarKey, buildUserAvatarKey } from '@/lib/avatar-storage'

const userRoute = new Hono<{ Bindings: ApiBindings }>()

async function requireAccessToken(c: Context<{ Bindings: ApiBindings }>, expectedApp: 'admin' | 'web' | Array<'admin' | 'web'>) {
  const authorization = c.req.header('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    throw authUnauthorizedError('Access token is required')
  }

  const token = authorization.slice('Bearer '.length).trim()

  if (!token) {
    throw authUnauthorizedError('Access token is required')
  }

  const env = getApiEnv(c.env)

  try {
    return await verifyAccessToken({
      token,
      secret: env.JWT_ACCESS_SECRET,
      expectedApp,
    })
  } catch {
    throw authUnauthorizedError('Access token is invalid')
  }
}

async function requireAdminAccessToken(c: Context<{ Bindings: ApiBindings }>) {
  return requireAccessToken(c, 'admin')
}

async function requireProfileAccessToken(c: Context<{ Bindings: ApiBindings }>) {
  return requireAccessToken(c, ['admin', 'web'])
}

userRoute.get('/profile', async (c) => {
  const claims = await requireProfileAccessToken(c)
  const profile = await findUserProfileById(getDb(c.env.DB), claims.sub)

  if (!profile) {
    throw authUnauthorizedError('Profile is unavailable')
  }

  const res = UserProfileResponseSchema.parse(profile)

  return c.json(buildSuccess(res, createApiMeta()))
})

userRoute.get('/list', async (c) => {
  await requireAdminAccessToken(c)

  const query = UserListQuerySchema.parse({
    page: c.req.query('page') ?? 1,
    pageSize: c.req.query('pageSize') ?? 10,
  })

  const offset = (query.page - 1) * query.pageSize
  const { items, total } = await findUserList(getDb(c.env.DB), {
    offset,
    limit: query.pageSize,
  })
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.pageSize)
  const res = UserListResponseSchema.parse({
    items,
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages,
  })

  return c.json(buildSuccess(res, createApiMeta()))
})

userRoute.get('/default-avatar/latest', async (c) => {
  await requireAdminAccessToken(c)

  const latestDefaultAvatar = await findLatestDefaultAvatarVersion(getDb(c.env.DB))
  const res = LatestDefaultAvatarResponseSchema.parse({
    key: latestDefaultAvatar?.key ?? null,
    updatedAtMs: latestDefaultAvatar?.updatedAtMs ?? null,
  })

  return c.json(buildSuccess(res, createApiMeta()))
})

userRoute.get('/default-avatar/history', async (c) => {
  await requireAdminAccessToken(c)

  const history = await findDefaultAvatarHistory(getDb(c.env.DB))
  const res = DefaultAvatarHistoryResponseSchema.parse({
    items: history,
  })

  return c.json(buildSuccess(res, createApiMeta()))
})

userRoute.get('/avatar', async (c) => {
  const claims = await requireProfileAccessToken(c)

  const key = c.req.query('key')?.trim()

  if (!key) {
    throw new AppError(BizCode.COMMON_INVALID_REQUEST, 'Avatar key is required', 400)
  }

  const db = getDb(c.env.DB)

  if (claims.app === 'web') {
    const profile = await findUserProfileById(db, claims.sub)

    if (!profile || profile.avatarKey !== key) {
      throw new AppError(BizCode.AUTH_FORBIDDEN, 'Avatar access is forbidden', 403)
    }
  }

  const object = await c.env.AVATAR_BUCKET.get(key)

  if (!object) {
    throw new AppError(BizCode.COMMON_NOT_FOUND, 'Avatar is not found', 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)

  return new Response(object.body, {
    headers,
  })
})

userRoute.post('/profile/avatar', async (c) => {
  const claims = await requireProfileAccessToken(c)

  const formData = await c.req.formData()
  const avatarFile = formData.get('file')

  if (!(avatarFile instanceof File)) {
    throw new AppError(BizCode.COMMON_INVALID_REQUEST, 'Avatar file is required', 400)
  }

  const nowMs = Date.now()
  const avatarKey = buildUserAvatarKey(claims.sub, avatarFile, nowMs)
  const contentType = avatarFile.type
  const extension = assertAvatarFile(avatarFile)

  await c.env.AVATAR_BUCKET.put(avatarKey, await avatarFile.arrayBuffer(), {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
      contentDisposition: `inline; filename="user-avatar.${extension}"`,
    },
  })

  await updateUserAvatarKey({
    db: getDb(c.env.DB),
    userId: claims.sub,
    avatarKey,
    updatedAtMs: nowMs,
  })

  const res = AvatarUploadResponseSchema.parse({
    key: avatarKey,
    updatedAtMs: nowMs,
  })

  return c.json(buildSuccess(res, createApiMeta()))
})

userRoute.post('/default-avatar/upload', async (c) => {
  const claims = await requireAdminAccessToken(c)

  if (!claims.roles.includes('admin_owner')) {
    throw new AppError(BizCode.AUTH_FORBIDDEN, 'Admin owner role required', 403)
  }

  const formData = await c.req.formData()
  const avatarFile = formData.get('file')

  if (!(avatarFile instanceof File)) {
    throw new AppError(BizCode.COMMON_INVALID_REQUEST, 'Avatar file is required', 400)
  }

  const nowMs = Date.now()
  const avatarKey = buildDefaultAvatarKey(avatarFile, nowMs)
  const contentType = avatarFile.type
  const extension = assertAvatarFile(avatarFile)

  await c.env.AVATAR_BUCKET.put(avatarKey, await avatarFile.arrayBuffer(), {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
      contentDisposition: `inline; filename="default-avatar.${extension}"`,
    },
  })

  await insertDefaultAvatarVersion({
    db: getDb(c.env.DB),
    id: uuidv7(),
    key: avatarKey,
    fileName: avatarFile.name,
    contentType,
    sizeBytes: avatarFile.size,
    createdByUserId: claims.sub,
    createdAtMs: nowMs,
  })

  const res = AvatarUploadResponseSchema.parse({
    key: avatarKey,
    updatedAtMs: nowMs,
  })

  return c.json(buildSuccess(res, createApiMeta()))
})

userRoute.post(
  '/default-avatar/set-current',
  zValidator(
    'json',
    SetCurrentDefaultAvatarRequestSchema,
    buildValidationErrorHandler('Invalid default avatar payload'),
  ),
  async (c) => {
    const claims = await requireAdminAccessToken(c)

    if (!claims.roles.includes('admin_owner')) {
      throw new AppError(BizCode.AUTH_FORBIDDEN, 'Admin owner role required', 403)
    }

    const payload = c.req.valid('json')
    const nowMs = Date.now()

    await insertDefaultAvatarVersion({
      db: getDb(c.env.DB),
      id: uuidv7(),
      key: payload.key,
      fileName: payload.key.split('/').pop() ?? payload.key,
      contentType: 'image/*',
      sizeBytes: 0,
      createdByUserId: claims.sub,
      createdAtMs: nowMs,
    })

    const res = SetCurrentDefaultAvatarResponseSchema.parse({
      key: payload.key,
      updatedAtMs: nowMs,
    })

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

userRoute.post(
  '/create',
  zValidator(
    'json',
    CreateUserRequestSchema,
    buildValidationErrorHandler('Invalid user create payload'),
  ),
  async (c) => {
    const claims = await requireAdminAccessToken(c)

    if (!claims.roles.includes('admin_owner')) {
      throw new AppError(BizCode.AUTH_FORBIDDEN, 'Admin owner role required', 403)
    }

    const payload = c.req.valid('json')
    const db = getDb(c.env.DB)
    const normalizedEmail = normalizeEmail(payload.email)
    const roleId = await findRoleIdByCode(db, payload.role)

    if (!roleId) {
      throw new AppError(BizCode.COMMON_INVALID_REQUEST, 'Role is invalid', 400)
    }

    const password = await hashPassword(payload.password)
    const latestDefaultAvatar = await findLatestDefaultAvatarVersion(db)
    const nowMs = Date.now()
    const userId = uuidv7()

    try {
      await createUserWithPassword({
        db,
        userId,
        emailId: uuidv7(),
        credentialId: uuidv7(),
        roleBindingId: uuidv7(),
        roleId,
        displayName: payload.name,
        email: payload.email,
        normalizedEmail,
        passwordHash: password.passwordHash,
        passwordAlgo: password.passwordAlgo,
        avatarKey: latestDefaultAvatar?.key ?? null,
        nowMs,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : ''

      if (message.includes('unique') || message.includes('constraint')) {
        throw new AppError(BizCode.BIZ_CONFLICT, 'Email already exists', 409)
      }

      throw error
    }

    const res = CreateUserResponseSchema.parse({
      id: userId,
      avatarKey: latestDefaultAvatar?.key ?? null,
    })

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

export default userRoute
