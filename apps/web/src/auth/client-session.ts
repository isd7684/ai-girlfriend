"use client"

import type {
  WebAuthSession,
  WebPasswordLoginResponse,
  WebTokenRefreshResponse,
} from '@repo/contracts'

const storageKey = 'web:client-session'
const sessionChangedEventName = 'web-client-session-changed'

type StoredWebSession = {
  accessToken: string
  refreshToken: string
  session: WebAuthSession
}

let currentSession: StoredWebSession | null = null

function canUseStorage() {
  return typeof window !== 'undefined'
}

function notifySessionChanged() {
  if (canUseStorage()) {
    window.dispatchEvent(new Event(sessionChangedEventName))
  }
}

export function readClientSession(): StoredWebSession | null {
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
    currentSession = JSON.parse(rawValue) as StoredWebSession
    return currentSession
  } catch {
    window.localStorage.removeItem(storageKey)
    return null
  }
}

export function saveClientSession(input: Pick<WebPasswordLoginResponse, 'accessToken' | 'refreshToken' | 'session'>) {
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

export function saveClientRefreshSession(input: Pick<WebTokenRefreshResponse, 'accessToken' | 'refreshToken' | 'session'>) {
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
export type { StoredWebSession }
