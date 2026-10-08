import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  BizCode,
  OrderDetailRequestSchema,
  OrderDetailResponseSchema,
  buildFailure,
  buildSuccess,
} from '@repo/contracts'
import type { ApiBindings } from '@/bindings'
import { createApiMeta } from '@/lib/api-meta'

const orderRoute = new Hono<{ Bindings: ApiBindings }>()

orderRoute.post(
  '/detail',
  zValidator('json', OrderDetailRequestSchema, (result, c) => {
    if (result.success) {
      return
    }

    const res = {
      code: BizCode.COMMON_INVALID_REQUEST,
      message: 'Invalid order detail payload',
      details: result.error.issues,
    }

    return c.json(buildFailure(res, createApiMeta()), 400)
  }),
  (c) => {
    const payload = c.req.valid('json')
    const res = OrderDetailResponseSchema.parse({
      id: payload.id,
      status: 'paid',
      total: 199,
    })

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

export default orderRoute
