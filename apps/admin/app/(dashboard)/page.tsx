"use client"

import { AdminDashboardMain } from '@/components/admin-dashboard-main'
import { useAdminDashboardContext } from '@/components/admin-dashboard-guard'

export default function Home() {
  const { profile } = useAdminDashboardContext()

  return <AdminDashboardMain profile={profile} />
}
