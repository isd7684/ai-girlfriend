export type AuthAppName = 'admin' | 'web'

// 这是登录阶段从数据库一次性取回的最小结果集，后面的密码校验和状态判断都依赖它。
export type LoginUserRecord = {
  userId: string
  emailId: string
  email: string
  userStatus: 'active' | 'suspended' | 'deleted'
  passwordHash: string
  passwordAlgo: 'argon2id' | 'bcrypt'
}

// 这是服务端在“登录成功 / 刷新成功”两个阶段都要用到的会话视图。
export type SessionContext = {
  sessionId: string
  userId: string
  app: AuthAppName
  roles: string[]
  expiresAtMs: number
}

// refresh token 读取出来以后，服务端重点关心的是：它属于哪个 session、有没有过期、有没有被用过。
export type RefreshTokenRecord = {
  tokenId: string
  sessionId: string
  userId: string
  applicationCode: string
  expiresAtMs: number
  usedAtMs: number | null
  revokedAtMs: number | null
  sessionRevokedAtMs: number | null
}

// access token 面向请求鉴权，只保留当前请求真正会用到的身份信息。
export type AccessTokenClaims = {
  sub: string
  sid: string
  app: AuthAppName
  roles: string[]
}

// refresh token 多一个 jti，用来把每次续签都映射到数据库里的一条独立状态记录。
export type RefreshTokenClaims = {
  sub: string
  sid: string
  app: AuthAppName
  jti: string
}

export type UserProfileRecord = {
  id: string
  name: string
  email: string
  avatarKey: string | null
  roles: string[]
  status: 'active' | 'suspended' | 'deleted'
  createdAtMs: number
  updatedAtMs: number
  lastLoginAtMs: number | null
}

export type UserListItemRecord = {
  id: string
  name: string
  email: string
  avatarKey: string | null
  roles: string[]
  status: 'active' | 'suspended' | 'deleted'
  createdAtMs: number
  updatedAtMs: number
  lastLoginAtMs: number | null
}
