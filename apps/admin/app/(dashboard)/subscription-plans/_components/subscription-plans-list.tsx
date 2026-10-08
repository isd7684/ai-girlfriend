import type { SubscriptionPlanListItem } from '@repo/contracts'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/table'

type SubscriptionPlansListProps = {
  plans: SubscriptionPlanListItem[]
  updatingPlanId: string | null
  disablingPlanId: string | null
  deletingPlanId: string | null
  onEditPlan: (plan: SubscriptionPlanListItem) => void
  onDisablePlan: (planId: string) => void
  onDeletePlan: (planId: string) => void
}

export function SubscriptionPlansList({ plans, updatingPlanId, disablingPlanId, deletingPlanId, onEditPlan, onDisablePlan, onDeletePlan }: SubscriptionPlansListProps) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Table>
        <TableHeader className="[&_tr]:border-border/80">
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>名称</TableHead>
            <TableHead>价格</TableHead>
            <TableHead>周期</TableHead>
            <TableHead>Agent 数量</TableHead>
            <TableHead>能力</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="w-[240px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id} className="border-border/80">
              <TableCell className="font-mono text-xs text-muted-foreground">{plan.code}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p>{plan.name}</p>
                  {plan.description ? <p className="text-xs text-muted-foreground">{plan.description}</p> : null}
                </div>
              </TableCell>
              <TableCell>{plan.price}</TableCell>
              <TableCell>{plan.billingPeriod}</TableCell>
              <TableCell>{plan.maxAgents}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {plan.supportsGroupChat ? <Badge variant="secondary">群聊</Badge> : null}
                  {plan.supportsMultiAgentLinkage ? <Badge variant="secondary">多 Agent 联动</Badge> : null}
                  {plan.supportsDiscoverSquare ? <Badge variant="secondary">广场寻觅</Badge> : null}
                  {plan.supportsAgentTimeEvolution ? <Badge variant="secondary">时间演变</Badge> : null}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={plan.status === 'active' ? 'secondary' : 'outline'}>{plan.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={updatingPlanId === plan.id} onClick={() => onEditPlan(plan)}>
                    {updatingPlanId === plan.id ? '编辑中...' : '编辑'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={plan.status !== 'active' || disablingPlanId === plan.id} onClick={() => onDisablePlan(plan.id)}>
                    {disablingPlanId === plan.id ? '禁用中...' : '禁用'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={deletingPlanId === plan.id} onClick={() => onDeletePlan(plan.id)}>
                    {deletingPlanId === plan.id ? '删除中...' : '删除'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
