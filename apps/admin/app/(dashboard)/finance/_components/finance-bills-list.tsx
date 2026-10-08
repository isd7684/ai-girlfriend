import { Pencil, Trash2 } from 'lucide-react'
import type { FinancialBillListItem } from '@repo/contracts'
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
import { formatAdminDateTime } from '@/lib/admin-ui'

type FinanceBillsListProps = {
  bills: FinancialBillListItem[]
  editingBillId: string | null
  deletingBillId: string | null
  onEditBill: (bill: FinancialBillListItem) => void
  onDeleteBill: (bill: FinancialBillListItem) => void
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(cents / 100)
}

export function FinanceBillsList({ bills, editingBillId, deletingBillId, onEditBill, onDeleteBill }: FinanceBillsListProps) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Table>
        <TableHeader className="[&_tr]:border-border/80">
          <TableRow>
            <TableHead>微信昵称</TableHead>
            <TableHead>邮箱</TableHead>
            <TableHead>付费金额</TableHead>
            <TableHead>付费时间</TableHead>
            <TableHead>是否退款</TableHead>
            <TableHead>退款金额</TableHead>
            <TableHead>净收益</TableHead>
            <TableHead className="w-[104px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => (
            <TableRow key={bill.id} className="border-border/80">
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium leading-none text-foreground">{bill.wechatNickname}</p>
                  {bill.note ? <p className="text-xs text-muted-foreground">{bill.note}</p> : null}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{bill.email}</TableCell>
              <TableCell className="font-medium">{formatMoney(bill.paidAmountCents)}</TableCell>
              <TableCell className="text-muted-foreground">{formatAdminDateTime(bill.paidAtMs)}</TableCell>
              <TableCell>
                {bill.isRefunded ? (
                  <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                    已退款
                  </Badge>
                ) : (
                  <Badge variant="secondary">未退款</Badge>
                )}
              </TableCell>
              <TableCell className={bill.refundAmountCents > 0 ? 'text-rose-700' : 'text-muted-foreground'}>
                {formatMoney(bill.refundAmountCents)}
              </TableCell>
              <TableCell className={bill.netRevenueCents >= 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>
                {formatMoney(bill.netRevenueCents)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={editingBillId === bill.id}
                    onClick={() => onEditBill(bill)}
                    title="编辑账单"
                    aria-label="编辑账单"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={deletingBillId === bill.id}
                    onClick={() => onDeleteBill(bill)}
                    title="删除账单"
                    aria-label="删除账单"
                  >
                    <Trash2 className="size-4" />
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
