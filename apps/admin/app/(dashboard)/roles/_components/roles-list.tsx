import type { RoleListItem } from '@repo/contracts'
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

type RolesListProps = {
  roles: RoleListItem[]
  disablingRoleId: string | null
  deletingRoleId: string | null
  onDisableRole: (roleId: string) => void
  onDeleteRole: (roleId: string) => void
}

export function RolesList({ roles, disablingRoleId, deletingRoleId, onDisableRole, onDeleteRole }: RolesListProps) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Table>
        <TableHeader className="[&_tr]:border-border/80">
          <TableRow>
            <TableHead>应用</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>名称</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="w-[180px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id} className="border-border/80">
              <TableCell>{role.applicationCode}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{role.code}</TableCell>
              <TableCell>{role.name}</TableCell>
              <TableCell>
                <Badge variant={role.status === 'active' ? 'secondary' : 'outline'}>{role.status}</Badge>
              </TableCell>
              <TableCell>
                {role.isProtected ? <Badge variant="outline">Protected</Badge> : <Badge variant="secondary">Custom</Badge>}
              </TableCell>
              <TableCell className="text-muted-foreground">{new Date(role.createdAtMs).toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={role.isProtected || role.status !== 'active' || disablingRoleId === role.id}
                    onClick={() => {
                      onDisableRole(role.id)
                    }}
                  >
                    {disablingRoleId === role.id ? '禁用中...' : '禁用'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={role.isProtected || deletingRoleId === role.id}
                    onClick={() => {
                      onDeleteRole(role.id)
                    }}
                  >
                    {deletingRoleId === role.id ? '删除中...' : '删除'}
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
