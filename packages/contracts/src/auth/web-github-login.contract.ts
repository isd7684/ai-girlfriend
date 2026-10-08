import { z } from 'zod'
import { WebPasswordLoginResponseSchema } from './web-password-login.contract'

export const WebGithubAuthUrlResponseSchema = z.object({
  url: z.string().url(),
  state: z.string().min(1),
})

export type WebGithubAuthUrlResponse = z.infer<
  typeof WebGithubAuthUrlResponseSchema
>

export const WebGithubTicketLoginRequestSchema = z.object({
  ticket: z.string().min(1),
})

export type WebGithubTicketLoginRequest = z.infer<
  typeof WebGithubTicketLoginRequestSchema
>

export const WebGithubTicketLoginResponseSchema = WebPasswordLoginResponseSchema

export type WebGithubTicketLoginResponse = z.infer<
  typeof WebGithubTicketLoginResponseSchema
>
