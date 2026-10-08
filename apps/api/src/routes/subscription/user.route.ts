import { uuidv7 } from 'uuidv7'
import { Hono, type Context } from 'hono'
import {
  AssignSubscriptionUserRequestSchema,
  AssignSubscriptionUserResponseSchema,
  BizCode,
  SubscriptionUserListQuerySchema,
  SubscriptionUserListResponseSchema,
  buildSuccess,
} from '@repo/contracts'
import { zValidator } from '@hono/zod-validator'
import { authUnauthorizedError } from '@/auth/errors'
import { buildValidationErrorHandler } from '@/auth/http'
import { verifyAccessToken } from '@/auth/jwt'
import {
  assignUserSubscriptionPlan,
  findActiveSubscriptionPlanById,
  findActiveUserById,
  findSubscriptionUserList,
} from '@/auth/repository'
import type { ApiBindings } from '@/bindings'
import { getDb } from '@/db/client'
import { getApiEnv } from '@/env'
import { createApiMeta } from '@/lib/api-meta'
import { AppError } from '@/lib/app-error'

const subscriptionUserRoute = new Hono<{ Bindings: ApiBindings }>()

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

subscriptionUserRoute.get('/list', async (c) => {
  await requireAdminOwner(c)

  const query = SubscriptionUserListQuerySchema.parse({
    page: c.req.query('page') ?? 1,
    pageSize: c.req.query('pageSize') ?? 10,
  })
  const offset = (query.page - 1) * query.pageSize
  const { items, total } = await findSubscriptionUserList(getDb(c.env.DB), {
    offset,
    limit: query.pageSize,
  })
  const res = SubscriptionUserListResponseSchema.parse({
    items,
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.ceil(total / query.pageSize),
  })

  return c.json(buildSuccess(res, createApiMeta()))
})

subscriptionUserRoute.post(
  '/assign',
  zValidator('json', AssignSubscriptionUserRequestSchema, buildValidationErrorHandler('Invalid subscription assign payload')),
  async (c) => {
    const claims = await requireAdminOwner(c)
    const payload = c.req.valid('json')
    const db = getDb(c.env.DB)

    const user = await findActiveUserById(db, payload.userId)

    if (!user) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, 'User is not found', 404)
    }

    const plan = await findActiveSubscriptionPlanById(db, payload.planId)

    if (!plan) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, 'Subscription plan is not found', 404)
    }

    await assignUserSubscriptionPlan({
      db,
      bindingId: uuidv7(),
      userId: payload.userId,
      planId: payload.planId,
      assignedByUserId: claims.sub,
      nowMs: Date.now(),
    })

    const res = AssignSubscriptionUserResponseSchema.parse({
      success: true,
      userId: payload.userId,
      planId: payload.planId,
    })

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

export default subscriptionUserRoute
