"use client"

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BizCodeValue, UserProfileResponse, WebAuthSession } from '@repo/contracts'
import { clearClientSession, readClientSession, sessionChangedEventName } from '@/auth/client-session'
import { getWebUserProfile } from '@/auth/api'

type WebDashboardContextValue = {
  profile: UserProfileResponse
  session: WebAuthSession
  refreshProfile: () => Promise<void>
}

const WebDashboardContext = createContext<WebDashboardContextValue | null>(null)

const authFailureCodes: Set<BizCodeValue | 'SESSION_REFRESH_FAILED'> = new Set([
  'AUTH.UNAUTHORIZED',
  'AUTH.REFRESH_TOKEN_INVALID',
  'AUTH.REFRESH_TOKEN_REPLAYED',
  'AUTH.SESSION_REVOKED',
  'SESSION_REFRESH_FAILED',
])

function isAuthFailure(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const appError = error as Error & { code?: BizCodeValue }

  return appError.message === 'Session refresh failed' || Boolean(appError.code && authFailureCodes.has(appError.code))
}

type WebDashboardGuardProps = {
  children: React.ReactNode
}

export function WebDashboardGuard({ children }: WebDashboardGuardProps) {
  const router = useRouter()
  const [context, setContext] = useState<WebDashboardContextValue | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async function loadProfile() {
    const storedSession = readClientSession()

    if (!storedSession) {
      setIsLoading(false)
      router.replace('/login')
      return
    }

    try {
      const nextProfile = await getWebUserProfile()
      const latestSession = readClientSession()

      if (!latestSession) {
        setIsLoading(false)
        router.replace('/login')
        return
      }

      setContext({ profile: nextProfile, session: latestSession.session, refreshProfile: loadProfile })
    } catch (error) {
      if (isAuthFailure(error)) {
        clearClientSession()
        router.replace('/login')
      }
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    function handleSessionChanged() {
      setIsLoading(true)
      void loadProfile()
    }

    void loadProfile()
    window.addEventListener(sessionChangedEventName, handleSessionChanged)

    return () => {
      window.removeEventListener(sessionChangedEventName, handleSessionChanged)
    }
  }, [loadProfile])

  if (isLoading || !context) {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">Loading workspace…</div>
  }

  return <WebDashboardContext.Provider value={context}>{children}</WebDashboardContext.Provider>
}

export function useWebDashboardContext() {
  const context = useContext(WebDashboardContext)

  if (!context) {
    throw new Error('useWebDashboardContext must be used within WebDashboardGuard.')
  }

  return context
}
