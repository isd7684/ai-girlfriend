CREATE TABLE IF NOT EXISTS agent_care_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES user_agent_companions(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL,
  frequency TEXT NOT NULL,
  preferred_time TEXT,
  scenes_json TEXT NOT NULL,
  tone TEXT NOT NULL,
  custom_prompt TEXT,
  next_run_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_care_plans_user_agent_unique
ON agent_care_plans(user_id, agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_care_plans_next_run
ON agent_care_plans(enabled, next_run_at_ms);

CREATE TABLE IF NOT EXISTS agent_care_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES user_agent_companions(id) ON DELETE CASCADE,
  care_plan_id TEXT REFERENCES agent_care_plans(id) ON DELETE SET NULL,
  conversation_id TEXT NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES agent_conversation_messages(id) ON DELETE CASCADE,
  scene TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata_json TEXT,
  generated_at_ms INTEGER NOT NULL,
  read_at_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_agent_care_events_agent_generated
ON agent_care_events(user_id, agent_id, generated_at_ms);

CREATE INDEX IF NOT EXISTS idx_agent_care_events_message
ON agent_care_events(message_id);
