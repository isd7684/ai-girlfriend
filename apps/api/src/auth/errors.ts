import { BizCode } from '@repo/contracts'
import { AppError } from '@/lib/app-error'

// 这组 helper 把“认证失败原因 -> HTTP 状态码 / 业务码”的映射收在一个地方，route 里只保留流程判断。
export function authUnauthorizedError(message = 'Unauthorized'): AppError {
  return new AppError(
    BizCode.AUTH_UNAUTHORIZED,
    message,
    401,
  )
}

export function authMethodDisabledError(message = 'Authentication method is disabled'): AppError {
  return new AppError(
    BizCode.AUTH_FORBIDDEN,
    message,
    403,
  )
}

export function invalidCredentialsError(): AppError {
  return new AppError(
    BizCode.AUTH_INVALID_CREDENTIALS,
    'Invalid email or password',
    401,
  )
}

export function adminRoleRequiredError(): AppError {
  return new AppError(
    BizCode.AUTH_ADMIN_ROLE_REQUIRED,
    'Admin role required',
    403,
  )
}

export function refreshTokenInvalidError(): AppError {
  return new AppError(
    BizCode.AUTH_REFRESH_TOKEN_INVALID,
    'Refresh token is invalid',
    401,
  )
}

export function refreshTokenReplayedError(): AppError {
  return new AppError(
    BizCode.AUTH_REFRESH_TOKEN_REPLAYED,
    'Refresh token replay detected',
    401,
  )
}

export function sessionRevokedError(): AppError {
  return new AppError(
    BizCode.AUTH_SESSION_REVOKED,
    'Session has been revoked',
    401,
  )
}
