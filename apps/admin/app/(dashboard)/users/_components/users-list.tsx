import { MoreHorizontal } from 'lucide-react'
import type { UserListItem } from '@repo/contracts'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/table'
import { UserAvatar } from '@/components/user-avatar'
import { formatOptionalAdminDateTime } from '@/lib/admin-ui'

type UsersListProps = {
  users: UserListItem[]
}

function formatStatus(status: UserListItem['status']) {
  return `${status.slice(0, 1).toUpperCase()}${status.slice(1)}`
}

export function UsersList({ users }: UsersListProps) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Table>
        <TableHeader className="[&_tr]:border-border/80">
          <TableRow>
            <TableHead>昵称</TableHead>
            <TableHead>邮箱</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>最后登录</TableHead>
            <TableHead>用户 ID</TableHead>
            <TableHead className="w-[56px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="border-border/80">
              <TableCell>
                <div className="flex items-center gap-3 py-2">
                  <UserAvatar user={user} size="sm" />
                  <p className="font-medium leading-none text-foreground">{user.name}</p>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm leading-5 text-muted-foreground">{user.email}</p>
              </TableCell>
              <TableCell>
                {user.status === 'active' ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <span className="size-1 rounded-full bg-emerald-500" />
                    {formatStatus(user.status)}
                  </span>
                ) : (
                  <Badge variant="outline">{formatStatus(user.status)}</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatOptionalAdminDateTime(user.lastLoginAtMs)}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {user.id}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                        size="icon"
                      >
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Make a copy</DropdownMenuItem>
                      <DropdownMenuItem>Favorite</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
