import type { UserProfileResponse } from '@repo/contracts'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { Separator } from '@repo/ui/separator'
import { formatOptionalAdminDateTime } from '@/lib/admin-ui'

type ProfileSummaryProps = {
  profile: UserProfileResponse
}

function getStatusVariant(status: UserProfileResponse['status']): 'secondary' | 'outline' {
  switch (status) {
    case 'active':
      return 'secondary'
    case 'suspended':
      return 'outline'
    default:
      return 'outline'
  }
}

function formatStatus(status: UserProfileResponse['status']) {
  return `${status.slice(0, 1).toUpperCase()}${status.slice(1)}`
}

export function ProfileSummary({ profile }: ProfileSummaryProps) {
  const summaryItems = [
    { label: 'Last login', value: formatOptionalAdminDateTime(profile.lastLoginAtMs) },
    { label: 'Created at', value: formatOptionalAdminDateTime(profile.createdAtMs) },
    { label: 'Updated at', value: formatOptionalAdminDateTime(profile.updatedAtMs) },
  ]

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Overview</CardTitle>
            <CardDescription>Account metadata and recent activity.</CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{profile.email}</Badge>
            <Badge variant={getStatusVariant(profile.status)}>{formatStatus(profile.status)}</Badge>
            {profile.roles.map((role) => (
              <Badge key={role} variant="secondary">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Separator />

        <div className="grid gap-4 md:grid-cols-3">
          {summaryItems.map((item) => (
            <Card key={item.label} className="shadow-none">
              <CardHeader className="pb-2">
                <CardDescription>{item.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-foreground">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
