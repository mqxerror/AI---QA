const express = require('express');
const router = express.Router();
const k6Service = require('../services/k6');
const logger = require('../utils/logger');

/**
 * POST /api/test/load
 * Run k6 load test
 *
 * Body:
 * {
 *   "target_url": "https://example.com",
 *   "virtual_users": 10,
 *   "duration": "30s",
 *   "thresholds": {
 *     "p95": 500,
 *     "error_rate": 0.01
 *   },
 *   "http_method": "GET",
 *   "request_body": null
 * }
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      target_url,
      virtual_users = 10,
      duration = '30s',
      thresholds,
      http_method = 'GET',
      request_body = null
    } = req.body;

    // Validation
    if (!target_url) {
      return res.status(400).json({
        success: false,
        error: 'target_url is required'
      });
    }

    if (virtual_users < 1 || virtual_users > 1000) {
      return res.status(400).json({
        success: false,
        error: 'virtual_users must be between 1 and 1000'
      });
    }

    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(http_method)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid http_method. Must be GET, POST, PUT, or DELETE'
      });
    }

    logger.info('Load test request received', {
      target_url,
      virtual_users,
      duration
    });

    // Run load test
    const result = await k6Service.runLoadTest({
      target_url,
      virtual_users,
      duration,
      thresholds,
      http_method,
      request_body
    });

    const totalDuration = Date.now() - startTime;

    logger.info('Load test completed', {
      target_url,
      duration_ms: totalDuration,
      status: result.status,
      rps: result.metrics.rps
    });

    res.json({
      ...result,
      total_duration_ms: totalDuration
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;

    logger.error('Load test failed:', {
      error: error.message,
      stack: error.stack,
      duration_ms: totalDuration
    });

    res.status(500).json({
      success: false,
      error: 'Load test failed',
      message: error.message,
      duration_ms: totalDuration
    });
  }
});

module.exports = router;
