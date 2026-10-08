CREATE TABLE IF NOT EXISTS user_agent_companions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  published_at_ms INTEGER,
  archived_at_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_user_agent_companions_user_id
ON user_agent_companions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_agent_companions_user_status
ON user_agent_companions(user_id, status);
