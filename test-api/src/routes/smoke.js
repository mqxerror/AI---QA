const express = require('express');
const router = express.Router();
const playwrightService = require('../services/playwright');
const logger = require('../utils/logger');

/**
 * POST /api/test/smoke
 * Run smoke tests
 *
 * Body:
 * {
 *   "target_url": "https://example.com",
 *   "browser": "chromium", // or "firefox", "webkit"
 *   "viewport": { "width": 1920, "height": 1080 },
 *   "tests": ["homepage_loads", "navigation_works", "no_console_errors"]
 * }
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      target_url,
      browser = 'chromium',
      viewport = { width: 1920, height: 1080 },
      tests
    } = req.body;

    // Validation
    if (!target_url) {
      return res.status(400).json({
        success: false,
        error: 'target_url is required'
      });
    }

    if (!['chromium', 'firefox', 'webkit'].includes(browser)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid browser. Must be chromium, firefox, or webkit'
      });
    }

    logger.info('Smoke test request received', {
      target_url,
      browser,
      viewport
    });

    // Run smoke tests
    const result = await playwrightService.runSmokeTests({
      target_url,
      browser,
      viewport,
      tests
    });

    const totalDuration = Date.now() - startTime;

    logger.info('Smoke test completed', {
      target_url,
      duration_ms: totalDuration,
      success: result.success
    });

    res.json({
      ...result,
      total_duration_ms: totalDuration
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;

    logger.error('Smoke test failed:', {
      error: error.message,
      stack: error.stack,
      duration_ms: totalDuration
    });

    res.status(500).json({
      success: false,
      error: 'Smoke test failed',
      message: error.message,
      duration_ms: totalDuration
    });
  }
});

module.exports = router;
