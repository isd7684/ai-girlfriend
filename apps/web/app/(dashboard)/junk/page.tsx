import { DashboardShell } from "../_components/dashboard-shell"

export default function JunkPage() {
  return (
    <DashboardShell title="Junk">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Junk</h1>
        <p className="mt-2 text-sm text-muted-foreground">Junk 页面占位内容。</p>
      </div>
    </DashboardShell>
  )
}
