import { uuidv7 } from 'uuidv7'
import { eq } from 'drizzle-orm'
import { Hono, type Context } from 'hono'
import {
  BizCode,
  CreateRoleRequestSchema,
  CreateRoleResponseSchema,
  DeleteRoleRequestSchema,
  DisableRoleRequestSchema,
  RoleListResponseSchema,
  buildSuccess,
} from '@repo/contracts'
import { zValidator } from '@hono/zod-validator'
import { authUnauthorizedError } from '@/auth/errors'
import { buildValidationErrorHandler } from '@/auth/http'
import { verifyAccessToken } from '@/auth/jwt'
import { isProtectedRole } from '@/auth/role-policy'
import {
  createRole,
  deleteRole,
  disableRole,
  findRoleById,
  findRoleList,
} from '@/auth/repository'
import type { ApiBindings } from '@/bindings'
import { getDb } from '@/db/client'
import { applications } from '@/db/schema'
import { getApiEnv } from '@/env'
import { createApiMeta } from '@/lib/api-meta'
import { AppError } from '@/lib/app-error'

const roleRoute = new Hono<{ Bindings: ApiBindings }>()

async function requireAdminOwner(c: Context<{ Bindings: ApiBindings }>) {
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
    const claims = await verifyAccessToken({
      token,
      secret: env.JWT_ACCESS_SECRET,
    })

    if (!claims.roles.includes('admin_owner')) {
      throw new AppError(BizCode.AUTH_FORBIDDEN, 'Admin owner role required', 403)
    }

    return claims
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw authUnauthorizedError('Access token is invalid')
  }
}

roleRoute.get('/list', async (c) => {
  await requireAdminOwner(c)

  const roles = await findRoleList(getDb(c.env.DB))
  const res = RoleListResponseSchema.parse({
    items: roles.map((role) => ({
      ...role,
      isProtected: isProtectedRole(role.code),
    })),
  })

  return c.json(buildSuccess(res, createApiMeta()))
})

roleRoute.post(
  '/create',
  zValidator('json', CreateRoleRequestSchema, buildValidationErrorHandler('Invalid role create payload')),
  async (c) => {
    await requireAdminOwner(c)

    const payload = c.req.valid('json')
    const db = getDb(c.env.DB)
    const application = await db
      .select({ id: applications.id })
      .from(applications)
      .where(eq(applications.code, payload.applicationCode))
      .limit(1)
      .get()

    if (!application) {
      throw new AppError(BizCode.COMMON_INVALID_REQUEST, 'Application is invalid', 400)
    }

    try {
      await createRole({
        db,
        id: uuidv7(),
        applicationId: application.id,
        code: payload.code,
        name: payload.name,
        nowMs: Date.now(),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('unique') || message.includes('constraint')) {
        throw new AppError(BizCode.BIZ_CONFLICT, 'Role code already exists', 409)
      }
      throw error
    }

    const res = CreateRoleResponseSchema.parse({
      id: uuidv7(),
    })

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

roleRoute.post(
  '/disable',
  zValidator('json', DisableRoleRequestSchema, buildValidationErrorHandler('Invalid role disable payload')),
  async (c) => {
    await requireAdminOwner(c)

    const payload = c.req.valid('json')
    const db = getDb(c.env.DB)
    const role = await findRoleById(db, payload.roleId)

    if (!role) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, 'Role is not found', 404)
    }

    if (isProtectedRole(role.code)) {
      throw new AppError(BizCode.AUTH_FORBIDDEN, 'Protected role cannot be disabled', 403)
    }

    await disableRole({ db, roleId: payload.roleId, nowMs: Date.now() })

    return c.json(buildSuccess({ success: true }, createApiMeta()))
  },
)

roleRoute.post(
  '/delete',
  zValidator('json', DeleteRoleRequestSchema, buildValidationErrorHandler('Invalid role delete payload')),
  async (c) => {
    await requireAdminOwner(c)

    const payload = c.req.valid('json')
    const db = getDb(c.env.DB)
    const role = await findRoleById(db, payload.roleId)

    if (!role) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, 'Role is not found', 404)
    }

    if (isProtectedRole(role.code)) {
      throw new AppError(BizCode.AUTH_FORBIDDEN, 'Protected role cannot be deleted', 403)
    }

    await deleteRole({ db, roleId: payload.roleId, nowMs: Date.now() })

    return c.json(buildSuccess({ success: true }, createApiMeta()))
  },
)

export default roleRoute
