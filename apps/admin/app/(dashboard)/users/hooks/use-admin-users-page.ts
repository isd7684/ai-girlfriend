"use client"

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAssignableAdminRoles, getUsersForPage } from '../api'

export function useAdminUsersPage() {
  const [page, setPage] = useState(1)
  const pageSize = 10

  const usersQuery = useQuery({
    queryKey: ['dashboard', 'users', 'list', page, pageSize],
    queryFn: () => getUsersForPage({ page, pageSize }),
    staleTime: 60_000,
  })

  const rolesQuery = useQuery({
    queryKey: ['dashboard', 'roles', 'assignable-list'],
    queryFn: getAssignableAdminRoles,
    staleTime: 60_000,
  })

  const total = usersQuery.data?.total ?? 0
  const totalPages = usersQuery.data?.totalPages ?? 0
  const assignableRoles = (rolesQuery.data?.items ?? []).filter((role) => role.applicationCode === 'admin' && role.status === 'active')

  return {
    users: usersQuery.data?.items ?? [],
    page,
    pageSize,
    total,
    totalPages,
    canPrev: page > 1,
    canNext: totalPages > 0 && page < totalPages,
    setPage: (nextPage: number) => {
      setPage(() => {
        if (totalPages > 0) {
          return Math.min(Math.max(1, nextPage), totalPages)
        }

        return Math.max(1, nextPage)
      })
    },
    prevPage: () => {
      setPage((current) => Math.max(1, current - 1))
    },
    nextPage: () => {
      setPage((current) => (totalPages > 0 ? Math.min(totalPages, current + 1) : current))
    },
    assignableRoles,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    error: usersQuery.error,
    refetch: usersQuery.refetch,
  }
}
