import type { UserProfileResponse } from '@repo/contracts'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { Progress } from '@repo/ui/progress'
import { formatAdminDate, getAdminAccentStyle } from '@/lib/admin-ui'

type DashboardMetric = {
  label: string
  value: string
  hint: string
  trend: 'up' | 'down' | 'neutral'
}

type DashboardTaskAccent = 'amber' | 'sky' | 'mint'

type DashboardTask = {
  id: string
  title: string
  status: 'In progress' | 'On hold' | 'Done'
  duration: string
  accent: DashboardTaskAccent
}

type AdminDashboardMainProps = {
  profile: UserProfileResponse
}

const metrics: DashboardMetric[] = [
  { label: 'Active personas', value: '18', hint: '+3 tuned today', trend: 'up' },
  { label: 'Tracked sessions', value: '31h', hint: '-6h manual review', trend: 'down' },
  { label: 'Memory sync', value: '93%', hint: '+12% health', trend: 'up' },
]

const tasks: DashboardTask[] = [
  { id: '1', title: 'Persona review for companion “Mira”', status: 'In progress', duration: '4h', accent: 'amber' },
  { id: '2', title: 'Memory policy calibration for new users', status: 'On hold', duration: '8h', accent: 'sky' },
  { id: '3', title: 'Safety response audit for emotional prompts', status: 'Done', duration: '32h', accent: 'mint' },
]

function trendBadgeVariant(trend: DashboardMetric['trend']) {
  if (trend === 'up') return 'secondary'
  if (trend === 'down') return 'outline'
  return 'outline'
}

function trendLabel(trend: DashboardMetric['trend']) {
  if (trend === 'up') return 'Rising'
  if (trend === 'down') return 'Falling'
  return 'Stable'
}

function taskBadgeVariant(status: DashboardTask['status']) {
  if (status === 'Done') return 'secondary'
  if (status === 'On hold') return 'outline'
  return 'outline'
}

export function AdminDashboardMain({ profile }: AdminDashboardMainProps) {
  const completedRatio = 30

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-3xl md:text-4xl">Hello, {profile.name}</CardTitle>
            <CardDescription className="max-w-2xl text-sm md:text-base">
              Track AI companion health, persona quality, and memory operations in a single workspace.
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit px-3 py-1.5 text-sm">
            {formatAdminDate(new Date())}
          </Badge>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
                <span className="text-sm font-semibold">{metric.value}</span>
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-foreground">{metric.label}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-2xl font-semibold text-foreground">{metric.value}</p>
                  <Badge variant={trendBadgeVariant(metric.trend)} className="rounded-full px-2.5 py-1 text-[11px]">
                    {trendLabel(metric.trend)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{metric.hint}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Weekly comparison of AI companion operations time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">This month</p>
                  <p className="text-3xl font-semibold text-foreground">7h</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Last month</p>
                  <p className="text-3xl font-semibold text-foreground">6h</p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Review load</p>
                <p className="mt-2 text-xl font-semibold text-foreground">Moderate</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Escalations</p>
                <p className="mt-2 text-xl font-semibold text-foreground">2 open</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Quality score</p>
                <p className="mt-2 text-xl font-semibold text-foreground">91 / 100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>Current tasks</CardTitle>
                <CardDescription>Track the main work items in this workspace.</CardDescription>
              </div>
              <Badge variant="outline">Week</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>Done {completedRatio}%</span>
                <span>{tasks.length} tasks</span>
              </div>
              <Progress value={completedRatio} className="h-2" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task, index) => {
              const accentStyle = getAdminAccentStyle(task.accent)

              return (
                <Card key={task.id}>
                  <CardContent className="grid gap-4 pt-6 md:grid-cols-[48px_minmax(0,1fr)_140px_72px_40px] md:items-center">
                    <div className={`flex size-12 items-center justify-center rounded-full text-sm font-semibold ${accentStyle.className}`}>
                      {index + 1}
                    </div>
                    <p className="text-sm font-medium text-foreground md:text-base">{task.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={`inline-block size-2 rounded-full ${accentStyle.dotClassName}`} />
                      <Badge variant={taskBadgeVariant(task.status)} className="rounded-full px-2.5 py-1 text-[11px]">
                        {task.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">{task.duration}</p>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Open task actions">
                      <span className="text-lg leading-none">…</span>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
