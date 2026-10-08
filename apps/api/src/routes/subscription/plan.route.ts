import { uuidv7 } from 'uuidv7'
import { Hono, type Context } from 'hono'
import {
  BizCode,
  CreateSubscriptionPlanRequestSchema,
  CreateSubscriptionPlanResponseSchema,
  DeleteSubscriptionPlanRequestSchema,
  DisableSubscriptionPlanRequestSchema,
  SubscriptionPlanListResponseSchema,
  UpdateSubscriptionPlanRequestSchema,
  buildSuccess,
} from '@repo/contracts'
import { zValidator } from '@hono/zod-validator'
import { authUnauthorizedError } from '@/auth/errors'
import { buildValidationErrorHandler } from '@/auth/http'
import { verifyAccessToken } from '@/auth/jwt'
import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  disableSubscriptionPlan,
  listSubscriptionPlans,
  updateSubscriptionPlan,
} from '@/auth/repository'
import type { ApiBindings } from '@/bindings'
import { getDb } from '@/db/client'
import { getApiEnv } from '@/env'
import { createApiMeta } from '@/lib/api-meta'
import { AppError } from '@/lib/app-error'

const subscriptionPlanRoute = new Hono<{ Bindings: ApiBindings }>()

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
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw authUnauthorizedError('Access token is invalid')
  }
}

subscriptionPlanRoute.get('/list', async (c) => {
  await requireAdminOwner(c)

  const plans = await listSubscriptionPlans(getDb(c.env.DB))
  const res = SubscriptionPlanListResponseSchema.parse({
    items: plans,
  })

  return c.json(buildSuccess(res, createApiMeta()))
})

subscriptionPlanRoute.post(
  '/create',
  zValidator('json', CreateSubscriptionPlanRequestSchema, buildValidationErrorHandler('Invalid subscription plan create payload')),
  async (c) => {
    await requireAdminOwner(c)

    const payload = c.req.valid('json')

    const planId = uuidv7()

    try {
      await createSubscriptionPlan({
        db: getDb(c.env.DB),
        id: planId,
        code: payload.code,
        name: payload.name,
        description: payload.description || null,
        price: payload.price,
        billingPeriod: payload.billingPeriod,
        maxAgents: payload.maxAgents,
        supportsGroupChat: payload.supportsGroupChat,
        supportsMultiAgentLinkage: payload.supportsMultiAgentLinkage,
        supportsDiscoverSquare: payload.supportsDiscoverSquare,
        supportsAgentTimeEvolution: payload.supportsAgentTimeEvolution,
        nowMs: Date.now(),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('unique') || message.includes('constraint')) {
        throw new AppError(BizCode.BIZ_CONFLICT, 'Plan code already exists', 409)
      }
      throw error
    }

    const res = CreateSubscriptionPlanResponseSchema.parse({
      id: planId,
    })

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

subscriptionPlanRoute.post(
  '/update',
  zValidator('json', UpdateSubscriptionPlanRequestSchema, buildValidationErrorHandler('Invalid subscription plan update payload')),
  async (c) => {
    await requireAdminOwner(c)

    const payload = c.req.valid('json')
    await updateSubscriptionPlan({
      db: getDb(c.env.DB),
      planId: payload.planId,
      name: payload.name,
      description: payload.description || null,
      price: payload.price,
      billingPeriod: payload.billingPeriod,
      maxAgents: payload.maxAgents,
      supportsGroupChat: payload.supportsGroupChat,
      supportsMultiAgentLinkage: payload.supportsMultiAgentLinkage,
      supportsDiscoverSquare: payload.supportsDiscoverSquare,
      supportsAgentTimeEvolution: payload.supportsAgentTimeEvolution,
      nowMs: Date.now(),
    })

    return c.json(buildSuccess({ success: true }, createApiMeta()))
  },
)

subscriptionPlanRoute.post(
  '/disable',
  zValidator('json', DisableSubscriptionPlanRequestSchema, buildValidationErrorHandler('Invalid subscription plan disable payload')),
  async (c) => {
    await requireAdminOwner(c)

    const payload = c.req.valid('json')
    await disableSubscriptionPlan({
      db: getDb(c.env.DB),
      planId: payload.planId,
      nowMs: Date.now(),
    })

    return c.json(buildSuccess({ success: true }, createApiMeta()))
  },
)

subscriptionPlanRoute.post(
  '/delete',
  zValidator('json', DeleteSubscriptionPlanRequestSchema, buildValidationErrorHandler('Invalid subscription plan delete payload')),
  async (c) => {
    await requireAdminOwner(c)

    const payload = c.req.valid('json')
    await deleteSubscriptionPlan({
      db: getDb(c.env.DB),
      planId: payload.planId,
      nowMs: Date.now(),
    })

    return c.json(buildSuccess({ success: true }, createApiMeta()))
  },
)

export default subscriptionPlanRoute
