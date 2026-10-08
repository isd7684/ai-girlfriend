CREATE TABLE IF NOT EXISTS user_subscription_bindings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_plan_id TEXT NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL,
  assigned_at_ms INTEGER NOT NULL,
  assigned_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  revoked_at_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_user_subscription_bindings_user_id ON user_subscription_bindings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscription_bindings_plan_id ON user_subscription_bindings(subscription_plan_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscription_bindings_one_active_per_user ON user_subscription_bindings(user_id) WHERE status = 'active';
