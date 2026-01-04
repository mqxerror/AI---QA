-- Seed data for QA Testing Dashboard

-- Insert sample websites
INSERT OR IGNORE INTO websites (name, url, status) VALUES
    ('VariableLib Main', 'https://variablelib.com', 'active'),
    ('Portugal Golden Visas', 'https://portugalgoldenvisas.co', 'active');

-- Insert sample test run
INSERT OR IGNORE INTO test_runs (website_id, test_type, status, passed, failed, total, duration_ms, created_at) VALUES
    (1, 'smoke', 'pass', 5, 0, 5, 3500, datetime('now', '-2 hours'));

-- Insert sample activity
INSERT OR IGNORE INTO activities (user, action, resource, resource_id, status, details) VALUES
    ('admin', 'create', 'website', 1, 'success', '{"name": "VariableLib Main"}'),
    ('admin', 'run_test', 'test_run', 1, 'success', '{"test_type": "smoke", "status": "pass"}');
