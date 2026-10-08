下面是一份基于 Cloudflare 生态 的完整认证与数据库设计攻略，目标覆盖这几个前提：

- admin 端只支持 邮箱 + 密码
- web 端支持 邮箱 + 密码、GitHub OAuth
- 后续可扩展 Google OAuth
- 登录后可查看、绑定、解绑 GitHub / Google 等账号
- 认证方案基于 JWT
- 数据库选择为 Cloudflare D1
- 高并发下可平滑扩展到 Durable Objects

---

1. 技术选型与职责划分

1.1 Cloudflare 组件分工

D1

放认证主数据：

- 用户主体
- 邮箱
- 密码凭证
- OAuth 绑定
- 子站登录策略
- 角色与权限绑定
- 会话
- refresh token
- 邮箱验证 token
- 密码重置 token

Worker Secrets / Vars

放部署配置与敏感密钥：

- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- APP_URL_WEB
- APP_URL_ADMIN

Durable Objects

可选，用于高并发下的串行控制：

- refresh token rotation
- 单 session 撤销
- token 重放检测

KV

不放认证主数据。只适合非关键缓存。

R2

不放认证结构化数据。适合头像、导出文件等对象。

---

2. 认证模型的核心原则

这套设计围绕三件事展开：

2.1 用户主体和登录方式分离

一个用户以后可能同时具备：

- 邮箱密码登录
- GitHub 绑定
- Google 绑定

所以用户主体必须独立存在。

2.2 子站登录规则和用户权限分离

admin 和 web 允许的登录方式不同：

- admin：password
- web：password + github
- 后续 web：password + github + google

这类规则不应该写死在用户表里。

2.3 JWT 只做短期 access，refresh 仍然要落库

access token 无状态，refresh token 有状态，这样才能支持：

- 注销
- 单设备下线
- refresh token 轮换
- replay 检测

---

3. 推荐的数据模型

3.1 字段类型约定（D1 / SQLite 风格）

统一使用：

- 主键：TEXT
- 时间：INTEGER（毫秒时间戳）
- 布尔：INTEGER + CHECK (IN (0,1))
- 枚举：TEXT + CHECK
- JSON：TEXT

ID 建议应用层生成：

- uuidv7
- 或 ulid

更推荐 uuidv7。

---

4. 完整表结构设计

---

4.1 users

用户主体表。

CREATE TABLE users (
id TEXT PRIMARY KEY,
status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'deleted')),
display_name TEXT,
avatar_url TEXT,
primary_email_id TEXT,
created_at_ms INTEGER NOT NULL,
updated_at_ms INTEGER NOT NULL,
last_login_at_ms INTEGER
);

设计原因

- 用户主体不能跟密码或 OAuth 绑死
- 后续可同时绑定多个登录方式
- primary_email_id 独立指向邮箱表，后续改邮箱更轻

---

4.2 user_emails

邮箱表，一个用户可以有多个邮箱。

CREATE TABLE user_emails (
id TEXT PRIMARY KEY,
user_id TEXT NOT NULL,
email TEXT NOT NULL,
normalized_email TEXT NOT NULL,
is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
is_verified INTEGER NOT NULL DEFAULT 0 CHECK (is_verified IN (0, 1)),
verified_at_ms INTEGER,
source TEXT NOT NULL CHECK (source IN ('password', 'github', 'google', 'manual')),
created_at_ms INTEGER NOT NULL,
updated_at_ms INTEGER NOT NULL,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_user_emails_normalized_email_unique
ON user_emails(normalized_email);

CREATE UNIQUE INDEX idx_user_emails_user_normalized_unique
ON user_emails(user_id, normalized_email);

CREATE UNIQUE INDEX idx_user_emails_one_primary_per_user
ON user_emails(user_id)
WHERE is_primary = 1;

设计原因

- GitHub / Google 返回的邮箱不一定等于主邮箱
- 多邮箱、改邮箱、备用邮箱都能支持
- normalized_email 负责大小写无关唯一性

---

4.3 password_credentials

本地密码凭证表。

CREATE TABLE password_credentials (
id TEXT PRIMARY KEY,
user_id TEXT NOT NULL,
email_id TEXT NOT NULL,
password_hash TEXT NOT NULL,
password_algo TEXT NOT NULL CHECK (password_algo IN ('argon2id', 'bcrypt')),
password_updated_at_ms INTEGER NOT NULL,
failed_attempts INTEGER NOT NULL DEFAULT 0,
locked_until_ms INTEGER,
must_reset_password INTEGER NOT NULL DEFAULT 0 CHECK (must_reset_password IN (0, 1)),
created_at_ms INTEGER NOT NULL,
updated_at_ms INTEGER NOT NULL,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (email_id) REFERENCES user_emails(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_password_credentials_user_unique
ON password_credentials(user_id);

CREATE UNIQUE INDEX idx_password_credentials_email_unique
ON password_credentials(email_id);

设计原因

- 密码登录与 OAuth 登录职责不同
- 未来可补：
  - 错误次数限制
  - 临时锁定
  - 强制改密
  - 算法迁移

---

4.4 oauth_identities

第三方身份绑定表。

CREATE TABLE oauth_identities (
id TEXT PRIMARY KEY,  
 user_id TEXT NOT NULL,
provider TEXT NOT NULL CHECK (provider IN ('github', 'google')),  
 provider_subject TEXT NOT NULL,  
 email_id TEXT,
provider_username TEXT,
provider_email TEXT,
profile_snapshot TEXT,
linked_at_ms INTEGER NOT NULL,
last_used_at_ms INTEGER,
unlinked_at_ms INTEGER,
created_at_ms INTEGER NOT NULL,
updated_at_ms INTEGER NOT NULL,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (email_id) REFERENCES user_emails(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_oauth_identities_provider_subject_unique
ON oauth_identities(provider, provider_subject);

CREATE INDEX idx_oauth_identities_user_id
ON oauth_identities(user_id);

设计原因

- 一个用户可绑定多个第三方账号
- provider_subject 必须是第三方稳定 ID
- 不要用第三方邮箱作为唯一身份标识
- profile_snapshot 存原始 profile 快照，便于排查问题

---

4.5 applications

子站定义表。

CREATE TABLE applications (
id TEXT PRIMARY KEY,
code TEXT NOT NULL,
name TEXT NOT NULL,
status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
created_at_ms INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_applications_code_unique
ON applications(code);

设计原因

当前系统天然有两个应用：

- web
- admin

以后可以继续扩：

- mobile
- partner
- console

---

4.6 application_auth_methods

每个子站允许的登录方式。

CREATE TABLE application_auth_methods (
id TEXT PRIMARY KEY,
application_id TEXT NOT NULL,
provider TEXT NOT NULL CHECK (provider IN ('password', 'github', 'google')),
enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
created_at_ms INTEGER NOT NULL,
updated_at_ms INTEGER NOT NULL,
FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_application_auth_methods_unique
ON application_auth_methods(application_id, provider);

初始化建议

admin

- password = 1
- github = 0
- google = 0

web

- password = 1
- github = 1
- google = 0

设计原因

登录能力属于“子站策略”，不属于用户本身。

---

4.7 roles

角色表，按子站隔离。

CREATE TABLE roles (
id TEXT PRIMARY KEY,
application_id TEXT NOT NULL,
code TEXT NOT NULL,
name TEXT NOT NULL,
created_at_ms INTEGER NOT NULL,
FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_roles_application_code_unique
ON roles(application_id, code);

设计原因

- admin 的角色体系和 web 很可能不同
- admin_owner、admin_operator
- web_user、web_creator 等都可以独立定义

---

4.8 user_role_bindings

用户和角色绑定表。

CREATE TABLE user_role_bindings (
id TEXT PRIMARY KEY,
user_id TEXT NOT NULL,
role_id TEXT NOT NULL,
status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
granted_at_ms INTEGER NOT NULL,
revoked_at_ms INTEGER,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_user_role_bindings_unique
ON user_role_bindings(user_id, role_id);

设计原因

- admin 登录成功后，还得检查是否有后台角色
- 同一个用户可以同时属于 web 和 admin

---

4.9 auth_sessions

会话表。

CREATE TABLE auth_sessions (
id TEXT PRIMARY KEY,
user_id TEXT NOT NULL,
application_id TEXT NOT NULL,
session_type TEXT NOT NULL CHECK (session_type IN ('web', 'admin')),
device_name TEXT,
user_agent TEXT,
ip TEXT,
last_seen_at_ms INTEGER,
created_at_ms INTEGER NOT NULL,
expires_at_ms INTEGER NOT NULL,
revoked_at_ms INTEGER,
revoke_reason TEXT,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE INDEX idx_auth_sessions_user_id
ON auth_sessions(user_id);

CREATE INDEX idx_auth_sessions_application_id
ON auth_sessions(application_id);

设计原因

- access token 不落库，但会话要落库
- 用于：
  - 查看登录设备
  - 单设备登出
  - 统一撤销 session

---

4.10 refresh_tokens

refresh token 轮换表。

CREATE TABLE refresh_tokens (
id TEXT PRIMARY KEY,
session_id TEXT NOT NULL,
jti_hash TEXT NOT NULL,
parent_token_id TEXT,
issued_at_ms INTEGER NOT NULL,
expires_at_ms INTEGER NOT NULL,
used_at_ms INTEGER,
revoked_at_ms INTEGER,
replaced_by_token_id TEXT,
FOREIGN KEY (session_id) REFERENCES auth_sessions(id) ON DELETE CASCADE,
FOREIGN KEY (parent_token_id) REFERENCES refresh_tokens(id) ON DELETE SET NULL,
FOREIGN KEY (replaced_by_token_id) REFERENCES refresh_tokens(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_refresh_tokens_jti_hash_unique
ON refresh_tokens(jti_hash);

CREATE INDEX idx_refresh_tokens_session_id
ON refresh_tokens(session_id);

设计原因

- 支持 refresh token rotation
- 支持 replay 检测
- 支持按 session 撤销整条链路

---

4.11 email_verification_tokens

邮箱验证 token。

CREATE TABLE email_verification_tokens (
id TEXT PRIMARY KEY,
email_id TEXT NOT NULL,
token_hash TEXT NOT NULL,
expires_at_ms INTEGER NOT NULL,
used_at_ms INTEGER,
created_at_ms INTEGER NOT NULL,
FOREIGN KEY (email_id) REFERENCES user_emails(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_email_verification_tokens_hash_unique
ON email_verification_tokens(token_hash);

---

4.12 password_reset_tokens

密码重置 token。

CREATE TABLE password_reset_tokens (
id TEXT PRIMARY KEY,
password_credential_id TEXT NOT NULL,  
 token_hash TEXT NOT NULL,
expires_at_ms INTEGER NOT NULL,  
 used_at_ms INTEGER,  
 created_at_ms INTEGER NOT NULL,
FOREIGN KEY (password_credential_id) REFERENCES password_credentials(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_password_reset_tokens_hash_unique
ON password_reset_tokens(token_hash);

---

4.13 oauth_tokens（可选，二期）

如果后续要代表用户调用 GitHub / Google API，再加这张表。

CREATE TABLE oauth_tokens (
id TEXT PRIMARY KEY,
oauth_identity_id TEXT NOT NULL,
access_token_encrypted TEXT,
refresh_token_encrypted TEXT,
scope TEXT,
token_expires_at_ms INTEGER,
created_at_ms INTEGER NOT NULL,
updated_at_ms INTEGER NOT NULL,
FOREIGN KEY (oauth_identity_id) REFERENCES oauth_identities(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_oauth_tokens_identity_unique
ON oauth_tokens(oauth_identity_id);

设计原因

登录身份绑定和第三方 token 持久化是两件事，拆开更安全。

---

5. 整体关系图

users
├─ user_emails
├─ password_credentials
├─ oauth_identities
│ └─ oauth_tokens (optional)
├─ user_role_bindings
└─ auth_sessions
└─ refresh_tokens

applications
├─ application_auth_methods
└─ roles
└─ user_role_bindings

---

6. 子站登录规则如何落地

admin

允许：

- 邮箱 + 密码

不允许：

- GitHub
- Google

判断逻辑：

1. application_auth_methods 检查 admin + password = enabled
2. 邮箱查 password_credentials
3. 校验密码
4. 检查用户状态
5. 检查该用户是否拥有 admin 相关角色

---

web

允许：

- 邮箱 + 密码
- GitHub

未来扩展：

- Google

判断逻辑：

1. application_auth_methods 检查当前 provider 是否启用
2. 本地密码登录走 password_credentials
3. GitHub 登录走 oauth_identities
4. 后续 Google 只是在 provider 上多一个值

---

7. JWT 方案设计

7.1 Access Token

短时有效，建议 5~15 分钟。

推荐 claims：

{
"sub": "user_id",
"sid": "session_id",
"app": "web",
"roles": ["web_user"],
"iat": 1710000000,
"exp": 1710000900
}

字段解释

- sub：用户 ID
- sid：session ID
- app：当前子站
- roles：当前子站的角色列表

---

7.2 Refresh Token

长时有效，建议 7~30 天。

要求：

- 每次刷新都轮换
- 数据库存 jti_hash
- 不存明文 token
- 发现旧 token 重复使用时，直接撤销整个 session

---

7.3 为什么 access / refresh 要分开

- access token 无状态，性能好
- refresh token 有状态，安全可控
- 撤销能力和性能能同时保住

---

8. D1 下 refresh token 刷新要怎么做

这是 Cloudflare 生态里最需要谨慎的地方。

8.1 必须事务化

一次刷新至少要在同一事务里完成：

1. 查旧 refresh token
2. 校验是否过期 / 是否已用 / 是否已撤销
3. 标记旧 token used_at_ms
4. 插入新 refresh token
5. 更新旧 token 的 replaced_by_token_id
6. 更新 session 的 last_seen_at_ms

8.2 为什么要这么严格

因为 refresh token 是最敏感的认证资产。
如果这里处理松散，很容易出现：

- 并发刷新成功两次
- 旧 token 被重放
- 撤销状态不一致

---

9. Durable Objects 什么时候要加

当前阶段

只要用户规模和登录并发不夸张，D1 + 事务 就够用。

需要 Durable Objects 的时机

当这些情况变多时：

- 同一个 session 高频刷新
- 并发刷新概率高
- 对 replay 检测要求很高
- 需要严格串行的 token rotation

Durable Objects 最适合承接的逻辑

- refresh token rotation
- 单 session revoke
- replay 检测
- 设备会话状态协调

也就是说：

- 主数据继续放 D1
- 高并发会话控制收口到 DO

---

10. GitHub / Google 绑定设计

查看已绑定账号

查 oauth_identities：

- provider
- provider_username
- provider_email
- linked_at_ms
- last_used_at_ms
- unlinked_at_ms

绑定账号流程

1. 用户先登录已有账号
2. 前端发起 OAuth 授权
3. 回调拿到 provider_subject
4. 检查 (provider, provider_subject) 是否已被别的用户占用
5. 若未占用，插入 oauth_identities
6. 若 provider 返回邮箱，必要时写入 user_emails

解绑账号流程

建议逻辑解绑：

- 更新 unlinked_at_ms

不建议直接物理删除。

为什么要这样

- 绑定是“给当前用户增加外部身份”
- 解绑要保留审计痕迹
- 同一个用户以后可以绑定多个第三方账号

---

11. 为什么不用 admin_users / web_users 双表

不建议拆两套用户表。

原因：

1. 同一个真实用户未来可能同时出现在 web 和 admin
2. 账号绑定能力天然围绕“用户主体”展开
3. GitHub / Google 绑定状态需要跨子站可见
4. 后续加 Google 时，单一用户模型更顺

正确边界是：

- 用户是谁：users
- 他有哪些登录方式：password_credentials、oauth_identities
- 哪个子站允许什么方式登录：application_auth_methods
- 他在各子站有什么权限：user_role_bindings

---

12. 认证接口建议
    12.1 admin

邮箱密码登录

- POST /auth/admin/password/login

刷新 token

- POST /auth/admin/token/refresh

登出

- POST /auth/admin/logout

---

12.2 web

邮箱密码登录

- POST /auth/web/password/login

GitHub 登录入口

- GET /auth/web/github/start

GitHub 回调

- GET /auth/web/github/callback

刷新 token

- POST /auth/web/token/refresh

登出

- POST /auth/web/logout

---

12.3 账号绑定

发起绑定 GitHub

- GET /account/oauth/github/start

GitHub 绑定回调

- GET /account/oauth/github/callback

发起绑定 Google

- GET /account/oauth/google/start

Google 绑定回调

- GET /account/oauth/google/callback

查看绑定列表

- GET /account/oauth-identities

解绑

- POST /account/oauth-identities/:id/unlink

---

13. 推荐的 D1 迁移顺序

第一批

先建核心表：

1. users
2. user_emails
3. password_credentials
4. oauth_identities
5. applications
6. application_auth_methods
7. roles
8. user_role_bindings
9. auth_sessions
10. refresh_tokens

第二批

补辅助表：

11. email_verification_tokens
12. password_reset_tokens
13. oauth_tokens

---

14. 初始化数据建议

applications

插入两条：

- web
- admin

application_auth_methods

初始化：

admin

- password = 1
- github = 0
- google = 0

web

- password = 1
- github = 1
- google = 0

roles

至少初始化：

admin

- admin_owner
- admin_operator

web

- web_user

---

15. 安全实现建议

密码

- 优先 argon2id
- 备选 bcrypt
- 密码 hash 只放 password_credentials

refresh token

- 明文不落库
- 只存 jti_hash
- 每次刷新轮换

OAuth token

- 需要持久化时加密存储
- 放在 oauth_tokens
- 能不落库时先不落

邮箱唯一性

- 统一查 normalized_email

session 撤销

- access token 靠短过期
- refresh token 靠数据库撤销
- 高并发下可引入 DO 串行化

---

16. Cloudflare 落地建议

D1

放业务认证主数据

Secrets

放：

- JWT 密钥
- GitHub / Google secret
- 第三方回调配置

DO

二期增强：

- token rotation 串行控制

KV

只做缓存，不做认证真相源

---

17. 推荐的最终落地顺序

第一步

先把 D1 核心表建好：

- users
- user_emails
- password_credentials
- oauth_identities
- applications
- application_auth_methods
- roles
- user_role_bindings
- auth_sessions
- refresh_tokens

第二步

实现 admin 邮箱密码登录

第三步

实现 web 邮箱密码登录

第四步

实现 web GitHub 登录

第五步

实现账号绑定 / 查看 / 解绑

第六步

实现邮箱验证、重置密码

第七步

视并发情况决定是否把 refresh rotation 迁到 DO

---

18. 最终推荐结论

基于 Cloudflare 生态，最佳组合是：

- D1：认证主数据
- Worker Secrets：JWT 和 OAuth 密钥
- JWT access token + DB refresh token
- Durable Objects：可选，用于高并发 token rotation

数据模型核心保持：

- 用户主体独立
- 登录方式独立
- 子站策略独立
- 角色权限独立
- 会话与 refresh token 独立

这套结构能直接覆盖当前需求：

- admin：邮箱密码登录
- web：邮箱密码 + GitHub
- 未来加 Google
- 登录后查看和绑定 GitHub / Google
- 支持 JWT + refresh token + 会话撤销
- 兼容 Cloudflare D1 的能力边界

拆分原则

文章落地时，按这条线来排：

1. 先让读者知道要解决什么问题
2. 再让读者搭出最小可运行认证骨架
3. 然后一点点补登录方式、会话、绑定、扩展能力
4. 最后再讲高并发和 Cloudflare 特有边界

这样读者不会一上来就被 13 张表、JWT、OAuth、DO 一起压住。

---

文章拆分方案

第 1 篇：先把认证系统的边界讲清楚

目标

让读者先理解整套方案到底在解决什么，不急着建表。

这一篇讲什么

对应 plan.md 这些部分：

    a. 技术选型与职责划分
    b. 认证模型的核心原则
    k. 为什么不用 admin_users / web_users 双表
    r. 最终推荐结论

这一篇的核心输出

读者看完后要明白：

- 为什么用户主体要独立
- 为什么登录方式要独立
- 为什么子站策略不能写死在用户表里
- 为什么 access token 和 refresh token 要分开
- 为什么不建议上来就拆 admin_users / web_users

文章标题可写成

- Cloudflare 认证系统怎么设计：先把边界定清楚
- 从 0 理清一套可扩展认证架构

付费小测插入点

放在“为什么不能把所有信息都塞进 users 表”之后。

小测题型建议

1. 选择题
   同一个用户未来既能登录 web，又能登录 admin，最合理的建模方式是什么？
2. 判断题
   “GitHub 邮箱可以直接作为第三方账号唯一标识。”
3. 简答题
   为什么 access token 可以无状态，refresh token 还要落库？

这一篇适合新手的写法

少讲“最佳实践”，多讲“如果不这样设计，会遇到什么具体问题”。

---

第 2 篇：先落数据库骨架，只建第一批核心表

目标

把读者真正带进实现阶段，先完成数据库基础建模。

这一篇讲什么

对应：

    c. 字段类型约定

- 4.1 ~ 4.10
  m. 推荐的 D1 迁移顺序（第一批）
  n. 初始化数据建议（先讲 applications / application_auth_methods / roles）

建议这一篇再拆成两个层次

第一层：先讲“表是分组出现的”

分成 4 组：

1. 用户主体组


    - users
    - user_emails
    - password_credentials
    - oauth_identities

2. 子站策略组


    - applications
    - application_auth_methods

3. 权限组


    - roles
    - user_role_bindings

4. 会话组


    - auth_sessions
    - refresh_tokens

第二层：每组只回答两个问题

- 这组表解决什么问题
- 表之间怎么连起来

这一篇的核心输出

读者最终能建出第一批核心表，并知道每张表存在的意义。

付费小测插入点

每讲完一组表放 2~3 题，小测分段出现会更适合付费内容。

小测题型建议

用户主体组

- users 和 password_credentials 为什么要拆开？
- oauth_identities 为什么不能只存第三方邮箱？

子站策略组

- application_auth_methods 应该记录在用户表里还是应用表里？
- admin 和 web 登录方式不同，哪张表负责表达这个差异？

会话组

- auth_sessions 和 refresh_tokens 的职责分别是什么？
- 为什么 refresh token 表要有 parent_token_id？

这一篇的写法提醒

不要一次性把 10 张表完整 SQL 全贴出来再解释。更适合：

- 先讲结构图
- 再分组讲
- 最后给完整 SQL

---

第 3 篇：先跑通 admin 的邮箱密码登录

目标

让读者先完成最简单、最收敛的一条认证链路。

这一篇讲什么

对应：

    f. 子站登录规则如何落地（admin）
    g. JWT 方案设计

- 12.1 admin
  q. 推荐的最终落地顺序里的第二步

为什么 admin 先写

因为它只有：

- 邮箱 + 密码
- 角色校验
- 不涉及 OAuth

对于教学来说，这是最适合先跑通的“第一条完整链路”。

这一篇的执行步骤

1. 检查 application_auth_methods 里 admin 是否启用 password
2. 用邮箱查 user_emails
3. 找到 password_credentials
4. 校验密码
5. 检查 users.status
6. 检查该用户是否具备 admin 角色
7. 创建 auth_sessions
8. 生成 access token
9. 写入 refresh token

这一篇的核心输出

读者能完成：

- POST /auth/admin/password/login
- POST /auth/admin/token/refresh
- POST /auth/admin/logout

付费小测插入点

放在“登录成功到底要写入哪些表”之后。

小测题型建议

1. 登录成功后，至少要新增或更新哪些数据？
2. admin 登录为什么还要检查角色，而不是只校验密码？
3. access token 里为什么要带 sid 和 app？

---

第 4 篇：再实现 web 的邮箱密码登录，让同一套模型跑两类子站

目标

让读者看到“同一套数据模型，怎么服务不同子站”。

这一篇讲什么

对应：

    f. 子站登录规则如何落地（web 的 password 部分）

- 12.2 web 里的 password login
- 17 的第三步

这一篇的重点

不是“再写一遍 admin 登录”，而是讲：

- 为什么同样是邮箱密码登录，web 和 admin 的校验边界不同
- admin 额外要看后台角色
- web 更关注普通用户身份和应用策略

这一篇的核心输出

读者能理解“同样的认证模型，不同子站只是策略差异”。

付费小测插入点

放在 admin / web 登录流程对比之后。

小测题型建议

1. admin 和 web 登录流程中，哪一步最可能不同？
2. 为什么不建议为 web 和 admin 各写一套完全独立的用户体系？
3. application_auth_methods 在 web 登录流程里起什么作用？

---

第 5 篇：接入 GitHub OAuth，只给 web 开放

目标

把第一种第三方登录真正接进来。

这一篇讲什么

对应：

    f. web 的 GitHub 登录部分
    j. GitHub / Google 绑定设计里与身份识别有关的部分

- 12.2 web 的 github start / callback
- 17 的第四步

这一篇适合怎么讲

按 OAuth 的真实执行顺序讲：

1. 前端跳转到 /auth/web/github/start
2. GitHub 回调 /auth/web/github/callback
3. 拿到 provider_subject
4. 查 oauth_identities
5. 判断这是登录还是首次接入
6. 创建或关联用户
7. 创建 session
8. 发 access / refresh token

这一篇要重点讲清楚的点

- 第三方身份唯一标识是 provider_subject
- 不是 GitHub 用户名
- 也不是 GitHub 邮箱
- oauth_identities 是外部身份表，不是用户主表

付费小测插入点

放在“为什么不能用邮箱作为 OAuth 唯一键”之后。

小测题型建议

1. GitHub 登录时，真正应该拿来做唯一识别的字段是什么？
2. 第一次 GitHub 登录时，什么时候需要往 user_emails 写数据？
3. 如果 web 启用了 GitHub 登录，但 admin 没启用，应该由哪张表控制？

---

第 6 篇：登录后查看、绑定、解绑 GitHub / Google 账号

目标

把“登录”和“账号绑定”这两个概念彻底分开。

这一篇讲什么

对应：

    j. GitHub / Google 绑定设计

- 12.3 账号绑定接口
- 17 的第五步

这一篇最核心的教学点

很多新手会把这两件事混掉：

- 用 GitHub 登录系统
- 给当前账号绑定 GitHub 身份

这篇就是专门把它们分开。

执行流程可拆成三段

1）查看绑定列表

- 查 oauth_identities
- 过滤未解绑记录
- 返回 provider / username / email / linked_at

2）绑定账号

- 用户先处于已登录状态
- 发起 OAuth
- 回调后取 provider_subject
- 检查是否已被别的用户占用
- 未占用则写入 oauth_identities

3）解绑账号

- 更新 unlinked_at_ms
- 不直接物理删除

这一篇的核心输出

读者可以实现：

- GET /account/oauth-identities
- GET /account/oauth/github/start
- GET /account/oauth/github/callback
- POST /account/oauth-identities/:id/unlink

付费小测插入点

放在“解绑为什么建议逻辑删除”之后。

小测题型建议

1. 为什么解绑第三方账号时更适合更新 unlinked_at_ms？
2. 登录态绑定 GitHub，和未登录直接 GitHub 登录，流程上的关键区别是什么？
3. 绑定前为什么必须检查 (provider, provider_subject) 是否已被其他用户占用？

---

第 7 篇：补齐 refresh token、邮箱验证、重置密码和 Cloudflare 高并发扩展

目标

把整套认证能力补完整，并告诉读者哪些是一期，哪些放二期。

这一篇讲什么

对应：

    h. D1 下 refresh token 刷新怎么做
    i. Durable Objects 什么时候要加

- 4.11 / 4.12 / 4.13
  o. 安全实现建议
  p. Cloudflare 落地建议
- 17 的第六步、第七步

这一篇建议再拆成 4 个小节

小节 1：refresh token rotation

讲清楚：

- 为什么每次刷新都要轮换
- 为什么必须事务化
- 旧 token 重放时怎么处理

小节 2：邮箱验证

- email_verification_tokens
- 验证链接
- 验证成功后更新 user_emails.is_verified

小节 3：重置密码

- password_reset_tokens
- 更新 password_credentials.password_hash
- 旧 session 是否失效

小节 4：什么时候上 Durable Objects

- 当前阶段 D1 + 事务够不够
- 什么情况下要把 session 级串行控制迁到 DO

这一篇的核心输出

读者能分清：

- 一期必须做什么
- 二期增强做什么
- Cloudflare 下真正需要小心的点在哪里

付费小测插入点

建议放两个位置：

1. refresh token rotation 讲完后
2. Durable Objects 讲完后

小测题型建议

1. refresh token 为什么不能只校验过期时间？
2. 为什么 refresh token 相关写入要放进同一事务？
3. 什么场景下才需要把 token rotation 放到 Durable Objects？
4. oauth_tokens 为什么适合放到二期，而不是一开始就做？

---

更适合写成文章的执行顺序

如果你是一边实现一边写，建议实际落地顺序按这个来：

第一阶段：架构认知

- 第 1 篇

第二阶段：数据库基础

- 第 2 篇

第三阶段：最小认证闭环

- 第 3 篇 admin 密码登录
- 第 4 篇 web 密码登录

第四阶段：扩展登录方式

- 第 5 篇 GitHub OAuth

第五阶段：账号中心能力

- 第 6 篇 绑定 / 查看 / 解绑

第六阶段：安全与扩展

- 第 7 篇 refresh token / 邮箱验证 / 重置密码 / DO

---

每篇文章的统一模板

为了方便持续产出，建议每篇都套同一个结构。

模板结构

1. 这篇要解决什么问题
2. 上一篇做到哪里
3. 这一篇完成后能得到什么结果
4. 先看流程图 / 数据流
5. 再看表结构或接口设计
6. 开始实现
7. 跑通一次完整流程
8. 常见误区
9. 付费小测
10. 小结与下一篇衔接

这个模板对新手很友好，因为读者每次都知道“现在学到哪一步了”。

---

付费小测的出题原则

你的读者是新手，题不要出成背概念，尽量出成“看场景做判断”。

适合的题型比例

- 60% 场景选择题
- 20% 判断题
- 20% 简答题

出题标准

好题的特点

- 基于真实登录流程
- 一题只考一个核心点
- 干扰项来自新手常见误解

不太适合的题

- 纯背表名
- 纯背字段
- 纯背定义

举个例子

一般题

“oauth_identities 表的作用是什么？”

更适合付费内容的题

“用户已经用邮箱密码注册过账号，之后又想绑定 GitHub。此时系统最合理的做法是什么？”

这样读者是在练判断，不是在背书。

---

可以直接落地成目录的大纲

专栏目录建议

1. Cloudflare 认证系统怎么定边界
2. 用 D1 设计认证数据库核心表
3. 先实现 admin 邮箱密码登录
4. 再实现 web 邮箱密码登录
5. 给 web 接入 GitHub OAuth
6. 实现账号绑定、查看和解绑
7. 做完 refresh token、邮箱验证与高并发扩展

---

哪些内容不建议放在第一篇就讲太深

这些点在 plan.md 里有，但不适合前置讲太深：

- oauth_tokens 持久化
- Durable Objects 串行控制
- replay 检测细节
- 多 provider 全量扩展
- 复杂安全策略细节

原因很简单：新手在第一轮更需要先跑通主流程。过早塞进去，阅读阻力会很高。

---

最后给一个最实用的落地版本

如果你接下来真的准备边做边写，最顺手的拆分就是这 4 个阶段：

阶段 1：认知与建模

- 第 1 篇
- 第 2 篇

阶段 2：跑通最小登录

- 第 3 篇
- 第 4 篇

阶段 3：接入第三方与账号中心

- 第 5 篇
- 第 6 篇

阶段 4：补安全与扩展

- 第 7 篇

这样安排，执行节奏、写作节奏、读者吸收节奏会比较统一。
