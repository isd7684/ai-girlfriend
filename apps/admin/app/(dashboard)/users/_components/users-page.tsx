"use client"

import { useState } from 'react'
import type { CreateUserRequest, RoleListItem, UserListItem } from '@repo/contracts'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Spinner } from '@repo/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@repo/ui/pagination'
import { createUser } from '../api'
import { UsersList } from './users-list'

type UsersPageProps = {
  users: UserListItem[]
  page: number
  total: number
  totalPages: number
  canPrev: boolean
  canNext: boolean
  assignableRoles: RoleListItem[]
  onPageChange: (page: number) => void
  onPrevPage: () => void
  onNextPage: () => void
  isLoading: boolean
  isError: boolean
  errorMessage: string
  onUsersChanged: () => void
  onRetry: () => void
}

export function UsersPage({ users, page, total, totalPages, canPrev, canNext, assignableRoles, onPageChange, onPrevPage, onNextPage, isLoading, isError, errorMessage, onUsersChanged, onRetry }: UsersPageProps) {
  const initialRole = assignableRoles[0]?.code ?? ''
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [createUserFeedback, setCreateUserFeedback] = useState<string | null>(null)
  const [createUserForm, setCreateUserForm] = useState<CreateUserRequest>({
    name: '',
    email: '',
    password: '',
    role: initialRole,
  })
  const visiblePages = (() => {
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
  })()
  const firstVisiblePage = visiblePages[0] ?? 1
  const lastVisiblePage = visiblePages[visiblePages.length - 1] ?? totalPages

  async function handleCreateUserSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreatingUser(true)
    setCreateUserFeedback(null)

    try {
      const result = await createUser(createUserForm)
      setCreateUserFeedback(`User created. Avatar key: ${result.avatarKey ?? 'Not configured'}`)
      setCreateUserForm({
        name: '',
        email: '',
        password: '',
        role: assignableRoles[0]?.code ?? '',
      })
      onUsersChanged()
    } catch (error) {
      setCreateUserFeedback(error instanceof Error ? error.message : 'Unable to create user.')
    } finally {
      setIsCreatingUser(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>展示当前可访问的用户信息。</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle>Users</CardTitle>
            <CardDescription>Loaded from the authenticated user list endpoint.</CardDescription>
          </div>
          <div className="w-full max-w-sm space-y-5">
            <form className="space-y-3" onSubmit={handleCreateUserSubmit}>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">创建用户</p>
                <Input
                  placeholder="Name"
                  value={createUserForm.name}
                  onChange={(event) => {
                    setCreateUserForm((current) => ({ ...current, name: event.target.value }))
                  }}
                  disabled={isCreatingUser}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={createUserForm.email}
                  onChange={(event) => {
                    setCreateUserForm((current) => ({ ...current, email: event.target.value }))
                  }}
                  disabled={isCreatingUser}
                />
                <Input
                  placeholder="Password"
                  type="password"
                  value={createUserForm.password}
                  onChange={(event) => {
                    setCreateUserForm((current) => ({ ...current, password: event.target.value }))
                  }}
                  disabled={isCreatingUser}
                />
                <Select
                  value={createUserForm.role}
                  onValueChange={(value) => {
                    setCreateUserForm((current) => ({ ...current, role: value }))
                  }}
                  disabled={isCreatingUser || assignableRoles.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.code}>
                        {role.name} ({role.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={isCreatingUser || assignableRoles.length === 0}>
                  {isCreatingUser ? 'Creating...' : 'Create user'}
                </Button>
              </div>
              {createUserFeedback ? <p className="text-sm text-muted-foreground">{createUserFeedback}</p> : null}
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <div>
                <Button type="button" variant="outline" onClick={onRetry}>
                  重试
                </Button>
              </div>
            </div>
          ) : (
            <Spinner loading={isLoading} size="lg" label="Loading users..." className="rounded-md">
              {users.length === 0 ? (
                <div className="text-sm text-muted-foreground">暂无可展示用户。</div>
              ) : (
                <div className="space-y-4">
                  <UsersList users={users} />
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
