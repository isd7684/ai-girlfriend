import type {
  CreateSubscriptionPlanRequest,
  CreateSubscriptionPlanResponse,
  DeleteSubscriptionPlanRequest,
  DisableSubscriptionPlanRequest,
  SubscriptionPlanListResponse,
  UpdateSubscriptionPlanRequest,
} from '@repo/contracts'
import { http } from '@/lib/http'

export function getSubscriptionPlanList() {
  return http.get<SubscriptionPlanListResponse>('/rpc/subscription/plan/list')
}

export function createSubscriptionPlan(input: CreateSubscriptionPlanRequest) {
  return http.post<CreateSubscriptionPlanResponse, CreateSubscriptionPlanRequest>('/rpc/subscription/plan/create', input)
}

export function updateSubscriptionPlan(input: UpdateSubscriptionPlanRequest) {
  return http.post<{ success: true }, UpdateSubscriptionPlanRequest>('/rpc/subscription/plan/update', input)
}

export function disableSubscriptionPlan(input: DisableSubscriptionPlanRequest) {
  return http.post<{ success: true }, DisableSubscriptionPlanRequest>('/rpc/subscription/plan/disable', input)
}

export function deleteSubscriptionPlan(input: DeleteSubscriptionPlanRequest) {
  return http.post<{ success: true }, DeleteSubscriptionPlanRequest>('/rpc/subscription/plan/delete', input)
}
