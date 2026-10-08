"use client"

import { useEffect, useState } from "react"
import type { UserProfileResponse } from "@repo/contracts"

import { getAvatarUrl } from "@/lib/avatar-url"
import { http } from "@/lib/http"

type UserAvatarProps = {
  user: Pick<UserProfileResponse, "name" | "email" | "avatarKey">
  size?: "sm" | "md" | "lg"
}

const sizeClassNameMap: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  sm: "size-8 rounded-lg text-xs",
  md: "size-10 rounded-2xl text-sm",
  lg: "size-16 rounded-2xl text-lg",
}

function getFallbackText(user: UserAvatarProps["user"]) {
  const base = user.name.trim() || user.email.trim()

  return base.slice(0, 2).toUpperCase() || "ME"
}

export function UserAvatar({ user, size = "md" }: UserAvatarProps) {
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const avatarUrl = getAvatarUrl(user.avatarKey)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false

    async function loadAvatar() {
      if (!avatarUrl) {
        setAvatarSrc(null)
        return
      }

      try {
        const blob = await http.getRaw(avatarUrl)
        objectUrl = URL.createObjectURL(blob)

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

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [avatarUrl])

  const className = `${sizeClassNameMap[size]} shrink-0 border border-slate-200 object-cover`

  if (avatarSrc) {
    return <img alt={`${user.name || user.email} avatar`} className={className} src={avatarSrc} />
  }

  return (
    <span className={`${className} flex items-center justify-center bg-slate-950 font-semibold text-white`}>
      {getFallbackText(user)}
    </span>
  )
}
