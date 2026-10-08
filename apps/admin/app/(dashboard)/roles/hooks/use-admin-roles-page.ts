"use client"

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRole, deleteRole, disableRole, getRoleList } from '../api'

const roleListQueryKey = ['dashboard', 'roles', 'list'] as const

export function useAdminRolesPage() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: roleListQueryKey,
    queryFn: getRoleList,
  })

  const createRoleMutation = useMutation({
    mutationFn: createRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleListQueryKey })
    },
  })

  const disableRoleMutation = useMutation({
    mutationFn: disableRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleListQueryKey })
    },
  })

  const deleteRoleMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleListQueryKey })
    },
  })

  return {
    roles: query.data?.items ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createRole: createRoleMutation.mutateAsync,
    disableRole: disableRoleMutation.mutateAsync,
    deleteRole: deleteRoleMutation.mutateAsync,
    isCreatingRole: createRoleMutation.isPending,
    disablingRoleId: disableRoleMutation.variables?.roleId ?? null,
    deletingRoleId: deleteRoleMutation.variables?.roleId ?? null,
  }
}
