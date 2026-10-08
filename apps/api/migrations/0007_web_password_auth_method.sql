INSERT OR IGNORE INTO application_auth_methods (id, application_id, provider, enabled, created_at_ms, updated_at_ms)
SELECT '019e0d00-85c9-7c13-a83c-2e3000000001', applications.id, 'password', 1, 1746816000000, 1746816000000
FROM applications
WHERE applications.code = 'web';
