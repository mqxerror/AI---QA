const express = require('express');
const router = express.Router();
const reportService = require('../services/report');
const playwrightService = require('../services/playwright');
const lighthouseService = require('../services/lighthouse');
const k6Service = require('../services/k6');
const visualRegressionService = require('../services/visualRegression');
const logger = require('../utils/logger');

/**
 * POST /api/test/report
 * Generate unified report from test results
 *
 * Body:
 * {
 *   "target_url": "https://example.com",
 *   "website_id": "site-123",
 *   "test_run_id": "optional-uuid",
 *   "results": {
 *     "smoke": { ... },
 *     "performance": { ... },
 *     "load": { ... },
 *     "visualRegression": { ... },
 *     "pixelAudit": { ... }
 *   },
 *   "metadata": { ... }
 * }
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();

  try {
    const { target_url, website_id, test_run_id, results, metadata } = req.body;

    if (!target_url) {
      return res.status(400).json({
        success: false,
        error: 'target_url is required'
      });
    }

    logger.info('Report generation request', {
      target_url,
      website_id,
      tests: Object.keys(results || {})
    });

    const report = await reportService.generateReport({
      target_url,
      website_id,
      test_run_id,
      results,
      metadata
    });

    res.json({
      success: true,
      report,
      duration_ms: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Report generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Report generation failed',
      message: error.message,
      duration_ms: Date.now() - startTime
    });
  }
});

/**
 * POST /api/test/report/full
 * Run full test suite and generate unified report
 *
 * Body:
 * {
 *   "target_url": "https://example.com",
 *   "website_id": "site-123",
 *   "tests": ["smoke", "performance", "load", "visualRegression", "pixelAudit"],
 *   "config": {
 *     "smoke": { "tests": [...] },
 *     "performance": { "strategy": "mobile" },
 *     "load": { "virtual_users": 10, "duration": "30s" },
 *     "visualRegression": { "viewports": [...] },
 *     "pixelAudit": { "expected_pixels": ["GA4", "GTM"] }
 *   }
 * }
 */
router.post('/full', async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      target_url,
      website_id,
      tests = ['smoke', 'performance'],
      config = {}
    } = req.body;

    if (!target_url) {
      return res.status(400).json({
        success: false,
        error: 'target_url is required'
      });
    }

    logger.info('Full test suite request', {
      target_url,
      website_id,
      tests
    });

    const results = {};

    // Run smoke tests
    if (tests.includes('smoke')) {
      try {
        logger.info('Running smoke tests...');
        results.smoke = await playwrightService.runSmokeTests({
          target_url,
          ...config.smoke
        });
      } catch (error) {
        logger.error('Smoke test error:', error);
        results.smoke = { success: false, error: error.message };
      }
    }

    // Run performance tests
    if (tests.includes('performance')) {
      try {
        logger.info('Running performance tests...');
        results.performance = await lighthouseService.runPerformanceTest({
          target_url,
          ...config.performance
        });
      } catch (error) {
        logger.error('Performance test error:', error);
        results.performance = { success: false, error: error.message };
      }
    }

    // Run load tests
    if (tests.includes('load')) {
      try {
        logger.info('Running load tests...');
        results.load = await k6Service.runLoadTest({
          target_url,
          ...config.load
        });
      } catch (error) {
        logger.error('Load test error:', error);
        results.load = { success: false, error: error.message };
      }
    }

    // Run visual regression
    if (tests.includes('visualRegression') && website_id) {
      try {
        logger.info('Running visual regression...');
        results.visualRegression = await visualRegressionService.runVisualRegression({
          target_url,
          website_id,
          ...config.visualRegression
        });
      } catch (error) {
        logger.error('Visual regression error:', error);
        results.visualRegression = { success: false, error: error.message };
      }
    }

    // Run pixel audit
    if (tests.includes('pixelAudit')) {
      try {
        logger.info('Running pixel audit...');
        results.pixelAudit = await playwrightService.runPixelAudit({
          target_url,
          ...config.pixelAudit
        });
      } catch (error) {
        logger.error('Pixel audit error:', error);
        results.pixelAudit = { success: false, error: error.message };
      }
    }

    // Generate unified report
    const report = await reportService.generateReport({
      target_url,
      website_id,
      results,
      metadata: {
        tests_requested: tests,
        config
      }
    });

    const totalDuration = Date.now() - startTime;

    logger.info('Full test suite completed', {
      target_url,
      status: report.status,
      duration_ms: totalDuration
    });

    res.json({
      success: true,
      report,
      dashboard_summary: reportService.toDashboardSummary(report),
      duration_ms: totalDuration
    });

  } catch (error) {
    logger.error('Full test suite failed:', error);
    res.status(500).json({
      success: false,
      error: 'Full test suite failed',
      message: error.message,
      duration_ms: Date.now() - startTime
    });
  }
});

/**
 * POST /api/test/report/summary
 * Convert full report to dashboard summary
 */
router.post('/summary', (req, res) => {
  try {
    const { report } = req.body;

    if (!report) {
      return res.status(400).json({
        success: false,
        error: 'report is required'
      });
    }

    const summary = reportService.toDashboardSummary(report);

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    logger.error('Summary generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Summary generation failed',
      message: error.message
    });
  }
});

module.exports = router;
