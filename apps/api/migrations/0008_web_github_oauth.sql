INSERT OR IGNORE INTO application_auth_methods (id, application_id, provider, enabled, created_at_ms, updated_at_ms)
SELECT '019e0d00-85c9-7c13-a83c-2e3000000002', applications.id, 'github', 1, 1746816000000, 1746816000000
FROM applications
WHERE applications.code = 'web';

UPDATE application_auth_methods
SET enabled = 1, updated_at_ms = 1746816000000
WHERE provider = 'github'
  AND application_id IN (
    SELECT id
    FROM applications
    WHERE code = 'web'
  );

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'google')),
  provider_user_id TEXT NOT NULL,
  provider_login TEXT,
  email_id TEXT REFERENCES user_emails(id) ON DELETE SET NULL,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_accounts_provider_user_unique
ON oauth_accounts(provider, provider_user_id);

CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id
ON oauth_accounts(user_id);

CREATE TABLE IF NOT EXISTS oauth_login_tickets (
  id TEXT PRIMARY KEY,
  ticket_hash TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'google')),
  created_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  used_at_ms INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_login_tickets_hash_unique
ON oauth_login_tickets(ticket_hash);

CREATE INDEX IF NOT EXISTS idx_oauth_login_tickets_user_id
ON oauth_login_tickets(user_id);
