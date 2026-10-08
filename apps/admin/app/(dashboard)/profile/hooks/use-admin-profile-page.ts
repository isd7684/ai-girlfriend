"use client"

import { useAdminDashboardContext } from '@/components/admin-dashboard-guard'

export function useAdminProfilePage() {
  return useAdminDashboardContext()
}
