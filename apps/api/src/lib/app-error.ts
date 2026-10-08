import type { BizCodeValue } from '@repo/contracts'

export type AppErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 500 | 504

export class AppError extends Error {
  constructor(
    readonly code: BizCodeValue,
    message: string,
    readonly status: AppErrorStatus,
    readonly details?: unknown,
  ) {
    super(message)
  }
}
