import type {
  AdminLogoutRequest,
  AdminPasswordLoginRequest,
  AdminPasswordLoginResponse,
  AdminTokenRefreshRequest,
  AdminTokenRefreshResponse,
  AvatarUploadResponse,
  UserProfileResponse,
} from '@repo/contracts'
import { http } from '@/lib/http'

// 这些函数只在 admin 的服务端层调用，让浏览器不必直接碰 API 的原始 token 响应。
export function loginWithAdminPassword(input: AdminPasswordLoginRequest) {
  return http.post<AdminPasswordLoginResponse, AdminPasswordLoginRequest>('/auth/admin/password/login', input)
}

export function refreshAdminSession(input: AdminTokenRefreshRequest) {
  return http.post<AdminTokenRefreshResponse, AdminTokenRefreshRequest>('/auth/admin/token/refresh', input)
}

export function logoutAdminSession(input: AdminLogoutRequest) {
  return http.post<{ success: true }, AdminLogoutRequest>('/auth/admin/logout', input)
}

export function getAdminUserProfile(accessToken?: string) {
  return http.get<UserProfileResponse>('/rpc/user/profile', accessToken ? {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  } : undefined)
}

export async function uploadCurrentUserAvatar(file: File) {
  const formData = new FormData()
  formData.set('file', file)

  return http.post<AvatarUploadResponse>('/rpc/user/profile/avatar', formData, {
    headers: {},
  })
}
