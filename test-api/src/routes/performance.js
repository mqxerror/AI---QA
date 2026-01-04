const express = require('express');
const router = express.Router();
const lighthouseService = require('../services/lighthouse');
const logger = require('../utils/logger');

/**
 * POST /api/test/performance
 * Run Lighthouse performance audit
 *
 * Body:
 * {
 *   "target_url": "https://example.com",
 *   "device": "desktop", // or "mobile"
 *   "thresholds": {
 *     "LCP": 2500,
 *     "CLS": 0.1,
 *     "TTFB": 800,
 *     "performance_score": 80
 *   }
 * }
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      target_url,
      device = 'desktop',
      thresholds
    } = req.body;

    // Validation
    if (!target_url) {
      return res.status(400).json({
        success: false,
        error: 'target_url is required'
      });
    }

    if (!['desktop', 'mobile'].includes(device)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device. Must be desktop or mobile'
      });
    }

    logger.info('Performance test request received', {
      target_url,
      device
    });

    // Run performance audit
    const result = await lighthouseService.runPerformanceAudit({
      target_url,
      device,
      thresholds
    });

    const totalDuration = Date.now() - startTime;

    logger.info('Performance test completed', {
      target_url,
      duration_ms: totalDuration,
      performance_score: result.scores.performance
    });

    res.json({
      ...result,
      total_duration_ms: totalDuration
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;

    logger.error('Performance test failed:', {
      error: error.message,
      stack: error.stack,
      duration_ms: totalDuration
    });

    res.status(500).json({
      success: false,
      error: 'Performance test failed',
      message: error.message,
      duration_ms: totalDuration
    });
  }
});

module.exports = router;
