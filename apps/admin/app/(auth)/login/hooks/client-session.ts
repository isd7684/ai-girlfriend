"use client"

import type {
  AdminAuthSession,
  AdminPasswordLoginResponse,
  AdminTokenRefreshResponse,
} from '@repo/contracts'

const storageKey = 'admin:client-session'
const sessionChangedEventName = 'admin-client-session-changed'

type StoredAdminSession = {
  accessToken: string
  refreshToken: string
  session: AdminAuthSession
}

let currentSession: StoredAdminSession | null = null

function canUseStorage() {
  return typeof window !== 'undefined'
}

function notifySessionChanged() {
  if (canUseStorage()) {
    window.dispatchEvent(new Event(sessionChangedEventName))
  }
}

export function readClientSession(): StoredAdminSession | null {
  if (currentSession) {
    return currentSession
  }

  if (!canUseStorage()) {
    return null
  }

  const rawValue = window.localStorage.getItem(storageKey)

  if (!rawValue) {
    return null
  }

  try {
    currentSession = JSON.parse(rawValue) as StoredAdminSession
    return currentSession
  } catch {
    window.localStorage.removeItem(storageKey)
    return null
  }
}

export function saveClientSession(input: Pick<AdminPasswordLoginResponse, 'accessToken' | 'refreshToken' | 'session'>) {
  currentSession = {
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    session: input.session,
  }

  if (canUseStorage()) {
    window.localStorage.setItem(storageKey, JSON.stringify(currentSession))
  }

  notifySessionChanged()
}

export function saveClientRefreshSession(input: Pick<AdminTokenRefreshResponse, 'accessToken' | 'refreshToken' | 'session'>) {
  saveClientSession(input)
}

export function clearClientSession() {
  currentSession = null

  if (canUseStorage()) {
    window.localStorage.removeItem(storageKey)
  }

  notifySessionChanged()
}

export { sessionChangedEventName }
export type { StoredAdminSession }
