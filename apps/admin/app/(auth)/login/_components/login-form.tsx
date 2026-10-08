import type { AdminPasswordLoginRequest } from '@repo/contracts'
import { useForm } from 'react-hook-form'
import { cn } from "@repo/ui/lib/utils"
import { Button } from "@repo/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@repo/ui/field"
import { Input } from "@repo/ui/input"
import { seededAdminAccount, useAdminLogin } from "../hooks/use-admin-login"

export function LoginForm({className, ...props}: React.ComponentProps<"form">) {
  const { error, isSubmitting, submit } = useAdminLogin()
  const { register, handleSubmit, formState: { errors } } = useForm<AdminPasswordLoginRequest>({
    defaultValues: seededAdminAccount,
  })

  async function onSubmit(values: AdminPasswordLoginRequest) {
    await submit(values)
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit(onSubmit)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">登录</h1>
          <p className="text-sm text-balance text-muted-foreground">
            请输入您的邮箱登录
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">邮箱</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            required
            {...register('email', {
              required: '请输入邮箱',
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: '邮箱格式不正确',
              },
            })}
          />
          <FieldError errors={errors.email ? [errors.email] : undefined} />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">密码</FieldLabel>
            <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">忘记密码？</a>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            {...register('password', {
              required: '请输入密码',
              minLength: {
                value: 8,
                message: '密码至少 8 位',
              },
            })}
          />
          <FieldError errors={errors.password ? [errors.password] : undefined} />
        </Field>
        {error ? (
          <div className="rounded-md border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive">
            {error}
          </div>
        ) : (
          <FieldDescription>直接请求 API 子站，登录成功后的令牌与会话信息会存入浏览器侧的客户端会话层，并由前端统一触发续签与保护路由。</FieldDescription>
        )}
        <Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "登录中..." : "登录"}
          </Button>
        </Field>
        <FieldSeparator>或继续使用</FieldSeparator>
        <Field>
          <Button variant="outline" type="button">
            <svg className="size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                fill="currentColor"
              />
            </svg>
            使用 GitHub 登录
          </Button>
          <FieldDescription className="text-center">
            预置账号: {seededAdminAccount.email} / {seededAdminAccount.password}
          </FieldDescription>
          <FieldDescription className="text-center">
            没有账号？{" "}
            <a href="#" className="underline underline-offset-4">注册</a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
