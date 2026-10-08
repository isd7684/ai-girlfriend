export type ApiBindings = CloudflareBindings & {
  DB: D1Database
  AVATAR_BUCKET: R2Bucket
  ADMIN_ORIGIN: string
  WEB_ORIGIN: string
  JWT_ACCESS_SECRET: string
  JWT_REFRESH_SECRET: string
  ACCESS_TOKEN_TTL_SEC: string | number
  REFRESH_TOKEN_TTL_SEC: string | number
  DEEPSEEK_API_KEY?: string
  DEEPSEEK_BASE_URL?: string
  DEEPSEEK_MODEL?: string
  GITHUB_OAUTH_CLIENT_ID?: string
  GITHUB_OAUTH_CLIENT_SECRET?: string
  GITHUB_OAUTH_CALLBACK_URL?: string
}
