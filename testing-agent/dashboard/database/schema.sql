-- QA Testing Dashboard - Database Schema
-- SQLite Database for Dashboard Backend

-- Websites being monitored
CREATE TABLE IF NOT EXISTS websites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'archived')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Test execution records
CREATE TABLE IF NOT EXISTS test_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    website_id INTEGER NOT NULL,
    test_type TEXT NOT NULL CHECK(test_type IN (
        'smoke', 'performance', 'load', 'pixel-audit',
        'visual-regression', 'security', 'accessibility', 'seo'
    )),
    status TEXT NOT NULL CHECK(status IN ('running', 'pass', 'fail', 'error')),
    passed INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    duration_ms INTEGER,
    results TEXT,  -- JSON blob with detailed results
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
);

-- Activity tracking
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL DEFAULT 'admin',
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id INTEGER,
    status TEXT NOT NULL CHECK(status IN ('success', 'error', 'info', 'warning')),
    details TEXT,  -- JSON blob with additional details
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Process monitoring (real-time test execution tracking)
CREATE TABLE IF NOT EXISTS processes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    website_id INTEGER NOT NULL,
    test_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('running', 'completed', 'failed', 'cancelled')),
    error TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
);

-- Failure tracking
CREATE TABLE IF NOT EXISTS failures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    website_id INTEGER NOT NULL,
    test_run_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
    assigned_to TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
    FOREIGN KEY (test_run_id) REFERENCES test_runs(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_runs_website_id ON test_runs(website_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_created_at ON test_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_runs_status ON test_runs(status);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);
CREATE INDEX IF NOT EXISTS idx_failures_website_id ON failures(website_id);
CREATE INDEX IF NOT EXISTS idx_failures_status ON failures(status);

-- Trigger to update updated_at timestamp on websites
CREATE TRIGGER IF NOT EXISTS update_websites_timestamp
AFTER UPDATE ON websites
BEGIN
    UPDATE websites SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
