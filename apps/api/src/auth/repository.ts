import { and, eq, inArray, isNull, sql, type SQL } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import type { ApiDb } from '@/db/client'
import {
  agentCareEvents,
  agentCarePlans,
  agentConversationMessages,
  agentConversations,
  agentGroupChatMembers,
  agentGroupChatMessages,
  agentGroupChats,
  agentMessageFeedbacks,
  agentMemories,
  applicationAuthMethods,
  applications,
  authSessions,
  defaultAvatarVersions,
  financialBills,
  oauthAccounts,
  oauthLoginTickets,
  passwordCredentials,
  refreshTokens,
  roles,
  subscriptionPlans,
  userAgentCompanions,
  userEmails,
  userRoleBindings,
  userSubscriptionBindings,
  users,
} from '@/db/schema'
import type {
  LoginUserRecord,
  RefreshTokenRecord,
  SessionContext,
  UserListItemRecord,
  UserProfileRecord,
} from './types'

export async function isPasswordLoginEnabledForApp(db: ApiDb, appCode: 'admin' | 'web'): Promise<boolean> {
  return isAuthMethodEnabledForApp(db, appCode, 'password')
}

export async function isAuthMethodEnabledForApp(
  db: ApiDb,
  appCode: 'admin' | 'web',
  provider: 'password' | 'github' | 'google',
): Promise<boolean> {
  const row = await db
    .select({ enabled: applicationAuthMethods.enabled })
    .from(applicationAuthMethods)
    .innerJoin(applications, eq(applications.id, applicationAuthMethods.applicationId))
    .where(
      and(
        eq(applications.code, appCode),
        eq(applications.status, 'active'),
        eq(applicationAuthMethods.provider, provider),
      ),
    )
    .limit(1)
    .get()

  return row?.enabled === 1
}

export async function isGithubLoginEnabledForWeb(db: ApiDb): Promise<boolean> {
  return isAuthMethodEnabledForApp(db, 'web', 'github')
}

export async function isPasswordLoginEnabledForAdmin(db: ApiDb): Promise<boolean> {
  return isPasswordLoginEnabledForApp(db, 'admin')
}

export async function isPasswordLoginEnabledForWeb(db: ApiDb): Promise<boolean> {
  return isPasswordLoginEnabledForApp(db, 'web')
}

export async function findLoginUserByNormalizedEmail(
  db: ApiDb,
  normalizedEmail: string,
): Promise<LoginUserRecord | null> {
  // 邮箱先映射到 user 和 credential，再做密码校验，登录入口和用户主体才不会耦死。
  const row = await db
    .select({
      userId: users.id,
      emailId: userEmails.id,
      email: userEmails.email,
      userStatus: users.status,
      passwordHash: passwordCredentials.passwordHash,
      passwordAlgo: passwordCredentials.passwordAlgo,
    })
    .from(userEmails)
    .innerJoin(users, eq(users.id, userEmails.userId))
    .innerJoin(
      passwordCredentials,
      and(
        eq(passwordCredentials.userId, users.id),
        eq(passwordCredentials.emailId, userEmails.id),
      ),
    )
    .where(eq(userEmails.normalizedEmail, normalizedEmail))
    .limit(1)
    .get()

  return row
    ? {
        ...row,
        userStatus: row.userStatus as LoginUserRecord['userStatus'],
        passwordAlgo: row.passwordAlgo as LoginUserRecord['passwordAlgo'],
      }
    : null
}

export async function getRolesForUserByApp(
  db: ApiDb,
  userId: string,
  appCode: 'admin' | 'web',
): Promise<string[]> {
  const rows = await db
    .select({ code: roles.code })
    .from(userRoleBindings)
    .innerJoin(roles, eq(roles.id, userRoleBindings.roleId))
    .innerJoin(applications, eq(applications.id, roles.applicationId))
    .where(
      and(
        eq(userRoleBindings.userId, userId),
        eq(userRoleBindings.status, 'active'),
        eq(roles.status, 'active'),
        eq(applications.code, appCode),
      ),
    )

  return rows.map((row) => row.code)
}

export async function getAdminRolesForUser(
  db: ApiDb,
  userId: string,
): Promise<string[]> {
  return getRolesForUserByApp(db, userId, 'admin')
}

export async function getWebRolesForUser(
  db: ApiDb,
  userId: string,
): Promise<string[]> {
  return getRolesForUserByApp(db, userId, 'web')
}

export async function getUserAgentCompanionSummary(
  db: ApiDb,
  userId: string,
): Promise<{
  total: number
  published: number
  draft: number
}> {
  const row = await db
    .select({
      total: sql<number>`count(*)`,
      published: sql<number>`sum(case when ${userAgentCompanions.status} = 'published' then 1 else 0 end)`,
      draft: sql<number>`sum(case when ${userAgentCompanions.status} = 'draft' then 1 else 0 end)`,
    })
    .from(userAgentCompanions)
    .where(eq(userAgentCompanions.userId, userId))
    .get()

  return {
    total: Number(row?.total ?? 0),
    published: Number(row?.published ?? 0),
    draft: Number(row?.draft ?? 0),
  }
}

export async function findUserAgentCompanionOwner(
  db: ApiDb,
  params: {
    userId: string
    agentId: string
  },
): Promise<{
  id: string
  name: string
  openingMessage: string | null
} | null> {
  const row = await db
    .select({
      id: userAgentCompanions.id,
      name: userAgentCompanions.name,
      openingMessage: userAgentCompanions.openingMessage,
    })
    .from(userAgentCompanions)
    .where(and(
      eq(userAgentCompanions.id, params.agentId),
      eq(userAgentCompanions.userId, params.userId),
    ))
    .limit(1)
    .get()

  return row ?? null
}

export async function createUserAgentCompanion(params: {
  db: ApiDb
  id: string
  userId: string
  name: string
  headline: string
  description: string
  storyBackground: string
  personalityPrompt: string
  tonePrompt: string
  guardrailsPrompt: string
  openingMessage: string
  defaultPrompt: string
  imageKey: string | null
  visibility: 'private' | 'public'
  status: 'draft' | 'published'
  nowMs: number
}) {
  await params.db.insert(userAgentCompanions).values({
    id: params.id,
    userId: params.userId,
    name: params.name,
    headline: params.headline,
    description: params.description,
    storyBackground: params.storyBackground,
    personalityPrompt: params.personalityPrompt,
    tonePrompt: params.tonePrompt,
    guardrailsPrompt: params.guardrailsPrompt,
    openingMessage: params.openingMessage,
    defaultPrompt: params.defaultPrompt,
    imageKey: params.imageKey,
    visibility: params.visibility,
    status: params.status,
    createdAtMs: params.nowMs,
    updatedAtMs: params.nowMs,
    publishedAtMs: params.status === 'published' ? params.nowMs : null,
    archivedAtMs: null,
  })
}

export async function listUserAgentCompanionsForInbox(
  db: ApiDb,
  userId: string,
): Promise<Array<{
  id: string
  name: string
  headline: string | null
  description: string | null
  storyBackground: string | null
  openingMessage: string | null
  imageKey: string | null
  latestMessage: string | null
  latestMessageAtMs: number | null
  lastAssistantMessage: string | null
  lastAssistantMessageAtMs: number | null
  hasUnreadCareEvent: boolean
  messageCount: number
  status: 'draft' | 'published' | 'archived'
  createdAtMs: number
  updatedAtMs: number
}>> {
  const rows = await db
    .select({
      id: userAgentCompanions.id,
      name: userAgentCompanions.name,
      headline: userAgentCompanions.headline,
      description: userAgentCompanions.description,
      storyBackground: userAgentCompanions.storyBackground,
      openingMessage: userAgentCompanions.openingMessage,
      imageKey: userAgentCompanions.imageKey,
      latestMessage: sql<string | null>`(
        select ${agentConversationMessages.content}
        from ${agentConversationMessages}
        where ${agentConversationMessages.userId} = ${userAgentCompanions.userId}
          and ${agentConversationMessages.agentId} = ${userAgentCompanions.id}
        order by ${agentConversationMessages.createdAtMs} desc, ${agentConversationMessages.id} desc
        limit 1
      )`,
      latestMessageAtMs: sql<number | null>`(
        select ${agentConversationMessages.createdAtMs}
        from ${agentConversationMessages}
        where ${agentConversationMessages.userId} = ${userAgentCompanions.userId}
          and ${agentConversationMessages.agentId} = ${userAgentCompanions.id}
        order by ${agentConversationMessages.createdAtMs} desc, ${agentConversationMessages.id} desc
        limit 1
      )`,
      lastAssistantMessage: userAgentCompanions.lastAssistantMessage,
      lastAssistantMessageAtMs: userAgentCompanions.lastAssistantMessageAtMs,
      messageCount: sql<number>`coalesce(${agentConversations.messageCount}, 0)`,
      status: userAgentCompanions.status,
      createdAtMs: userAgentCompanions.createdAtMs,
      updatedAtMs: sql<number>`coalesce(${agentConversations.lastMessageAtMs}, ${userAgentCompanions.lastAssistantMessageAtMs}, ${userAgentCompanions.updatedAtMs})`,
    })
    .from(userAgentCompanions)
    .leftJoin(
      agentConversations,
      and(
        eq(agentConversations.userId, userAgentCompanions.userId),
        eq(agentConversations.agentId, userAgentCompanions.id),
      ),
    )
    .where(eq(userAgentCompanions.userId, userId))
    .orderBy(sql`coalesce(${agentConversations.lastMessageAtMs}, ${userAgentCompanions.lastAssistantMessageAtMs}, ${userAgentCompanions.updatedAtMs}) desc, ${userAgentCompanions.id} desc`)
    .limit(50)

  const unreadCareAgentIds = new Set<string>()

  if (rows.length > 0) {
    try {
      const unreadRows = await db
        .select({
          agentId: agentCareEvents.agentId,
          count: sql<number>`count(*)`,
        })
        .from(agentCareEvents)
        .where(and(
          eq(agentCareEvents.userId, userId),
          inArray(agentCareEvents.agentId, rows.map((row) => row.id)),
          eq(agentCareEvents.status, 'generated'),
          isNull(agentCareEvents.readAtMs),
        ))
        .groupBy(agentCareEvents.agentId)

      for (const row of unreadRows) {
        if (Number(row.count ?? 0) > 0) {
          unreadCareAgentIds.add(row.agentId)
        }
      }
    } catch (error) {
      console.warn('Agent care unread count is unavailable', error)
    }
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    headline: row.headline,
    description: row.description,
    storyBackground: row.storyBackground,
    openingMessage: row.openingMessage,
    imageKey: row.imageKey,
    latestMessage: row.latestMessage,
    latestMessageAtMs: row.latestMessageAtMs,
    lastAssistantMessage: row.lastAssistantMessage,
    lastAssistantMessageAtMs: row.lastAssistantMessageAtMs,
    hasUnreadCareEvent: unreadCareAgentIds.has(row.id),
    messageCount: row.messageCount,
    status: row.status as 'draft' | 'published' | 'archived',
    createdAtMs: row.createdAtMs,
    updatedAtMs: row.updatedAtMs,
  }))
}

export type AgentGroupChatMemberRecord = {
  id: string
  agentId: string
  name: string
  headline: string | null
  imageKey: string | null
  status: 'active' | 'removed'
  displayOrder: number
  joinedAtMs: number
}

export type AgentGroupChatMessageRecord = {
  id: string
  groupChatId: string
  senderType: 'user' | 'agent' | 'system'
  agentId: string | null
  agentName: string | null
  agentImageKey: string | null
  content: string
  status: 'completed' | 'failed'
  turnIndex: number
  createdAtMs: number
}

export type AgentGroupChatRecord = {
  id: string
  title: string
  summary: string | null
  messageCount: number
  lastMessageAtMs: number | null
  createdAtMs: number
  updatedAtMs: number
  members: AgentGroupChatMemberRecord[]
  latestMessage: AgentGroupChatMessageRecord | null
}

export type AgentGroupChatAgentRecord = {
  id: string
  name: string
  headline: string | null
  description: string | null
  storyBackground: string | null
  personalityPrompt: string | null
  tonePrompt: string | null
  guardrailsPrompt: string | null
  defaultPrompt: string | null
  imageKey: string | null
  displayOrder: number
  conversationMessageCount: number
  conversationLastMessageAtMs: number | null
}

async function listAgentGroupChatMembersForGroups(
  db: ApiDb,
  params: {
    userId: string
    groupChatIds: string[]
  },
): Promise<Map<string, AgentGroupChatMemberRecord[]>> {
  const membersByGroupId = new Map<string, AgentGroupChatMemberRecord[]>()

  if (params.groupChatIds.length === 0) {
    return membersByGroupId
  }

  const rows = await db
    .select({
      groupChatId: agentGroupChatMembers.groupChatId,
      id: agentGroupChatMembers.id,
      agentId: agentGroupChatMembers.agentId,
      name: userAgentCompanions.name,
      headline: userAgentCompanions.headline,
      imageKey: userAgentCompanions.imageKey,
      status: agentGroupChatMembers.status,
      displayOrder: agentGroupChatMembers.displayOrder,
      joinedAtMs: agentGroupChatMembers.joinedAtMs,
    })
    .from(agentGroupChatMembers)
    .innerJoin(userAgentCompanions, eq(userAgentCompanions.id, agentGroupChatMembers.agentId))
    .where(and(
      eq(agentGroupChatMembers.userId, params.userId),
      inArray(agentGroupChatMembers.groupChatId, params.groupChatIds),
      eq(agentGroupChatMembers.status, 'active'),
    ))
    .orderBy(sql`${agentGroupChatMembers.displayOrder} asc, ${agentGroupChatMembers.id} asc`)

  for (const row of rows) {
    const members = membersByGroupId.get(row.groupChatId) ?? []
    members.push({
      id: row.id,
      agentId: row.agentId,
      name: row.name,
      headline: row.headline,
      imageKey: row.imageKey,
      status: row.status as 'active' | 'removed',
      displayOrder: row.displayOrder,
      joinedAtMs: row.joinedAtMs,
    })
    membersByGroupId.set(row.groupChatId, members)
  }

  return membersByGroupId
}

async function listLatestAgentGroupChatMessagesForGroups(
  db: ApiDb,
  params: {
    userId: string
    groupChatIds: string[]
  },
): Promise<Map<string, AgentGroupChatMessageRecord>> {
  const latestByGroupId = new Map<string, AgentGroupChatMessageRecord>()

  if (params.groupChatIds.length === 0) {
    return latestByGroupId
  }

  const rows = await db
    .select({
      id: agentGroupChatMessages.id,
      groupChatId: agentGroupChatMessages.groupChatId,
      senderType: agentGroupChatMessages.senderType,
      agentId: agentGroupChatMessages.agentId,
      agentName: userAgentCompanions.name,
      agentImageKey: userAgentCompanions.imageKey,
      content: agentGroupChatMessages.content,
      status: agentGroupChatMessages.status,
      turnIndex: agentGroupChatMessages.turnIndex,
      createdAtMs: agentGroupChatMessages.createdAtMs,
    })
    .from(agentGroupChatMessages)
    .leftJoin(userAgentCompanions, eq(userAgentCompanions.id, agentGroupChatMessages.agentId))
    .where(and(
      eq(agentGroupChatMessages.userId, params.userId),
      inArray(agentGroupChatMessages.groupChatId, params.groupChatIds),
    ))
    .orderBy(sql`${agentGroupChatMessages.createdAtMs} desc, ${agentGroupChatMessages.id} desc`)

  for (const row of rows) {
    if (latestByGroupId.has(row.groupChatId)) {
      continue
    }

    latestByGroupId.set(row.groupChatId, {
      id: row.id,
      groupChatId: row.groupChatId,
      senderType: row.senderType as 'user' | 'agent' | 'system',
      agentId: row.agentId,
      agentName: row.agentName,
      agentImageKey: row.agentImageKey,
      content: row.content,
      status: row.status as 'completed' | 'failed',
      turnIndex: row.turnIndex,
      createdAtMs: row.createdAtMs,
    })
  }

  return latestByGroupId
}

export async function listAgentGroupChats(
  db: ApiDb,
  userId: string,
): Promise<AgentGroupChatRecord[]> {
  const rows = await db
    .select({
      id: agentGroupChats.id,
      title: agentGroupChats.title,
      summary: agentGroupChats.summary,
      messageCount: agentGroupChats.messageCount,
      lastMessageAtMs: agentGroupChats.lastMessageAtMs,
      createdAtMs: agentGroupChats.createdAtMs,
      updatedAtMs: agentGroupChats.updatedAtMs,
    })
    .from(agentGroupChats)
    .where(eq(agentGroupChats.userId, userId))
    .orderBy(sql`coalesce(${agentGroupChats.lastMessageAtMs}, ${agentGroupChats.updatedAtMs}) desc, ${agentGroupChats.id} desc`)
    .limit(50)

  const groupChatIds = rows.map((row) => row.id)
  const [membersByGroupId, latestByGroupId] = await Promise.all([
    listAgentGroupChatMembersForGroups(db, { userId, groupChatIds }),
    listLatestAgentGroupChatMessagesForGroups(db, { userId, groupChatIds }),
  ])

  return rows.map((row) => ({
    ...row,
    members: membersByGroupId.get(row.id) ?? [],
    latestMessage: latestByGroupId.get(row.id) ?? null,
  }))
}

export async function findAgentGroupChat(
  db: ApiDb,
  params: {
    userId: string
    groupChatId: string
  },
): Promise<AgentGroupChatRecord | null> {
  const row = await db
    .select({
      id: agentGroupChats.id,
      title: agentGroupChats.title,
      summary: agentGroupChats.summary,
      messageCount: agentGroupChats.messageCount,
      lastMessageAtMs: agentGroupChats.lastMessageAtMs,
      createdAtMs: agentGroupChats.createdAtMs,
      updatedAtMs: agentGroupChats.updatedAtMs,
    })
    .from(agentGroupChats)
    .where(and(
      eq(agentGroupChats.id, params.groupChatId),
      eq(agentGroupChats.userId, params.userId),
    ))
    .limit(1)
    .get()

  if (!row) {
    return null
  }

  const [membersByGroupId, latestByGroupId] = await Promise.all([
    listAgentGroupChatMembersForGroups(db, { userId: params.userId, groupChatIds: [row.id] }),
    listLatestAgentGroupChatMessagesForGroups(db, { userId: params.userId, groupChatIds: [row.id] }),
  ])

  return {
    ...row,
    members: membersByGroupId.get(row.id) ?? [],
    latestMessage: latestByGroupId.get(row.id) ?? null,
  }
}

export async function listOwnedAgentCompanionsByIds(
  db: ApiDb,
  params: {
    userId: string
    agentIds: string[]
  },
): Promise<AgentGroupChatAgentRecord[]> {
  if (params.agentIds.length === 0) {
    return []
  }

  const rows = await db
    .select({
      id: userAgentCompanions.id,
      name: userAgentCompanions.name,
      headline: userAgentCompanions.headline,
      description: userAgentCompanions.description,
      storyBackground: userAgentCompanions.storyBackground,
      personalityPrompt: userAgentCompanions.personalityPrompt,
      tonePrompt: userAgentCompanions.tonePrompt,
      guardrailsPrompt: userAgentCompanions.guardrailsPrompt,
      defaultPrompt: userAgentCompanions.defaultPrompt,
      imageKey: userAgentCompanions.imageKey,
      conversationMessageCount: sql<number>`coalesce(${agentConversations.messageCount}, 0)`,
      conversationLastMessageAtMs: agentConversations.lastMessageAtMs,
    })
    .from(userAgentCompanions)
    .leftJoin(
      agentConversations,
      and(
        eq(agentConversations.userId, userAgentCompanions.userId),
        eq(agentConversations.agentId, userAgentCompanions.id),
      ),
    )
    .where(and(
      eq(userAgentCompanions.userId, params.userId),
      inArray(userAgentCompanions.id, params.agentIds),
      sql`${userAgentCompanions.status} != 'archived'`,
    ))

  const orderByAgentId = new Map(params.agentIds.map((agentId, index) => [agentId, index]))

  return rows
    .map((row) => ({
      ...row,
      displayOrder: orderByAgentId.get(row.id) ?? 0,
      conversationMessageCount: row.conversationMessageCount ?? 0,
      conversationLastMessageAtMs: row.conversationLastMessageAtMs,
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder)
}

export async function createAgentGroupChat(params: {
  db: ApiDb
  id: string
  userId: string
  title: string
  agentIds: string[]
  nowMs: number
}) {
  await params.db.insert(agentGroupChats).values({
    id: params.id,
    userId: params.userId,
    title: params.title,
    summary: null,
    messageCount: 0,
    lastMessageAtMs: null,
    createdAtMs: params.nowMs,
    updatedAtMs: params.nowMs,
  })

  if (params.agentIds.length > 0) {
    await params.db.insert(agentGroupChatMembers).values(params.agentIds.map((agentId, index) => ({
      id: uuidv7(),
      groupChatId: params.id,
      userId: params.userId,
      agentId,
      displayOrder: index,
      status: 'active',
      joinedAtMs: params.nowMs,
      removedAtMs: null,
    })))
  }
}

export async function addAgentGroupChatMembers(params: {
  db: ApiDb
  userId: string
  groupChatId: string
  agentIds: string[]
  nowMs: number
}) {
  if (params.agentIds.length === 0) {
    return
  }

  const existingRows = await params.db
    .select({
      agentId: agentGroupChatMembers.agentId,
      displayOrder: agentGroupChatMembers.displayOrder,
    })
    .from(agentGroupChatMembers)
    .where(and(
      eq(agentGroupChatMembers.userId, params.userId),
      eq(agentGroupChatMembers.groupChatId, params.groupChatId),
      eq(agentGroupChatMembers.status, 'active'),
    ))

  const existingAgentIds = new Set(existingRows.map((row) => row.agentId))
  const maxOrder = existingRows.reduce((max, row) => Math.max(max, row.displayOrder), -1)
  const nextAgentIds = params.agentIds.filter((agentId) => !existingAgentIds.has(agentId))

  if (nextAgentIds.length === 0) {
    return
  }

  await params.db.insert(agentGroupChatMembers).values(nextAgentIds.map((agentId, index) => ({
    id: uuidv7(),
    groupChatId: params.groupChatId,
    userId: params.userId,
    agentId,
    displayOrder: maxOrder + index + 1,
    status: 'active',
    joinedAtMs: params.nowMs,
    removedAtMs: null,
  })))

  await params.db
    .update(agentGroupChats)
    .set({ updatedAtMs: params.nowMs })
    .where(and(
      eq(agentGroupChats.id, params.groupChatId),
      eq(agentGroupChats.userId, params.userId),
    ))
}

export async function removeAgentGroupChatMember(params: {
  db: ApiDb
  userId: string
  groupChatId: string
  memberId: string
  nowMs: number
}) {
  await params.db
    .update(agentGroupChatMembers)
    .set({
      status: 'removed',
      removedAtMs: params.nowMs,
    })
    .where(and(
      eq(agentGroupChatMembers.id, params.memberId),
      eq(agentGroupChatMembers.userId, params.userId),
      eq(agentGroupChatMembers.groupChatId, params.groupChatId),
    ))

  await params.db
    .update(agentGroupChats)
    .set({ updatedAtMs: params.nowMs })
    .where(and(
      eq(agentGroupChats.id, params.groupChatId),
      eq(agentGroupChats.userId, params.userId),
    ))
}

export async function listAgentGroupChatAgents(params: {
  db: ApiDb
  userId: string
  groupChatId: string
}): Promise<AgentGroupChatAgentRecord[]> {
  const rows = await params.db
    .select({
      id: userAgentCompanions.id,
      name: userAgentCompanions.name,
      headline: userAgentCompanions.headline,
      description: userAgentCompanions.description,
      storyBackground: userAgentCompanions.storyBackground,
      personalityPrompt: userAgentCompanions.personalityPrompt,
      tonePrompt: userAgentCompanions.tonePrompt,
      guardrailsPrompt: userAgentCompanions.guardrailsPrompt,
      defaultPrompt: userAgentCompanions.defaultPrompt,
      imageKey: userAgentCompanions.imageKey,
      displayOrder: agentGroupChatMembers.displayOrder,
      conversationMessageCount: sql<number>`coalesce(${agentConversations.messageCount}, 0)`,
      conversationLastMessageAtMs: agentConversations.lastMessageAtMs,
    })
    .from(agentGroupChatMembers)
    .innerJoin(userAgentCompanions, eq(userAgentCompanions.id, agentGroupChatMembers.agentId))
    .leftJoin(
      agentConversations,
      and(
        eq(agentConversations.userId, agentGroupChatMembers.userId),
        eq(agentConversations.agentId, agentGroupChatMembers.agentId),
      ),
    )
    .where(and(
      eq(agentGroupChatMembers.userId, params.userId),
      eq(agentGroupChatMembers.groupChatId, params.groupChatId),
      eq(agentGroupChatMembers.status, 'active'),
    ))
    .orderBy(sql`${agentGroupChatMembers.displayOrder} asc, ${agentGroupChatMembers.id} asc`)

  return rows
}

export async function listAgentGroupChatMessages(params: {
  db: ApiDb
  userId: string
  groupChatId: string
  beforeMs?: number
  limit: number
}): Promise<AgentGroupChatMessageRecord[]> {
  const conditions: SQL[] = [
    eq(agentGroupChatMessages.userId, params.userId),
    eq(agentGroupChatMessages.groupChatId, params.groupChatId),
  ]

  if (params.beforeMs) {
    conditions.push(sql`${agentGroupChatMessages.createdAtMs} < ${params.beforeMs}`)
  }

  const rows = await params.db
    .select({
      id: agentGroupChatMessages.id,
      groupChatId: agentGroupChatMessages.groupChatId,
      senderType: agentGroupChatMessages.senderType,
      agentId: agentGroupChatMessages.agentId,
      agentName: userAgentCompanions.name,
      agentImageKey: userAgentCompanions.imageKey,
      content: agentGroupChatMessages.content,
      status: agentGroupChatMessages.status,
      turnIndex: agentGroupChatMessages.turnIndex,
      createdAtMs: agentGroupChatMessages.createdAtMs,
    })
    .from(agentGroupChatMessages)
    .leftJoin(userAgentCompanions, eq(userAgentCompanions.id, agentGroupChatMessages.agentId))
    .where(and(...conditions))
    .orderBy(sql`${agentGroupChatMessages.createdAtMs} desc, ${agentGroupChatMessages.id} desc`)
    .limit(params.limit)

  return rows
    .map((row) => ({
      id: row.id,
      groupChatId: row.groupChatId,
      senderType: row.senderType as 'user' | 'agent' | 'system',
      agentId: row.agentId,
      agentName: row.agentName,
      agentImageKey: row.agentImageKey,
      content: row.content,
      status: row.status as 'completed' | 'failed',
      turnIndex: row.turnIndex,
      createdAtMs: row.createdAtMs,
    }))
    .reverse()
}

export async function insertAgentGroupChatMessage(params: {
  db: ApiDb
  id: string
  userId: string
  groupChatId: string
  senderType: 'user' | 'agent' | 'system'
  agentId: string | null
  content: string
  status: 'completed' | 'failed'
  turnIndex: number
  metadataJson?: string | null
  nowMs: number
}) {
  await params.db.insert(agentGroupChatMessages).values({
    id: params.id,
    userId: params.userId,
    groupChatId: params.groupChatId,
    senderType: params.senderType,
    agentId: params.agentId,
    content: params.content,
    status: params.status,
    turnIndex: params.turnIndex,
    metadataJson: params.metadataJson ?? null,
    createdAtMs: params.nowMs,
  })
}

export async function updateAgentGroupChatAfterMessage(params: {
  db: ApiDb
  userId: string
  groupChatId: string
  summary: string | null
  messageCount: number
  lastMessageAtMs: number
  nowMs: number
}) {
  await params.db
    .update(agentGroupChats)
    .set({
      summary: params.summary,
      messageCount: params.messageCount,
      lastMessageAtMs: params.lastMessageAtMs,
      updatedAtMs: params.nowMs,
    })
    .where(and(
      eq(agentGroupChats.id, params.groupChatId),
      eq(agentGroupChats.userId, params.userId),
    ))
}

export async function findDefaultAgentConversation(
  db: ApiDb,
  params: {
    userId: string
    agentId: string
  },
): Promise<{
  id: string
  userId: string
  agentId: string
  title: string | null
  summary: string | null
  messageCount: number
  lastMessageAtMs: number | null
  createdAtMs: number
  updatedAtMs: number
} | null> {
  const row = await db
    .select({
      id: agentConversations.id,
      userId: agentConversations.userId,
      agentId: agentConversations.agentId,
      title: agentConversations.title,
      summary: agentConversations.summary,
      messageCount: agentConversations.messageCount,
      lastMessageAtMs: agentConversations.lastMessageAtMs,
      createdAtMs: agentConversations.createdAtMs,
      updatedAtMs: agentConversations.updatedAtMs,
    })
    .from(agentConversations)
    .where(and(
      eq(agentConversations.userId, params.userId),
      eq(agentConversations.agentId, params.agentId),
    ))
    .limit(1)
    .get()

  return row ?? null
}

export async function createDefaultAgentConversation(params: {
  db: ApiDb
  id: string
  userId: string
  agentId: string
  title: string
  nowMs: number
}) {
  await params.db.insert(agentConversations).values({
    id: params.id,
    userId: params.userId,
    agentId: params.agentId,
    title: params.title,
    summary: null,
    messageCount: 0,
    lastMessageAtMs: null,
    createdAtMs: params.nowMs,
    updatedAtMs: params.nowMs,
  }).onConflictDoNothing()
}

export async function getOrCreateDefaultAgentConversation(params: {
  db: ApiDb
  id: string
  userId: string
  agentId: string
  title: string
  nowMs: number
}) {
  const existing = await findDefaultAgentConversation(params.db, {
    userId: params.userId,
    agentId: params.agentId,
  })

  if (existing) {
    return existing
  }

  await createDefaultAgentConversation(params)

  return (await findDefaultAgentConversation(params.db, {
    userId: params.userId,
    agentId: params.agentId,
  }))!
}

export async function listAgentConversationMessages(params: {
  db: ApiDb
  userId: string
  agentId: string
  conversationId: string
  beforeMs?: number
  limit: number
}): Promise<Array<{
  id: string
  conversationId: string
  agentId: string
  role: 'user' | 'assistant'
  content: string
  status: 'completed' | 'failed'
  createdAtMs: number
  feedback: {
    rating: 'positive' | 'negative'
    reason: string | null
    note: string | null
    updatedAtMs: number
  } | null
}>> {
  const conditions: SQL[] = [
    eq(agentConversationMessages.userId, params.userId),
    eq(agentConversationMessages.agentId, params.agentId),
    eq(agentConversationMessages.conversationId, params.conversationId),
  ]

  if (params.beforeMs) {
    conditions.push(sql`${agentConversationMessages.createdAtMs} < ${params.beforeMs}`)
  }

  const rows = await params.db
    .select({
      id: agentConversationMessages.id,
      conversationId: agentConversationMessages.conversationId,
      agentId: agentConversationMessages.agentId,
      role: agentConversationMessages.role,
      content: agentConversationMessages.content,
      status: agentConversationMessages.status,
      createdAtMs: agentConversationMessages.createdAtMs,
    })
    .from(agentConversationMessages)
    .where(and(...conditions))
    .orderBy(sql`${agentConversationMessages.createdAtMs} desc, ${agentConversationMessages.id} desc`)
    .limit(params.limit)

  const feedbackByMessageId = new Map<string, {
    rating: 'positive' | 'negative'
    reason: string | null
    note: string | null
    updatedAtMs: number
  }>()

  if (rows.length > 0) {
    try {
      const feedbackRows = await params.db
        .select({
          messageId: agentMessageFeedbacks.messageId,
          rating: agentMessageFeedbacks.rating,
          reason: agentMessageFeedbacks.reason,
          note: agentMessageFeedbacks.note,
          updatedAtMs: agentMessageFeedbacks.updatedAtMs,
        })
        .from(agentMessageFeedbacks)
        .where(and(
          eq(agentMessageFeedbacks.userId, params.userId),
          inArray(agentMessageFeedbacks.messageId, rows.map((row) => row.id)),
        ))

      for (const row of feedbackRows) {
        if (row.rating !== 'positive' && row.rating !== 'negative') {
          continue
        }
        feedbackByMessageId.set(row.messageId, {
          rating: row.rating,
          reason: row.reason,
          note: row.note,
          updatedAtMs: row.updatedAtMs,
        })
      }
    } catch (error) {
      console.warn('Agent message feedbacks are unavailable', error)
    }
  }

  return rows
    .map((row) => ({
      id: row.id,
      conversationId: row.conversationId,
      agentId: row.agentId,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      status: row.status as 'completed' | 'failed',
      createdAtMs: row.createdAtMs,
      feedback: feedbackByMessageId.get(row.id) ?? null,
    }))
    .reverse()
}

export async function insertAgentConversationMessage(params: {
  db: ApiDb
  id: string
  conversationId: string
  userId: string
  agentId: string
  role: 'user' | 'assistant'
  content: string
  status: 'completed' | 'failed'
  metadataJson?: string | null
  nowMs: number
}) {
  await params.db.insert(agentConversationMessages).values({
    id: params.id,
    conversationId: params.conversationId,
    userId: params.userId,
    agentId: params.agentId,
    role: params.role,
    content: params.content,
    status: params.status,
    metadataJson: params.metadataJson ?? null,
    createdAtMs: params.nowMs,
  })
}

export async function findAgentConversationMessageForFeedback(params: {
  db: ApiDb
  userId: string
  agentId: string
  messageId: string
}): Promise<{
  id: string
  conversationId: string
  agentId: string
  role: 'assistant'
  content: string
  createdAtMs: number
} | null> {
  const row = await params.db
    .select({
      id: agentConversationMessages.id,
      conversationId: agentConversationMessages.conversationId,
      agentId: agentConversationMessages.agentId,
      role: agentConversationMessages.role,
      content: agentConversationMessages.content,
      createdAtMs: agentConversationMessages.createdAtMs,
    })
    .from(agentConversationMessages)
    .where(and(
      eq(agentConversationMessages.id, params.messageId),
      eq(agentConversationMessages.userId, params.userId),
      eq(agentConversationMessages.agentId, params.agentId),
      eq(agentConversationMessages.role, 'assistant'),
      eq(agentConversationMessages.status, 'completed'),
    ))
    .limit(1)
    .get()

  if (!row) {
    return null
  }

  return {
    id: row.id,
    conversationId: row.conversationId,
    agentId: row.agentId,
    role: 'assistant',
    content: row.content,
    createdAtMs: row.createdAtMs,
  }
}

export async function upsertAgentMessageFeedback(params: {
  db: ApiDb
  id: string
  userId: string
  agentId: string
  conversationId: string
  messageId: string
  rating: 'positive' | 'negative'
  reason: string | null
  note: string | null
  nowMs: number
}): Promise<{
  rating: 'positive' | 'negative'
  reason: string | null
  note: string | null
  updatedAtMs: number
}> {
  const existing = await params.db
    .select({ id: agentMessageFeedbacks.id })
    .from(agentMessageFeedbacks)
    .where(and(
      eq(agentMessageFeedbacks.userId, params.userId),
      eq(agentMessageFeedbacks.messageId, params.messageId),
    ))
    .limit(1)
    .get()

  if (existing) {
    await params.db
      .update(agentMessageFeedbacks)
      .set({
        agentId: params.agentId,
        conversationId: params.conversationId,
        rating: params.rating,
        reason: params.reason,
        note: params.note,
        updatedAtMs: params.nowMs,
      })
      .where(and(
        eq(agentMessageFeedbacks.id, existing.id),
        eq(agentMessageFeedbacks.userId, params.userId),
      ))
  } else {
    await params.db.insert(agentMessageFeedbacks).values({
      id: params.id,
      userId: params.userId,
      agentId: params.agentId,
      conversationId: params.conversationId,
      messageId: params.messageId,
      rating: params.rating,
      reason: params.reason,
      note: params.note,
      createdAtMs: params.nowMs,
      updatedAtMs: params.nowMs,
    })
  }

  return {
    rating: params.rating,
    reason: params.reason,
    note: params.note,
    updatedAtMs: params.nowMs,
  }
}

export async function listRecentAgentMessageFeedbacks(params: {
  db: ApiDb
  userId: string
  agentId: string
  limit: number
}): Promise<Array<{
  rating: 'positive' | 'negative'
  reason: string | null
  note: string | null
  messageContent: string
  updatedAtMs: number
}>> {
  const rows = await params.db
    .select({
      rating: agentMessageFeedbacks.rating,
      reason: agentMessageFeedbacks.reason,
      note: agentMessageFeedbacks.note,
      updatedAtMs: agentMessageFeedbacks.updatedAtMs,
      messageContent: agentConversationMessages.content,
    })
    .from(agentMessageFeedbacks)
    .innerJoin(agentConversationMessages, eq(agentConversationMessages.id, agentMessageFeedbacks.messageId))
    .where(and(
      eq(agentMessageFeedbacks.userId, params.userId),
      eq(agentMessageFeedbacks.agentId, params.agentId),
    ))
    .orderBy(sql`${agentMessageFeedbacks.updatedAtMs} desc, ${agentMessageFeedbacks.id} desc`)
    .limit(params.limit)

  return rows.map((row) => ({
    rating: row.rating as 'positive' | 'negative',
    reason: row.reason,
    note: row.note,
    messageContent: row.messageContent,
    updatedAtMs: row.updatedAtMs,
  }))
}

export async function updateAgentConversationAfterMessage(params: {
  db: ApiDb
  userId: string
  agentId: string
  conversationId: string
  summary: string | null
  messageCount: number
  lastMessageAtMs: number
  nowMs: number
}) {
  await params.db
    .update(agentConversations)
    .set({
      summary: params.summary,
      messageCount: params.messageCount,
      lastMessageAtMs: params.lastMessageAtMs,
      updatedAtMs: params.nowMs,
    })
    .where(and(
      eq(agentConversations.id, params.conversationId),
      eq(agentConversations.userId, params.userId),
      eq(agentConversations.agentId, params.agentId),
    ))
}

export async function listActiveAgentMemories(params: {
  db: ApiDb
  userId: string
  agentId: string
  limit: number
}): Promise<Array<{
  id: string
  type: string
  content: string
  importance: number
  updatedAtMs: number
}>> {
  return params.db
    .select({
      id: agentMemories.id,
      type: agentMemories.type,
      content: agentMemories.content,
      importance: agentMemories.importance,
      updatedAtMs: agentMemories.updatedAtMs,
    })
    .from(agentMemories)
    .where(and(
      eq(agentMemories.userId, params.userId),
      eq(agentMemories.agentId, params.agentId),
      eq(agentMemories.status, 'active'),
    ))
    .orderBy(sql`${agentMemories.importance} desc, ${agentMemories.updatedAtMs} desc`)
    .limit(params.limit)
}

export async function listAgentMemories(params: {
  db: ApiDb
  userId: string
  agentId?: string
  includeDeleted?: boolean
}): Promise<Array<{
  id: string
  agentId: string
  type: string
  content: string
  importance: number
  status: 'active' | 'disabled' | 'deleted'
  sourceMessageId: string | null
  sourceMessage: {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAtMs: number
  } | null
  createdAtMs: number
  updatedAtMs: number
}>> {
  const conditions: SQL[] = [
    eq(agentMemories.userId, params.userId),
  ]

  if (params.agentId) {
    conditions.push(eq(agentMemories.agentId, params.agentId))
  }

  if (!params.includeDeleted) {
    conditions.push(sql`${agentMemories.status} != 'deleted'`)
  }

  const rows = await params.db
    .select({
      id: agentMemories.id,
      agentId: agentMemories.agentId,
      type: agentMemories.type,
      content: agentMemories.content,
      importance: agentMemories.importance,
      status: agentMemories.status,
      sourceMessageId: agentMemories.sourceMessageId,
      createdAtMs: agentMemories.createdAtMs,
      updatedAtMs: agentMemories.updatedAtMs,
      sourceRole: agentConversationMessages.role,
      sourceContent: agentConversationMessages.content,
      sourceCreatedAtMs: agentConversationMessages.createdAtMs,
    })
    .from(agentMemories)
    .leftJoin(agentConversationMessages, eq(agentConversationMessages.id, agentMemories.sourceMessageId))
    .where(and(...conditions))
    .orderBy(sql`${agentMemories.updatedAtMs} desc, ${agentMemories.id} desc`)
    .limit(100)

  return rows.map((row) => ({
    id: row.id,
    agentId: row.agentId,
    type: row.type,
    content: row.content,
    importance: row.importance,
    status: row.status as 'active' | 'disabled' | 'deleted',
    sourceMessageId: row.sourceMessageId,
    sourceMessage: row.sourceMessageId && row.sourceRole && row.sourceContent && typeof row.sourceCreatedAtMs === 'number'
      ? {
          id: row.sourceMessageId,
          role: row.sourceRole as 'user' | 'assistant',
          content: row.sourceContent,
          createdAtMs: row.sourceCreatedAtMs,
        }
      : null,
    createdAtMs: row.createdAtMs,
    updatedAtMs: row.updatedAtMs,
  }))
}

export async function findAgentMemory(params: {
  db: ApiDb
  userId: string
  agentId: string
  memoryId: string
}): Promise<{
  id: string
  agentId: string
  type: string
  content: string
  importance: number
  status: 'active' | 'disabled' | 'deleted'
  sourceMessageId: string | null
  sourceMessage: {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAtMs: number
  } | null
  createdAtMs: number
  updatedAtMs: number
} | null> {
  const row = await params.db
    .select({
      id: agentMemories.id,
      agentId: agentMemories.agentId,
      type: agentMemories.type,
      content: agentMemories.content,
      importance: agentMemories.importance,
      status: agentMemories.status,
      sourceMessageId: agentMemories.sourceMessageId,
      createdAtMs: agentMemories.createdAtMs,
      updatedAtMs: agentMemories.updatedAtMs,
      sourceRole: agentConversationMessages.role,
      sourceContent: agentConversationMessages.content,
      sourceCreatedAtMs: agentConversationMessages.createdAtMs,
    })
    .from(agentMemories)
    .leftJoin(agentConversationMessages, eq(agentConversationMessages.id, agentMemories.sourceMessageId))
    .where(and(
      eq(agentMemories.id, params.memoryId),
      eq(agentMemories.userId, params.userId),
      eq(agentMemories.agentId, params.agentId),
    ))
    .limit(1)
    .get()

  if (!row) {
    return null
  }

  return {
    id: row.id,
    agentId: row.agentId,
    type: row.type,
    content: row.content,
    importance: row.importance,
    status: row.status as 'active' | 'disabled' | 'deleted',
    sourceMessageId: row.sourceMessageId,
    sourceMessage: row.sourceMessageId && row.sourceRole && row.sourceContent && typeof row.sourceCreatedAtMs === 'number'
      ? {
          id: row.sourceMessageId,
          role: row.sourceRole as 'user' | 'assistant',
          content: row.sourceContent,
          createdAtMs: row.sourceCreatedAtMs,
        }
      : null,
    createdAtMs: row.createdAtMs,
    updatedAtMs: row.updatedAtMs,
  }
}

export async function insertAgentMemory(params: {
  db: ApiDb
  id: string
  userId: string
  agentId: string
  type: string
  content: string
  importance: number
  sourceMessageId: string | null
  nowMs: number
}) {
  await params.db.insert(agentMemories).values({
    id: params.id,
    userId: params.userId,
    agentId: params.agentId,
    type: params.type,
    content: params.content,
    importance: params.importance,
    status: 'active',
    sourceMessageId: params.sourceMessageId,
    createdAtMs: params.nowMs,
    updatedAtMs: params.nowMs,
  })
}

export async function updateAgentMemory(params: {
  db: ApiDb
  userId: string
  agentId: string
  memoryId: string
  patch: {
    type?: string
    content?: string
    importance?: number
    status?: 'active' | 'disabled' | 'deleted'
  }
  nowMs: number
}) {
  await params.db
    .update(agentMemories)
    .set({
      ...params.patch,
      updatedAtMs: params.nowMs,
    })
    .where(and(
      eq(agentMemories.id, params.memoryId),
      eq(agentMemories.userId, params.userId),
      eq(agentMemories.agentId, params.agentId),
    ))
}

export async function findUserAgentCompanionDetail(
  db: ApiDb,
  params: {
    userId: string
    agentId: string
  },
): Promise<{
  id: string
  name: string
  headline: string | null
  description: string | null
  storyBackground: string | null
  personalityPrompt: string | null
  tonePrompt: string | null
  guardrailsPrompt: string | null
  openingMessage: string | null
  defaultPrompt: string | null
  imageKey: string | null
  visibility: 'private' | 'public' | null
  status: 'draft' | 'published' | 'archived'
  lastAssistantMessage: string | null
  lastAssistantMessageAtMs: number | null
  createdAtMs: number
  updatedAtMs: number
  publishedAtMs: number | null
  archivedAtMs: number | null
} | null> {
  const row = await db
    .select({
      id: userAgentCompanions.id,
      name: userAgentCompanions.name,
      headline: userAgentCompanions.headline,
      description: userAgentCompanions.description,
      storyBackground: userAgentCompanions.storyBackground,
      personalityPrompt: userAgentCompanions.personalityPrompt,
      tonePrompt: userAgentCompanions.tonePrompt,
      guardrailsPrompt: userAgentCompanions.guardrailsPrompt,
      openingMessage: userAgentCompanions.openingMessage,
      defaultPrompt: userAgentCompanions.defaultPrompt,
      imageKey: userAgentCompanions.imageKey,
      visibility: userAgentCompanions.visibility,
      status: userAgentCompanions.status,
      lastAssistantMessage: userAgentCompanions.lastAssistantMessage,
      lastAssistantMessageAtMs: userAgentCompanions.lastAssistantMessageAtMs,
      createdAtMs: userAgentCompanions.createdAtMs,
      updatedAtMs: userAgentCompanions.updatedAtMs,
      publishedAtMs: userAgentCompanions.publishedAtMs,
      archivedAtMs: userAgentCompanions.archivedAtMs,
    })
    .from(userAgentCompanions)
    .where(and(
      eq(userAgentCompanions.id, params.agentId),
      eq(userAgentCompanions.userId, params.userId),
    ))
    .limit(1)
    .get()

  return row
    ? {
        ...row,
        visibility: row.visibility as 'private' | 'public' | null,
        status: row.status as 'draft' | 'published' | 'archived',
      }
    : null
}

export async function updateUserAgentCompanion(params: {
  db: ApiDb
  userId: string
  agentId: string
  name: string
  headline: string
  description: string
  storyBackground: string
  personalityPrompt: string
  tonePrompt: string
  guardrailsPrompt: string
  openingMessage: string
  defaultPrompt: string
  imageKey: string | null
  visibility: 'private' | 'public'
  status: 'draft' | 'published'
  publishedAtMs: number | null
  nowMs: number
}) {
  await params.db
    .update(userAgentCompanions)
    .set({
      name: params.name,
      headline: params.headline,
      description: params.description,
      storyBackground: params.storyBackground,
      personalityPrompt: params.personalityPrompt,
      tonePrompt: params.tonePrompt,
      guardrailsPrompt: params.guardrailsPrompt,
      openingMessage: params.openingMessage,
      defaultPrompt: params.defaultPrompt,
      imageKey: params.imageKey,
      visibility: params.visibility,
      status: params.status,
      updatedAtMs: params.nowMs,
      publishedAtMs: params.publishedAtMs,
      archivedAtMs: null,
    })
    .where(and(
      eq(userAgentCompanions.id, params.agentId),
      eq(userAgentCompanions.userId, params.userId),
    ))
}

export async function updateUserAgentCompanionLatestAssistantMessage(params: {
  db: ApiDb
  userId: string
  agentId: string
  message: string
  nowMs: number
}) {
  await params.db
    .update(userAgentCompanions)
    .set({
      lastAssistantMessage: params.message,
      lastAssistantMessageAtMs: params.nowMs,
      updatedAtMs: params.nowMs,
    })
    .where(and(
      eq(userAgentCompanions.id, params.agentId),
      eq(userAgentCompanions.userId, params.userId),
    ))
}

export async function findAgentCarePlan(params: {
  db: ApiDb
  userId: string
  agentId: string
}): Promise<{
  id: string
  agentId: string
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'custom'
  preferredTime: string | null
  scenes: Array<'morning' | 'night' | 'long_absence' | 'stress_support' | 'relationship_warmup' | 'anniversary'>
  tone: 'light' | 'gentle' | 'intimate'
  customPrompt: string | null
  nextRunAtMs: number | null
  createdAtMs: number
  updatedAtMs: number
} | null> {
  const row = await params.db
    .select({
      id: agentCarePlans.id,
      agentId: agentCarePlans.agentId,
      enabled: agentCarePlans.enabled,
      frequency: agentCarePlans.frequency,
      preferredTime: agentCarePlans.preferredTime,
      scenesJson: agentCarePlans.scenesJson,
      tone: agentCarePlans.tone,
      customPrompt: agentCarePlans.customPrompt,
      nextRunAtMs: agentCarePlans.nextRunAtMs,
      createdAtMs: agentCarePlans.createdAtMs,
      updatedAtMs: agentCarePlans.updatedAtMs,
    })
    .from(agentCarePlans)
    .where(and(
      eq(agentCarePlans.userId, params.userId),
      eq(agentCarePlans.agentId, params.agentId),
    ))
    .limit(1)
    .get()

  if (!row) {
    return null
  }

  const allowedScenes = new Set(['morning', 'night', 'long_absence', 'stress_support', 'relationship_warmup', 'anniversary'])
  let scenes: Array<'morning' | 'night' | 'long_absence' | 'stress_support' | 'relationship_warmup' | 'anniversary'> = ['long_absence']

  try {
    const parsed = JSON.parse(row.scenesJson)
    const normalizedScenes = Array.isArray(parsed)
      ? parsed.filter((scene): scene is 'morning' | 'night' | 'long_absence' | 'stress_support' | 'relationship_warmup' | 'anniversary' =>
          typeof scene === 'string' && allowedScenes.has(scene),
        )
      : []

    if (normalizedScenes.length > 0) {
      scenes = normalizedScenes
    }
  } catch {
    scenes = ['long_absence']
  }

  return {
    id: row.id,
    agentId: row.agentId,
    enabled: row.enabled === 1,
    frequency: row.frequency as 'daily' | 'weekly' | 'custom',
    preferredTime: row.preferredTime,
    scenes,
    tone: row.tone as 'light' | 'gentle' | 'intimate',
    customPrompt: row.customPrompt,
    nextRunAtMs: row.nextRunAtMs,
    createdAtMs: row.createdAtMs,
    updatedAtMs: row.updatedAtMs,
  }
}

export async function upsertAgentCarePlan(params: {
  db: ApiDb
  id: string
  userId: string
  agentId: string
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'custom'
  preferredTime: string | null
  scenes: Array<'morning' | 'night' | 'long_absence' | 'stress_support' | 'relationship_warmup' | 'anniversary'>
  tone: 'light' | 'gentle' | 'intimate'
  customPrompt: string | null
  nextRunAtMs: number | null
  nowMs: number
}) {
  const existing = await params.db
    .select({ id: agentCarePlans.id, createdAtMs: agentCarePlans.createdAtMs })
    .from(agentCarePlans)
    .where(and(
      eq(agentCarePlans.userId, params.userId),
      eq(agentCarePlans.agentId, params.agentId),
    ))
    .limit(1)
    .get()

  if (existing) {
    await params.db
      .update(agentCarePlans)
      .set({
        enabled: params.enabled ? 1 : 0,
        frequency: params.frequency,
        preferredTime: params.preferredTime,
        scenesJson: JSON.stringify(params.scenes),
        tone: params.tone,
        customPrompt: params.customPrompt,
        nextRunAtMs: params.nextRunAtMs,
        updatedAtMs: params.nowMs,
      })
      .where(and(
        eq(agentCarePlans.id, existing.id),
        eq(agentCarePlans.userId, params.userId),
      ))

    return existing.id
  }

  await params.db.insert(agentCarePlans).values({
    id: params.id,
    userId: params.userId,
    agentId: params.agentId,
    enabled: params.enabled ? 1 : 0,
    frequency: params.frequency,
    preferredTime: params.preferredTime,
    scenesJson: JSON.stringify(params.scenes),
    tone: params.tone,
    customPrompt: params.customPrompt,
    nextRunAtMs: params.nextRunAtMs,
    createdAtMs: params.nowMs,
    updatedAtMs: params.nowMs,
  })

  return params.id
}

export async function insertAgentCareEvent(params: {
  db: ApiDb
  id: string
  userId: string
  agentId: string
  carePlanId: string | null
  conversationId: string
  messageId: string
  scene: 'morning' | 'night' | 'long_absence' | 'stress_support' | 'relationship_warmup' | 'anniversary'
  message: string
  metadataJson?: string | null
  nowMs: number
}) {
  await params.db.insert(agentCareEvents).values({
    id: params.id,
    userId: params.userId,
    agentId: params.agentId,
    carePlanId: params.carePlanId,
    conversationId: params.conversationId,
    messageId: params.messageId,
    scene: params.scene,
    status: 'generated',
    message: params.message,
    metadataJson: params.metadataJson ?? null,
    generatedAtMs: params.nowMs,
    readAtMs: null,
  })
}

export async function listAgentCareEvents(params: {
  db: ApiDb
  userId: string
  agentId: string
  limit: number
}): Promise<Array<{
  id: string
  agentId: string
  carePlanId: string | null
  conversationId: string
  messageId: string
  scene: 'morning' | 'night' | 'long_absence' | 'stress_support' | 'relationship_warmup' | 'anniversary'
  status: 'generated' | 'read'
  message: string
  generatedAtMs: number
  readAtMs: number | null
}>> {
  const rows = await params.db
    .select({
      id: agentCareEvents.id,
      agentId: agentCareEvents.agentId,
      carePlanId: agentCareEvents.carePlanId,
      conversationId: agentCareEvents.conversationId,
      messageId: agentCareEvents.messageId,
      scene: agentCareEvents.scene,
      status: agentCareEvents.status,
      message: agentCareEvents.message,
      generatedAtMs: agentCareEvents.generatedAtMs,
      readAtMs: agentCareEvents.readAtMs,
    })
    .from(agentCareEvents)
    .where(and(
      eq(agentCareEvents.userId, params.userId),
      eq(agentCareEvents.agentId, params.agentId),
    ))
    .orderBy(sql`${agentCareEvents.generatedAtMs} desc, ${agentCareEvents.id} desc`)
    .limit(params.limit)

  return rows.map((row) => ({
    id: row.id,
    agentId: row.agentId,
    carePlanId: row.carePlanId,
    conversationId: row.conversationId,
    messageId: row.messageId,
    scene: row.scene as 'morning' | 'night' | 'long_absence' | 'stress_support' | 'relationship_warmup' | 'anniversary',
    status: row.status as 'generated' | 'read',
    message: row.message,
    generatedAtMs: row.generatedAtMs,
    readAtMs: row.readAtMs,
  }))
}

export async function findAgentCareEvent(params: {
  db: ApiDb
  userId: string
  agentId: string
  eventId: string
}): Promise<{
  id: string
  agentId: string
  carePlanId: string | null
  conversationId: string
  messageId: string
  scene: 'morning' | 'night' | 'long_absence' | 'stress_support' | 'relationship_warmup' | 'anniversary'
  status: 'generated' | 'read'
  message: string
  generatedAtMs: number
  readAtMs: number | null
} | null> {
  const row = await params.db
    .select({
      id: agentCareEvents.id,
      agentId: agentCareEvents.agentId,
      carePlanId: agentCareEvents.carePlanId,
      conversationId: agentCareEvents.conversationId,
      messageId: agentCareEvents.messageId,
      scene: agentCareEvents.scene,
      status: agentCareEvents.status,
      message: agentCareEvents.message,
      generatedAtMs: agentCareEvents.generatedAtMs,
      readAtMs: agentCareEvents.readAtMs,
    })
    .from(agentCareEvents)
    .where(and(
      eq(agentCareEvents.id, params.eventId),
      eq(agentCareEvents.userId, params.userId),
      eq(agentCareEvents.agentId, params.agentId),
    ))
    .limit(1)
    .get()

  return row
    ? {
        id: row.id,
        agentId: row.agentId,
        carePlanId: row.carePlanId,
        conversationId: row.conversationId,
        messageId: row.messageId,
        scene: row.scene as 'morning' | 'night' | 'long_absence' | 'stress_support' | 'relationship_warmup' | 'anniversary',
        status: row.status as 'generated' | 'read',
        message: row.message,
        generatedAtMs: row.generatedAtMs,
        readAtMs: row.readAtMs,
      }
    : null
}

export async function markAgentCareEventsRead(params: {
  db: ApiDb
  userId: string
  agentId: string
  nowMs: number
}) {
  try {
    await params.db
      .update(agentCareEvents)
      .set({
        status: 'read',
        readAtMs: params.nowMs,
      })
      .where(and(
        eq(agentCareEvents.userId, params.userId),
        eq(agentCareEvents.agentId, params.agentId),
        eq(agentCareEvents.status, 'generated'),
        isNull(agentCareEvents.readAtMs),
      ))
  } catch (error) {
    console.warn('Agent care read marker is unavailable', error)
  }
}

export async function findUserAgentCompanionImageByKey(
  db: ApiDb,
  params: {
    userId: string
    imageKey: string
  },
): Promise<{
  id: string
  imageKey: string | null
} | null> {
  const row = await db
    .select({
      id: userAgentCompanions.id,
      imageKey: userAgentCompanions.imageKey,
    })
    .from(userAgentCompanions)
    .where(and(
      eq(userAgentCompanions.userId, params.userId),
      eq(userAgentCompanions.imageKey, params.imageKey),
    ))
    .limit(1)
    .get()

  return row ?? null
}

export async function findUserAgentCompanionPrompt(
  db: ApiDb,
  params: {
    userId: string
    agentId: string
  },
): Promise<{
  id: string
  name: string
  guardrailsPrompt: string | null
  defaultPrompt: string | null
} | null> {
  const row = await db
    .select({
      id: userAgentCompanions.id,
      name: userAgentCompanions.name,
      guardrailsPrompt: userAgentCompanions.guardrailsPrompt,
      defaultPrompt: userAgentCompanions.defaultPrompt,
    })
    .from(userAgentCompanions)
    .where(and(
      eq(userAgentCompanions.id, params.agentId),
      eq(userAgentCompanions.userId, params.userId),
    ))
    .limit(1)
    .get()

  return row ?? null
}

export async function findWebUserByGithubAccount(
  db: ApiDb,
  providerUserId: string,
): Promise<{
  userId: string
  userStatus: 'active' | 'suspended' | 'deleted'
} | null> {
  const row = await db
    .select({
      userId: users.id,
      userStatus: users.status,
    })
    .from(oauthAccounts)
    .innerJoin(users, eq(users.id, oauthAccounts.userId))
    .where(
      and(
        eq(oauthAccounts.provider, 'github'),
        eq(oauthAccounts.providerUserId, providerUserId),
      ),
    )
    .limit(1)
    .get()

  return row
    ? {
        ...row,
        userStatus: row.userStatus as 'active' | 'suspended' | 'deleted',
      }
    : null
}

export async function findUserByNormalizedEmail(
  db: ApiDb,
  normalizedEmail: string,
): Promise<{
  userId: string
  emailId: string
  userStatus: 'active' | 'suspended' | 'deleted'
} | null> {
  const row = await db
    .select({
      userId: users.id,
      emailId: userEmails.id,
      userStatus: users.status,
    })
    .from(userEmails)
    .innerJoin(users, eq(users.id, userEmails.userId))
    .where(eq(userEmails.normalizedEmail, normalizedEmail))
    .limit(1)
    .get()

  return row
    ? {
        ...row,
        userStatus: row.userStatus as 'active' | 'suspended' | 'deleted',
      }
    : null
}

export async function findPrimaryEmailIdByUserId(
  db: ApiDb,
  userId: string,
): Promise<string | null> {
  const row = await db
    .select({ id: userEmails.id })
    .from(userEmails)
    .where(
      and(
        eq(userEmails.userId, userId),
        eq(userEmails.isPrimary, 1),
      ),
    )
    .limit(1)
    .get()

  return row?.id ?? null
}

export async function createGithubWebUser(params: {
  db: ApiDb
  userId: string
  emailId: string
  oauthAccountId: string
  roleBindingId: string
  webRoleId: string
  email: string
  normalizedEmail: string
  displayName: string
  providerUserId: string
  providerLogin: string | null
  nowMs: number
}): Promise<void> {
  await params.db.batch([
    params.db.insert(users).values({
      id: params.userId,
      status: 'active',
      displayName: params.displayName,
      primaryEmailId: params.emailId,
      avatarKey: null,
      createdAtMs: params.nowMs,
      updatedAtMs: params.nowMs,
      lastLoginAtMs: null,
    }),
    params.db.insert(userEmails).values({
      id: params.emailId,
      userId: params.userId,
      email: params.email,
      normalizedEmail: params.normalizedEmail,
      isPrimary: 1,
      isVerified: 1,
      verifiedAtMs: params.nowMs,
      source: 'github',
      createdAtMs: params.nowMs,
      updatedAtMs: params.nowMs,
    }),
    params.db.insert(oauthAccounts).values({
      id: params.oauthAccountId,
      userId: params.userId,
      provider: 'github',
      providerUserId: params.providerUserId,
      providerLogin: params.providerLogin,
      emailId: params.emailId,
      createdAtMs: params.nowMs,
      updatedAtMs: params.nowMs,
    }),
    params.db.insert(userRoleBindings).values({
      id: params.roleBindingId,
      userId: params.userId,
      roleId: params.webRoleId,
      status: 'active',
      grantedAtMs: params.nowMs,
      revokedAtMs: null,
    }),
  ])
}

export async function linkGithubAccountToUser(params: {
  db: ApiDb
  oauthAccountId: string
  userId: string
  emailId: string | null
  providerUserId: string
  providerLogin: string | null
  nowMs: number
}): Promise<void> {
  await params.db.insert(oauthAccounts).values({
    id: params.oauthAccountId,
    userId: params.userId,
    provider: 'github',
    providerUserId: params.providerUserId,
    providerLogin: params.providerLogin,
    emailId: params.emailId,
    createdAtMs: params.nowMs,
    updatedAtMs: params.nowMs,
  })
}

export async function ensureUserHasRole(params: {
  db: ApiDb
  bindingId: string
  userId: string
  roleId: string
  nowMs: number
}): Promise<void> {
  await params.db.insert(userRoleBindings).values({
    id: params.bindingId,
    userId: params.userId,
    roleId: params.roleId,
    status: 'active',
    grantedAtMs: params.nowMs,
    revokedAtMs: null,
  }).onConflictDoUpdate({
    target: [userRoleBindings.userId, userRoleBindings.roleId],
    set: {
      status: 'active',
      revokedAtMs: null,
    },
  })
}

export async function insertOauthLoginTicket(params: {
  db: ApiDb
  id: string
  ticketHash: string
  userId: string
  applicationId: string
  provider: 'github' | 'google'
  createdAtMs: number
  expiresAtMs: number
}): Promise<void> {
  await params.db.insert(oauthLoginTickets).values({
    id: params.id,
    ticketHash: params.ticketHash,
    userId: params.userId,
    applicationId: params.applicationId,
    provider: params.provider,
    createdAtMs: params.createdAtMs,
    expiresAtMs: params.expiresAtMs,
    usedAtMs: null,
  })
}

export async function consumeOauthLoginTicket(params: {
  db: ApiDb
  ticketHash: string
  provider: 'github' | 'google'
  nowMs: number
}): Promise<{
  ticketId: string
  userId: string
  applicationId: string
  expiresAtMs: number
} | null> {
  const row = await params.db
    .update(oauthLoginTickets)
    .set({ usedAtMs: params.nowMs })
    .where(
      and(
        eq(oauthLoginTickets.ticketHash, params.ticketHash),
        eq(oauthLoginTickets.provider, params.provider),
        isNull(oauthLoginTickets.usedAtMs),
        sql`${oauthLoginTickets.expiresAtMs} > ${params.nowMs}`,
      ),
    )
    .returning({
      ticketId: oauthLoginTickets.id,
      userId: oauthLoginTickets.userId,
      applicationId: oauthLoginTickets.applicationId,
      expiresAtMs: oauthLoginTickets.expiresAtMs,
    })

  return row[0] ?? null
}

export async function getApplicationIdByCode(db: ApiDb, appCode: 'admin' | 'web'): Promise<string> {
  const row = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.code, appCode))
    .limit(1)
    .get()

  if (!row) {
    throw new Error(`${appCode} application is missing`)
  }

  return row.id
}

export async function getAdminApplicationId(db: ApiDb): Promise<string> {
  return getApplicationIdByCode(db, 'admin')
}

export async function getWebApplicationId(db: ApiDb): Promise<string> {
  return getApplicationIdByCode(db, 'web')
}

export async function createAuthSession(params: {
  db: ApiDb
  userId: string
  applicationId: string
  app: 'admin' | 'web'
  sessionType: 'admin' | 'web'
  userAgent: string | null
  ip: string | null
  nowMs: number
  expiresAtMs: number
  roles: string[]
}): Promise<SessionContext> {
  const sessionId = uuidv7()

  // 登录成功时同时写 session 和 users.last_login_at_ms，让“会话状态”和“用户最近登录时间”保持同一时刻更新。
  await params.db.batch([
    params.db.insert(authSessions).values({
      id: sessionId,
      userId: params.userId,
      applicationId: params.applicationId,
      sessionType: params.sessionType,
      deviceName: null,
      userAgent: params.userAgent,
      ip: params.ip,
      lastSeenAtMs: params.nowMs,
      createdAtMs: params.nowMs,
      expiresAtMs: params.expiresAtMs,
      revokedAtMs: null,
      revokeReason: null,
    }),
    params.db
      .update(users)
      .set({
        lastLoginAtMs: params.nowMs,
        updatedAtMs: params.nowMs,
      })
      .where(eq(users.id, params.userId)),
  ])

  return {
    sessionId,
    userId: params.userId,
    app: params.app,
    roles: params.roles,
    expiresAtMs: params.expiresAtMs,
  }
}

export async function createAdminSession(params: {
  db: ApiDb
  userId: string
  applicationId: string
  userAgent: string | null
  ip: string | null
  nowMs: number
  expiresAtMs: number
  roles: string[]
}): Promise<SessionContext> {
  return createAuthSession({
    ...params,
    app: 'admin',
    sessionType: 'admin',
  })
}

export async function createWebSession(params: {
  db: ApiDb
  userId: string
  applicationId: string
  userAgent: string | null
  ip: string | null
  nowMs: number
  expiresAtMs: number
  roles: string[]
}): Promise<SessionContext> {
  return createAuthSession({
    ...params,
    app: 'web',
    sessionType: 'web',
  })
}

export async function insertRefreshToken(params: {
  db: ApiDb
  tokenId: string
  sessionId: string
  jtiHash: string
  parentTokenId: string | null
  issuedAtMs: number
  expiresAtMs: number
}): Promise<void> {
  // parent_token_id 把 refresh token rotation 串成一条链，后面排查重放和替换关系会容易很多。
  await params.db.insert(refreshTokens).values({
    id: params.tokenId,
    sessionId: params.sessionId,
    jtiHash: params.jtiHash,
    parentTokenId: params.parentTokenId,
    issuedAtMs: params.issuedAtMs,
    expiresAtMs: params.expiresAtMs,
    usedAtMs: null,
    revokedAtMs: null,
    replacedByTokenId: null,
  })
}

export async function findRefreshTokenForSession(params: {
  db: ApiDb
  jtiHash: string
  sessionId: string
}): Promise<RefreshTokenRecord | null> {
  // 这里把 session 撤销状态一并查出来，refresh route 就不用再二次查询 auth_sessions。
  const row = await params.db
    .select({
      tokenId: refreshTokens.id,
      sessionId: refreshTokens.sessionId,
      userId: authSessions.userId,
      applicationCode: applications.code,
      expiresAtMs: refreshTokens.expiresAtMs,
      usedAtMs: refreshTokens.usedAtMs,
      revokedAtMs: refreshTokens.revokedAtMs,
      sessionRevokedAtMs: authSessions.revokedAtMs,
    })
    .from(refreshTokens)
    .innerJoin(authSessions, eq(authSessions.id, refreshTokens.sessionId))
    .innerJoin(applications, eq(applications.id, authSessions.applicationId))
    .where(
      and(
        eq(refreshTokens.jtiHash, params.jtiHash),
        eq(refreshTokens.sessionId, params.sessionId),
      ),
    )
    .limit(1)
    .get()

  return row ?? null
}

export async function markRefreshTokenUsed(params: {
  db: ApiDb
  tokenId: string
  usedAtMs: number
}): Promise<boolean> {
  // 条件更新只会让第一个成功刷新的请求拿到 changes=1，后续并发请求会直接落到 replay 分支。
  const updated = await params.db
    .update(refreshTokens)
    .set({ usedAtMs: params.usedAtMs })
    .where(
      and(
        eq(refreshTokens.id, params.tokenId),
        isNull(refreshTokens.usedAtMs),
        isNull(refreshTokens.revokedAtMs),
      ),
    )
    .returning({ id: refreshTokens.id })

  return updated.length === 1
}

export async function updateRefreshRotation(params: {
  db: ApiDb
  oldTokenId: string
  newTokenId: string
  sessionId: string
  lastSeenAtMs: number
}): Promise<void> {
  // 旧 token 指向新 token，加上 session 的 last_seen 更新时间，方便后续排查一条 refresh 链的演进过程。
  await params.db.batch([
    params.db
      .update(refreshTokens)
      .set({ replacedByTokenId: params.newTokenId })
      .where(eq(refreshTokens.id, params.oldTokenId)),
    params.db
      .update(authSessions)
      .set({ lastSeenAtMs: params.lastSeenAtMs })
      .where(eq(authSessions.id, params.sessionId)),
  ])
}

export async function revokeSession(params: {
  db: ApiDb
  sessionId: string
  revokedAtMs: number
  reason: string
}): Promise<void> {
  // 发现 refresh token 重放时直接撤销整个 session，比只封掉单个 token 更容易收住风险面。
  await params.db.batch([
    params.db
      .update(authSessions)
      .set({
        revokedAtMs: sql`COALESCE(${authSessions.revokedAtMs}, ${params.revokedAtMs})`,
        revokeReason: sql`COALESCE(${authSessions.revokeReason}, ${params.reason})`,
      })
      .where(eq(authSessions.id, params.sessionId)),
    params.db
      .update(refreshTokens)
      .set({
        revokedAtMs: sql`COALESCE(${refreshTokens.revokedAtMs}, ${params.revokedAtMs})`,
      })
      .where(
        and(
          eq(refreshTokens.sessionId, params.sessionId),
          isNull(refreshTokens.revokedAtMs),
        ),
      ),
  ])
}

export async function findUserProfileById(
  db: ApiDb,
  userId: string,
): Promise<UserProfileRecord | null> {
  const profile = await db
    .select({
      id: users.id,
      name: sql<string>`COALESCE(${users.displayName}, ${userEmails.email})`,
      email: userEmails.email,
      avatarKey: users.avatarKey,
      status: users.status,
      createdAtMs: users.createdAtMs,
      updatedAtMs: users.updatedAtMs,
      lastLoginAtMs: users.lastLoginAtMs,
    })
    .from(users)
    .innerJoin(userEmails, eq(userEmails.id, users.primaryEmailId))
    .where(eq(users.id, userId))
    .limit(1)
    .get()

  if (!profile) {
    return null
  }

  const rolesResult = await db
    .select({ code: roles.code })
    .from(userRoleBindings)
    .innerJoin(roles, eq(roles.id, userRoleBindings.roleId))
    .where(
      and(
        eq(userRoleBindings.userId, userId),
        eq(userRoleBindings.status, 'active'),
        eq(roles.status, 'active'),
      ),
    )

  return {
    ...profile,
    status: profile.status as UserProfileRecord['status'],
    roles: rolesResult.map((row) => row.code),
  }
}

export async function findLatestDefaultAvatarVersion(db: ApiDb): Promise<{
  key: string
  updatedAtMs: number
} | null> {
  const row = await db
    .select({
      key: defaultAvatarVersions.avatarKey,
      updatedAtMs: defaultAvatarVersions.createdAtMs,
    })
    .from(defaultAvatarVersions)
    .orderBy(sql`${defaultAvatarVersions.createdAtMs} desc, ${defaultAvatarVersions.id} desc`)
    .limit(1)
    .get()

  return row ?? null
}

export async function insertDefaultAvatarVersion(params: {
  db: ApiDb
  id: string
  key: string
  fileName: string
  contentType: string
  sizeBytes: number
  createdByUserId: string
  createdAtMs: number
}): Promise<void> {
  await params.db.insert(defaultAvatarVersions).values({
    id: params.id,
    avatarKey: params.key,
    fileName: params.fileName,
    contentType: params.contentType,
    sizeBytes: params.sizeBytes,
    createdByUserId: params.createdByUserId,
    createdAtMs: params.createdAtMs,
  })
}

export async function findDefaultAvatarHistory(db: ApiDb): Promise<Array<{
  id: string
  key: string
  fileName: string
  contentType: string
  sizeBytes: number
  createdByUserId: string | null
  createdAtMs: number
}>> {
  const rows = await db
    .select({
      id: defaultAvatarVersions.id,
      key: defaultAvatarVersions.avatarKey,
      fileName: defaultAvatarVersions.fileName,
      contentType: defaultAvatarVersions.contentType,
      sizeBytes: defaultAvatarVersions.sizeBytes,
      createdByUserId: defaultAvatarVersions.createdByUserId,
      createdAtMs: defaultAvatarVersions.createdAtMs,
    })
    .from(defaultAvatarVersions)
    .orderBy(sql`${defaultAvatarVersions.createdAtMs} desc, ${defaultAvatarVersions.id} desc`)

  const latestRowByKey = new Map<string, (typeof rows)[number]>()

  for (const row of rows) {
    if (!latestRowByKey.has(row.key)) {
      latestRowByKey.set(row.key, row)
    }
  }

  return [...latestRowByKey.values()]
}

export async function findRoleIdByCode(
  db: ApiDb,
  code: string,
): Promise<string | null> {
  const row = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(eq(roles.code, code), eq(roles.status, 'active')))
    .limit(1)
    .get()

  return row?.id ?? null
}

export async function findRoleList(db: ApiDb): Promise<Array<{
  id: string
  applicationCode: string
  code: string
  name: string
  status: 'active' | 'disabled' | 'deleted'
  createdAtMs: number
  updatedAtMs: number
  disabledAtMs: number | null
  deletedAtMs: number | null
}>> {
  const rows = await db
    .select({
      id: roles.id,
      applicationCode: applications.code,
      code: roles.code,
      name: roles.name,
      status: roles.status,
      createdAtMs: roles.createdAtMs,
      updatedAtMs: roles.updatedAtMs,
      disabledAtMs: roles.disabledAtMs,
      deletedAtMs: roles.deletedAtMs,
    })
    .from(roles)
    .innerJoin(applications, eq(applications.id, roles.applicationId))
    .where(sql`${roles.status} != 'deleted'`)
    .orderBy(sql`${applications.code} asc, ${roles.createdAtMs} desc, ${roles.id} desc`)

  return rows.map((row) => ({
    ...row,
    status: row.status as 'active' | 'disabled' | 'deleted',
  }))
}

export async function createRole(params: {
  db: ApiDb
  id: string
  applicationId: string
  code: string
  name: string
  nowMs: number
}): Promise<void> {
  await params.db.insert(roles).values({
    id: params.id,
    applicationId: params.applicationId,
    code: params.code,
    name: params.name,
    status: 'active',
    createdAtMs: params.nowMs,
    updatedAtMs: params.nowMs,
    disabledAtMs: null,
    deletedAtMs: null,
  })
}

export async function findRoleById(
  db: ApiDb,
  roleId: string,
): Promise<{
  id: string
  applicationCode: string
  code: string
  name: string
  status: 'active' | 'disabled' | 'deleted'
} | null> {
  const row = await db
    .select({
      id: roles.id,
      applicationCode: applications.code,
      code: roles.code,
      name: roles.name,
      status: roles.status,
    })
    .from(roles)
    .innerJoin(applications, eq(applications.id, roles.applicationId))
    .where(eq(roles.id, roleId))
    .limit(1)
    .get()

  return row
    ? {
        ...row,
        status: row.status as 'active' | 'disabled' | 'deleted',
      }
    : null
}

export async function disableRole(params: {
  db: ApiDb
  roleId: string
  nowMs: number
}): Promise<void> {
  await params.db
    .update(roles)
    .set({
      status: 'disabled',
      updatedAtMs: params.nowMs,
      disabledAtMs: params.nowMs,
    })
    .where(eq(roles.id, params.roleId))
}

export async function deleteRole(params: {
  db: ApiDb
  roleId: string
  nowMs: number
}): Promise<void> {
  await params.db
    .update(roles)
    .set({
      status: 'deleted',
      updatedAtMs: params.nowMs,
      deletedAtMs: params.nowMs,
    })
    .where(eq(roles.id, params.roleId))
}

export async function listSubscriptionPlans(db: ApiDb): Promise<Array<{
  id: string
  code: string
  name: string
  description: string | null
  price: string
  billingPeriod: 'month' | 'year' | 'one_time'
  maxAgents: number
  supportsGroupChat: boolean
  supportsMultiAgentLinkage: boolean
  supportsDiscoverSquare: boolean
  supportsAgentTimeEvolution: boolean
  status: 'active' | 'disabled' | 'deleted'
  createdAtMs: number
  updatedAtMs: number
  deletedAtMs: number | null
}>> {
  const rows = await db
    .select({
      id: subscriptionPlans.id,
      code: subscriptionPlans.code,
      name: subscriptionPlans.name,
      description: subscriptionPlans.description,
      price: subscriptionPlans.price,
      billingPeriod: subscriptionPlans.billingPeriod,
      maxAgents: subscriptionPlans.maxAgents,
      supportsGroupChat: subscriptionPlans.supportsGroupChat,
      supportsMultiAgentLinkage: subscriptionPlans.supportsMultiAgentLinkage,
      supportsDiscoverSquare: subscriptionPlans.supportsDiscoverSquare,
      supportsAgentTimeEvolution: subscriptionPlans.supportsAgentTimeEvolution,
      status: subscriptionPlans.status,
      createdAtMs: subscriptionPlans.createdAtMs,
      updatedAtMs: subscriptionPlans.updatedAtMs,
      deletedAtMs: subscriptionPlans.deletedAtMs,
    })
    .from(subscriptionPlans)
    .where(sql`${subscriptionPlans.status} != 'deleted'`)
    .orderBy(sql`${subscriptionPlans.createdAtMs} desc, ${subscriptionPlans.id} desc`)

  return rows.map((row) => ({
    ...row,
    billingPeriod: row.billingPeriod as 'month' | 'year' | 'one_time',
    supportsGroupChat: row.supportsGroupChat === 1,
    supportsMultiAgentLinkage: row.supportsMultiAgentLinkage === 1,
    supportsDiscoverSquare: row.supportsDiscoverSquare === 1,
    supportsAgentTimeEvolution: row.supportsAgentTimeEvolution === 1,
    status: row.status as 'active' | 'disabled' | 'deleted',
  }))
}

export async function createSubscriptionPlan(params: {
  db: ApiDb
  id: string
  code: string
  name: string
  description: string | null
  price: string
  billingPeriod: 'month' | 'year' | 'one_time'
  maxAgents: number
  supportsGroupChat: boolean
  supportsMultiAgentLinkage: boolean
  supportsDiscoverSquare: boolean
  supportsAgentTimeEvolution: boolean
  nowMs: number
}): Promise<void> {
  await params.db.insert(subscriptionPlans).values({
    id: params.id,
    code: params.code,
    name: params.name,
    description: params.description,
    price: params.price,
    billingPeriod: params.billingPeriod,
    maxAgents: params.maxAgents,
    supportsGroupChat: params.supportsGroupChat ? 1 : 0,
    supportsMultiAgentLinkage: params.supportsMultiAgentLinkage ? 1 : 0,
    supportsDiscoverSquare: params.supportsDiscoverSquare ? 1 : 0,
    supportsAgentTimeEvolution: params.supportsAgentTimeEvolution ? 1 : 0,
    status: 'active',
    createdAtMs: params.nowMs,
    updatedAtMs: params.nowMs,
    deletedAtMs: null,
  })
}

export async function updateSubscriptionPlan(params: {
  db: ApiDb
  planId: string
  name: string
  description: string | null
  price: string
  billingPeriod: 'month' | 'year' | 'one_time'
  maxAgents: number
  supportsGroupChat: boolean
  supportsMultiAgentLinkage: boolean
  supportsDiscoverSquare: boolean
  supportsAgentTimeEvolution: boolean
  nowMs: number
}): Promise<void> {
  await params.db
    .update(subscriptionPlans)
    .set({
      name: params.name,
      description: params.description,
      price: params.price,
      billingPeriod: params.billingPeriod,
      maxAgents: params.maxAgents,
      supportsGroupChat: params.supportsGroupChat ? 1 : 0,
      supportsMultiAgentLinkage: params.supportsMultiAgentLinkage ? 1 : 0,
      supportsDiscoverSquare: params.supportsDiscoverSquare ? 1 : 0,
      supportsAgentTimeEvolution: params.supportsAgentTimeEvolution ? 1 : 0,
      updatedAtMs: params.nowMs,
    })
    .where(eq(subscriptionPlans.id, params.planId))
}

export async function disableSubscriptionPlan(params: {
  db: ApiDb
  planId: string
  nowMs: number
}): Promise<void> {
  await params.db
    .update(subscriptionPlans)
    .set({
      status: 'disabled',
      updatedAtMs: params.nowMs,
    })
    .where(eq(subscriptionPlans.id, params.planId))
}

export async function deleteSubscriptionPlan(params: {
  db: ApiDb
  planId: string
  nowMs: number
}): Promise<void> {
  await params.db
    .update(subscriptionPlans)
    .set({
      status: 'deleted',
      updatedAtMs: params.nowMs,
      deletedAtMs: params.nowMs,
    })
    .where(eq(subscriptionPlans.id, params.planId))
}

export async function findSubscriptionUserList(
  db: ApiDb,
  params: {
    offset: number
    limit: number
  },
): Promise<{
  items: Array<{
    id: string
    userId: string
    userName: string
    userEmail: string
    userStatus: 'active' | 'suspended' | 'deleted'
    planId: string
    planCode: string
    planName: string
    planPrice: string
    planBillingPeriod: 'month' | 'year' | 'one_time'
    assignedAtMs: number
    assignedByUserId: string | null
  }>
  total: number
}> {
  const totalRow = await db
    .select({ total: sql<number>`count(*)` })
    .from(userSubscriptionBindings)
    .where(eq(userSubscriptionBindings.status, 'active'))
    .get()

  const total = Number(totalRow?.total ?? 0)

  const rows = await db
    .select({
      id: userSubscriptionBindings.id,
      userId: users.id,
      userName: sql<string>`COALESCE(${users.displayName}, ${userEmails.email})`,
      userEmail: userEmails.email,
      userStatus: users.status,
      planId: subscriptionPlans.id,
      planCode: subscriptionPlans.code,
      planName: subscriptionPlans.name,
      planPrice: subscriptionPlans.price,
      planBillingPeriod: subscriptionPlans.billingPeriod,
      assignedAtMs: userSubscriptionBindings.assignedAtMs,
      assignedByUserId: userSubscriptionBindings.assignedByUserId,
    })
    .from(userSubscriptionBindings)
    .innerJoin(users, eq(users.id, userSubscriptionBindings.userId))
    .innerJoin(userEmails, eq(userEmails.id, users.primaryEmailId))
    .innerJoin(subscriptionPlans, eq(subscriptionPlans.id, userSubscriptionBindings.subscriptionPlanId))
    .where(eq(userSubscriptionBindings.status, 'active'))
    .orderBy(sql`${userSubscriptionBindings.assignedAtMs} desc, ${userSubscriptionBindings.id} desc`)
    .limit(params.limit)
    .offset(params.offset)

  return {
    total,
    items: rows.map((row) => ({
      ...row,
      userStatus: row.userStatus as 'active' | 'suspended' | 'deleted',
      planBillingPeriod: row.planBillingPeriod as 'month' | 'year' | 'one_time',
    })),
  }
}

export async function findActiveUserById(
  db: ApiDb,
  userId: string,
): Promise<{ id: string } | null> {
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.status, 'active')))
    .limit(1)
    .get()

  return row ?? null
}

export async function findActiveSubscriptionPlanById(
  db: ApiDb,
  planId: string,
): Promise<{ id: string } | null> {
  const row = await db
    .select({ id: subscriptionPlans.id })
    .from(subscriptionPlans)
    .where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.status, 'active')))
    .limit(1)
    .get()

  return row ?? null
}

export async function assignUserSubscriptionPlan(params: {
  db: ApiDb
  bindingId: string
  userId: string
  planId: string
  assignedByUserId: string
  nowMs: number
}): Promise<void> {
  const currentBinding = await params.db
    .select({ id: userSubscriptionBindings.id, planId: userSubscriptionBindings.subscriptionPlanId })
    .from(userSubscriptionBindings)
    .where(and(eq(userSubscriptionBindings.userId, params.userId), eq(userSubscriptionBindings.status, 'active')))
    .limit(1)
    .get()

  if (currentBinding?.planId === params.planId) {
    return
  }

  await params.db.batch([
    params.db
      .update(userSubscriptionBindings)
      .set({
        status: 'revoked',
        revokedAtMs: params.nowMs,
      })
      .where(and(eq(userSubscriptionBindings.userId, params.userId), eq(userSubscriptionBindings.status, 'active'))),
    params.db.insert(userSubscriptionBindings).values({
      id: params.bindingId,
      userId: params.userId,
      subscriptionPlanId: params.planId,
      status: 'active',
      assignedAtMs: params.nowMs,
      assignedByUserId: params.assignedByUserId,
      revokedAtMs: null,
    }),
  ])
}

export async function createFinancialBill(params: {
  db: ApiDb
  id: string
  wechatNickname: string
  email: string
  normalizedEmail: string
  paidAmountCents: number
  paidAtMs: number
  billingMonth: string
  isRefunded: boolean
  refundAmountCents: number
  note: string | null
  createdByUserId: string
  nowMs: number
}): Promise<void> {
  await params.db.insert(financialBills).values({
    id: params.id,
    wechatNickname: params.wechatNickname,
    email: params.email,
    normalizedEmail: params.normalizedEmail,
    paidAmountCents: params.paidAmountCents,
    paidAtMs: params.paidAtMs,
    billingMonth: params.billingMonth,
    isRefunded: params.isRefunded ? 1 : 0,
    refundAmountCents: params.refundAmountCents,
    note: params.note,
    createdByUserId: params.createdByUserId,
    createdAtMs: params.nowMs,
    updatedAtMs: params.nowMs,
  })
}

export async function listFinancialBillMonths(db: ApiDb): Promise<Array<{
  month: string
  billCount: number
  paidAmountCents: number
  refundAmountCents: number
  netRevenueCents: number
}>> {
  const rows = await db
    .select({
      month: financialBills.billingMonth,
      billCount: sql<number>`count(*)`,
      paidAmountCents: sql<number>`COALESCE(sum(${financialBills.paidAmountCents}), 0)`,
      refundAmountCents: sql<number>`COALESCE(sum(${financialBills.refundAmountCents}), 0)`,
      netRevenueCents: sql<number>`COALESCE(sum(${financialBills.paidAmountCents} - ${financialBills.refundAmountCents}), 0)`,
    })
    .from(financialBills)
    .groupBy(financialBills.billingMonth)
    .orderBy(sql`${financialBills.billingMonth} desc`)

  return rows.map((row) => ({
    month: row.month,
    billCount: Number(row.billCount),
    paidAmountCents: Number(row.paidAmountCents),
    refundAmountCents: Number(row.refundAmountCents),
    netRevenueCents: Number(row.netRevenueCents),
  }))
}

export async function listFinancialBillsByMonth(
  db: ApiDb,
  month: string,
): Promise<Array<{
  id: string
  wechatNickname: string
  email: string
  paidAmountCents: number
  paidAtMs: number
  billingMonth: string
  isRefunded: boolean
  refundAmountCents: number
  netRevenueCents: number
  note: string | null
  createdByUserId: string | null
  createdAtMs: number
  updatedAtMs: number
}>> {
  const rows = await db
    .select({
      id: financialBills.id,
      wechatNickname: financialBills.wechatNickname,
      email: financialBills.email,
      paidAmountCents: financialBills.paidAmountCents,
      paidAtMs: financialBills.paidAtMs,
      billingMonth: financialBills.billingMonth,
      isRefunded: financialBills.isRefunded,
      refundAmountCents: financialBills.refundAmountCents,
      netRevenueCents: sql<number>`${financialBills.paidAmountCents} - ${financialBills.refundAmountCents}`,
      note: financialBills.note,
      createdByUserId: financialBills.createdByUserId,
      createdAtMs: financialBills.createdAtMs,
      updatedAtMs: financialBills.updatedAtMs,
    })
    .from(financialBills)
    .where(eq(financialBills.billingMonth, month))
    .orderBy(sql`${financialBills.paidAtMs} desc, ${financialBills.id} desc`)

  return rows.map((row) => ({
    ...row,
    isRefunded: row.isRefunded === 1,
    netRevenueCents: Number(row.netRevenueCents),
  }))
}

export async function findFinancialBillById(
  db: ApiDb,
  billId: string,
): Promise<{ id: string } | null> {
  const row = await db
    .select({ id: financialBills.id })
    .from(financialBills)
    .where(eq(financialBills.id, billId))
    .limit(1)
    .get()

  return row ?? null
}

export async function updateFinancialBill(params: {
  db: ApiDb
  billId: string
  wechatNickname: string
  email: string
  normalizedEmail: string
  paidAmountCents: number
  paidAtMs: number
  billingMonth: string
  isRefunded: boolean
  refundAmountCents: number
  note: string | null
  nowMs: number
}): Promise<void> {
  await params.db
    .update(financialBills)
    .set({
      wechatNickname: params.wechatNickname,
      email: params.email,
      normalizedEmail: params.normalizedEmail,
      paidAmountCents: params.paidAmountCents,
      paidAtMs: params.paidAtMs,
      billingMonth: params.billingMonth,
      isRefunded: params.isRefunded ? 1 : 0,
      refundAmountCents: params.refundAmountCents,
      note: params.note,
      updatedAtMs: params.nowMs,
    })
    .where(eq(financialBills.id, params.billId))
}

export async function deleteFinancialBill(params: {
  db: ApiDb
  billId: string
}): Promise<void> {
  await params.db
    .delete(financialBills)
    .where(eq(financialBills.id, params.billId))
}

export async function updateUserAvatarKey(params: {
  db: ApiDb
  userId: string
  avatarKey: string
  updatedAtMs: number
}): Promise<void> {
  await params.db
    .update(users)
    .set({
      avatarKey: params.avatarKey,
      updatedAtMs: params.updatedAtMs,
    })
    .where(eq(users.id, params.userId))
}

export async function createUserWithPassword(params: {
  db: ApiDb
  userId: string
  emailId: string
  credentialId: string
  roleBindingId: string
  roleId: string
  displayName: string
  email: string
  normalizedEmail: string
  passwordHash: string
  passwordAlgo: 'bcrypt'
  avatarKey: string | null
  nowMs: number
}): Promise<void> {
  await params.db.batch([
    params.db.insert(users).values({
      id: params.userId,
      status: 'active',
      displayName: params.displayName,
      primaryEmailId: params.emailId,
      avatarKey: params.avatarKey,
      createdAtMs: params.nowMs,
      updatedAtMs: params.nowMs,
      lastLoginAtMs: null,
    }),
    params.db.insert(userEmails).values({
      id: params.emailId,
      userId: params.userId,
      email: params.email,
      normalizedEmail: params.normalizedEmail,
      isPrimary: 1,
      isVerified: 1,
      verifiedAtMs: params.nowMs,
      source: 'password',
      createdAtMs: params.nowMs,
      updatedAtMs: params.nowMs,
    }),
    params.db.insert(passwordCredentials).values({
      id: params.credentialId,
      userId: params.userId,
      emailId: params.emailId,
      passwordHash: params.passwordHash,
      passwordAlgo: params.passwordAlgo,
      passwordUpdatedAtMs: params.nowMs,
      failedAttempts: 0,
      lockedUntilMs: null,
      mustResetPassword: 0,
      createdAtMs: params.nowMs,
      updatedAtMs: params.nowMs,
    }),
    params.db.insert(userRoleBindings).values({
      id: params.roleBindingId,
      userId: params.userId,
      roleId: params.roleId,
      status: 'active',
      grantedAtMs: params.nowMs,
      revokedAtMs: null,
    }),
  ])
}

export async function findUserList(
  db: ApiDb,
  params: {
    offset: number
    limit: number
  },
): Promise<{ items: UserListItemRecord[]; total: number }> {
  const totalRow = await db
    .select({ total: sql<number>`count(*)` })
    .from(users)
    .get()

  const total = Number(totalRow?.total ?? 0)

  const userList = await db
    .select({
      id: users.id,
      name: sql<string>`COALESCE(${users.displayName}, ${userEmails.email})`,
      email: userEmails.email,
      avatarKey: users.avatarKey,
      status: users.status,
      createdAtMs: users.createdAtMs,
      updatedAtMs: users.updatedAtMs,
      lastLoginAtMs: users.lastLoginAtMs,
    })
    .from(users)
    .innerJoin(userEmails, eq(userEmails.id, users.primaryEmailId))
    .orderBy(sql`${users.createdAtMs} desc, ${users.id} desc`)
    .limit(params.limit)
    .offset(params.offset)

  if (userList.length === 0) {
    return { items: [], total }
  }

  const userIds = userList.map((user) => user.id)
  const roleRows = await db
    .select({
      userId: userRoleBindings.userId,
      code: roles.code,
    })
    .from(userRoleBindings)
    .innerJoin(roles, eq(roles.id, userRoleBindings.roleId))
    .where(
      and(
        inArray(userRoleBindings.userId, userIds),
        eq(userRoleBindings.status, 'active'),
        eq(roles.status, 'active'),
      ),
    )

  const rolesByUserId = new Map<string, string[]>()

  for (const row of roleRows) {
    const currentRoles = rolesByUserId.get(row.userId) ?? []
    currentRoles.push(row.code)
    rolesByUserId.set(row.userId, currentRoles)
  }

  return {
    total,
    items: userList.map((user) => ({
      ...user,
      status: user.status as UserListItemRecord['status'],
      roles: rolesByUserId.get(user.id) ?? [],
    })),
  }
}
