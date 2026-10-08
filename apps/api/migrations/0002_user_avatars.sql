ALTER TABLE users ADD COLUMN avatar_key TEXT;

CREATE TABLE IF NOT EXISTS default_avatar_versions (
  id TEXT PRIMARY KEY,
  avatar_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_default_avatar_versions_created_at_ms
ON default_avatar_versions(created_at_ms DESC);
