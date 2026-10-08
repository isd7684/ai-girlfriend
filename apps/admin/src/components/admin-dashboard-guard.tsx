"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminAuthSession, UserProfileResponse } from '@repo/contracts'
import { clearClientSession, readClientSession, sessionChangedEventName } from '@/auth/client-session'
import { getAdminUserProfile } from '@/auth/api'

type AdminDashboardContextValue = {
  profile: UserProfileResponse
  session: AdminAuthSession
  refreshProfile: () => Promise<void>
}

const AdminDashboardContext = createContext<AdminDashboardContextValue | null>(null)

type AdminDashboardGuardProps = {
  children: React.ReactNode
}

// dashboard 下的大多数页面都需要同一份“已登录 + 已拿到 profile”的前置条件。
// 这里把它收口成一个客户端 guard：
// 1. 先从浏览器侧 session store 读当前 access/refresh/session 快照
// 2. 没有会话就直接跳转登录页
// 3. 有会话就尝试请求 profile；请求过程会复用 http.ts 里的自动 refresh 逻辑
// 4. 成功后把 profile + session 放进 context，供 dashboard 子页面直接消费
export function AdminDashboardGuard({ children }: AdminDashboardGuardProps) {
  const router = useRouter()
  const [context, setContext] = useState<AdminDashboardContextValue | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadProfile() {
      // 这里统一做 dashboard 首屏会话校验与 profile 拉取。
      // 这样各个页面就不需要再分别写“未登录跳转 / 自己请求 profile”的重复逻辑。
      const storedSession = readClientSession()

      // 本地没有任何会话快照，说明用户尚未登录或已被主动清理。
      // 这里直接回登录页，不继续渲染 dashboard 内容。
      if (!storedSession) {
        setIsLoading(false)
        router.replace('/login')
        return
      }

      try {
        // profile 请求本身会经过统一 http 层：
        // - 自动附带 access token
        // - access token 失效时自动尝试 refresh
        // - refresh 成功后重放原请求
        const nextProfile = await getAdminUserProfile()
        const latestSession = readClientSession()

        // profile 请求过程中如果发生 refresh，本地 session 可能已经被替换成新 token。
        // 因此这里再读一次最新快照，确保 context 中暴露的是刷新后的 session。
        if (!latestSession) {
          setIsLoading(false)
          router.replace('/login')
          return
        }

        setContext({ profile: nextProfile, session: latestSession.session, refreshProfile: loadProfile })
      } catch {
        // 这里把 profile 拉取失败统一视为“当前会话已不可用”：
        // 可能是 refresh token 过期、会话被撤销，或者 API 鉴权失败。
        // 为了避免 dashboard 保留一份脏状态，直接清空本地会话并跳回登录页。
        clearClientSession()
        router.replace('/login')
      } finally {
        setIsLoading(false)
      }
    }

  useEffect(() => {
    // 登录、刷新、登出都会触发 client-session 里的全局事件。
    // 这里监听这类变化，让 dashboard 能在不整页刷新的情况下同步最新会话状态。
    function handleSessionChanged() {
      setIsLoading(true)
      void loadProfile()
    }

    void loadProfile()
    window.addEventListener(sessionChangedEventName, handleSessionChanged)

    return () => {
      window.removeEventListener(sessionChangedEventName, handleSessionChanged)
    }
  }, [router])

  // guard 尚未拿到“可用会话 + 可用 profile”之前，统一显示 loading 占位。
  // 这样可以避免 dashboard 页面短暂闪出未鉴权内容。
  if (isLoading || !context) {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">Loading workspace…</div>
  }

  return <AdminDashboardContext.Provider value={context}>{children}</AdminDashboardContext.Provider>
}

// 子页面只需要消费这个 hook，就能拿到已经过 guard 校验后的 profile 和 session。
// 如果组件树没有包在 AdminDashboardGuard 里，直接抛错，避免静默拿到 null。
export function useAdminDashboardContext() {
  const context = useContext(AdminDashboardContext)

  if (!context) {
    throw new Error('useAdminDashboardContext must be used within AdminDashboardGuard.')
  }

  return context
}
