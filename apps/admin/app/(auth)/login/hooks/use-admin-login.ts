"use client"

import type { AdminPasswordLoginRequest } from '@repo/contracts'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { loginByApi } from '@/auth/login-client'

export const seededAdminAccount: AdminPasswordLoginRequest = {
  email: 'admin@example.com',
  password: 'Admin123456!',
}

export function useAdminLogin() {
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: (input: AdminPasswordLoginRequest) => loginByApi(input),
    onSuccess: () => {
      router.replace('/')
    },
  })

  async function submit(input: AdminPasswordLoginRequest) {
    mutation.reset()

    try {
      await mutation.mutateAsync(input)
      return true
    } catch {
      return false
    }
  }

  return {
    seededAdminAccount,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    isSubmitting: mutation.isPending,
    submit,
  }
}
