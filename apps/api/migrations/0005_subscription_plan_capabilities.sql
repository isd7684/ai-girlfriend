ALTER TABLE subscription_plans ADD COLUMN max_agents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN supports_group_chat INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN supports_multi_agent_linkage INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN supports_discover_square INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN supports_agent_time_evolution INTEGER NOT NULL DEFAULT 0;
