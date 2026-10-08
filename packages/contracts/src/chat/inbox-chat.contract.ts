import { z } from 'zod'

const InboxChatPartSchema = z.object({
  type: z.string().min(1),
}).passthrough()

export const InboxChatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant']),
  parts: z.array(InboxChatPartSchema).min(1).max(50),
})

export const InboxChatLlmWireApiSchema = z.enum(['chat_completions', 'responses'])

export const InboxChatLlmReasoningEffortSchema = z.enum(['minimal', 'low', 'medium', 'high'])

export const InboxChatLlmConfigSchema = z.object({
  providerName: z.string().trim().min(1).max(80).optional(),
  baseURL: z.string().trim().url().max(300),
  apiKey: z.string().trim().min(1).max(400),
  model: z.string().trim().min(1).max(120),
  wireApi: InboxChatLlmWireApiSchema.optional(),
  reasoningEffort: InboxChatLlmReasoningEffortSchema.optional(),
})

export const InboxChatRequestSchema = z.object({
  conversationId: z.string().min(1).optional(),
  messages: z.array(InboxChatMessageSchema).min(1).max(20),
  llmConfig: InboxChatLlmConfigSchema.optional(),
  conversation: z.object({
    id: z.string().min(1).optional(),
    name: z.string().min(1).max(120),
    handle: z.string().min(1).max(120),
    headline: z.string().min(1).max(200),
    lastActive: z.string().min(1).max(80),
    status: z.string().min(1).max(80),
    relationship: z.string().min(1).max(120),
    topic: z.string().min(1).max(120),
    chemistry: z.string().min(1).max(80),
    chemistryLabel: z.string().min(1).max(80),
    rhythm: z.string().min(1).max(80),
    profileNote: z.string().min(1).max(2000),
    imageKey: z.string().nullable().optional(),
  }),
})

export const AgentConversationMessageRoleSchema = z.enum(['user', 'assistant'])
export const AgentMessageFeedbackRatingSchema = z.enum(['positive', 'negative'])
export const AgentMessageFeedbackReasonSchema = z.enum([
  'good_tone',
  'helpful',
  'warm',
  'remembered_context',
  'bad_tone',
  'too_long',
  'too_cold',
  'too_pushy',
  'wrong_memory',
  'unsafe',
  'other',
])

export const AgentMessageFeedbackSchema = z.object({
  rating: AgentMessageFeedbackRatingSchema,
  reason: AgentMessageFeedbackReasonSchema.nullable(),
  note: z.string().nullable(),
  updatedAtMs: z.number().int().nonnegative(),
})

export const AgentConversationMessageSchema = z.object({
  id: z.string().min(1),
  conversationId: z.string().min(1),
  agentId: z.string().min(1),
  role: AgentConversationMessageRoleSchema,
  content: z.string(),
  status: z.enum(['completed', 'failed']),
  createdAtMs: z.number().int().nonnegative(),
  feedback: AgentMessageFeedbackSchema.nullable(),
})

export const AgentConversationResponseSchema = z.object({
  conversationId: z.string().min(1),
  agentId: z.string().min(1),
  title: z.string().nullable(),
  summary: z.string().nullable(),
  messageCount: z.number().int().nonnegative(),
  openingMessage: z.string().nullable(),
  messages: z.array(AgentConversationMessageSchema),
  nextCursor: z.string().nullable(),
})

export const AgentConversationMessagesResponseSchema = z.object({
  messages: z.array(AgentConversationMessageSchema),
  nextCursor: z.string().nullable(),
})

export const SubmitAgentMessageFeedbackRequestSchema = z.object({
  rating: AgentMessageFeedbackRatingSchema,
  reason: AgentMessageFeedbackReasonSchema.optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
})

export const SubmitAgentMessageFeedbackResponseSchema = z.object({
  messageId: z.string().min(1),
  feedback: AgentMessageFeedbackSchema,
})

export type InboxChatMessage = z.infer<typeof InboxChatMessageSchema>
export type InboxChatLlmWireApi = z.infer<typeof InboxChatLlmWireApiSchema>
export type InboxChatLlmReasoningEffort = z.infer<typeof InboxChatLlmReasoningEffortSchema>
export type InboxChatLlmConfig = z.infer<typeof InboxChatLlmConfigSchema>
export type InboxChatRequest = z.infer<typeof InboxChatRequestSchema>
export type AgentConversationMessageRole = z.infer<typeof AgentConversationMessageRoleSchema>
export type AgentMessageFeedbackRating = z.infer<typeof AgentMessageFeedbackRatingSchema>
export type AgentMessageFeedbackReason = z.infer<typeof AgentMessageFeedbackReasonSchema>
export type AgentMessageFeedback = z.infer<typeof AgentMessageFeedbackSchema>
export type AgentConversationMessage = z.infer<typeof AgentConversationMessageSchema>
export type AgentConversationResponse = z.infer<typeof AgentConversationResponseSchema>
export type AgentConversationMessagesResponse = z.infer<typeof AgentConversationMessagesResponseSchema>
export type SubmitAgentMessageFeedbackRequest = z.infer<typeof SubmitAgentMessageFeedbackRequestSchema>
export type SubmitAgentMessageFeedbackResponse = z.infer<typeof SubmitAgentMessageFeedbackResponseSchema>
