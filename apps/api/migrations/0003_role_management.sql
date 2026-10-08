ALTER TABLE roles ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE roles ADD COLUMN updated_at_ms INTEGER NOT NULL DEFAULT 1746816000000;
ALTER TABLE roles ADD COLUMN disabled_at_ms INTEGER;
ALTER TABLE roles ADD COLUMN deleted_at_ms INTEGER;

INSERT OR IGNORE INTO applications (id, code, name, status, created_at_ms)
VALUES ('019e0c99-85c8-76e3-86f1-c32148ee807d', 'web', 'Web App', 'active', 1746816000000);

INSERT OR IGNORE INTO roles (id, application_id, code, name, created_at_ms, status, updated_at_ms, disabled_at_ms, deleted_at_ms)
VALUES ('019e0c99-85c9-7c13-a83c-2e01e71bd599', '019e0c99-85c8-76e3-86f1-c32148ee807d', 'web_user', 'Web User', 1746816000000, 'active', 1746816000000, NULL, NULL);

UPDATE roles
SET status = 'active', updated_at_ms = COALESCE(updated_at_ms, created_at_ms, 1746816000000)
WHERE status IS NULL OR status = '';
