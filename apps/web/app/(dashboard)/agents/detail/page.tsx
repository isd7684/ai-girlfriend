import { Suspense } from "react"

import { DashboardShell } from "../../_components/dashboard-shell"
import { AgentDetailClient } from "./_components/agent-detail-client"

function AgentDetailFallback() {
  return (
    <DashboardShell title="Agent 详情">
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50/70 px-5 py-5 lg:px-8">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="h-[36rem] animate-pulse rounded-2xl bg-white" />
          <div className="h-80 animate-pulse rounded-2xl bg-white" />
        </div>
        <p className="sr-only">正在加载 Agent 详情</p>
      </main>
    </DashboardShell>
  )
}

export default function AgentDetailPage() {
  return (
    <Suspense fallback={<AgentDetailFallback />}>
      <AgentDetailClient />
    </Suspense>
  )
}
