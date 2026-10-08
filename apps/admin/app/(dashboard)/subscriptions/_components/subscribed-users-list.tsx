import type { SubscriptionUserListItem } from '@repo/contracts'
import { Badge } from '@repo/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/table'
import { formatAdminDateTime } from '@/lib/admin-ui'

type SubscribedUsersListProps = {
  subscriptions: SubscriptionUserListItem[]
}

function formatBillingPeriod(period: SubscriptionUserListItem['planBillingPeriod']) {
  if (period === 'month') {
    return '按月付费'
  }

  if (period === 'year') {
    return '按年付费'
  }

  return '一次性付费'
}

export function SubscribedUsersList({ subscriptions }: SubscribedUsersListProps) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Table>
        <TableHeader className="[&_tr]:border-border/80">
          <TableRow>
            <TableHead>用户</TableHead>
            <TableHead>邮箱</TableHead>
            <TableHead>套餐</TableHead>
            <TableHead>价格 / 周期</TableHead>
            <TableHead>分配时间</TableHead>
            <TableHead>操作人 ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription.id} className="border-border/80">
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium leading-none text-foreground">{subscription.userName}</p>
                  <p className="font-mono text-xs text-muted-foreground">{subscription.userId}</p>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm text-muted-foreground">{subscription.userEmail}</p>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p>{subscription.planName}</p>
                  <Badge variant="secondary">{subscription.planCode}</Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p>{subscription.planPrice}</p>
                  <p className="text-xs text-muted-foreground">{formatBillingPeriod(subscription.planBillingPeriod)}</p>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatAdminDateTime(subscription.assignedAtMs)}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{subscription.assignedByUserId ?? '系统'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
