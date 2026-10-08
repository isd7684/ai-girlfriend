"use client"

import { useEffect, useMemo, useState } from 'react'
import type { CreateFinancialBillRequest, DeleteFinancialBillRequest, FinancialBillListItem, FinancialBillMonth, UpdateFinancialBillRequest } from '@repo/contracts'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Spinner } from '@repo/ui/spinner'
import { Switch } from '@repo/ui/switch'
import { FinanceBillsList } from './finance-bills-list'

type FinancePageProps = {
  selectedMonth: string
  months: FinancialBillMonth[]
  bills: FinancialBillListItem[]
  totalPaidAmountCents: number
  totalRefundAmountCents: number
  totalNetRevenueCents: number
  isLoading: boolean
  isCreatingBill: boolean
  isUpdatingBill: boolean
  errorMessage: string
  deletingBillId: string | null
  onMonthChange: (month: string) => void
  onCreateBill: (input: CreateFinancialBillRequest) => Promise<unknown>
  onUpdateBill: (input: UpdateFinancialBillRequest) => Promise<unknown>
  onDeleteBill: (input: DeleteFinancialBillRequest) => Promise<unknown>
  onRetry: () => void
}

type FinanceBillForm = {
  wechatNickname: string
  email: string
  paidAmount: string
  paidAt: string
  isRefunded: boolean
  refundAmount: string
  note: string
}

function toLocalDateTimeInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function toMonthDateTimeInputValue(month?: string) {
  if (!month) {
    return toLocalDateTimeInputValue(new Date())
  }

  const now = new Date()
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')

  return `${month}-01T${hour}:${minute}`
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(cents / 100)
}

function centsToYuanValue(cents: number) {
  return (cents / 100).toFixed(2)
}

function yuanToCents(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return 0
  }

  const amount = Number(normalized)

  if (!Number.isFinite(amount)) {
    return 0
  }

  return Math.round(amount * 100)
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split('-')
  return `${year} 年 ${Number(monthNumber)} 月`
}

export function FinancePage({ selectedMonth, months, bills, totalPaidAmountCents, totalRefundAmountCents, totalNetRevenueCents, isLoading, isCreatingBill, isUpdatingBill, errorMessage, deletingBillId, onMonthChange, onCreateBill, onUpdateBill, onDeleteBill, onRetry }: FinancePageProps) {
  const [editingBillId, setEditingBillId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [form, setForm] = useState<FinanceBillForm>({
    wechatNickname: '',
    email: '',
    paidAmount: '',
    paidAt: toLocalDateTimeInputValue(new Date()),
    isRefunded: false,
    refundAmount: '',
    note: '',
  })
  const activeMonth = useMemo(
    () => months.find((month) => month.month === selectedMonth),
    [months, selectedMonth],
  )
  const formPaidAmountCents = yuanToCents(form.paidAmount)
  const formRefundAmountCents = form.isRefunded ? yuanToCents(form.refundAmount) : 0
  const isSavingBill = isCreatingBill || isUpdatingBill
  const canSubmit = Boolean(form.wechatNickname.trim())
    && Boolean(form.email.trim())
    && formPaidAmountCents > 0
    && Number.isFinite(new Date(form.paidAt).getTime())
    && formRefundAmountCents <= formPaidAmountCents

  useEffect(() => {
    if (!selectedMonth || editingBillId) {
      return
    }

    setForm((current) => {
      const isEmptyDraft = !current.wechatNickname.trim()
        && !current.email.trim()
        && !current.paidAmount.trim()
        && !current.refundAmount.trim()
        && !current.note.trim()

      if (!isEmptyDraft || current.paidAt.slice(0, 7) === selectedMonth) {
        return current
      }

      return {
        ...current,
        paidAt: toMonthDateTimeInputValue(selectedMonth),
      }
    })
  }, [editingBillId, selectedMonth])

  function resetForm(month = selectedMonth) {
    setEditingBillId(null)
    setForm({
      wechatNickname: '',
      email: '',
      paidAmount: '',
      paidAt: toMonthDateTimeInputValue(month),
      isRefunded: false,
      refundAmount: '',
      note: '',
    })
  }

  function handleMonthChange(month: string) {
    onMonthChange(month)
    resetForm(month)
    setFeedback(null)
  }

  function startEditBill(bill: FinancialBillListItem) {
    setFeedback(null)
    onMonthChange(bill.billingMonth)
    setEditingBillId(bill.id)
    setForm({
      wechatNickname: bill.wechatNickname,
      email: bill.email,
      paidAmount: centsToYuanValue(bill.paidAmountCents),
      paidAt: toLocalDateTimeInputValue(new Date(bill.paidAtMs)),
      isRefunded: bill.isRefunded,
      refundAmount: bill.isRefunded ? centsToYuanValue(bill.refundAmountCents) : '',
      note: bill.note ?? '',
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    if (!canSubmit) {
      setFeedback('请检查昵称、邮箱、付费金额与退款金额。')
      return
    }

    try {
      const payload = {
        wechatNickname: form.wechatNickname,
        email: form.email,
        paidAmountCents: formPaidAmountCents,
        paidAtMs: new Date(form.paidAt).getTime(),
        billingMonth: form.paidAt.slice(0, 7),
        isRefunded: form.isRefunded,
        refundAmountCents: formRefundAmountCents,
        note: form.note,
      }

      if (editingBillId) {
        await onUpdateBill({
          ...payload,
          billId: editingBillId,
        })
        setFeedback('账单收入已更新。')
      } else {
        await onCreateBill(payload)
        setFeedback('账单收入已新增。')
      }

      resetForm()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '保存账单失败。')
    }
  }

  async function handleDeleteBill(bill: FinancialBillListItem) {
    setFeedback(null)

    try {
      await onDeleteBill({ billId: bill.id })
      if (editingBillId === bill.id) {
        resetForm(bill.billingMonth)
      }
      setFeedback('账单收入已删除。')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '删除账单失败。')
    }
  }

  function renderMonthSummary() {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-border p-3">
          <p className="text-xs text-muted-foreground">付费总额</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{formatMoney(totalPaidAmountCents)}</p>
        </div>
        <div className="rounded-md border border-border p-3">
          <p className="text-xs text-muted-foreground">退款总额</p>
          <p className="mt-1 text-lg font-semibold text-rose-700">{formatMoney(totalRefundAmountCents)}</p>
        </div>
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs text-emerald-700">实际总收益</p>
          <p className="mt-1 text-lg font-semibold text-emerald-800">{formatMoney(totalNetRevenueCents)}</p>
        </div>
      </div>
    )
  }

  function renderBillForm(title: string, description: string) {
    return (
      <div className="space-y-3 border-t border-border pt-5">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label>微信昵称</Label>
            <Input
              value={form.wechatNickname}
              onChange={(event) => setForm((current) => ({ ...current, wechatNickname: event.target.value }))}
              placeholder="例如：小杨"
              disabled={isSavingBill}
            />
          </div>
          <div className="grid gap-2">
            <Label>邮箱</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="user@example.com"
              disabled={isSavingBill}
            />
          </div>
          <div className="grid gap-2">
            <Label>付费金额（元）</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.paidAmount}
              onChange={(event) => setForm((current) => ({ ...current, paidAmount: event.target.value }))}
              placeholder="400.00"
              disabled={isSavingBill}
            />
          </div>
          <div className="grid gap-2">
            <Label>付费时间</Label>
            <Input
              type="datetime-local"
              value={form.paidAt}
              onChange={(event) => setForm((current) => ({ ...current, paidAt: event.target.value }))}
              disabled={isSavingBill}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
            <div className="space-y-0.5">
              <Label>是否退款</Label>
              <p className="text-xs text-muted-foreground">开启后填写退款金额</p>
            </div>
            <Switch
              checked={form.isRefunded}
              onCheckedChange={(checked) => setForm((current) => ({
                ...current,
                isRefunded: checked,
                refundAmount: checked ? current.refundAmount : '',
              }))}
              disabled={isSavingBill}
            />
          </div>
          <div className="grid gap-2">
            <Label>退款金额（元）</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.refundAmount}
              onChange={(event) => setForm((current) => ({ ...current, refundAmount: event.target.value }))}
              placeholder="0.00"
              disabled={isSavingBill || !form.isRefunded}
            />
          </div>
          <div className="grid gap-2 xl:col-span-2">
            <Label>备注</Label>
            <Input
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              placeholder="可填写套餐、渠道或人工备注"
              disabled={isSavingBill}
            />
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-4">
            <Button type="submit" disabled={isSavingBill || !canSubmit}>
              {isSavingBill ? '保存中...' : editingBillId ? '保存账单' : '新增账单收入'}
            </Button>
            {editingBillId ? (
              <Button type="button" variant="outline" disabled={isSavingBill} onClick={resetForm}>
                取消编辑
              </Button>
            ) : null}
          </div>
        </form>
        {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Finance
            </div>
            <div className="space-y-1">
              <CardTitle>财务管理</CardTitle>
              <CardDescription>按月份记录账单收入、退款金额，并在每个账单月份内计算实际总收益。</CardDescription>
            </div>
          </div>
          {activeMonth ? (
            <Badge variant="secondary">
              当前月份 · {formatMonthLabel(activeMonth.month)} · {activeMonth.billCount} 条
            </Badge>
          ) : null}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle>月度账单</CardTitle>
            <CardDescription>先选择月份，再在该月份下新增、编辑和查看账单。</CardDescription>
          </div>
          {activeMonth ? (
            <Badge variant="secondary">
              净收益 {formatMoney(activeMonth.netRevenueCents)}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent>
          {errorMessage ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <div>
                <Button type="button" variant="outline" onClick={onRetry}>重试</Button>
              </div>
            </div>
          ) : (
            <Spinner loading={isLoading} label="Loading financial bills..." className="rounded-md">
              {months.length === 0 ? (
                <div className="space-y-5">
                  {renderMonthSummary()}
                  {renderBillForm('新增第一条账单收入', '收入会根据付费时间自动创建对应月份 tab。')}
                  <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无账单收入，新增第一条账单后会自动出现月份 tab。
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex gap-2 overflow-x-auto border-b border-border pb-2">
                    {months.map((month) => (
                      <button
                        key={month.month}
                        type="button"
                        className={[
                          'shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                          selectedMonth === month.month
                            ? 'border-foreground text-foreground'
                            : 'border-transparent text-muted-foreground hover:text-foreground',
                        ].join(' ')}
                        onClick={() => handleMonthChange(month.month)}
                      >
                        {formatMonthLabel(month.month)}
                      </button>
                    ))}
                  </div>

                  {renderMonthSummary()}
                  {renderBillForm(
                    `${formatMonthLabel(selectedMonth)} · ${editingBillId ? '编辑账单收入' : '新增账单收入'}`,
                    editingBillId ? '保存后会按照新的付费时间重新归入对应月份。' : '新增收入会根据付费时间归入对应月份。',
                  )}

                  {bills.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      当前月份暂无账单。
                    </div>
                  ) : (
                    <FinanceBillsList
                      bills={bills}
                      editingBillId={editingBillId}
                      deletingBillId={deletingBillId}
                      onEditBill={startEditBill}
                      onDeleteBill={(bill) => {
                        void handleDeleteBill(bill)
                      }}
                    />
                  )}
                </div>
              )}
            </Spinner>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
