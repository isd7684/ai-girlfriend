import { Hono } from 'hono'
import { CatalogListResponseSchema, buildSuccess } from '@repo/contracts'
import type { ApiBindings } from '@/bindings'
import { createApiMeta } from '@/lib/api-meta'

const catalogRoute = new Hono<{ Bindings: ApiBindings }>()

catalogRoute.get('/list', (c) => {
  const res = CatalogListResponseSchema.parse({
    items: [
      { id: 'catalog-1', name: 'Minimal Button', category: 'component' },
      { id: 'catalog-2', name: 'Hero Template', category: 'landing-page' },
      { id: 'catalog-3', name: 'Profile Card', category: 'card' },
    ],
  })

  return c.json(buildSuccess(res, createApiMeta()))
})

export default catalogRoute
