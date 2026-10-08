import type {
  CreateUserRequest,
  CreateUserResponse,
  RoleListResponse,
  UserListResponse,
} from '@repo/contracts'
import { http } from '@/lib/http'

type GetUsersForPageInput = {
  page: number
  pageSize: number
}

export function getUsersForPage({ page, pageSize }: GetUsersForPageInput) {
  return http.get<UserListResponse>(`/rpc/user/list?page=${page}&pageSize=${pageSize}`)
}

export function createUser(input: CreateUserRequest) {
  return http.post<CreateUserResponse, CreateUserRequest>('/rpc/user/create', input)
}

export function getAssignableAdminRoles() {
  return http.get<RoleListResponse>('/rpc/role/list')
}
