"use client"

import { useEffect, useMemo, useState } from "react"

import { getAgentImageUrl } from "@/lib/avatar-url"
import { http } from "@/lib/http"
import { cn } from "@/lib/utils"

type AgentAvatarProps = {
  imageKey?: string | null
  name: string
  className?: string
  fallbackClassName?: string
  imageClassName?: string
}

function getFallbackText(name: string) {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return "AI"
  }

  const parts = normalizedName.split(/\s+/).filter(Boolean)

  if (parts.length > 1) {
    return parts
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  return Array.from(normalizedName).slice(0, 2).join("").toUpperCase()
}

export function AgentAvatar({
  imageKey,
  name,
  className,
  fallbackClassName,
  imageClassName,
}: AgentAvatarProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const imageUrl = useMemo(() => getAgentImageUrl(imageKey ?? null), [imageKey])

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false

    async function loadImage() {
      setImageSrc(null)

      if (!imageUrl) {
        return
      }

      try {
        const blob = await http.getRaw(imageUrl)
        objectUrl = URL.createObjectURL(blob)

        if (!cancelled) {
          setImageSrc(objectUrl)
        }
      } catch {
        if (!cancelled) {
          setImageSrc(null)
        }
      }
    }

    void loadImage()

    return () => {
      cancelled = true

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [imageUrl])

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-600",
        className,
      )}
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`${name || "Agent"} avatar`}
          className={cn("size-full object-cover", imageClassName)}
          src={imageSrc}
        />
      ) : (
        <span
          className={cn(
            "flex size-full items-center justify-center bg-slate-100 text-slate-600",
            fallbackClassName,
          )}
        >
          {getFallbackText(name)}
        </span>
      )}
    </span>
  )
}
