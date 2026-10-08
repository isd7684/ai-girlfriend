-- 认证的核心数据先收敛到 admin 密码登录这一条链路，后续 web / OAuth 可以继续在这套表上扩。
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'deleted')),
  display_name TEXT,
  primary_email_id TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  last_login_at_ms INTEGER
);

CREATE TABLE IF NOT EXISTS user_emails (
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_emails_normalized_email_unique
ON user_emails(normalized_email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_emails_user_normalized_unique
ON user_emails(user_id, normalized_email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_emails_one_primary_per_user
ON user_emails(user_id)
WHERE is_primary = 1;

CREATE TABLE IF NOT EXISTS password_credentials (
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_password_credentials_user_unique
ON password_credentials(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_password_credentials_email_unique
ON password_credentials(email_id);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
  created_at_ms INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_code_unique
ON applications(code);

CREATE TABLE IF NOT EXISTS application_auth_methods (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('password', 'github', 'google')),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_application_auth_methods_unique
ON application_auth_methods(application_id, provider);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_application_code_unique
ON roles(application_id, code);

CREATE TABLE IF NOT EXISTS user_role_bindings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  granted_at_ms INTEGER NOT NULL,
  revoked_at_ms INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_role_bindings_unique
ON user_role_bindings(user_id, role_id);

CREATE TABLE IF NOT EXISTS auth_sessions (
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

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id
ON auth_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_application_id
ON auth_sessions(application_id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_jti_hash_unique
ON refresh_tokens(jti_hash);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session_id
ON refresh_tokens(session_id);

INSERT OR IGNORE INTO applications (id, code, name, status, created_at_ms)
VALUES ('019e0c99-85c8-76e3-86f1-c32148ee807c', 'admin', 'Admin Console', 'active', 1746816000000);

INSERT OR IGNORE INTO application_auth_methods (id, application_id, provider, enabled, created_at_ms, updated_at_ms)
VALUES ('019e0c99-85c9-7c13-a83c-2dffa63803da', '019e0c99-85c8-76e3-86f1-c32148ee807c', 'password', 1, 1746816000000, 1746816000000);

INSERT OR IGNORE INTO roles (id, application_id, code, name, created_at_ms)
VALUES
  ('019e0c99-85c9-7c13-a83c-2e00a09d54e3', '019e0c99-85c8-76e3-86f1-c32148ee807c', 'admin_owner', 'Admin Owner', 1746816000000),
  ('019e0c99-85c9-7c13-a83c-2e01e71bd511', '019e0c99-85c8-76e3-86f1-c32148ee807c', 'admin_operator', 'Admin Operator', 1746816000000);
