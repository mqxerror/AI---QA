"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dbPath = process.env.DATABASE_PATH || './database/qa-tests.db';
// Create database directory if it doesn't exist
const dbDir = path_1.default.dirname(dbPath);
if (!fs_1.default.existsSync(dbDir)) {
    fs_1.default.mkdirSync(dbDir, { recursive: true });
}
const db = new better_sqlite3_1.default(dbPath);
// Create tables with proper schema
db.exec(`
  CREATE TABLE IF NOT EXISTS websites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
    test_frequency TEXT DEFAULT 'Manual' CHECK(test_frequency IN ('Manual', 'Daily', 'Weekly')),
    last_result TEXT CHECK(last_result IN ('Pass', 'Fail')),
    last_tested_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS test_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT UNIQUE NOT NULL,
    website_id INTEGER NOT NULL,
    test_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Pass', 'Fail')),
    total_tests INTEGER DEFAULT 0,
    passed INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    duration_ms INTEGER,
    report_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_run_id INTEGER NOT NULL,
    test_name TEXT NOT NULL,
    category TEXT,
    status TEXT NOT NULL CHECK(status IN ('Pass', 'Fail')),
    duration_ms INTEGER,
    error_message TEXT,
    screenshot_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_run_id) REFERENCES test_runs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_run_id INTEGER NOT NULL,
    lcp REAL,
    cls REAL,
    fcp REAL,
    ttfb REAL,
    inp REAL,
    fid REAL,
    performance_score INTEGER CHECK(performance_score BETWEEN 0 AND 100),
    accessibility_score INTEGER CHECK(accessibility_score BETWEEN 0 AND 100),
    seo_score INTEGER CHECK(seo_score BETWEEN 0 AND 100),
    best_practices_score INTEGER CHECK(best_practices_score BETWEEN 0 AND 100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_run_id) REFERENCES test_runs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('success', 'error', 'running', 'pending')),
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS processes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('running', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    output_path TEXT,
    metadata TEXT
  );

  CREATE TABLE IF NOT EXISTS pixel_audit_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_run_id INTEGER NOT NULL,
    pixel_vendor TEXT NOT NULL,
    pixel_id TEXT,
    found BOOLEAN NOT NULL,
    events_detected TEXT,
    warnings TEXT,
    har_file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_run_id) REFERENCES test_runs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS load_test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_run_id INTEGER NOT NULL,
    virtual_users INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    requests_total INTEGER,
    requests_failed INTEGER,
    latency_p50 REAL,
    latency_p90 REAL,
    latency_p95 REAL,
    latency_p99 REAL,
    throughput_rps REAL,
    error_rate REAL CHECK(error_rate BETWEEN 0 AND 1),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_run_id) REFERENCES test_runs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS accessibility_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_run_id INTEGER NOT NULL,
    violation_id TEXT NOT NULL,
    impact TEXT NOT NULL CHECK(impact IN ('critical', 'serious', 'moderate', 'minor')),
    description TEXT,
    help TEXT,
    help_url TEXT,
    nodes_affected INTEGER DEFAULT 0,
    wcag_tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_run_id) REFERENCES test_runs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS security_scan_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_run_id INTEGER NOT NULL,
    overall_score INTEGER CHECK(overall_score BETWEEN 0 AND 100),
    ssl_valid BOOLEAN,
    ssl_days_remaining INTEGER,
    ssl_issuer TEXT,
    security_headers TEXT,
    violations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_run_id) REFERENCES test_runs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS seo_audit_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_run_id INTEGER NOT NULL,
    overall_score INTEGER CHECK(overall_score BETWEEN 0 AND 100),
    meta_tags TEXT,
    open_graph TEXT,
    twitter_card TEXT,
    structured_data TEXT,
    headings TEXT,
    images TEXT,
    links TEXT,
    technical TEXT,
    issues TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_run_id) REFERENCES test_runs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS visual_regression_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_run_id INTEGER NOT NULL,
    overall_score INTEGER CHECK(overall_score BETWEEN 0 AND 100),
    is_baseline_run BOOLEAN DEFAULT 0,
    comparisons TEXT,
    issues TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_run_id) REFERENCES test_runs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS failures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_run_id INTEGER,
    test_result_id INTEGER,
    failure_type TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High', 'Critical')),
    title TEXT NOT NULL,
    description TEXT,
    reproduction_steps TEXT,
    status TEXT DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Resolved')),
    assigned_to TEXT,
    resolution_notes TEXT,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_run_id) REFERENCES test_runs(id) ON DELETE SET NULL,
    FOREIGN KEY (test_result_id) REFERENCES test_results(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS test_configurations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    website_id INTEGER NOT NULL,
    test_type TEXT NOT NULL,
    enabled BOOLEAN DEFAULT 1,
    thresholds TEXT,
    browsers TEXT,
    viewports TEXT,
    login_required BOOLEAN DEFAULT 0,
    login_credentials TEXT,
    expected_pixels TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
    UNIQUE(website_id, test_type)
  );

  -- Users table for authentication
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Performance indexes
  CREATE INDEX IF NOT EXISTS idx_test_runs_website ON test_runs(website_id);
  CREATE INDEX IF NOT EXISTS idx_test_runs_created ON test_runs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_test_runs_type ON test_runs(test_type);
  CREATE INDEX IF NOT EXISTS idx_test_results_run ON test_results(test_run_id);
  CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user);
  CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);
  CREATE INDEX IF NOT EXISTS idx_processes_type ON processes(process_type);
  CREATE INDEX IF NOT EXISTS idx_pixel_audit_test_run ON pixel_audit_results(test_run_id);
  CREATE INDEX IF NOT EXISTS idx_load_test_test_run ON load_test_results(test_run_id);
  CREATE INDEX IF NOT EXISTS idx_accessibility_test_run ON accessibility_results(test_run_id);
  CREATE INDEX IF NOT EXISTS idx_security_scan_test_run ON security_scan_results(test_run_id);
  CREATE INDEX IF NOT EXISTS idx_seo_audit_test_run ON seo_audit_results(test_run_id);
  CREATE INDEX IF NOT EXISTS idx_visual_regression_test_run ON visual_regression_results(test_run_id);
  CREATE INDEX IF NOT EXISTS idx_failures_status ON failures(status);
  CREATE INDEX IF NOT EXISTS idx_failures_priority ON failures(priority);
  CREATE INDEX IF NOT EXISTS idx_test_config_website ON test_configurations(website_id);
`);
console.log('✅ Database initialized with TypeScript');
exports.default = db;
//# sourceMappingURL=database.js.map