import type { Context } from 'hono'
import type { ApiBindings } from '@/bindings'

// 这几个函数看起来小，但它们把“从请求里取上下文”这件事单独收口了。
// service 只需要表达业务步骤，不需要反复写 trim / toLowerCase / header 名称。
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function getUserAgent(c: Context<{ Bindings: ApiBindings }>): string | null {
  return c.req.header('user-agent') ?? null
}

export function getIp(c: Context<{ Bindings: ApiBindings }>): string | null {
  return c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? null
}
