import { DashboardShell } from "../_components/dashboard-shell"

export default function SentPage() {
  return (
    <DashboardShell title="Sent">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Sent</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sent 页面占位内容。</p>
      </div>
    </DashboardShell>
  )
}
