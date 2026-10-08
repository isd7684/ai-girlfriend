"use client"

import { useState } from 'react'
import type { CreateRoleRequest, RoleListItem } from '@repo/contracts'
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
import { RolesList } from './roles-list'

type RolesPageProps = {
  roles: RoleListItem[]
  isLoading: boolean
  isCreatingRole: boolean
  disablingRoleId: string | null
  deletingRoleId: string | null
  errorMessage: string
  onCreateRole: (input: CreateRoleRequest) => Promise<unknown>
  onDisableRole: (roleId: string) => Promise<unknown>
  onDeleteRole: (roleId: string) => Promise<unknown>
  onRetry: () => void
}

export function RolesPage({ roles, isLoading, isCreatingRole, disablingRoleId, deletingRoleId, errorMessage, onCreateRole, onDisableRole, onDeleteRole, onRetry }: RolesPageProps) {
  const [form, setForm] = useState<CreateRoleRequest>({
    applicationCode: 'admin',
    code: '',
    name: '',
  })
  const [feedback, setFeedback] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    try {
      await onCreateRole(form)
      setForm({
        applicationCode: form.applicationCode,
        code: '',
        name: '',
      })
      setFeedback('Role created.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to create role.')
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <Card>
        <CardHeader>
          <CardTitle>角色管理</CardTitle>
          <CardDescription>创建、查看、禁用与删除角色。受保护角色不能被禁用或删除。</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>创建角色</CardTitle>
          <CardDescription>角色按 application 维度隔离，当前支持 admin 与 web。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end" onSubmit={handleSubmit}>
            <Select
              value={form.applicationCode}
              onValueChange={(value) => {
                const applicationCode = value as CreateRoleRequest['applicationCode']
                setForm((current) => ({ ...current, applicationCode }))
              }}
              disabled={isCreatingRole}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select application" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="web">web</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="role code"
              value={form.code}
              onChange={(event) => {
                setForm((current) => ({ ...current, code: event.target.value }))
              }}
              disabled={isCreatingRole}
            />
            <Input
              placeholder="display name"
              value={form.name}
              onChange={(event) => {
                setForm((current) => ({ ...current, name: event.target.value }))
              }}
              disabled={isCreatingRole}
            />
            <Button type="submit" disabled={isCreatingRole}>
              {isCreatingRole ? '创建中...' : '创建角色'}
            </Button>
          </form>
          {feedback ? <p className="mt-3 text-sm text-muted-foreground">{feedback}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>角色列表</CardTitle>
          <CardDescription>仅 active 角色可继续被分配给新用户。</CardDescription>
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
            <Spinner loading={isLoading} label="Loading roles..." className="rounded-md">
              {roles.length === 0 ? (
                <div className="text-sm text-muted-foreground">暂无角色。</div>
              ) : (
                <RolesList
                  roles={roles}
                  disablingRoleId={disablingRoleId}
                  deletingRoleId={deletingRoleId}
                  onDisableRole={(roleId) => {
                    void onDisableRole(roleId)
                  }}
                  onDeleteRole={(roleId) => {
                    void onDeleteRole(roleId)
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
