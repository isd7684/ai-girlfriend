import axios, { AxiosError, type AxiosRequestConfig, type RawAxiosRequestHeaders } from 'axios'
import type { ApiResponse, AdminTokenRefreshResponse, BizCodeValue } from '@repo/contracts'
import { clearClientSession, readClientSession, saveClientRefreshSession } from '@/auth/client-session'
import { getAdminClientEnv } from '@/env.client'
import { getAdminServerEnv } from '@/env.server'

const unauthorizedBizCodes: Set<BizCodeValue> = new Set([
  'AUTH.UNAUTHORIZED',
])

let refreshPromise: Promise<void> | null = null

function resolveBaseURL(): string {
  if (typeof window !== 'undefined') {
    return getAdminClientEnv().NEXT_PUBLIC_API_BASE_URL
  }

  return getAdminServerEnv().API_BASE_URL
}

function shouldAttachAccessToken(headers: AxiosRequestConfig['headers']) {
  if (!headers || typeof headers !== 'object') {
    return true
  }

  const normalizedHeaders = headers as Record<string, unknown>
  return !('authorization' in normalizedHeaders || 'Authorization' in normalizedHeaders)
}

function createRequestConfig(url: string, config: AxiosRequestConfig = {}): AxiosRequestConfig {
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData
  const headers: RawAxiosRequestHeaders = {
    ...(isFormData ? {} : { 'content-type': 'application/json' }),
    ...(config.headers as RawAxiosRequestHeaders | undefined),
  }

  if (typeof window !== 'undefined' && shouldAttachAccessToken(config.headers)) {
    const storedSession = readClientSession()

    if (storedSession) {
      headers.authorization = `Bearer ${storedSession.accessToken}`
    }
  }

  return {
    ...config,
    baseURL: config.baseURL ?? resolveBaseURL(),
    headers,
    validateStatus: () => true,
    url,
  }
}

function shouldTryRefresh(config: AxiosRequestConfig, payload: ApiResponse<unknown>) {
  if (typeof window === 'undefined') {
    return false
  }

  if (config.url?.includes('/auth/admin/token/refresh')) {
    return false
  }

  return !payload.ok && unauthorizedBizCodes.has(payload.error.code)
}

function unwrapApiResponse<T>(config: AxiosRequestConfig, payload: ApiResponse<T>): T {
  if (payload.ok) {
    return payload.data
  }

  const error = new Error(payload.error.message) as Error & {
    status?: number
    code?: BizCodeValue
    shouldRefresh?: boolean
  }

  error.code = payload.error.code
  error.shouldRefresh = shouldTryRefresh(config, payload)

  throw error
}

async function refreshClientSession() {
  const storedSession = readClientSession()

  if (!storedSession) {
    throw new Error('Session refresh failed')
  }

  const response = await axios.request<ApiResponse<AdminTokenRefreshResponse>>({
    baseURL: resolveBaseURL(),
    url: '/auth/admin/token/refresh',
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    data: {
      refreshToken: storedSession.refreshToken,
    },
    validateStatus: () => true,
  })

  const data = unwrapApiResponse<AdminTokenRefreshResponse>({
    url: '/auth/admin/token/refresh',
    method: 'POST',
  }, response.data)

  saveClientRefreshSession(data)
}

async function ensureClientRefresh() {
  if (!refreshPromise) {
    refreshPromise = refreshClientSession().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await axios.request<ApiResponse<T>>(config)
    return unwrapApiResponse(config, response.data)
  } catch (error) {
    const appError = error as Error & { shouldRefresh?: boolean }

    if (appError.shouldRefresh) {
      try {
        await ensureClientRefresh()
        const { authorization: _authorization, Authorization: _Authorization, ...retryHeaders } = (config.headers ?? {}) as RawAxiosRequestHeaders
        const retryConfig = createRequestConfig(config.url ?? '', {
          ...config,
          headers: retryHeaders,
        })
        const retryResponse = await axios.request<ApiResponse<T>>(retryConfig)
        return unwrapApiResponse(retryConfig, retryResponse.data)
      } catch {
        clearClientSession()
        throw new Error('Session refresh failed')
      }
    }

    if (error instanceof AxiosError) {
      throw new Error(error.message || 'Request failed')
    }

    throw error
  }
}

export const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request<T>(createRequestConfig(url, {
      ...config,
      method: 'GET',
    }))
  },
  async getRaw(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const requestConfig = createRequestConfig(url, {
      ...config,
      method: 'GET',
      responseType: 'blob',
      validateStatus: (status) => status >= 200 && status < 300,
    })
    const response = await axios.request<Blob>(requestConfig)
    return response.data
  },
  post<TResponse, TRequest = unknown>(url: string, data?: TRequest, config?: AxiosRequestConfig): Promise<TResponse> {
    return request<TResponse>(createRequestConfig(url, {
      ...config,
      method: 'POST',
      data,
    }))
  },
}
