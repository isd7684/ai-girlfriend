import type {
  AvatarUploadResponse,
  DefaultAvatarHistoryResponse,
  LatestDefaultAvatarResponse,
  SetCurrentDefaultAvatarRequest,
  SetCurrentDefaultAvatarResponse,
} from '@repo/contracts'
import { http } from '@/lib/http'

export function getLatestDefaultAvatar() {
  return http.get<LatestDefaultAvatarResponse>('/rpc/user/default-avatar/latest')
}

export function getDefaultAvatarHistory() {
  return http.get<DefaultAvatarHistoryResponse>('/rpc/user/default-avatar/history')
}

export async function uploadDefaultAvatar(file: File) {
  const formData = new FormData()
  formData.set('file', file)

  return http.post<AvatarUploadResponse>('/rpc/user/default-avatar/upload', formData, {
    headers: {},
  })
}

export function setCurrentDefaultAvatar(input: SetCurrentDefaultAvatarRequest) {
  return http.post<SetCurrentDefaultAvatarResponse, SetCurrentDefaultAvatarRequest>('/rpc/user/default-avatar/set-current', input)
}
