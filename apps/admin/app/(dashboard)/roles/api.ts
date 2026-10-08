import type {
  CreateRoleRequest,
  CreateRoleResponse,
  DeleteRoleRequest,
  DisableRoleRequest,
  RoleListResponse,
} from '@repo/contracts'
import { http } from '@/lib/http'

export function getRoleList() {
  return http.get<RoleListResponse>('/rpc/role/list')
}

export function createRole(input: CreateRoleRequest) {
  return http.post<CreateRoleResponse, CreateRoleRequest>('/rpc/role/create', input)
}

export function disableRole(input: DisableRoleRequest) {
  return http.post<{ success: true }, DisableRoleRequest>('/rpc/role/disable', input)
}

export function deleteRole(input: DeleteRoleRequest) {
  return http.post<{ success: true }, DeleteRoleRequest>('/rpc/role/delete', input)
}
