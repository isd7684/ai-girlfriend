"use client"

import { useState } from 'react'
import type { CreateSubscriptionPlanRequest, SubscriptionPlanListItem, UpdateSubscriptionPlanRequest } from '@repo/contracts'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Spinner } from '@repo/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select'
import { SubscriptionPlansList } from './subscription-plans-list'

type SubscriptionPlansPageProps = {
  plans: SubscriptionPlanListItem[]
  isLoading: boolean
  isCreatingPlan: boolean
  updatingPlanId: string | null
  disablingPlanId: string | null
  deletingPlanId: string | null
  errorMessage: string
  onCreatePlan: (input: CreateSubscriptionPlanRequest) => Promise<unknown>
  onUpdatePlan: (input: UpdateSubscriptionPlanRequest) => Promise<unknown>
  onDisablePlan: (planId: string) => Promise<unknown>
  onDeletePlan: (planId: string) => Promise<unknown>
  onRetry: () => void
}

export function SubscriptionPlansPage({ plans, isLoading, isCreatingPlan, updatingPlanId, disablingPlanId, deletingPlanId, errorMessage, onCreatePlan, onUpdatePlan, onDisablePlan, onDeletePlan, onRetry }: SubscriptionPlansPageProps) {
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [form, setForm] = useState<CreateSubscriptionPlanRequest>({
    code: '',
    name: '',
    description: '',
    price: '',
    billingPeriod: 'month',
    maxAgents: 0,
    supportsGroupChat: false,
    supportsMultiAgentLinkage: false,
    supportsDiscoverSquare: false,
    supportsAgentTimeEvolution: false,
  })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    try {
      if (editingPlanId) {
        await onUpdatePlan({
          planId: editingPlanId,
          name: form.name,
          description: form.description,
          price: form.price,
          billingPeriod: form.billingPeriod,
          maxAgents: form.maxAgents,
          supportsGroupChat: form.supportsGroupChat,
          supportsMultiAgentLinkage: form.supportsMultiAgentLinkage,
          supportsDiscoverSquare: form.supportsDiscoverSquare,
          supportsAgentTimeEvolution: form.supportsAgentTimeEvolution,
        })
        setFeedback('Plan updated.')
      } else {
        await onCreatePlan(form)
        setFeedback('Plan created.')
      }

      setEditingPlanId(null)
      setForm({
        code: '',
        name: '',
        description: '',
        price: '',
        billingPeriod: 'month',
        maxAgents: 0,
        supportsGroupChat: false,
        supportsMultiAgentLinkage: false,
        supportsDiscoverSquare: false,
        supportsAgentTimeEvolution: false,
      })
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to save plan.')
    }
  }

  function startEdit(plan: SubscriptionPlanListItem) {
    setEditingPlanId(plan.id)
    setForm({
      code: plan.code,
      name: plan.name,
      description: plan.description ?? '',
      price: plan.price,
      billingPeriod: plan.billingPeriod,
      maxAgents: plan.maxAgents,
      supportsGroupChat: plan.supportsGroupChat,
      supportsMultiAgentLinkage: plan.supportsMultiAgentLinkage,
      supportsDiscoverSquare: plan.supportsDiscoverSquare,
      supportsAgentTimeEvolution: plan.supportsAgentTimeEvolution,
    })
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <Card>
        <CardHeader>
          <CardTitle>套餐管理</CardTitle>
          <CardDescription>管理套餐基础信息与固定能力开关。</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingPlanId ? '编辑套餐' : '创建套餐'}</CardTitle>
          <CardDescription>填写套餐的唯一编码、展示信息、价格周期，以及用户购买后可使用的能力。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label>套餐编码：唯一标识，创建后不可修改</Label>
              <Input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} disabled={isCreatingPlan || !!editingPlanId} />
            </div>
            <div className="grid gap-2">
              <Label>套餐名称：展示给用户看的名称</Label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} disabled={isCreatingPlan} />
            </div>
            <div className="grid gap-2">
              <Label>套餐价格：请输入金额，如 99.00</Label>
              <Input value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} disabled={isCreatingPlan} />
            </div>
            <div className="grid gap-2">
              <Label>计费周期：选择套餐收费方式</Label>
              <Select value={form.billingPeriod} onValueChange={(value) => setForm((current) => ({ ...current, billingPeriod: value as CreateSubscriptionPlanRequest['billingPeriod'] }))} disabled={isCreatingPlan}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">按月付费</SelectItem>
                  <SelectItem value="year">按年付费</SelectItem>
                  <SelectItem value="one_time">一次性付费</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>支持创建多少个 Agent：填写用户最多可创建的 Agent 数量</Label>
              <Input
                type="number"
                min={0}
                value={String(form.maxAgents)}
                onChange={(event) => setForm((current) => ({ ...current, maxAgents: Number(event.target.value || 0) }))}
                disabled={isCreatingPlan}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>套餐说明：补充介绍套餐适合的场景或权益</Label>
              <Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} disabled={isCreatingPlan} />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.supportsGroupChat} onChange={(event) => setForm((current) => ({ ...current, supportsGroupChat: event.target.checked }))} disabled={isCreatingPlan} />
              开启后，用户可以使用群聊功能
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.supportsMultiAgentLinkage} onChange={(event) => setForm((current) => ({ ...current, supportsMultiAgentLinkage: event.target.checked }))} disabled={isCreatingPlan} />
              开启后，用户可以让多个 Agent 联动协作
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.supportsDiscoverSquare} onChange={(event) => setForm((current) => ({ ...current, supportsDiscoverSquare: event.target.checked }))} disabled={isCreatingPlan} />
              开启后，用户可以访问发现广场
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.supportsAgentTimeEvolution} onChange={(event) => setForm((current) => ({ ...current, supportsAgentTimeEvolution: event.target.checked }))} disabled={isCreatingPlan} />
              开启后，用户可以使用 Agent 时间演变功能
            </label>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isCreatingPlan}>
                {editingPlanId ? '保存套餐' : isCreatingPlan ? '创建中...' : '创建套餐'}
              </Button>
            </div>
          </form>
          {feedback ? <p className="mt-3 text-sm text-muted-foreground">{feedback}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>套餐列表</CardTitle>
          <CardDescription>仅展示未删除的套餐。</CardDescription>
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
            <Spinner loading={isLoading} label="Loading plans..." className="rounded-md">
              {plans.length === 0 ? (
                <div className="text-sm text-muted-foreground">暂无套餐。</div>
              ) : (
                <SubscriptionPlansList
                  plans={plans}
                  updatingPlanId={updatingPlanId}
                  disablingPlanId={disablingPlanId}
                  deletingPlanId={deletingPlanId}
                  onEditPlan={startEdit}
                  onDisablePlan={(planId) => {
                    void onDisablePlan(planId)
                  }}
                  onDeletePlan={(planId) => {
                    void onDeletePlan(planId)
                  }}
                />
              )}
            </Spinner>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
