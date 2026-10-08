import { clearClientSession, readClientSession } from '@/auth/client-session'
import { http } from '@/lib/http'

export async function logoutByApi() {
  const storedSession = readClientSession()

  try {
    if (storedSession) {
      await http.post<{ success: true }, { refreshToken: string }>('/auth/admin/logout', {
        refreshToken: storedSession.refreshToken,
      })
    }
  } finally {
    clearClientSession()
  }
}
