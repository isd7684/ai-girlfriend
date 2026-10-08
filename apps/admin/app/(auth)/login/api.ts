import type { AdminPasswordLoginResponse } from '@repo/contracts'
import { saveClientSession } from './hooks/client-session'
import { http } from '@/lib/http'

export type AdminLoginInput = {
  email: string
  password: string
}

export async function loginByApi(input: AdminLoginInput) {
  const response = await http.post<AdminPasswordLoginResponse, AdminLoginInput>('/auth/admin/password/login', input)
  saveClientSession(response)
}
