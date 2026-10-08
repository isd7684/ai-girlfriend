"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Github, Loader2 } from "lucide-react"
import { Button } from "@repo/ui/button"
import { readClientSession } from "@/auth/client-session"
import { consumeStoredGithubOAuthState, loginByGithubTicket } from "@/auth/login-client"

function GithubLoginCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const exchangedTicketRef = useRef<string | null>(null)

  useEffect(() => {
    const ticket = searchParams.get("ticket")
    const state = searchParams.get("state")
    const callbackError = searchParams.get("error")

    if (callbackError) {
      setError(callbackError)
      return
    }

    if (!ticket) {
      setError("GitHub 登录结果缺少 ticket")
      return
    }

    const loginTicket = ticket

    if (exchangedTicketRef.current === loginTicket) {
      return
    }

    const expectedState = consumeStoredGithubOAuthState()

    if (!state || !expectedState || state !== expectedState) {
      setError("GitHub 登录状态校验失败")
      return
    }

    exchangedTicketRef.current = loginTicket

    async function exchangeTicket() {
      try {
        await loginByGithubTicket({ ticket: loginTicket })
        router.replace("/")
      } catch (ticketError) {
        if (readClientSession()) {
          router.replace("/")
          return
        }

        setError(ticketError instanceof Error ? ticketError.message : "GitHub 登录失败")
      }
    }

    void exchangeTicket()
  }, [router, searchParams])

  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-50 px-6">
      <section className="w-full max-w-sm bg-white p-6 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
          {error ? <Github className="size-5" /> : <Loader2 className="size-5 animate-spin" />}
        </div>
        <h1 className="mt-5 text-lg font-semibold text-slate-950">
          {error ? "GitHub 登录未完成" : "正在完成 GitHub 登录"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {error ?? "正在校验 GitHub 授权结果，并创建当前浏览器会话。"}
        </p>
        {error ? (
          <Button asChild className="mt-5 w-full">
            <Link href="/login">返回登录页</Link>
          </Button>
        ) : null}
      </section>
    </main>
  )
}

export default function GithubLoginCallbackPage() {
  return (
    <Suspense fallback={<GithubLoginCallbackFallback />}>
      <GithubLoginCallbackContent />
    </Suspense>
  )
}

function GithubLoginCallbackFallback() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-50 px-6">
      <section className="w-full max-w-sm bg-white p-6 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Loader2 className="size-5 animate-spin" />
        </div>
        <h1 className="mt-5 text-lg font-semibold text-slate-950">正在读取 GitHub 登录结果</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          正在准备校验授权结果。
        </p>
      </section>
    </main>
  )
}
