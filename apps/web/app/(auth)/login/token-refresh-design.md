# Web 登录无感刷新 Token 实现方案

## 为什么需要无感刷新

我们可以先把登录态里最基础的关系讲清楚。Web 登录不是只拿一个 token 就结束了，通常会同时拿到 `accessToken` 和 `refreshToken`。`accessToken` 用来访问接口，生命周期会设计得比较短；`refreshToken` 用来续签，生命周期会更长一些。

这样设计是为了在安全性和用户体验之间做平衡。如果 `accessToken` 设置得很长，一旦泄露，风险会持续很久。如果 `accessToken` 设置得很短，而系统又没有续签机制，用户就会频繁遇到登录失效，被迫重新输入账号密码。

所谓**无感刷新**，就是在用户没有明显感知的情况下，把这次续签补上。用户发起一次正常请求，如果当前 `accessToken` 已经过期，前端会自动用本地保存的 `refreshToken` 去换一组新的 token。换成功以后，前端再用新的 `accessToken` 把刚才失败的请求重新发一遍。对用户来说，页面没有跳回登录页，操作也没有被打断，这就是我们要实现的效果。

这套机制真正要解决的不是单纯**刷新 token**，而是把登录态的整个生命周期串起来：登录成功以后如何保存，会话过期时如何续签，并发请求时如何避免重复刷新，刷新失败时如何退出登录，后端又如何识别 refresh token 是否被重复使用。

---

## 整体流程

我们可以把整个过程想象成一条连续的链路。

用户登录成功后，浏览器会保存 `accessToken`、`refreshToken` 和 `session`。后续所有需要登录态的 API 请求，都会从统一的 HTTP 模块发出。这个 HTTP 模块会在请求发出之前读取本地会话，并把 `accessToken` 自动放进 `Authorization` 请求头。

如果接口正常返回，业务代码就拿到数据，完全不需要关心 token。如果接口返回 `AUTH.UNAUTHORIZED`，前端会判断这很可能是 `accessToken` 过期，于是自动请求 `/auth/web/token/refresh`。刷新成功后，新的 token 会覆盖旧 token，然后刚才失败的请求会被重新发送。

对应到代码文件，大致是这样的关系：登录成功后的保存逻辑在 `apps/web/src/auth/login-client.ts`，浏览器侧会话管理在 `apps/web/src/auth/client-session.ts`，请求注入 token 和无感刷新逻辑在 `apps/web/src/lib/http.ts`，页面保护逻辑在 `apps/web/src/components/web-dashboard-guard.tsx`，后端真正处理 refresh 的地方在 `apps/api/src/auth/services/web-token-refresh.ts`，JWT 的签发和校验则集中在 `apps/api/src/auth/jwt.ts`。

这里没有把刷新逻辑散落在每个页面里。每个页面只要正常调用 HTTP 模块，就自然拥有了自动续签能力。

---

## 登录后的会话保存

登录成功以后，接口返回的不是一个孤立的 token，而是一份完整的登录结果，其中包含 `accessToken`、`refreshToken` 和 `session`。前端拿到结果以后，第一时间把它交给统一的客户端会话模块保存。

```ts
// apps/web/src/auth/login-client.ts
import type { WebPasswordLoginResponse } from '@repo/contracts'
import { saveClientSession } from '@/auth/client-session'
import { http } from '@/lib/http'

export type WebLoginInput = {
  email: string
  password: string
}

export async function loginByApi(input: WebLoginInput) {
  const response = await http.post<WebPasswordLoginResponse, WebLoginInput>('/auth/web/password/login', input)
  saveClientSession(response)
}
```

这里值得注意的是，登录表单并不直接操作 localStorage，也不自己拼接 token。它只负责提交邮箱和密码。保存 token、通知其他模块会话变化，这些事情都交给 `saveClientSession` 处理。

这样做的好处是，登录页不会和存储细节耦合。以后如果我们要调整 session 的存储方式，登录页本身不需要跟着大改。

---

## 客户端会话

客户端会话由 `apps/web/src/auth/client-session.ts` 管理。这里同时使用了内存变量和 localStorage。

```ts
const storageKey = 'web:client-session'
const sessionChangedEventName = 'web-client-session-changed'

type StoredWebSession = {
  accessToken: string
  refreshToken: string
  session: WebAuthSession
}

let currentSession: StoredWebSession | null = null
```

内存变量的作用是让页面运行期间读取更快，不需要每次请求都访问 localStorage。localStorage 的作用是让用户刷新页面以后仍然保持登录态。两者配合起来，既能保证体验，也能让刷新页面后的恢复变得自然。

读取会话时，会先看内存里有没有，如果没有，再尝试从 localStorage 恢复。

```ts
export function readClientSession(): StoredWebSession | null {
  if (currentSession) {
    return currentSession
  }

  if (!canUseStorage()) {
    return null
  }

  const rawValue = window.localStorage.getItem(storageKey)

  if (!rawValue) {
    return null
  }

  try {
    currentSession = JSON.parse(rawValue) as StoredWebSession
    return currentSession
  } catch {
    window.localStorage.removeItem(storageKey)
    return null
  }
}
```

保存会话时，内存和 localStorage 会同时更新，并且会广播一个会话变化事件。

```ts
export function saveClientSession(input: Pick<WebPasswordLoginResponse, 'accessToken' | 'refreshToken' | 'session'>) {
  currentSession = {
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    session: input.session,
  }

  if (canUseStorage()) {
    window.localStorage.setItem(storageKey, JSON.stringify(currentSession))
  }

  notifySessionChanged()
}
```

这个 `notifySessionChanged()` 很重要。登录、刷新、登出都会改变 session，如果其他组件需要感知这件事，比如路由保护组件需要重新拉取 profile，就可以监听这个事件。

刷新 token 以后，我们也不是只替换 `accessToken`，而是保存一份完整的新会话。

```ts
export function saveClientRefreshSession(input: Pick<WebTokenRefreshResponse, 'accessToken' | 'refreshToken' | 'session'>) {
  saveClientSession(input)
}
```

原因是后端做了 refresh token rotation。每次刷新成功后，`refreshToken` 本身也会换成新的。如果前端只替换 `accessToken`，下次续签时就会拿旧的 refresh token 去请求，最终用户就会感觉**续签没接上**。

---

## 请求自动带上 token

我们不希望业务页面每次请求接口时都手动读取 token，也不希望每个 API helper 都重复写 `Authorization` 头。因此，登录后的 API 请求统一走 `apps/web/src/lib/http.ts`。

对外暴露的 `get` 和 `post` 很简单：

```ts
export const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request<T>(createRequestConfig(url, {
      ...config,
      method: 'GET',
    }))
  },
  post<TResponse, TRequest = unknown>(url: string, data?: TRequest, config?: AxiosRequestConfig): Promise<TResponse> {
    return request<TResponse>(createRequestConfig(url, {
      ...config,
      method: 'POST',
      data,
    }))
  },
}
```

真正补 token 的地方在 `createRequestConfig`。

```ts
function createRequestConfig(url: string, config: AxiosRequestConfig = {}): AxiosRequestConfig {
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData
  const headers: RawAxiosRequestHeaders = {
    ...(isFormData ? {} : { 'content-type': 'application/json' }),
    ...(config.headers as RawAxiosRequestHeaders | undefined),
  }

  if (typeof window !== 'undefined' && shouldAttachAccessToken(config.headers)) {
    const storedSession = readClientSession()

    if (storedSession) {
      headers.authorization = `Bearer ${storedSession.accessToken}`
    }
  }

  return {
    ...config,
    baseURL: config.baseURL ?? resolveBaseURL(),
    headers,
    validateStatus: () => true,
    url,
  }
}
```

这里有两个细节需要讲清楚。第一，只在浏览器环境下读取 session，因为 localStorage 只存在于浏览器。第二，如果调用方已经显式传了 `authorization`，HTTP 模块不会覆盖它。这样可以给特殊请求保留空间。

判断是否需要自动注入 token 的函数也很直接：

```ts
function shouldAttachAccessToken(headers: AxiosRequestConfig['headers']) {
  if (!headers || typeof headers !== 'object') {
    return true
  }

  const normalizedHeaders = headers as Record<string, unknown>
  return !('authorization' in normalizedHeaders || 'Authorization' in normalizedHeaders)
}
```

这一步完成以后，业务代码只需要正常请求接口，不需要关心 token 是从哪里来的。

---

## 试探 access token 可用性

无感刷新不是一上来就刷新 token，而是先用当前的 `accessToken` 去请求接口。只有当后端明确返回 `AUTH.UNAUTHORIZED` 时，前端才认为当前 access token 可能已经不可用。

```ts
const unauthorizedBizCodes: Set<BizCodeValue> = new Set([
  'AUTH.UNAUTHORIZED',
])
```

判断逻辑写在 `shouldTryRefresh` 里。

```ts
function shouldTryRefresh(config: AxiosRequestConfig, payload: ApiResponse<unknown>) {
  if (typeof window === 'undefined') {
    return false
  }

  if (config.url?.includes('/auth/web/token/refresh')) {
    return false
  }

  return !payload.ok && unauthorizedBizCodes.has(payload.error.code)
}
```

这里有一个很关键的边界：refresh 接口自己不能再触发 refresh。如果 `/auth/web/token/refresh` 都失败了，说明 refresh token 或 session 已经不可用了。这个时候应该进入退出登录流程，而不是递归调用 refresh。

另外，普通业务错误也不应该触发刷新。比如参数校验失败、业务冲突、权限不足，这些问题和 access token 是否过期没有直接关系。只有 `AUTH.UNAUTHORIZED` 才是刷新信号。

---

## 给错误打上刷新标记

所有接口返回都会经过 `unwrapApiResponse` 处理。成功时返回 `data`，失败时抛出错误，并把是否需要刷新写到错误对象上。

```ts
function unwrapApiResponse<T>(config: AxiosRequestConfig, payload: ApiResponse<T>): T {
  if (payload.ok) {
    return payload.data
  }

  const error = new Error(payload.error.message) as Error & {
    status?: number
    code?: BizCodeValue
    shouldRefresh?: boolean
  }

  error.code = payload.error.code
  error.shouldRefresh = shouldTryRefresh(config, payload)

  throw error
}
```

这样后面的 `request` 函数就不用反复分析错误码了。它只需要看 `error.shouldRefresh`，就能知道这次失败是不是应该走续签流程。

---

## 自动刷新 token

当一个请求需要刷新时，前端会调用 `refreshClientSession`。这个函数会从本地会话中取出 refresh token，然后请求 `/auth/web/token/refresh`。

```ts
async function refreshClientSession() {
  const storedSession = readClientSession()

  if (!storedSession) {
    throw new Error('Session refresh failed')
  }

  const response = await axios.request<ApiResponse<WebTokenRefreshResponse>>({
    baseURL: resolveBaseURL(),
    url: '/auth/web/token/refresh',
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    data: {
      refreshToken: storedSession.refreshToken,
    },
    validateStatus: () => true,
  })

  const data = unwrapApiResponse<WebTokenRefreshResponse>({
    url: '/auth/web/token/refresh',
    method: 'POST',
  }, response.data)

  saveClientRefreshSession(data)
}
```

这里没有复用当前请求的 `Authorization`，因为 refresh 接口真正需要的是请求体里的 `refreshToken`。刷新成功以后，新的 access token、refresh token 和 session 会一起保存回本地。

---

## 并发刷新控制

页面上经常会同时发出多个请求。如果 access token 正好过期，这些请求可能都会收到 `AUTH.UNAUTHORIZED`。如果每个请求都去刷新一次 token，后端的 refresh token rotation 就很容易被打乱。

我们可以把这个问题再补充完整一点。refresh token 是一次性轮换的，第一个 refresh 请求成功后，旧 refresh token 会被标记为 used，并生成一个新的 refresh token。如果第二个请求还拿旧 refresh token 去刷新，后端就可能把它判断成重放。

所以前端需要一个并发锁。这里用的是 `refreshPromise`。

```ts
let refreshPromise: Promise<void> | null = null

async function ensureClientRefresh() {
  if (!refreshPromise) {
    refreshPromise = refreshClientSession().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}
```

第一个发现 token 过期的请求会创建 `refreshPromise`，后续请求只需要等待同一个 promise。等刷新完成以后，`refreshPromise` 再清空。这样无论页面上同时有多少请求，真正发到后端的 refresh 请求都只有一个。

---

## 重试原请求

刷新成功不代表无感刷新已经完成。真正让用户无感的是：刷新成功以后，前端会把刚才失败的请求重新发一遍。

这段逻辑在 `request` 函数里。

```ts
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await axios.request<ApiResponse<T>>(config)
    return unwrapApiResponse(config, response.data)
  } catch (error) {
    const appError = error as Error & { shouldRefresh?: boolean }

    if (appError.shouldRefresh) {
      try {
        await ensureClientRefresh()
        const { authorization: _authorization, Authorization: _Authorization, ...retryHeaders } = (config.headers ?? {}) as RawAxiosRequestHeaders
        const retryConfig = createRequestConfig(config.url ?? '', {
          ...config,
          headers: retryHeaders,
        })
        const retryResponse = await axios.request<ApiResponse<T>>(retryConfig)
        return unwrapApiResponse(retryConfig, retryResponse.data)
      } catch {
        clearClientSession()
        throw new Error('Session refresh failed')
      }
    }

    if (error instanceof AxiosError) {
      throw new Error(error.message || 'Request failed')
    }

    throw error
  }
}
```

这里最容易忽略的是重试前移除旧的 `Authorization`。

```ts
const { authorization: _authorization, Authorization: _Authorization, ...retryHeaders } = (config.headers ?? {}) as RawAxiosRequestHeaders
```

第一次请求是带着旧 access token 发出去的。如果 refresh 成功后直接复用旧 config，重试请求仍然会带着过期 token。这样就会出现一种很尴尬的情况：refresh 明明成功了，但重试还是失败，用户最后还是被踢回登录页。

所以我们在重试前先把旧的 `authorization` 和 `Authorization` 都剔除掉，再调用 `createRequestConfig`。这样它会重新读取本地最新的 session，并把新的 access token 注入进去。

这一步做对以后，无感刷新才算真正接上。

---

## 后端刷新

前端能无感刷新，前提是后端 refresh 实现足够安全。后端逻辑在 `apps/api/src/auth/services/web-token-refresh.ts`。

第一步是校验 refresh token 的 JWT，并且要求它属于 web 应用。

```ts
claims = await verifyRefreshToken({
  token: payload.refreshToken,
  secret: env.JWT_REFRESH_SECRET,
  expectedApp: 'web',
})
```

只校验 JWT 还不够，因为 JWT 本身是无状态的。后端还需要到数据库里查这枚 refresh token 是否存在、是否已经被使用、是否已经过期，以及它所在的 session 是否已经被撤销。

```ts
const currentToken = await findRefreshTokenForSession({
  db: db,
  jtiHash,
  sessionId: claims.sid,
})

if (!currentToken || currentToken.applicationCode !== 'web') {
  throw refreshTokenInvalidError()
}
```

如果 session 已经撤销，直接失败。

```ts
if (currentToken.sessionRevokedAtMs !== null) {
  throw sessionRevokedError()
}
```

如果 refresh token 自己已经撤销或者过期，也直接失败。

```ts
if (currentToken.revokedAtMs !== null || currentToken.expiresAtMs <= nowMs) {
  throw refreshTokenInvalidError()
}
```

如果这枚 refresh token 已经使用过，却又被拿来刷新，就说明存在重放风险。后端会撤销整条 session。

```ts
if (currentToken.usedAtMs !== null) {
  await revokeSession({
    db: db,
    sessionId: currentToken.sessionId,
    revokedAtMs: nowMs,
    reason: 'refresh_token_replay',
  })

  throw refreshTokenReplayedError()
}
```

然后后端会把当前 refresh token 标记为已使用。

```ts
const markedUsed = await markRefreshTokenUsed({
  db: db,
  tokenId: currentToken.tokenId,
  usedAtMs: nowMs,
})
```

接着重新查询用户的 web 角色。这样做是为了让权限变更能在下一次刷新时生效。如果用户已经没有 `web_user` 角色，就不能继续续签。

```ts
const roles = await getWebRolesForUser(db, claims.sub)

if (!roles.includes('web_user')) {
  await revokeSession({
    db: db,
    sessionId: currentToken.sessionId,
    revokedAtMs: nowMs,
    reason: 'web_role_missing',
  })

  throw adminRoleRequiredError()
}
```

最后，后端创建新的 session 视图并签发新的 token。

```ts
const session = {
  sessionId: currentToken.sessionId,
  userId: claims.sub,
  app: 'web' as const,
  roles,
  expiresAtMs: refreshExpiresAtMs,
}

const tokenPair = await issueTokenPair({
  session,
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessTtlSec: env.ACCESS_TOKEN_TTL_SEC,
  refreshTtlSec: env.REFRESH_TOKEN_TTL_SEC,
})
```

新的 refresh token 会写入数据库，并且会和旧 refresh token 串起来。

```ts
await insertRefreshToken({
  db: db,
  tokenId: tokenPair.refreshJti,
  sessionId: currentToken.sessionId,
  jtiHash: await hashTokenJti(tokenPair.refreshJti),
  parentTokenId: currentToken.tokenId,
  issuedAtMs: nowMs,
  expiresAtMs: refreshExpiresAtMs,
})

await updateRefreshRotation({
  db: db,
  oldTokenId: currentToken.tokenId,
  newTokenId: tokenPair.refreshJti,
  sessionId: currentToken.sessionId,
  lastSeenAtMs: nowMs,
})
```

这就是 refresh token rotation。旧 token 被标记为用过，新 token 被写入，旧 token 指向新 token。这样后端既能追踪续签链路，也能识别重复使用旧 token 的风险。

---

## 应用隔离

web 和 admin 使用同一套 JWT 签发能力，但 token 中会带上 `app` 字段。这个字段非常重要，它避免 web token 和 admin token 混用。

access token 中会写入：

```ts
return new SignJWT({
  sid: params.claims.sid,
  app: params.claims.app,
  roles: params.claims.roles,
})
```

refresh token 中会写入：

```ts
const token = await new SignJWT({
  sid: params.claims.sid,
  app: params.claims.app,
  jti,
})
```

校验时也会检查 `expectedApp`。

```ts
export async function verifyRefreshToken(params: {
  token: string
  secret: string
  expectedApp?: ExpectedApp
}): Promise<RefreshTokenClaims> {
  const expectedApp = params.expectedApp ?? 'admin'

  if (!isExpectedApp(app, expectedApp)) {
    throw new Error('Invalid refresh token claims')
  }
}
```

默认值是 `admin`，这意味着即使系统新增了 web 登录，也不会意外放宽 admin 接口。web refresh 明确传 `expectedApp: 'web'`，共享接口则可以传 `['admin', 'web']`。

这样就能保证 web token 只能刷新 web session，admin token 只能刷新 admin session。web 用户可以访问自己的 profile，但不能拿 web token 去访问 admin-only 的用户管理接口。

---

## 路由保护

无感刷新不仅发生在普通 API 请求中，也会发生在路由保护阶段。

`apps/web/src/components/web-dashboard-guard.tsx` 会在进入受保护页面时读取本地 session，然后请求 profile。

```ts
async function loadProfile() {
  const storedSession = readClientSession()

  if (!storedSession) {
    setIsLoading(false)
    router.replace('/login')
    return
  }

  try {
    const nextProfile = await getWebUserProfile()
    const latestSession = readClientSession()

    if (!latestSession) {
      setIsLoading(false)
      router.replace('/login')
      return
    }

    setContext({ profile: nextProfile, session: latestSession.session, refreshProfile: loadProfile })
  } catch {
    clearClientSession()
    router.replace('/login')
  } finally {
    setIsLoading(false)
  }
}
```

`getWebUserProfile()` 同样走统一的 HTTP 模块。所以如果用户刷新页面时 access token 已经过期，profile 请求会先失败，然后 HTTP 模块自动 refresh，再重试 profile。guard 最后仍然能拿到 profile，页面就不会跳回登录页。

只有 refresh token 也失效、session 被撤销、或者用户失去了 web 角色时，guard 才会清空会话并回到 `/login`。

---

## 失败处理

无感刷新不是说永远不重新登录。它的边界是 refresh token 和服务端 session 仍然有效。

如果 refresh 失败，前端会清空本地 session。

```ts
clearClientSession()
throw new Error('Session refresh failed')
```

常见失败原因包括 refresh token 过期、refresh token 已撤销、session 已撤销、旧 refresh token 被重复使用、用户不再拥有 `web_user` 角色。遇到这些情况，继续保留本地 token 只会让页面反复请求失败，所以直接清理会话并回到登录页会更合理。

---

## 验证方式

我们可以先做类型检查，确认前后端实现没有破坏编译。

```bash
pnpm --filter web check-types
pnpm --filter @repo/api check-types
```

然后用 API 直接验证登录和刷新。

```bash
curl -X POST http://127.0.0.1:8787/auth/web/password/login \
  -H 'content-type: application/json' \
  -d '{"email":"user01@example.com","password":"Admin123456!"}'
```

拿到 refresh token 后，再请求刷新接口。

```bash
curl -X POST http://127.0.0.1:8787/auth/web/token/refresh \
  -H 'content-type: application/json' \
  -d '{"refreshToken":"<refreshToken>"}'
```

最后用 access token 访问 profile。

```bash
curl http://127.0.0.1:8787/rpc/user/profile \
  -H 'authorization: Bearer <accessToken>'
```

浏览器里可以打开 `http://localhost:3005/login`，使用默认账号登录。登录后查看 localStorage 中是否存在 `web:client-session`。如果想更快验证无感刷新，可以临时缩短 access token 的 TTL，等 access token 过期后触发一次需要登录态的请求。Network 面板中应该能看到 `/auth/web/token/refresh`，并且原业务请求会在刷新成功后继续完成，页面不会跳回登录页。

---

## 总结

Web 登录无感刷新并不是一个单独的接口，而是一套前后端协作机制。前端负责保存会话、自动携带 access token、识别认证失败、调用 refresh、保存新 token，并重试原请求。后端负责校验 refresh token、维护 refresh token rotation、识别重放风险、重新签发 token，并确保 web/admin 的 app 边界不会混在一起。

这套方案的关键在于：`accessToken` 可以保持短有效期，减少泄露后的风险；`refreshToken` 通过 rotation 和数据库状态保证可追踪、可撤销；前端通过统一 HTTP 模块把刷新和重试收口起来。这样用户不会因为短期 access token 过期而频繁重新登录，系统也不会为了体验牺牲基础安全性。
