"use client"

import { RolesPage } from './_components/roles-page'
import { useAdminRolesPage } from './hooks/use-admin-roles-page'

export default function RolesPageRoute() {
  const {
    roles,
    isLoading,
    error,
    refetch,
    createRole,
    disableRole,
    deleteRole,
    isCreatingRole,
    disablingRoleId,
    deletingRoleId,
  } = useAdminRolesPage()

  return (
    <RolesPage
      roles={roles}
      isLoading={isLoading}
      isCreatingRole={isCreatingRole}
      disablingRoleId={disablingRoleId}
      deletingRoleId={deletingRoleId}
      errorMessage={error instanceof Error ? error.message : ''}
      onCreateRole={createRole}
      onDisableRole={(roleId) => disableRole({ roleId })}
      onDeleteRole={(roleId) => deleteRole({ roleId })}
      onRetry={() => {
        void refetch()
      }}
    />
  )
}
