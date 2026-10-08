import type { AdminAuthSession, UserProfileResponse } from '@repo/contracts'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@repo/ui/field'
import { formatAdminDateTime } from '@/lib/admin-ui'

type ProfileDetailsProps = {
  profile: UserProfileResponse
  session: AdminAuthSession
}

const horizontalFieldClassName = 'grid-cols-1 gap-y-1 md:grid-cols-[minmax(0,140px)_minmax(0,1fr)]'

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

export function ProfileDetails({ profile, session }: ProfileDetailsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>Core account details and assigned access for this user.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field orientation="horizontal" className={horizontalFieldClassName}>
              <FieldLabel>User ID</FieldLabel>
              <FieldContent>
                <div className="break-all font-mono text-xs text-foreground md:text-sm">{profile.id}</div>
              </FieldContent>
            </Field>

            <Field orientation="horizontal" className={horizontalFieldClassName}>
              <FieldLabel>Primary email</FieldLabel>
              <FieldContent>
                <div className="break-all text-sm text-foreground">{profile.email}</div>
              </FieldContent>
            </Field>

            <Field orientation="horizontal" className={horizontalFieldClassName}>
              <FieldLabel>Status</FieldLabel>
              <FieldContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getStatusVariant(profile.status)}>{formatStatus(profile.status)}</Badge>
                </div>
              </FieldContent>
            </Field>

            <Field orientation="horizontal" className={horizontalFieldClassName}>
              <FieldLabel>Roles</FieldLabel>
              <FieldContent>
                <div className="flex flex-wrap gap-2">
                  {profile.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))}
                </div>
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Runtime values from the current authenticated browser session.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-5">
              <Field orientation="horizontal" className={horizontalFieldClassName}>
                <FieldLabel>Session ID</FieldLabel>
                <FieldContent>
                  <div className="break-all font-mono text-xs text-foreground md:text-sm">{session.sessionId}</div>
                </FieldContent>
              </Field>

              <Field orientation="horizontal" className={horizontalFieldClassName}>
                <FieldLabel>Session roles</FieldLabel>
                <FieldContent>
                  <div className="flex flex-wrap gap-2">
                    {session.roles.map((role) => (
                      <Badge key={role} variant="outline">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </FieldContent>
              </Field>

              <Field orientation="horizontal" className={horizontalFieldClassName}>
                <FieldLabel>Session expires</FieldLabel>
                <FieldContent>
                  <div className="text-sm text-foreground">{formatAdminDateTime(session.expiresAtMs)}</div>
                </FieldContent>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>How this page stays in sync with the active admin session.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldDescription>
              This page reflects the current profile payload returned by the authenticated browser session. When the access token expires, the shared HTTP client refreshes it before retrying the request.
            </FieldDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
