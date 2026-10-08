import { z } from 'zod'
import type { ApiBindings } from './bindings'

const optionalNonEmptyString = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.string().min(1).optional(),
)

const optionalUrl = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.string().url().optional(),
)

const apiEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']),
  ADMIN_ORIGIN: z.string().url(),
  WEB_ORIGIN: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL_SEC: z.coerce.number().int().positive(),
  REFRESH_TOKEN_TTL_SEC: z.coerce.number().int().positive(),
  DEEPSEEK_API_KEY: z.string().min(1).optional(),
  DEEPSEEK_BASE_URL: z.string().url().optional(),
  DEEPSEEK_MODEL: z.string().min(1).optional(),
  GITHUB_OAUTH_CLIENT_ID: optionalNonEmptyString,
  GITHUB_OAUTH_CLIENT_SECRET: optionalNonEmptyString,
  GITHUB_OAUTH_CALLBACK_URL: optionalUrl,
})

export type ApiEnv = z.infer<typeof apiEnvSchema>

export function getApiEnv(bindings: ApiBindings): ApiEnv {
  return apiEnvSchema.parse({
    APP_ENV: bindings.APP_ENV,
    ADMIN_ORIGIN: bindings.ADMIN_ORIGIN,
    WEB_ORIGIN: bindings.WEB_ORIGIN,
    JWT_ACCESS_SECRET: bindings.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: bindings.JWT_REFRESH_SECRET,
    ACCESS_TOKEN_TTL_SEC: bindings.ACCESS_TOKEN_TTL_SEC,
    REFRESH_TOKEN_TTL_SEC: bindings.REFRESH_TOKEN_TTL_SEC,
    DEEPSEEK_API_KEY: bindings.DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL: bindings.DEEPSEEK_BASE_URL,
    DEEPSEEK_MODEL: bindings.DEEPSEEK_MODEL,
    GITHUB_OAUTH_CLIENT_ID: bindings.GITHUB_OAUTH_CLIENT_ID,
    GITHUB_OAUTH_CLIENT_SECRET: bindings.GITHUB_OAUTH_CLIENT_SECRET,
    GITHUB_OAUTH_CALLBACK_URL: bindings.GITHUB_OAUTH_CALLBACK_URL,
  })
}
