"use client"

import { useEffect, useState } from 'react'
import type { UserProfileResponse, UserListItem } from '@repo/contracts'
import { getAvatarUrl } from '@/lib/avatar-url'
import { http } from '@/lib/http'

type UserAvatarProps = {
  user: Pick<UserListItem, 'name' | 'avatarKey'> | Pick<UserProfileResponse, 'name' | 'avatarKey'>
  size?: 'sm' | 'md' | 'lg'
}

const sizeClassNameMap: Record<NonNullable<UserAvatarProps['size']>, string> = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-lg',
}

export function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const avatarUrl = getAvatarUrl(user.avatarKey)
  const fallbackText = user.name.trim().slice(0, 1).toUpperCase() || '?'

  useEffect(() => {
    let revokedUrl: string | null = null
    let cancelled = false

    async function loadAvatar() {
      if (!avatarUrl) {
        setAvatarSrc(null)
        return
      }

      try {
        const blob = await http.getRaw(avatarUrl, {
          baseURL: undefined,
        })
        const objectUrl = URL.createObjectURL(blob)
        revokedUrl = objectUrl

        if (!cancelled) {
          setAvatarSrc(objectUrl)
        }
      } catch {
        if (!cancelled) {
          setAvatarSrc(null)
        }
      }
    }

    void loadAvatar()

    return () => {
      cancelled = true
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl)
      }
    }
  }, [avatarUrl])

  return avatarSrc ? (
    <img
      src={avatarSrc}
      alt={`${user.name} avatar`}
      className={`${sizeClassNameMap[size]} rounded-full border object-cover`}
    />
  ) : (
    <div className={`${sizeClassNameMap[size]} flex items-center justify-center rounded-full border bg-muted text-muted-foreground font-medium`}>
      {fallbackText}
    </div>
  )
}
