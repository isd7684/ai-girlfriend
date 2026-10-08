import { getWebClientEnv } from '@/env.client'
import { getWebServerEnv } from '@/env.server'

function resolveApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return getWebClientEnv().NEXT_PUBLIC_API_BASE_URL
  }

  return getWebServerEnv().API_BASE_URL
}

export function getAvatarUrl(avatarKey: string | null) {
  if (!avatarKey) {
    return null
  }

  const url = new URL('/rpc/user/avatar', resolveApiBaseUrl())
  url.searchParams.set('key', avatarKey)

  return url.toString()
}

export function getAgentImageUrl(imageKey: string | null) {
  if (!imageKey) {
    return null
  }

  const url = new URL('/rpc/agent/my/image', resolveApiBaseUrl())
  url.searchParams.set('key', imageKey)

  return url.toString()
}
