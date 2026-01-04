const express = require('express');
const router = express.Router();
const visualRegressionService = require('../services/visualRegression');
const logger = require('../utils/logger');

/**
 * POST /api/test/visual-regression
 * Run visual regression test
 *
 * Body:
 * {
 *   "target_url": "https://example.com",
 *   "website_id": "site-123",
 *   "viewports": [
 *     { "name": "desktop", "width": 1920, "height": 1080 },
 *     { "name": "mobile", "width": 375, "height": 812 }
 *   ],
 *   "threshold": 0.1,
 *   "update_baseline": false
 * }
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      target_url,
      website_id,
      viewports,
      threshold = 0.1,
      update_baseline = false
    } = req.body;

    // Validation
    if (!target_url) {
      return res.status(400).json({
        success: false,
        error: 'target_url is required'
      });
    }

    if (!website_id) {
      return res.status(400).json({
        success: false,
        error: 'website_id is required for baseline management'
      });
    }

    logger.info('Visual regression test request received', {
      target_url,
      website_id,
      viewports: viewports?.length || 3,
      update_baseline
    });

    // Run visual regression
    const result = await visualRegressionService.runVisualRegression({
      target_url,
      website_id,
      viewports,
      threshold,
      update_baseline
    });

    const totalDuration = Date.now() - startTime;

    logger.info('Visual regression test completed', {
      target_url,
      website_id,
      duration_ms: totalDuration,
      success: result.success,
      is_baseline_run: result.is_baseline_run
    });

    res.json({
      ...result,
      total_duration_ms: totalDuration
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;

    logger.error('Visual regression test failed:', {
      error: error.message,
      stack: error.stack,
      duration_ms: totalDuration
    });

    res.status(500).json({
      success: false,
      error: 'Visual regression test failed',
      message: error.message,
      duration_ms: totalDuration
    });
  }
});

/**
 * POST /api/test/visual-regression/compare
 * Compare two images directly
 *
 * Body:
 * {
 *   "baseline_url": "https://...",
 *   "current_url": "https://...",
 *   "threshold": 0.1
 * }
 */
router.post('/compare', async (req, res) => {
  const startTime = Date.now();

  try {
    const { baseline_url, current_url, threshold = 0.1 } = req.body;

    if (!baseline_url || !current_url) {
      return res.status(400).json({
        success: false,
        error: 'baseline_url and current_url are required'
      });
    }

    logger.info('Image comparison request received');

    const result = await visualRegressionService.compareImages(
      baseline_url,
      current_url,
      { maxDifference: threshold }
    );

    res.json({
      success: true,
      ...result,
      duration_ms: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Image comparison failed:', error);
    res.status(500).json({
      success: false,
      error: 'Image comparison failed',
      message: error.message,
      duration_ms: Date.now() - startTime
    });
  }
});

/**
 * PUT /api/test/visual-regression/baseline
 * Update baseline from screenshot
 *
 * Body:
 * {
 *   "website_id": "site-123",
 *   "viewport": "desktop",
 *   "screenshot_url": "https://..."
 * }
 */
router.put('/baseline', async (req, res) => {
  try {
    const { website_id, viewport, screenshot_url } = req.body;

    if (!website_id || !viewport || !screenshot_url) {
      return res.status(400).json({
        success: false,
        error: 'website_id, viewport, and screenshot_url are required'
      });
    }

    logger.info('Baseline update request', { website_id, viewport });

    const result = await visualRegressionService.updateBaseline(
      website_id,
      viewport,
      screenshot_url
    );

    res.json(result);

  } catch (error) {
    logger.error('Baseline update failed:', error);
    res.status(500).json({
      success: false,
      error: 'Baseline update failed',
      message: error.message
    });
  }
});

/**
 * DELETE /api/test/visual-regression/baseline/:websiteId
 * Delete baselines for a website
 *
 * Query:
 *   viewport - Optional, delete specific viewport only
 */
router.delete('/baseline/:websiteId', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { viewport } = req.query;

    logger.info('Baseline deletion request', { websiteId, viewport });

    const result = await visualRegressionService.deleteBaseline(websiteId, viewport);

    res.json(result);

  } catch (error) {
    logger.error('Baseline deletion failed:', error);
    res.status(500).json({
      success: false,
      error: 'Baseline deletion failed',
      message: error.message
    });
  }
});

module.exports = router;
