"use client"

import { UsersPage } from './_components/users-page'
import { useAdminUsersPage } from './hooks/use-admin-users-page'

export default function UsersPageRoute() {
  const {
    users,
    page,
    total,
    totalPages,
    canPrev,
    canNext,
    setPage,
    prevPage,
    nextPage,
    assignableRoles,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminUsersPage()

  async function handleUsersRefresh() {
    await refetch()
  }

  return (
    <UsersPage
      users={users}
      page={page}
      total={total}
      totalPages={totalPages}
      canPrev={canPrev}
      canNext={canNext}
      assignableRoles={assignableRoles}
      onPageChange={setPage}
      onPrevPage={prevPage}
      onNextPage={nextPage}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error instanceof Error ? error.message : 'Request failed'}
      onUsersChanged={() => {
        void handleUsersRefresh()
      }}
      onRetry={() => {
        void refetch()
      }}
    />
  )
}
