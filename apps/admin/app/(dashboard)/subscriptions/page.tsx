"use client"

import { SubscriptionsPage } from './_components/subscriptions-page'
import { useAdminSubscriptionsPage } from './hooks/use-admin-subscriptions-page'

export default function SubscriptionsPageRoute() {
  const {
    subscriptions,
    users,
    plans,
    page,
    total,
    totalPages,
    canPrev,
    canNext,
    isLoading,
    error,
    refetch,
    assignSubscription,
    isAssigningSubscription,
    setPage,
    prevPage,
    nextPage,
  } = useAdminSubscriptionsPage()

  return (
    <SubscriptionsPage
      subscriptions={subscriptions}
      users={users}
      plans={plans}
      page={page}
      total={total}
      totalPages={totalPages}
      canPrev={canPrev}
      canNext={canNext}
      isLoading={isLoading}
      errorMessage={error instanceof Error ? error.message : ''}
      isAssigningSubscription={isAssigningSubscription}
      onAssignSubscription={assignSubscription}
      onPageChange={setPage}
      onPrevPage={prevPage}
      onNextPage={nextPage}
      onRetry={() => {
        void refetch()
      }}
    />
  )
}
