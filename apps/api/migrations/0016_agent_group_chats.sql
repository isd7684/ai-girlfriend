CREATE TABLE IF NOT EXISTS agent_group_chats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  message_count INTEGER NOT NULL,
  last_message_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_group_chats_user_updated
ON agent_group_chats(user_id, updated_at_ms, id);

CREATE TABLE IF NOT EXISTS agent_group_chat_members (
  id TEXT PRIMARY KEY,
  group_chat_id TEXT NOT NULL REFERENCES agent_group_chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES user_agent_companions(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  status TEXT NOT NULL,
  joined_at_ms INTEGER NOT NULL,
  removed_at_ms INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_group_chat_members_unique_active
ON agent_group_chat_members(group_chat_id, agent_id)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_agent_group_chat_members_group_order
ON agent_group_chat_members(group_chat_id, status, display_order, id);

CREATE TABLE IF NOT EXISTS agent_group_chat_messages (
  id TEXT PRIMARY KEY,
  group_chat_id TEXT NOT NULL REFERENCES agent_group_chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  agent_id TEXT REFERENCES user_agent_companions(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL,
  turn_index INTEGER NOT NULL,
  metadata_json TEXT,
  created_at_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_group_chat_messages_group_created
ON agent_group_chat_messages(group_chat_id, created_at_ms, id);

CREATE INDEX IF NOT EXISTS idx_agent_group_chat_messages_user_group
ON agent_group_chat_messages(user_id, group_chat_id, created_at_ms);
