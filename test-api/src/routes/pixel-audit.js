const express = require('express');
const router = express.Router();
const playwrightService = require('../services/playwright');
const logger = require('../utils/logger');

/**
 * POST /api/test/pixel-audit
 * Run pixel audit to detect marketing pixels
 *
 * Body:
 * {
 *   "target_url": "https://example.com",
 *   "incognito": true,
 *   "expected_pixels": ["GA4", "Meta Pixel", "GTM"],
 *   "capture_har": true
 * }
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      target_url,
      incognito = true,
      expected_pixels = [],
      capture_har = true
    } = req.body;

    // Validation
    if (!target_url) {
      return res.status(400).json({
        success: false,
        error: 'target_url is required'
      });
    }

    const validPixels = ['GA4', 'Meta Pixel', 'GTM', 'Google Ads', 'TikTok', 'LinkedIn', 'Pinterest', 'Hotjar', 'Clarity'];
    const invalidPixels = expected_pixels.filter(p => !validPixels.includes(p));

    if (invalidPixels.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid pixel names: ${invalidPixels.join(', ')}`,
        valid_pixels: validPixels
      });
    }

    logger.info('Pixel audit request received', {
      target_url,
      expected_pixels
    });

    // Run pixel audit
    const result = await playwrightService.runPixelAudit({
      target_url,
      incognito,
      expected_pixels,
      capture_har
    });

    const totalDuration = Date.now() - startTime;

    const detectedCount = result.pixels_found.filter(p => p.detected).length;
    const missingCount = result.missing_pixels.length;

    logger.info('Pixel audit completed', {
      target_url,
      duration_ms: totalDuration,
      detected: detectedCount,
      missing: missingCount
    });

    res.json({
      ...result,
      total_duration_ms: totalDuration,
      summary: {
        expected: expected_pixels.length,
        detected: detectedCount,
        missing: missingCount
      }
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;

    logger.error('Pixel audit failed:', {
      error: error.message,
      stack: error.stack,
      duration_ms: totalDuration
    });

    res.status(500).json({
      success: false,
      error: 'Pixel audit failed',
      message: error.message,
      duration_ms: totalDuration
    });
  }
});

module.exports = router;
