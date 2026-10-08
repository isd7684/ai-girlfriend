"use client"

import { WebDashboardGuard } from '@/components/web-dashboard-guard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <WebDashboardGuard>{children}</WebDashboardGuard>
}
