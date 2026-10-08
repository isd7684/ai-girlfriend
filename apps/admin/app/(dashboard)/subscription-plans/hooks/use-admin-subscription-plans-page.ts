"use client"

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  disableSubscriptionPlan,
  getSubscriptionPlanList,
  updateSubscriptionPlan,
} from '../api'

const subscriptionPlanListQueryKey = ['dashboard', 'subscription-plans', 'list'] as const

export function useAdminSubscriptionPlansPage() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: subscriptionPlanListQueryKey,
    queryFn: getSubscriptionPlanList,
  })

  const createMutation = useMutation({
    mutationFn: createSubscriptionPlan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: subscriptionPlanListQueryKey })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateSubscriptionPlan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: subscriptionPlanListQueryKey })
    },
  })

  const disableMutation = useMutation({
    mutationFn: disableSubscriptionPlan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: subscriptionPlanListQueryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubscriptionPlan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: subscriptionPlanListQueryKey })
    },
  })

  return {
    plans: query.data?.items ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createPlan: createMutation.mutateAsync,
    updatePlan: updateMutation.mutateAsync,
    disablePlan: disableMutation.mutateAsync,
    deletePlan: deleteMutation.mutateAsync,
    isCreatingPlan: createMutation.isPending,
    updatingPlanId: updateMutation.variables?.planId ?? null,
    disablingPlanId: disableMutation.variables?.planId ?? null,
    deletingPlanId: deleteMutation.variables?.planId ?? null,
  }
}
