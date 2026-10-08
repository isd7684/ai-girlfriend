"use client"

import { FinancePage } from './_components/finance-page'
import { useAdminFinancePage } from './hooks/use-admin-finance-page'

export default function FinancePageRoute() {
  const {
    selectedMonth,
    setSelectedMonth,
    months,
    bills,
    totalPaidAmountCents,
    totalRefundAmountCents,
    totalNetRevenueCents,
    isLoading,
    error,
    refetch,
    createBill,
    isCreatingBill,
    updateBill,
    isUpdatingBill,
    deleteBill,
    deletingBillId,
  } = useAdminFinancePage()

  return (
    <FinancePage
      selectedMonth={selectedMonth}
      months={months}
      bills={bills}
      totalPaidAmountCents={totalPaidAmountCents}
      totalRefundAmountCents={totalRefundAmountCents}
      totalNetRevenueCents={totalNetRevenueCents}
      isLoading={isLoading}
      isCreatingBill={isCreatingBill}
      isUpdatingBill={isUpdatingBill}
      errorMessage={error instanceof Error ? error.message : ''}
      onMonthChange={setSelectedMonth}
      onCreateBill={createBill}
      onUpdateBill={updateBill}
      onDeleteBill={deleteBill}
      deletingBillId={deletingBillId}
      onRetry={() => {
        void refetch()
      }}
    />
  )
}
