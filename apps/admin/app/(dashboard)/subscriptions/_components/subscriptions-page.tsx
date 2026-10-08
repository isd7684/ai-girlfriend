"use client"

import { useMemo, useState } from 'react'
import type {
  AssignSubscriptionUserRequest,
  SubscriptionPlanListItem,
  SubscriptionUserListItem,
  UserListItem,
} from '@repo/contracts'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { Label } from '@repo/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@repo/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select'
import { Spinner } from '@repo/ui/spinner'
import { SubscribedUsersList } from './subscribed-users-list'

type SubscriptionsPageProps = {
  subscriptions: SubscriptionUserListItem[]
  users: UserListItem[]
  plans: SubscriptionPlanListItem[]
  page: number
  total: number
  totalPages: number
  canPrev: boolean
  canNext: boolean
  isLoading: boolean
  errorMessage: string
  isAssigningSubscription: boolean
  onAssignSubscription: (input: AssignSubscriptionUserRequest) => Promise<unknown>
  onPageChange: (page: number) => void
  onPrevPage: () => void
  onNextPage: () => void
  onRetry: () => void
}

export function SubscriptionsPage({ subscriptions, users, plans, page, total, totalPages, canPrev, canNext, isLoading, errorMessage, isAssigningSubscription, onAssignSubscription, onPageChange, onPrevPage, onNextPage, onRetry }: SubscriptionsPageProps) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    if (page <= 3) {
      return [1, 2, 3, 4, 5]
    }

    if (page >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [page - 2, page - 1, page, page + 1, page + 2]
  }, [page, totalPages])
  const firstVisiblePage = visiblePages[0] ?? 1
  const lastVisiblePage = visiblePages[visiblePages.length - 1] ?? totalPages

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    try {
      await onAssignSubscription({
        userId: selectedUserId,
        planId: selectedPlanId,
      })
      setFeedback('订阅已新增。')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '新增订阅失败。')
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <Card>
        <CardHeader>
          <CardTitle>订阅管理</CardTitle>
          <CardDescription>查看已订阅用户，并为用户分配套餐。</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>新增订阅</CardTitle>
          <CardDescription>选择一个用户和一个启用中的套餐，为该用户设置当前订阅。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label>选择用户</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={isAssigningSubscription || users.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择需要订阅的用户" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}（{user.email}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>选择套餐</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId} disabled={isAssigningSubscription || plans.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择要分配的套餐" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}（{plan.code}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isAssigningSubscription || !selectedUserId || !selectedPlanId}>
              {isAssigningSubscription ? '新增中...' : '新增订阅'}
            </Button>
          </form>
          {feedback ? <p className="mt-3 text-sm text-muted-foreground">{feedback}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>已订阅用户</CardTitle>
          <CardDescription>仅展示当前生效的用户订阅关系。</CardDescription>
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
            <Spinner loading={isLoading} label="Loading subscriptions..." className="rounded-md">
              {subscriptions.length === 0 ? (
                <div className="text-sm text-muted-foreground">暂无已订阅用户。</div>
              ) : (
                <div className="space-y-4">
                  <SubscribedUsersList subscriptions={subscriptions} />
                  <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex-1 text-muted-foreground">
                      共 {total} 条 · 第 {page} / {Math.max(totalPages, 1)} 页
                    </p>
                    <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            text="上一页"
                            aria-disabled={!canPrev}
                            className={!canPrev ? 'pointer-events-none opacity-50' : undefined}
                            onClick={(event) => {
                              event.preventDefault()
                              if (canPrev) {
                                onPrevPage()
                              }
                            }}
                          />
                        </PaginationItem>

                        {firstVisiblePage > 1 ? (
                          <>
                            <PaginationItem>
                              <PaginationLink
                                href="#"
                                onClick={(event) => {
                                  event.preventDefault()
                                  onPageChange(1)
                                }}
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                            {firstVisiblePage > 2 ? (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            ) : null}
                          </>
                        ) : null}

                        {visiblePages.map((pageNumber) => (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              href="#"
                              isActive={pageNumber === page}
                              onClick={(event) => {
                                event.preventDefault()
                                onPageChange(pageNumber)
                              }}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        {lastVisiblePage < totalPages ? (
                          <>
                            {lastVisiblePage < totalPages - 1 ? (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            ) : null}
                            <PaginationItem>
                              <PaginationLink
                                href="#"
                                onClick={(event) => {
                                  event.preventDefault()
                                  onPageChange(totalPages)
                                }}
                              >
                                {totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          </>
                        ) : null}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            text="下一页"
                            aria-disabled={!canNext}
                            className={!canNext ? 'pointer-events-none opacity-50' : undefined}
                            onClick={(event) => {
                              event.preventDefault()
                              if (canNext) {
                                onNextPage()
                              }
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              )}
            </Spinner>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
