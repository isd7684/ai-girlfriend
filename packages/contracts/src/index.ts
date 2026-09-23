import { z } from 'zod'

export const BizCode = {
  COMMON_INVALID_REQUEST: 'COMMON.INVALID_REQUEST',
  COMMON_NOT_FOUND: 'COMMON.NOT_FOUND',
  AUTH_UNAUTHORIZED: 'AUTH.UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH.FORBIDDEN',
  BIZ_CONFLICT: 'BIZ.CONFLICT',
  BIZ_RULE_VIOLATION: 'BIZ.RULE_VIOLATION',
  SYSTEM_INTERNAL_ERROR: 'SYSTEM.INTERNAL_ERROR',
  SYSTEM_UPSTREAM_TIMEOUT: 'SYSTEM.UPSTREAM_TIMEOUT',
} as const

export type BizCode = (typeof BizCode)[keyof typeof BizCode]

export interface ApiMeta {
  requestId: string
  timestamp: string
}

export interface ApiSuccess<T> {
  ok: true
  data: T
  meta: ApiMeta
}

export interface ApiError<E = unknown> {
  code: BizCode
  message: string
  details?: E
}

export interface ApiFailure<E = unknown> {
  ok: false
  error: ApiError<E>
  meta: ApiMeta
}

export type ApiResponse<T, E = unknown> = ApiSuccess<T> | ApiFailure<E>

export const PingRequestSchema = z.object({
  name: z.string().trim().min(1),
})

export const PingResponseSchema = z.object({
  service: z.literal('api'),
  message: z.string(),
})

export type PingRequest = z.infer<typeof PingRequestSchema>
export type PingResponse = z.infer<typeof PingResponseSchema>

export function buildSuccess<T>(data: T, meta: ApiMeta): ApiSuccess<T> {
  return { ok: true, data, meta }
}

export function buildFailure<E = unknown>(
  error: ApiError<E>,
  meta: ApiMeta,
): ApiFailure<E> {
  return { ok: false, error, meta }
}