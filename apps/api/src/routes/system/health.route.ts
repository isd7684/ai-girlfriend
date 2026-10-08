import { Hono } from 'hono'
import { buildSuccess, type HealthResponse } from '@repo/contracts'
import type { ApiBindings } from '@/bindings'
import { getApiEnv } from '@/env'
import { createApiMeta } from '@/lib/api-meta'

const healthRoute = new Hono<{ Bindings: ApiBindings }>()

healthRoute.get('/', (c) => {
  const env = getApiEnv(c.env)
  const res: HealthResponse = {
    service: 'api',
    env: env.APP_ENV,
  }

  return c.json(buildSuccess(res, createApiMeta()))
})

export default healthRoute
