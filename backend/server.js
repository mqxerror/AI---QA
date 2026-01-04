require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./database').default;
const authRoutes = require('./routes/auth');
const activitiesRoutes = require('./routes/activities');
const processesRoutes = require('./routes/processes');
const failuresRoutes = require('./routes/failures');
const configurationsRoutes = require('./routes/configurations');
const { authenticate } = require('./middleware/auth');
const ActivityLogger = require('./services/ActivityLogger').default || require('./services/ActivityLogger');
const ProcessMonitor = require('./services/ProcessMonitor').default || require('./services/ProcessMonitor');
const ProcessCleanup = require('./services/ProcessCleanup');
const AccessibilityService = require('./services/AccessibilityService');
const SecurityScanner = require('./services/SecurityScanner').default;
const SEOAuditor = require('./services/SEOAuditor').default;
const VisualRegression = require('./services/VisualRegression').default;
const ReportGenerator = require('./services/ReportGenerator').default;
const ScheduledTests = require('./services/ScheduledTests');
const wsServer = require('./websocket');

const app = express();
const PORT = process.env.PORT || 3004;
const TEST_API_URL = process.env.TEST_API_URL || 'http://38.97.60.181:3003';

// Trust proxy - required for rate limiting behind reverse proxy (nginx/traefik)
// Using '1' to trust only the first proxy hop (Traefik/nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "*"], // Allow images from any origin
    },
  },
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Trust the X-Forwarded-For header from our proxy
  validate: { trustProxy: false }
});
app.use('/api/', limiter);

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Activity and Process routes (protected)
app.use('/api/activities', authenticate, activitiesRoutes);
app.use('/api/processes', authenticate, processesRoutes);
app.use('/api/failures', failuresRoutes);
app.use('/api/configurations', configurationsRoutes);

// ============================================================================
// WEBSITES
// ============================================================================

// Get all websites (protected)
app.get('/api/websites', authenticate, (req, res) => {
  try {
    const websites = db.prepare(`
      SELECT w.*,
        (SELECT COUNT(*) FROM test_runs WHERE website_id = w.id) as total_tests
      FROM websites w
      ORDER BY w.created_at DESC
    `).all();
    res.json(websites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single website (protected)
app.get('/api/websites/:id', authenticate, (req, res) => {
  try {
    const website = db.prepare('SELECT * FROM websites WHERE id = ?').get(req.params.id);
    if (!website) return res.status(404).json({ error: 'Website not found' });
    res.json(website);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create website (protected)
app.post('/api/websites', authenticate, (req, res) => {
  try {
    const { name, url, test_frequency } = req.body;
    const result = db.prepare(`
      INSERT INTO websites (name, url, test_frequency)
      VALUES (?, ?, ?)
    `).run(name, url, test_frequency || 'Manual');

    const website = db.prepare('SELECT * FROM websites WHERE id = ?').get(result.lastInsertRowid);

    // Log activity
    ActivityLogger.log({
      user: req.user.username,
      action: 'create',
      resource: 'website',
      status: 'success',
      metadata: { website_id: website.id, name, url }
    });

    res.json(website);
  } catch (error) {
    ActivityLogger.log({
      user: req.user.username,
      action: 'create',
      resource: 'website',
      status: 'error',
      metadata: { error: error.message }
    });
    res.status(500).json({ error: error.message });
  }
});

// Update website (protected)
app.put('/api/websites/:id', authenticate, (req, res) => {
  try {
    const { name, url, status, test_frequency } = req.body;
    db.prepare(`
      UPDATE websites
      SET name = ?, url = ?, status = ?, test_frequency = ?
      WHERE id = ?
    `).run(name, url, status, test_frequency, req.params.id);

    const website = db.prepare('SELECT * FROM websites WHERE id = ?').get(req.params.id);

    // Log activity
    ActivityLogger.log({
      user: req.user.username,
      action: 'update',
      resource: 'website',
      status: 'success',
      metadata: { website_id: req.params.id, name, url, status }
    });

    res.json(website);
  } catch (error) {
    ActivityLogger.log({
      user: req.user.username,
      action: 'update',
      resource: 'website',
      status: 'error',
      metadata: { website_id: req.params.id, error: error.message }
    });
    res.status(500).json({ error: error.message });
  }
});

// Delete website (protected)
app.delete('/api/websites/:id', authenticate, (req, res) => {
  try {
    const website = db.prepare('SELECT * FROM websites WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM websites WHERE id = ?').run(req.params.id);

    // Log activity
    ActivityLogger.log({
      user: req.user.username,
      action: 'delete',
      resource: 'website',
      status: 'success',
      metadata: { website_id: req.params.id, name: website?.name }
    });

    res.json({ success: true });
  } catch (error) {
    ActivityLogger.log({
      user: req.user.username,
      action: 'delete',
      resource: 'website',
      status: 'error',
      metadata: { website_id: req.params.id, error: error.message }
    });
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TEST RUNS
// ============================================================================

// Get all test runs
app.get('/api/test-runs', (req, res) => {
  try {
    const { website_id, test_type, limit = 50 } = req.query;

    let query = `
      SELECT tr.*, w.name as website_name, w.url as website_url,
             ltr.virtual_users, ltr.duration_seconds as load_duration_seconds,
             ltr.requests_total, ltr.requests_failed, ltr.throughput_rps, ltr.error_rate,
             ltr.latency_p50, ltr.latency_p90, ltr.latency_p95, ltr.latency_p99
      FROM test_runs tr
      JOIN websites w ON tr.website_id = w.id
      LEFT JOIN load_test_results ltr ON tr.id = ltr.test_run_id
      WHERE 1=1
    `;
    const params = [];

    if (website_id) {
      query += ' AND tr.website_id = ?';
      params.push(website_id);
    }
    if (test_type) {
      query += ' AND tr.test_type = ?';
      params.push(test_type);
    }

    query += ' ORDER BY tr.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const runs = db.prepare(query).all(...params);
    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single test run with details
app.get('/api/test-runs/:id', (req, res) => {
  try {
    const run = db.prepare(`
      SELECT tr.*, w.name as website_name, w.url as website_url
      FROM test_runs tr
      JOIN websites w ON tr.website_id = w.id
      WHERE tr.id = ?
    `).get(req.params.id);

    if (!run) return res.status(404).json({ error: 'Test run not found' });

    // Get test results
    const results = db.prepare(`
      SELECT * FROM test_results WHERE test_run_id = ?
    `).all(req.params.id);

    // Get performance metrics
    const metrics = db.prepare(`
      SELECT * FROM performance_metrics WHERE test_run_id = ?
    `).get(req.params.id);

    // Get pixel audit results
    const pixel_results = db.prepare(`
      SELECT * FROM pixel_audit_results WHERE test_run_id = ?
    `).all(req.params.id);

    // Get load test results
    const load_results = db.prepare(`
      SELECT * FROM load_test_results WHERE test_run_id = ?
    `).get(req.params.id);

    // Get accessibility results
    const accessibility_results = db.prepare(`
      SELECT * FROM accessibility_results WHERE test_run_id = ?
    `).all(req.params.id);

    // Get security scan results
    const security_results = db.prepare(`
      SELECT * FROM security_scan_results WHERE test_run_id = ?
    `).get(req.params.id);

    // Get SEO audit results
    const seo_results = db.prepare(`
      SELECT * FROM seo_audit_results WHERE test_run_id = ?
    `).get(req.params.id);

    // Get visual regression results
    const visual_results = db.prepare(`
      SELECT * FROM visual_regression_results WHERE test_run_id = ?
    `).get(req.params.id);

    res.json({ ...run, results, metrics, pixel_results, load_results, accessibility_results, security_results, seo_results, visual_results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run smoke test
app.post('/api/run-test/smoke/:websiteId', authenticate, async (req, res) => {
  let processId = null;

  try {
    const website = db.prepare('SELECT * FROM websites WHERE id = ?').get(req.params.websiteId);
    if (!website) return res.status(404).json({ error: 'Website not found' });

    // Start process monitoring
    processId = ProcessMonitor.start({
      process_type: 'smoke_test',
      metadata: { website_id: website.id, website_name: website.name, url: website.url }
    });

    // Log activity
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'smoke_test',
      status: 'running',
      metadata: { website_id: website.id, process_id: processId }
    });

    // Call Test API
    ProcessMonitor.updateProgress(processId, 20);
    const response = await axios.post(`${TEST_API_URL}/api/test/smoke`, {
      target_url: website.url,
      browser: 'chromium'
    }, { timeout: 120000 });

    ProcessMonitor.updateProgress(processId, 80);

    const testData = response.data;
    const runId = `${Date.now()}-smoke-${website.id}`;

    // Store test run
    const runResult = db.prepare(`
      INSERT INTO test_runs (run_id, website_id, test_type, status, total_tests, passed, failed, duration_ms)
      VALUES (?, ?, 'Smoke', ?, ?, ?, ?, ?)
    `).run(
      runId,
      website.id,
      testData.success ? 'Pass' : 'Fail',
      testData.summary?.total || 0,
      testData.summary?.passed || 0,
      testData.summary?.failed || 0,
      testData.duration_ms || 0
    );

    const testRunId = runResult.lastInsertRowid;

    // Store individual test results
    if (testData.results) {
      const insertResult = db.prepare(`
        INSERT INTO test_results (test_run_id, test_name, category, status, duration_ms, error_message, screenshot_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const result of testData.results) {
        insertResult.run(
          testRunId,
          result.name,
          'UI',
          result.status === 'pass' ? 'Pass' : 'Fail',
          result.duration_ms || 0,
          result.message || null,
          result.screenshot || null
        );
      }
    }

    // Update website
    db.prepare(`
      UPDATE websites
      SET last_result = ?, last_tested_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(testData.success ? 'Pass' : 'Fail', website.id);

    // Complete process
    ProcessMonitor.complete(processId, 'completed');

    // Log completion
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'smoke_test',
      status: testData.success ? 'success' : 'fail',
      metadata: {
        website_id: website.id,
        test_run_id: testRunId,
        passed: testData.summary?.passed,
        failed: testData.summary?.failed
      }
    });

    res.json({ test_run_id: testRunId, process_id: processId, ...testData });
  } catch (error) {
    // Mark process as failed
    if (processId) {
      ProcessMonitor.fail(processId, error.message);
    }

    // Log error
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'smoke_test',
      status: 'error',
      metadata: { website_id: req.params.websiteId, error: error.message }
    });

    res.status(500).json({ error: error.message });
  }
});

// Run performance test
app.post('/api/run-test/performance/:websiteId', authenticate, async (req, res) => {
  let processId = null;

  try {
    const website = db.prepare('SELECT * FROM websites WHERE id = ?').get(req.params.websiteId);
    if (!website) return res.status(404).json({ error: 'Website not found' });

    // Start process monitoring
    processId = ProcessMonitor.start({
      process_type: 'performance_test',
      metadata: { website_id: website.id, website_name: website.name, url: website.url }
    });

    // Log activity
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'performance_test',
      status: 'running',
      metadata: { website_id: website.id, process_id: processId }
    });

    ProcessMonitor.updateProgress(processId, 10);
    const response = await axios.post(`${TEST_API_URL}/api/test/performance`, {
      target_url: website.url,
      device: req.body.device || 'desktop'
    }, { timeout: 180000 });

    ProcessMonitor.updateProgress(processId, 80);

    const testData = response.data;
    const runId = `${Date.now()}-perf-${website.id}`;

    // Store test run
    const runResult = db.prepare(`
      INSERT INTO test_runs (run_id, website_id, test_type, status, total_tests, passed, failed, duration_ms, report_url)
      VALUES (?, ?, 'Performance', ?, 1, ?, ?, ?, ?)
    `).run(
      runId,
      website.id,
      testData.success ? 'Pass' : 'Fail',
      testData.success ? 1 : 0,
      testData.success ? 0 : 1,
      testData.total_duration_ms || 0,
      testData.report_url || null
    );

    const testRunId = runResult.lastInsertRowid;

    // Store performance metrics
    if (testData.metrics && testData.scores) {
      db.prepare(`
        INSERT INTO performance_metrics (
          test_run_id, lcp, cls, fcp, ttfb, inp,
          performance_score, accessibility_score, seo_score, best_practices_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        testRunId,
        testData.metrics.LCP || null,
        testData.metrics.CLS || null,
        testData.metrics.FCP || null,
        testData.metrics.TTFB || null,
        testData.metrics.INP || null,
        testData.scores.performance || null,
        testData.scores.accessibility || null,
        testData.scores.seo || null,
        testData.scores['best-practices'] || null
      );
    }

    // Update website
    db.prepare(`
      UPDATE websites
      SET last_result = ?, last_tested_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(testData.success ? 'Pass' : 'Fail', website.id);

    // Complete process
    ProcessMonitor.complete(processId, 'completed');

    // Log completion
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'performance_test',
      status: testData.success ? 'success' : 'fail',
      metadata: {
        website_id: website.id,
        test_run_id: testRunId,
        performance_score: testData.scores?.performance
      }
    });

    res.json({ test_run_id: testRunId, process_id: processId, ...testData });
  } catch (error) {
    // Mark process as failed
    if (processId) {
      ProcessMonitor.fail(processId, error.message);
    }

    // Log error
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'performance_test',
      status: 'error',
      metadata: { website_id: req.params.websiteId, error: error.message }
    });

    res.status(500).json({ error: error.message });
  }
});

// Run pixel audit test
app.post('/api/run-test/pixel-audit/:websiteId', authenticate, async (req, res) => {
  let processId = null;

  try {
    const website = db.prepare('SELECT * FROM websites WHERE id = ?').get(req.params.websiteId);
    if (!website) return res.status(404).json({ error: 'Website not found' });

    // Start process monitoring
    processId = ProcessMonitor.start({
      process_type: 'pixel_audit',
      metadata: { website_id: website.id, website_name: website.name, url: website.url }
    });

    // Log activity
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'pixel_audit',
      status: 'running',
      metadata: { website_id: website.id, process_id: processId }
    });

    ProcessMonitor.updateProgress(processId, 10);
    const response = await axios.post(`${TEST_API_URL}/api/test/pixel-audit`, {
      target_url: website.url
    }, { timeout: 120000 });

    ProcessMonitor.updateProgress(processId, 80);

    const testData = response.data;
    const runId = `${Date.now()}-pixel-${website.id}`;

    // Map API response to expected format
    const totalPixels = (testData.summary?.detected || 0) + (testData.summary?.missing || 0);

    // Store test run
    const runResult = db.prepare(`
      INSERT INTO test_runs (run_id, website_id, test_type, status, total_tests, passed, failed, duration_ms)
      VALUES (?, ?, 'Pixel Audit', ?, ?, ?, ?, ?)
    `).run(
      runId,
      website.id,
      testData.success ? 'Pass' : 'Fail',
      totalPixels,
      testData.summary?.detected || 0,
      testData.summary?.missing || 0,
      testData.total_duration_ms || 0
    );

    const testRunId = runResult.lastInsertRowid;

    // Store pixel audit results - combine found and missing pixels
    const insertPixel = db.prepare(`
      INSERT INTO pixel_audit_results (test_run_id, pixel_vendor, pixel_id, found, events_detected, warnings, har_file_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Store found pixels
    if (testData.pixels_found && Array.isArray(testData.pixels_found)) {
      for (const pixel of testData.pixels_found) {
        insertPixel.run(
          testRunId,
          pixel.name,
          pixel.pixel_id || pixel.container_id || null,
          1, // found = true
          JSON.stringify({
            network_calls: pixel.network_calls || 0,
            events: pixel.events || 0,
            script_url: pixel.script_url
          }),
          null,
          testData.har_url || null
        );
      }
    }

    // Store missing pixels
    if (testData.missing_pixels && Array.isArray(testData.missing_pixels)) {
      for (const pixel of testData.missing_pixels) {
        insertPixel.run(
          testRunId,
          pixel.name || pixel.vendor,
          pixel.pixel_id || null,
          0, // found = false
          null,
          JSON.stringify({ reason: 'Not detected on page' }),
          null
        );
      }
    }

    // Update website
    db.prepare(`
      UPDATE websites
      SET last_result = ?, last_tested_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(testData.success ? 'Pass' : 'Fail', website.id);

    // Complete process
    ProcessMonitor.complete(processId, 'completed');

    // Log completion
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'pixel_audit',
      status: testData.success ? 'success' : 'fail',
      metadata: {
        website_id: website.id,
        test_run_id: testRunId,
        pixels_found: testData.summary?.detected || 0,
        pixels_missing: testData.summary?.missing || 0
      }
    });

    res.json({ test_run_id: testRunId, process_id: processId, ...testData });
  } catch (error) {
    // Mark process as failed
    if (processId) {
      ProcessMonitor.fail(processId, error.message);
    }

    // Log error
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'pixel_audit',
      status: 'error',
      metadata: { website_id: req.params.websiteId, error: error.message }
    });

    res.status(500).json({ error: error.message });
  }
});

// Run accessibility test
app.post('/api/run-test/accessibility/:websiteId', authenticate, async (req, res) => {
  let processId = null;

  try {
    const website = db.prepare('SELECT * FROM websites WHERE id = ?').get(req.params.websiteId);
    if (!website) return res.status(404).json({ error: 'Website not found' });

    // Start process monitoring
    processId = ProcessMonitor.start({
      process_type: 'accessibility_test',
      metadata: {
        website_id: website.id,
        website_name: website.name,
        url: website.url
      }
    });

    // Log activity
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'accessibility_test',
      status: 'running',
      metadata: { website_id: website.id, process_id: processId }
    });

    ProcessMonitor.updateProgress(processId, 10);

    // Run accessibility test locally using axe-playwright
    const testData = await AccessibilityService.runTest(website.url);

    ProcessMonitor.updateProgress(processId, 80);
    const runId = `${Date.now()}-a11y-${website.id}`;

    // Calculate totals
    const totalViolations = (testData.violations || []).length;
    const criticalCount = (testData.violations || []).filter(v => v.impact === 'critical').length;
    const seriousCount = (testData.violations || []).filter(v => v.impact === 'serious').length;

    // Store test run
    const runResult = db.prepare(`
      INSERT INTO test_runs (run_id, website_id, test_type, status, total_tests, passed, failed, duration_ms)
      VALUES (?, ?, 'Accessibility', ?, ?, ?, ?, ?)
    `).run(
      runId,
      website.id,
      totalViolations === 0 ? 'Pass' : 'Fail',
      totalViolations,
      0, // passed (violations are failures)
      totalViolations,
      testData.duration_ms || 0
    );

    const testRunId = runResult.lastInsertRowid;

    // Store accessibility violations
    if (testData.violations && Array.isArray(testData.violations)) {
      const insertViolation = db.prepare(`
        INSERT INTO accessibility_results (
          test_run_id, violation_id, impact, description, help, help_url, nodes_affected, wcag_tags
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const violation of testData.violations) {
        insertViolation.run(
          testRunId,
          violation.id,
          violation.impact,
          violation.description || violation.help,
          violation.help,
          violation.helpUrl,
          violation.nodes?.length || 0,
          violation.tags ? JSON.stringify(violation.tags) : null
        );
      }
    }

    // Update website
    db.prepare(`
      UPDATE websites
      SET last_result = ?, last_tested_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(totalViolations === 0 ? 'Pass' : 'Fail', website.id);

    // Complete process
    ProcessMonitor.complete(processId, 'completed');

    // Log completion
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'accessibility_test',
      status: testData.success ? 'success' : 'fail',
      metadata: {
        website_id: website.id,
        test_run_id: testRunId,
        violations: totalViolations,
        critical: criticalCount,
        serious: seriousCount
      }
    });

    res.json({ test_run_id: testRunId, process_id: processId, ...testData });
  } catch (error) {
    // Mark process as failed
    if (processId) {
      ProcessMonitor.fail(processId, error.message);
    }

    // Log error
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'accessibility_test',
      status: 'error',
      metadata: { website_id: req.params.websiteId, error: error.message }
    });

    res.status(500).json({ error: error.message });
  }
});

// Run load test
app.post('/api/run-test/load/:websiteId', authenticate, async (req, res) => {
  let processId = null;

  try {
    const website = db.prepare('SELECT * FROM websites WHERE id = ?').get(req.params.websiteId);
    if (!website) return res.status(404).json({ error: 'Website not found' });

    // Get load test parameters from request body (with defaults)
    const { virtual_users = 10, duration_seconds = 30 } = req.body;

    // Start process monitoring
    processId = ProcessMonitor.start({
      process_type: 'load_test',
      metadata: {
        website_id: website.id,
        website_name: website.name,
        url: website.url,
        virtual_users,
        duration_seconds
      }
    });

    // Log activity
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'load_test',
      status: 'running',
      metadata: { website_id: website.id, process_id: processId, virtual_users, duration_seconds }
    });

    ProcessMonitor.updateProgress(processId, 10);
    const response = await axios.post(`${TEST_API_URL}/api/test/load`, {
      target_url: website.url,
      virtual_users,
      duration: `${duration_seconds}s`  // API expects duration as string like '30s'
    }, { timeout: (duration_seconds + 60) * 1000 }); // Add 60s buffer to timeout

    ProcessMonitor.updateProgress(processId, 80);

    const testData = response.data;
    const runId = `${Date.now()}-load-${website.id}`;

    // Store test run
    const runResult = db.prepare(`
      INSERT INTO test_runs (run_id, website_id, test_type, status, total_tests, passed, failed, duration_ms)
      VALUES (?, ?, 'Load Test', ?, ?, ?, ?, ?)
    `).run(
      runId,
      website.id,
      testData.success ? 'Pass' : 'Fail',
      testData.metrics?.requests_total || 0,
      testData.metrics?.requests_total - (testData.metrics?.requests_failed || 0) || 0,
      testData.metrics?.requests_failed || 0,
      testData.duration_ms || 0
    );

    const testRunId = runResult.lastInsertRowid;

    // Store load test metrics - map test API field names to database fields
    if (testData.metrics) {
      const metrics = testData.metrics;
      db.prepare(`
        INSERT INTO load_test_results (
          test_run_id, virtual_users, duration_seconds,
          requests_total, requests_failed,
          latency_p50, latency_p90, latency_p95, latency_p99,
          throughput_rps, error_rate
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        testRunId,
        virtual_users,
        duration_seconds,
        metrics.total_requests || metrics.requests_total || 0,
        metrics.requests_failed || 0,
        metrics.p50_ms || metrics.latency_p50 || null,
        metrics.p90_ms || metrics.latency_p90 || null,
        metrics.p95_ms || metrics.latency_p95 || null,
        metrics.p99_ms || metrics.latency_p99 || null,
        metrics.rps || metrics.throughput_rps || null,
        metrics.error_rate || null
      );
    } else {
      // Store a record even if metrics are missing, to track the test run
      db.prepare(`
        INSERT INTO load_test_results (
          test_run_id, virtual_users, duration_seconds,
          requests_total, requests_failed
        )
        VALUES (?, ?, ?, 0, 0)
      `).run(testRunId, virtual_users, duration_seconds);
    }

    // Update website
    db.prepare(`
      UPDATE websites
      SET last_result = ?, last_tested_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(testData.success ? 'Pass' : 'Fail', website.id);

    // Complete process
    ProcessMonitor.complete(processId, 'completed');

    // Log completion
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'load_test',
      status: testData.success ? 'success' : 'fail',
      metadata: {
        website_id: website.id,
        test_run_id: testRunId,
        requests_total: testData.metrics?.requests_total || 0,
        error_rate: testData.metrics?.error_rate || 0
      }
    });

    // Emit WebSocket event for real-time update
    const testRun = db.prepare('SELECT * FROM test_runs WHERE id = ?').get(testRunId);
    if (testRun) {
      wsServer.emitTestResult({
        ...testRun,
        website_name: website.name,
        website_url: website.url
      });
    }

    res.json({ test_run_id: testRunId, process_id: processId, ...testData });
  } catch (error) {
    const responseData = error.response?.data;

    // Check if k6 is not installed
    if (responseData?.message?.includes('k6: not found') || responseData?.error?.includes('k6')) {
      if (processId) ProcessMonitor.fail(processId, 'k6 not installed');
      ActivityLogger.log({
        user: req.user?.username || 'system',
        action: 'test',
        resource: 'load_test',
        status: 'error',
        metadata: { website_id: req.params.websiteId, error: 'k6 not installed' }
      });
      return res.status(500).json({
        error: 'Load testing (k6) is not yet installed on the test server. The tool will be installed soon.'
      });
    }

    // Check if test ran but failed thresholds
    if (error.response?.status === 500 && responseData?.duration_ms) {
      // Test executed but either failed thresholds or had errors
      const testData = responseData;
      const runId = `${Date.now()}-load-${req.params.websiteId}`;
      const website = db.prepare('SELECT * FROM websites WHERE id = ?').get(req.params.websiteId);

      // Check if we have metrics or just duration
      const hasMetrics = testData.metrics && testData.metrics.requests_total;

      // Store test run as "Fail"
      const runResult = db.prepare(`
        INSERT INTO test_runs (run_id, website_id, test_type, status, total_tests, passed, failed, duration_ms)
        VALUES (?, ?, 'Load Test', 'Fail', ?, ?, ?, ?)
      `).run(
        runId,
        req.params.websiteId,
        hasMetrics ? (testData.metrics.requests_total || 0) : 0,
        hasMetrics ? ((testData.metrics.requests_total || 0) - (testData.metrics.requests_failed || 0)) : 0,
        hasMetrics ? (testData.metrics.requests_failed || 0) : 0,
        testData.duration_ms || 0
      );

      const testRunId = runResult.lastInsertRowid;

      // Store load test metrics if available
      if (hasMetrics) {
        db.prepare(`
          INSERT INTO load_test_results (
            test_run_id, virtual_users, duration_seconds,
            requests_total, requests_failed,
            latency_p50, latency_p90, latency_p95, latency_p99,
            throughput_rps, error_rate
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          testRunId,
          req.body.virtual_users || 10,
          req.body.duration_seconds || 30,
          testData.metrics.requests_total || 0,
          testData.metrics.requests_failed || 0,
          testData.metrics.latency_p50 || null,
          testData.metrics.latency_p90 || null,
          testData.metrics.latency_p95 || null,
          testData.metrics.latency_p99 || null,
          testData.metrics.throughput_rps || null,
          testData.metrics.error_rate || null
        );
      }

      // Update website
      db.prepare(`
        UPDATE websites
        SET last_result = 'Fail', last_tested_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.params.websiteId);

      // Complete process
      ProcessMonitor.complete(processId, 'completed');

      // Log completion
      ActivityLogger.log({
        user: req.user?.username || 'system',
        action: 'test',
        resource: 'load_test',
        status: 'success',
        metadata: {
          website_id: req.params.websiteId,
          test_run_id: testRunId,
          threshold_warning: testData.message || 'Performance thresholds exceeded',
          has_metrics: hasMetrics
        }
      });

      // Emit WebSocket event for real-time update
      const testRun = db.prepare('SELECT * FROM test_runs WHERE id = ?').get(testRunId);
      if (testRun && website) {
        wsServer.emitTestResult({
          ...testRun,
          website_name: website.name,
          website_url: website.url
        });
      }

      return res.json({
        test_run_id: testRunId,
        process_id: processId,
        success: false,
        message: testData.message || 'Test completed but performance thresholds were exceeded',
        duration_ms: testData.duration_ms,
        metrics: testData.metrics || null
      });
    }

    // Unknown error - mark as failed
    if (processId) {
      ProcessMonitor.fail(processId, error.message);
    }

    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'load_test',
      status: 'error',
      metadata: { website_id: req.params.websiteId, error: error.message }
    });

    const errorMessage = responseData?.message || responseData?.error || error.message;
    res.status(500).json({ error: errorMessage });
  }
});

// Run security scan
app.post('/api/run-test/security/:websiteId', authenticate, async (req, res) => {
  let processId = null;

  try {
    const website = db.prepare('SELECT * FROM websites WHERE id = ?').get(req.params.websiteId);
    if (!website) return res.status(404).json({ error: 'Website not found' });

    // Start process monitoring
    processId = ProcessMonitor.start({
      process_type: 'security_scan',
      metadata: {
        website_id: website.id,
        website_name: website.name,
        url: website.url
      }
    });

    // Log activity
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'security_scan',
      status: 'running',
      metadata: { website_id: website.id, process_id: processId }
    });

    ProcessMonitor.updateProgress(processId, 20);

    // Run security scan
    const scanResult = await SecurityScanner.runScan(website.url);

    ProcessMonitor.updateProgress(processId, 80);

    const runId = `${Date.now()}-security-${website.id}`;

    // Store test run
    const runResult = db.prepare(`
      INSERT INTO test_runs (run_id, website_id, test_type, status, total_tests, passed, failed, duration_ms)
      VALUES (?, ?, 'Security Scan', ?, ?, ?, ?, ?)
    `).run(
      runId,
      website.id,
      scanResult.success ? 'Pass' : 'Fail',
      scanResult.summary.total,
      scanResult.summary.total - scanResult.summary.critical - scanResult.summary.high,
      scanResult.summary.critical + scanResult.summary.high,
      scanResult.duration_ms
    );

    const testRunId = runResult.lastInsertRowid;

    // Store security scan results - properly handle undefined/null values
    const sslValid = scanResult.ssl_info?.valid !== undefined ? (scanResult.ssl_info.valid ? 1 : 0) : null;
    const sslDaysRemaining = scanResult.ssl_info?.days_remaining !== undefined ? scanResult.ssl_info.days_remaining : null;
    const sslIssuer = scanResult.ssl_info?.issuer || null;

    db.prepare(`
      INSERT INTO security_scan_results (
        test_run_id, overall_score, ssl_valid, ssl_days_remaining, ssl_issuer,
        security_headers, violations
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      testRunId,
      scanResult.overall_score,
      sslValid,
      sslDaysRemaining,
      sslIssuer,
      JSON.stringify(scanResult.security_headers || {}),
      JSON.stringify(scanResult.violations || [])
    );

    // Update website
    db.prepare(`
      UPDATE websites
      SET last_result = ?, last_tested_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(scanResult.success ? 'Pass' : 'Fail', website.id);

    // Complete process
    ProcessMonitor.complete(processId, 'completed');

    // Log completion
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'security_scan',
      status: scanResult.success ? 'success' : 'error',
      metadata: {
        website_id: website.id,
        test_run_id: testRunId,
        overall_score: scanResult.overall_score,
        violations: scanResult.summary.total
      }
    });

    // Emit WebSocket event for real-time update
    const testRun = db.prepare('SELECT * FROM test_runs WHERE id = ?').get(testRunId);
    if (testRun) {
      wsServer.emitTestResult({
        ...testRun,
        website_name: website.name,
        website_url: website.url
      });
    }

    res.json({
      test_run_id: testRunId,
      process_id: processId,
      ...scanResult
    });
  } catch (error) {
    // Mark as failed
    if (processId) {
      ProcessMonitor.fail(processId, error.message);
    }

    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'security_scan',
      status: 'error',
      metadata: { website_id: req.params.websiteId, error: error.message }
    });

    res.status(500).json({ error: error.message });
  }
});

// Run SEO audit
app.post('/api/run-test/seo/:websiteId', authenticate, async (req, res) => {
  let processId = null;

  try {
    const website = db.prepare('SELECT * FROM websites WHERE id = ?').get(req.params.websiteId);
    if (!website) return res.status(404).json({ error: 'Website not found' });

    // Start process monitoring
    processId = ProcessMonitor.start({
      process_type: 'seo_audit',
      metadata: {
        website_id: website.id,
        website_name: website.name,
        url: website.url
      }
    });

    // Log activity
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'seo_audit',
      status: 'running',
      metadata: { website_id: website.id, process_id: processId }
    });

    ProcessMonitor.updateProgress(processId, 20);

    // Run SEO audit
    const auditResult = await SEOAuditor.runAudit(website.url);

    ProcessMonitor.updateProgress(processId, 80);

    const runId = `${Date.now()}-seo-${website.id}`;

    // Store test run
    const runResult = db.prepare(`
      INSERT INTO test_runs (run_id, website_id, test_type, status, total_tests, passed, failed, duration_ms)
      VALUES (?, ?, 'SEO Audit', ?, ?, ?, ?, ?)
    `).run(
      runId,
      website.id,
      auditResult.success ? 'Pass' : 'Fail',
      auditResult.summary.total,
      auditResult.summary.total - auditResult.summary.critical - auditResult.summary.warning,
      auditResult.summary.critical + auditResult.summary.warning,
      auditResult.duration_ms
    );

    const testRunId = runResult.lastInsertRowid;

    // Store SEO audit results
    db.prepare(`
      INSERT INTO seo_audit_results (
        test_run_id, overall_score, meta_tags, open_graph, twitter_card,
        structured_data, headings, images, links, technical, issues
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      testRunId,
      auditResult.overall_score,
      JSON.stringify(auditResult.meta_tags),
      JSON.stringify(auditResult.open_graph),
      JSON.stringify(auditResult.twitter_card),
      JSON.stringify(auditResult.structured_data),
      JSON.stringify(auditResult.headings),
      JSON.stringify(auditResult.images),
      JSON.stringify(auditResult.links),
      JSON.stringify(auditResult.technical),
      JSON.stringify(auditResult.issues)
    );

    // Update website
    db.prepare(`
      UPDATE websites
      SET last_result = ?, last_tested_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(auditResult.success ? 'Pass' : 'Fail', website.id);

    // Complete process
    ProcessMonitor.complete(processId, 'completed');

    // Log completion
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'seo_audit',
      status: auditResult.success ? 'success' : 'error',
      metadata: {
        website_id: website.id,
        test_run_id: testRunId,
        overall_score: auditResult.overall_score,
        issues: auditResult.summary.total
      }
    });

    // Emit WebSocket event for real-time update
    const testRun = db.prepare('SELECT * FROM test_runs WHERE id = ?').get(testRunId);
    if (testRun) {
      wsServer.emitTestResult({
        ...testRun,
        website_name: website.name,
        website_url: website.url
      });
    }

    res.json({
      test_run_id: testRunId,
      process_id: processId,
      ...auditResult
    });
  } catch (error) {
    // Mark as failed
    if (processId) {
      ProcessMonitor.fail(processId, error.message);
    }

    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'seo_audit',
      status: 'error',
      metadata: { website_id: req.params.websiteId, error: error.message }
    });

    res.status(500).json({ error: error.message });
  }
});

// Run visual regression test
app.post('/api/run-test/visual/:websiteId', authenticate, async (req, res) => {
  let processId = null;

  try {
    const website = db.prepare('SELECT * FROM websites WHERE id = ?').get(req.params.websiteId);
    if (!website) return res.status(404).json({ error: 'Website not found' });

    // Get createBaseline parameter from request body
    const { createBaseline = false } = req.body;

    // Start process monitoring
    processId = ProcessMonitor.start({
      process_type: 'visual_regression',
      metadata: {
        website_id: website.id,
        website_name: website.name,
        url: website.url,
        create_baseline: createBaseline
      }
    });

    // Log activity
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'visual_regression',
      status: 'running',
      metadata: { website_id: website.id, process_id: processId, create_baseline: createBaseline }
    });

    ProcessMonitor.updateProgress(processId, 20);

    // Run visual regression test
    const testResult = await VisualRegression.runTest(website.url, website.id, createBaseline);

    ProcessMonitor.updateProgress(processId, 80);

    const runId = `${Date.now()}-visual-${website.id}`;

    // Store test run
    const runResult = db.prepare(`
      INSERT INTO test_runs (run_id, website_id, test_type, status, total_tests, passed, failed, duration_ms)
      VALUES (?, ?, 'Visual Regression', ?, ?, ?, ?, ?)
    `).run(
      runId,
      website.id,
      testResult.success ? 'Pass' : 'Fail',
      testResult.summary.total_viewports,
      testResult.summary.passed,
      testResult.summary.failed,
      testResult.duration_ms
    );

    const testRunId = runResult.lastInsertRowid;

    // Store visual regression results
    db.prepare(`
      INSERT INTO visual_regression_results (
        test_run_id, overall_score, is_baseline_run, comparisons, issues
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      testRunId,
      testResult.overall_score,
      testResult.is_baseline_run ? 1 : 0,
      JSON.stringify(testResult.comparisons),
      JSON.stringify(testResult.issues)
    );

    // Update website
    db.prepare(`
      UPDATE websites
      SET last_result = ?, last_tested_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(testResult.success ? 'Pass' : 'Fail', website.id);

    // Complete process
    ProcessMonitor.complete(processId, 'completed');

    // Log completion
    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'visual_regression',
      status: testResult.success ? 'success' : 'error',
      metadata: {
        website_id: website.id,
        test_run_id: testRunId,
        overall_score: testResult.overall_score,
        is_baseline_run: testResult.is_baseline_run,
        viewports_tested: testResult.summary.total_viewports
      }
    });

    // Emit WebSocket event for real-time update
    const testRun = db.prepare('SELECT * FROM test_runs WHERE id = ?').get(testRunId);
    if (testRun) {
      wsServer.emitTestResult({
        ...testRun,
        website_name: website.name,
        website_url: website.url
      });
    }

    res.json({
      test_run_id: testRunId,
      process_id: processId,
      ...testResult
    });
  } catch (error) {
    // Mark as failed
    if (processId) {
      ProcessMonitor.fail(processId, error.message);
    }

    ActivityLogger.log({
      user: req.user?.username || 'system',
      action: 'test',
      resource: 'visual_regression',
      status: 'error',
      metadata: { website_id: req.params.websiteId, error: error.message }
    });

    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// STATS & DASHBOARD
// ============================================================================

app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      total_websites: db.prepare('SELECT COUNT(*) as count FROM websites').get().count,
      active_websites: db.prepare('SELECT COUNT(*) as count FROM websites WHERE status = ?').get('Active').count,
      total_test_runs: db.prepare('SELECT COUNT(*) as count FROM test_runs').get().count,
      recent_passes: db.prepare(`SELECT COUNT(*) as count FROM test_runs WHERE status = ? AND created_at > datetime('now', '-7 days')`).get('Pass').count,
      recent_fails: db.prepare(`SELECT COUNT(*) as count FROM test_runs WHERE status = ? AND created_at > datetime('now', '-7 days')`).get('Fail').count,
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PDF REPORT GENERATION
// ============================================================================

// Serve static PDF files
app.use('/reports', express.static('reports'));

// Serve static screenshot files
app.use('/screenshots', express.static('screenshots'));

// Generate PDF report for a test run
app.get('/api/test-runs/:id/report', authenticate, async (req, res) => {
  try {
    const testRunId = parseInt(req.params.id);

    // Get test run details
    const testRun = db.prepare(`
      SELECT tr.*, w.name as website_name, w.url as website_url
      FROM test_runs tr
      JOIN websites w ON tr.website_id = w.id
      WHERE tr.id = ?
    `).get(testRunId);

    if (!testRun) {
      return res.status(404).json({ error: 'Test run not found' });
    }

    // Get test-specific results based on test type
    let reportOptions = {
      testRun,
      testResults: null,
      metrics: null,
      pixelResults: null,
      loadResults: null,
      accessibilityResults: null,
      securityResults: null,
      seoResults: null,
      visualResults: null
    };

    switch (testRun.test_type) {
      case 'Smoke':
        // Smoke test results are in the test_results column
        reportOptions.testResults = testRun.test_results ? JSON.parse(testRun.test_results) : null;
        break;

      case 'Performance':
        const perfResults = db.prepare('SELECT * FROM performance_metrics WHERE test_run_id = ?').get(testRunId);
        reportOptions.metrics = perfResults;
        break;

      case 'Pixel Audit':
        const pixelResults = db.prepare('SELECT * FROM pixel_audit_results WHERE test_run_id = ?').get(testRunId);
        reportOptions.pixelResults = pixelResults;
        break;

      case 'Load Test':
        const loadResults = db.prepare('SELECT * FROM load_test_results WHERE test_run_id = ?').get(testRunId);
        reportOptions.loadResults = loadResults;
        break;

      case 'Accessibility':
        const a11yResults = db.prepare('SELECT * FROM accessibility_results WHERE test_run_id = ?').all(testRunId);
        reportOptions.accessibilityResults = a11yResults;
        break;

      case 'Security Scan':
        const securityResults = db.prepare('SELECT * FROM security_scan_results WHERE test_run_id = ?').get(testRunId);
        reportOptions.securityResults = securityResults;
        break;

      case 'SEO Audit':
        const seoResults = db.prepare('SELECT * FROM seo_audit_results WHERE test_run_id = ?').get(testRunId);
        reportOptions.seoResults = seoResults;
        break;

      case 'Visual Regression':
        const visualResults = db.prepare('SELECT * FROM visual_regression_results WHERE test_run_id = ?').get(testRunId);
        reportOptions.visualResults = visualResults;
        break;
    }

    // Generate PDF report
    console.log(`Generating PDF report for test run ${testRunId}, type: ${testRun.test_type}`);
    console.log('Report options:', JSON.stringify({
      testRun: { id: testRun.id, test_type: testRun.test_type },
      hasSecurityResults: !!reportOptions.securityResults,
      hasSeoResults: !!reportOptions.seoResults,
      hasVisualResults: !!reportOptions.visualResults,
      hasMetrics: !!reportOptions.metrics
    }));
    const pdfFilename = await ReportGenerator.generateReport(reportOptions);
    console.log(`PDF report generated: ${pdfFilename}`);

    // Send the PDF file directly
    const path = require('path');
    const pdfPath = path.join(__dirname, 'reports', pdfFilename);
    res.download(pdfPath, pdfFilename, (err) => {
      if (err) {
        console.error('Error sending PDF:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error sending PDF file' });
        }
      }
    });

  } catch (error) {
    console.error('Error generating report:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message, details: error.stack });
  }
});

// ============================================================================
// REPORT PROXY (Fix 404 errors for MinIO reports)
// ============================================================================

app.get('/api/reports/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    // Use port 9000 (MinIO default) not 9002
    const reportUrl = `http://38.97.60.181:9000/testing-agent/reports/${filename}`;

    // Fetch report from MinIO and proxy to client
    const response = await axios.get(reportUrl, {
      responseType: 'arraybuffer', // Use arraybuffer instead of stream
      timeout: 30000,
      maxRedirects: 5
    });

    // Set appropriate headers
    res.set('Content-Type', response.headers['content-type'] || 'text/html');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Send the response
    res.send(response.data);

  } catch (error) {
    console.error('Report proxy error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
    res.status(404).json({
      error: 'Report not found',
      message: 'The requested report could not be retrieved from storage'
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', async (req, res) => {
  try {
    const testApiHealth = await axios.get(`${TEST_API_URL}/api/health`, { timeout: 5000 });
    res.json({
      status: 'healthy',
      dashboard: true,
      test_api: testApiHealth.data.status === 'healthy',
      database: true
    });
  } catch (error) {
    res.json({
      status: 'degraded',
      dashboard: true,
      test_api: false,
      database: true,
      error: error.message
    });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize WebSocket server
wsServer.initialize(httpServer);

httpServer.listen(PORT, () => {
  console.log(`✅ QA Dashboard Backend running on port ${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`🧪 Test API: ${TEST_API_URL}`);

  // Start periodic process cleanup (check every 5 minutes, timeout after 10 minutes)
  ProcessCleanup.startPeriodicCleanup(5, 10);

  // Start scheduled test jobs
  ScheduledTests.start();
});
