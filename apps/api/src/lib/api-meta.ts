import type { ApiMeta } from '@repo/contracts'

export function createApiMeta(): ApiMeta {
  return {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  }
}
