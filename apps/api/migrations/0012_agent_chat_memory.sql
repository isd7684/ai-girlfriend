CREATE TABLE IF NOT EXISTS agent_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES user_agent_companions(id) ON DELETE CASCADE,
  title TEXT,
  summary TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_conversations_user_agent_unique
ON agent_conversations(user_id, agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_user_updated
ON agent_conversations(user_id, updated_at_ms);

CREATE TABLE IF NOT EXISTS agent_conversation_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES user_agent_companions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  metadata_json TEXT,
  created_at_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_conversation_messages_conversation_created
ON agent_conversation_messages(conversation_id, created_at_ms, id);

CREATE INDEX IF NOT EXISTS idx_agent_conversation_messages_agent_created
ON agent_conversation_messages(user_id, agent_id, created_at_ms);

CREATE TABLE IF NOT EXISTS agent_memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES user_agent_companions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  importance INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled', 'deleted')),
  source_message_id TEXT REFERENCES agent_conversation_messages(id) ON DELETE SET NULL,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_memories_agent_status_importance
ON agent_memories(user_id, agent_id, status, importance, updated_at_ms);

CREATE INDEX IF NOT EXISTS idx_agent_memories_source_message
ON agent_memories(source_message_id);
