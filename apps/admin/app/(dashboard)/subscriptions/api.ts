import type {
  AssignSubscriptionUserRequest,
  AssignSubscriptionUserResponse,
  SubscriptionPlanListResponse,
  SubscriptionUserListResponse,
  UserListResponse,
} from '@repo/contracts'
import { http } from '@/lib/http'

type GetPageInput = {
  page: number
  pageSize: number
}

export function getSubscriptionUsersForPage({ page, pageSize }: GetPageInput) {
  return http.get<SubscriptionUserListResponse>(`/rpc/subscription/user/list?page=${page}&pageSize=${pageSize}`)
}

export function getSubscriptionAssignableUsers() {
  return http.get<UserListResponse>('/rpc/user/list?page=1&pageSize=50')
}

export function getSubscriptionAssignablePlans() {
  return http.get<SubscriptionPlanListResponse>('/rpc/subscription/plan/list')
}

export function assignSubscriptionUser(input: AssignSubscriptionUserRequest) {
  return http.post<AssignSubscriptionUserResponse, AssignSubscriptionUserRequest>('/rpc/subscription/user/assign', input)
}
