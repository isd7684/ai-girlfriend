"use client"

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFinancialBill, deleteFinancialBill, getFinancialBills, updateFinancialBill } from '../api'

const financeQueryKey = ['dashboard', 'finance', 'bills'] as const

export function useAdminFinancePage() {
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>()
  const queryClient = useQueryClient()

  const billsQuery = useQuery({
    queryKey: [...financeQueryKey, selectedMonth ?? 'latest'],
    queryFn: () => getFinancialBills(selectedMonth),
  })

  useEffect(() => {
    if (!selectedMonth && billsQuery.data?.selectedMonth) {
      setSelectedMonth(billsQuery.data.selectedMonth)
    }
  }, [billsQuery.data?.selectedMonth, selectedMonth])

  const createMutation = useMutation({
    mutationFn: createFinancialBill,
    onSuccess: async (_data, input) => {
      setSelectedMonth(input.billingMonth)
      await queryClient.invalidateQueries({ queryKey: financeQueryKey })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateFinancialBill,
    onSuccess: async (_data, input) => {
      setSelectedMonth(input.billingMonth)
      await queryClient.invalidateQueries({ queryKey: financeQueryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFinancialBill,
    onSuccess: async () => {
      setSelectedMonth(undefined)
      await queryClient.invalidateQueries({ queryKey: financeQueryKey })
    },
  })

  return {
    selectedMonth: selectedMonth ?? billsQuery.data?.selectedMonth ?? '',
    setSelectedMonth,
    months: billsQuery.data?.months ?? [],
    bills: billsQuery.data?.items ?? [],
    totalPaidAmountCents: billsQuery.data?.totalPaidAmountCents ?? 0,
    totalRefundAmountCents: billsQuery.data?.totalRefundAmountCents ?? 0,
    totalNetRevenueCents: billsQuery.data?.totalNetRevenueCents ?? 0,
    isLoading: billsQuery.isLoading,
    error: billsQuery.error,
    refetch: billsQuery.refetch,
    createBill: createMutation.mutateAsync,
    isCreatingBill: createMutation.isPending,
    updateBill: updateMutation.mutateAsync,
    isUpdatingBill: updateMutation.isPending,
    deleteBill: deleteMutation.mutateAsync,
    deletingBillId: deleteMutation.variables?.billId ?? null,
  }
}
