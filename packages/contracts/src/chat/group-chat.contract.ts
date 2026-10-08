import { z } from 'zod'
import { InboxChatLlmConfigSchema } from './inbox-chat.contract'

export const AgentGroupChatMemberSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
  name: z.string().min(1).max(120),
  headline: z.string().max(200).nullable(),
  imageKey: z.string().max(300).nullable(),
  status: z.enum(['active', 'removed']),
  displayOrder: z.number().int().nonnegative(),
  joinedAtMs: z.number().int().nonnegative(),
})

export const AgentGroupChatMessageSchema = z.object({
  id: z.string().min(1),
  groupChatId: z.string().min(1),
  senderType: z.enum(['user', 'agent', 'system']),
  agentId: z.string().min(1).nullable(),
  agentName: z.string().max(120).nullable(),
  agentImageKey: z.string().max(300).nullable(),
  content: z.string(),
  status: z.enum(['completed', 'failed']),
  turnIndex: z.number().int().nonnegative(),
  createdAtMs: z.number().int().nonnegative(),
})

export const AgentGroupChatSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  summary: z.string().max(2000).nullable(),
  messageCount: z.number().int().nonnegative(),
  lastMessageAtMs: z.number().int().nonnegative().nullable(),
  createdAtMs: z.number().int().nonnegative(),
  updatedAtMs: z.number().int().nonnegative(),
  members: z.array(AgentGroupChatMemberSchema),
  latestMessage: AgentGroupChatMessageSchema.nullable(),
})

export const AgentGroupChatListResponseSchema = z.object({
  items: z.array(AgentGroupChatSchema),
})

export const CreateAgentGroupChatRequestSchema = z.object({
  title: z.string().trim().min(1).max(120),
  agentIds: z.array(z.string().min(1)).min(1).max(6),
})

export const CreateAgentGroupChatResponseSchema = z.object({
  groupChat: AgentGroupChatSchema,
})

export const AgentGroupChatDetailResponseSchema = z.object({
  groupChat: AgentGroupChatSchema,
  messages: z.array(AgentGroupChatMessageSchema),
  nextCursor: z.string().nullable(),
})

export const AddAgentGroupChatMembersRequestSchema = z.object({
  agentIds: z.array(z.string().min(1)).min(1).max(6),
})

export const AddAgentGroupChatMembersResponseSchema = z.object({
  groupChat: AgentGroupChatSchema,
})

export const AgentGroupChatMessagesResponseSchema = z.object({
  messages: z.array(AgentGroupChatMessageSchema),
  nextCursor: z.string().nullable(),
})

export const SendAgentGroupChatMessageRequestSchema = z.object({
  groupChatId: z.string().min(1),
  message: z.string().trim().min(1).max(4000),
  llmConfig: InboxChatLlmConfigSchema.optional(),
})

export const SendAgentGroupChatMessageResponseSchema = z.object({
  userMessage: AgentGroupChatMessageSchema,
  agentMessages: z.array(AgentGroupChatMessageSchema),
  groupChat: AgentGroupChatSchema,
})

export type AgentGroupChatMember = z.infer<typeof AgentGroupChatMemberSchema>
export type AgentGroupChatMessage = z.infer<typeof AgentGroupChatMessageSchema>
export type AgentGroupChat = z.infer<typeof AgentGroupChatSchema>
export type AgentGroupChatListResponse = z.infer<typeof AgentGroupChatListResponseSchema>
export type CreateAgentGroupChatRequest = z.infer<typeof CreateAgentGroupChatRequestSchema>
export type CreateAgentGroupChatResponse = z.infer<typeof CreateAgentGroupChatResponseSchema>
export type AgentGroupChatDetailResponse = z.infer<typeof AgentGroupChatDetailResponseSchema>
export type AddAgentGroupChatMembersRequest = z.infer<typeof AddAgentGroupChatMembersRequestSchema>
export type AddAgentGroupChatMembersResponse = z.infer<typeof AddAgentGroupChatMembersResponseSchema>
export type AgentGroupChatMessagesResponse = z.infer<typeof AgentGroupChatMessagesResponseSchema>
export type SendAgentGroupChatMessageRequest = z.infer<typeof SendAgentGroupChatMessageRequestSchema>
export type SendAgentGroupChatMessageResponse = z.infer<typeof SendAgentGroupChatMessageResponseSchema>
