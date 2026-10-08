"use client"

import { SubscriptionPlansPage } from './_components/subscription-plans-page'
import { useAdminSubscriptionPlansPage } from './hooks/use-admin-subscription-plans-page'

export default function SubscriptionPlansPageRoute() {
  const {
    plans,
    isLoading,
    error,
    refetch,
    createPlan,
    updatePlan,
    disablePlan,
    deletePlan,
    isCreatingPlan,
    updatingPlanId,
    disablingPlanId,
    deletingPlanId,
  } = useAdminSubscriptionPlansPage()

  return (
    <SubscriptionPlansPage
      plans={plans}
      isLoading={isLoading}
      isCreatingPlan={isCreatingPlan}
      updatingPlanId={updatingPlanId}
      disablingPlanId={disablingPlanId}
      deletingPlanId={deletingPlanId}
      errorMessage={error instanceof Error ? error.message : ''}
      onCreatePlan={createPlan}
      onUpdatePlan={updatePlan}
      onDisablePlan={(planId) => disablePlan({ planId })}
      onDeletePlan={(planId) => deletePlan({ planId })}
      onRetry={() => {
        void refetch()
      }}
    />
  )
}
