import { getAdminClientEnv } from '@/env.client'
import { getAdminServerEnv } from '@/env.server'

function resolveApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return getAdminClientEnv().NEXT_PUBLIC_API_BASE_URL
  }

  return getAdminServerEnv().API_BASE_URL
}

export function getAvatarUrl(avatarKey: string | null) {
  if (!avatarKey) {
    return null
  }

  const url = new URL('/rpc/user/avatar', resolveApiBaseUrl())
  url.searchParams.set('key', avatarKey)

  return url.toString()
}
