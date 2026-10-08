"use client"

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  assignSubscriptionUser,
  getSubscriptionAssignablePlans,
  getSubscriptionAssignableUsers,
  getSubscriptionUsersForPage,
} from '../api'

const subscriptionUsersQueryKey = ['dashboard', 'subscriptions', 'users', 'list'] as const
const assignableUsersQueryKey = ['dashboard', 'subscriptions', 'assignable-users'] as const
const assignablePlansQueryKey = ['dashboard', 'subscriptions', 'assignable-plans'] as const

export function useAdminSubscriptionsPage() {
  const [page, setPageState] = useState(1)
  const pageSize = 10
  const queryClient = useQueryClient()

  const subscriptionUsersQuery = useQuery({
    queryKey: [...subscriptionUsersQueryKey, page, pageSize],
    queryFn: () => getSubscriptionUsersForPage({ page, pageSize }),
  })

  const usersQuery = useQuery({
    queryKey: assignableUsersQueryKey,
    queryFn: getSubscriptionAssignableUsers,
    staleTime: 60_000,
  })

  const plansQuery = useQuery({
    queryKey: assignablePlansQueryKey,
    queryFn: getSubscriptionAssignablePlans,
    staleTime: 60_000,
  })

  const assignMutation = useMutation({
    mutationFn: assignSubscriptionUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: subscriptionUsersQueryKey })
    },
  })

  const total = subscriptionUsersQuery.data?.total ?? 0
  const totalPages = subscriptionUsersQuery.data?.totalPages ?? 0

  return {
    subscriptions: subscriptionUsersQuery.data?.items ?? [],
    users: (usersQuery.data?.items ?? []).filter((user) => user.status === 'active'),
    plans: (plansQuery.data?.items ?? []).filter((plan) => plan.status === 'active'),
    page,
    pageSize,
    total,
    totalPages,
    canPrev: page > 1,
    canNext: totalPages > 0 && page < totalPages,
    setPage: (nextPage: number) => {
      setPageState(() => {
        if (totalPages > 0) {
          return Math.min(Math.max(1, nextPage), totalPages)
        }

        return Math.max(1, nextPage)
      })
    },
    prevPage: () => {
      setPageState((current) => Math.max(1, current - 1))
    },
    nextPage: () => {
      setPageState((current) => (totalPages > 0 ? Math.min(totalPages, current + 1) : current))
    },
    isLoading: subscriptionUsersQuery.isLoading || usersQuery.isLoading || plansQuery.isLoading,
    error: subscriptionUsersQuery.error ?? usersQuery.error ?? plansQuery.error,
    refetch: async () => {
      await Promise.all([
        subscriptionUsersQuery.refetch(),
        usersQuery.refetch(),
        plansQuery.refetch(),
      ])
    },
    assignSubscription: assignMutation.mutateAsync,
    isAssigningSubscription: assignMutation.isPending,
  }
}
