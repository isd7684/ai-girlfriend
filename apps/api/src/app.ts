import { BizCode, buildFailure } from '@repo/contracts'
import { cors } from 'hono/cors'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ApiBindings } from './bindings'
import { getApiEnv } from './env'
import { AppError } from './lib/app-error'
import { createApiMeta } from './lib/api-meta'
import routes from './routes'

const app = new Hono<{ Bindings: ApiBindings }>()

app.use('*', async (c, next) => {
  const env = getApiEnv(c.env)
  const allowedOrigins = new Set([env.ADMIN_ORIGIN, env.WEB_ORIGIN])
  const corsMiddleware = cors({
    origin: (origin) => allowedOrigins.has(origin) ? origin : env.ADMIN_ORIGIN,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })

  return corsMiddleware(c, next)
})

app.onError((error, c) => {
  const meta = createApiMeta()

  if (error instanceof AppError) {
    const res = {
      code: error.code,
      message: error.message,
      details: error.details,
    }

    return c.json(buildFailure(res, meta), error.status)
  }

  if (error instanceof HTTPException) {
    const res = {
      code: BizCode.COMMON_INVALID_REQUEST,
      message: error.message,
    }

    return c.json(buildFailure(res, meta), error.status)
  }

  console.error(error)

  const res = {
    code: BizCode.SYSTEM_INTERNAL_ERROR,
    message: 'Internal server error',
  }

  return c.json(buildFailure(res, meta), 500)
})

app.notFound((c) => {
  const res = {
    code: BizCode.COMMON_NOT_FOUND,
    message: 'Not found',
  }

  return c.json(buildFailure(res, createApiMeta()), 404)
})

app.route('/', routes)

export type AppType = typeof routes

export default app
