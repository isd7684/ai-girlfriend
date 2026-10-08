import { BizCode, buildFailure } from '@repo/contracts'
import { createApiMeta } from '@/lib/api-meta'

// 这个 helper 只解决一件事：
// 多个接口的 zValidator 失败响应长得完全一样，只是 message 不同。
// 抽出来以后，route 文件就不会被重复的 400 响应代码占满。
export function buildValidationErrorHandler(
  message: string,
) {
  return (
    result: {
      success: boolean
      error?: { issues: unknown }
    },
    c: {
      json: (body: unknown, status?: number) => unknown
    },
  ): void | Response => {
    if (result.success) {
      return
    }

    const res = {
      code: BizCode.COMMON_INVALID_REQUEST,
      message,
      details: result.error?.issues,
    }

    return c.json(buildFailure(res, createApiMeta()), 400) as Response
  }
}
