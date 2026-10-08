import type { WebGithubTicketLoginRequest, WebPasswordLoginResponse } from '@repo/contracts'
import { saveClientSession } from '@/auth/client-session'
import { getWebGithubAuthUrl, loginWithWebGithubTicket } from '@/auth/api'
import { http } from '@/lib/http'

const githubOAuthStateStorageKey = 'web:github-oauth-state'

export type WebLoginInput = {
  email: string
  password: string
}

export async function loginByApi(input: WebLoginInput) {
  const response = await http.post<WebPasswordLoginResponse, WebLoginInput>('/auth/web/password/login', input)
  saveClientSession(response)
}

export async function redirectToGithubLogin() {
  const response = await getWebGithubAuthUrl()

  window.sessionStorage.setItem(githubOAuthStateStorageKey, response.state)
  window.location.assign(response.url)
}

export async function loginByGithubTicket(input: WebGithubTicketLoginRequest) {
  const response = await loginWithWebGithubTicket(input)
  saveClientSession(response)
}

export function consumeStoredGithubOAuthState() {
  const state = window.sessionStorage.getItem(githubOAuthStateStorageKey)

  window.sessionStorage.removeItem(githubOAuthStateStorageKey)

  return state
}
