CREATE TABLE IF NOT EXISTS agent_message_feedbacks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES user_agent_companions(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES agent_conversation_messages(id) ON DELETE CASCADE,
  rating TEXT NOT NULL,
  reason TEXT,
  note TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_message_feedbacks_user_message_unique
ON agent_message_feedbacks(user_id, message_id);

CREATE INDEX IF NOT EXISTS idx_agent_message_feedbacks_agent_updated
ON agent_message_feedbacks(user_id, agent_id, updated_at_ms);

CREATE INDEX IF NOT EXISTS idx_agent_message_feedbacks_message
ON agent_message_feedbacks(message_id);
