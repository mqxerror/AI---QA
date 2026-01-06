/**
 * Alert Routes
 * API endpoints for managing alerts
 *
 * Task: T1.3
 */

const express = require('express');
const router = express.Router();
const alertService = require('../services/alerts');
const logger = require('../utils/logger');

/**
 * GET /api/alerts/channels
 * Get all configured alert channels
 */
router.get('/channels', (req, res) => {
  try {
    const channels = alertService.getChannels();
    res.json({
      success: true,
      channels
    });
  } catch (error) {
    logger.error('Failed to get channels:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/alerts/channels
 * Register a new alert channel
 */
router.post('/channels', (req, res) => {
  try {
    const { name, type, config } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Channel name and type are required'
      });
    }

    const validTypes = ['email', 'slack', 'webhook', 'console'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid channel type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    alertService.registerChannel(name, { type, ...config });

    res.json({
      success: true,
      message: `Channel '${name}' registered`,
      channels: alertService.getChannels()
    });
  } catch (error) {
    logger.error('Failed to register channel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/alerts/channels/:name
 * Update an existing alert channel
 */
router.put('/channels/:name', (req, res) => {
  try {
    const { name } = req.params;
    const updates = req.body;

    alertService.updateChannel(name, updates);

    res.json({
      success: true,
      message: `Channel '${name}' updated`,
      channels: alertService.getChannels()
    });
  } catch (error) {
    logger.error('Failed to update channel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/alerts/channels/:name
 * Remove an alert channel
 */
router.delete('/channels/:name', (req, res) => {
  try {
    const { name } = req.params;
    const removed = alertService.removeChannel(name);

    res.json({
      success: true,
      removed,
      message: removed ? `Channel '${name}' removed` : `Channel '${name}' not found`
    });
  } catch (error) {
    logger.error('Failed to remove channel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/alerts/history
 * Get alert history with optional filters
 */
router.get('/history', (req, res) => {
  try {
    const { websiteId, type, severity, since, limit = 50 } = req.query;

    const history = alertService.getHistory({
      websiteId,
      type,
      severity,
      since,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      count: history.length,
      alerts: history
    });
  } catch (error) {
    logger.error('Failed to get history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/alerts/test
 * Send a test alert to verify channel configuration
 */
router.post('/test', async (req, res) => {
  try {
    const { channel, severity = 'info' } = req.body;

    // Temporarily enable only the specified channel if provided
    const channels = alertService.getChannels();

    const alert = await alertService.sendAlert({
      type: 'test_alert',
      severity,
      websiteId: 'test',
      websiteUrl: 'https://example.com',
      title: 'Test Alert',
      message: 'This is a test alert to verify your notification configuration.',
      data: {
        testAt: new Date().toISOString(),
        triggeredBy: 'manual'
      }
    });

    res.json({
      success: true,
      message: 'Test alert sent',
      alert: {
        id: alert.id,
        deliveries: alert.deliveries
      }
    });
  } catch (error) {
    logger.error('Failed to send test alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/alerts/send
 * Manually send an alert
 */
router.post('/send', async (req, res) => {
  try {
    const { type, severity, websiteId, websiteUrl, title, message, data } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Type, title, and message are required'
      });
    }

    const alert = await alertService.sendAlert({
      type,
      severity: severity || 'info',
      websiteId,
      websiteUrl,
      title,
      message,
      data
    });

    res.json({
      success: true,
      alert: {
        id: alert.id,
        deliveries: alert.deliveries
      }
    });
  } catch (error) {
    logger.error('Failed to send alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/alerts/types
 * Get available alert types and severity levels
 */
router.get('/types', (req, res) => {
  res.json({
    success: true,
    types: Object.values(require('../services/alerts').constructor.TYPES || {
      TEST_FAILURE: 'test_failure',
      PERFORMANCE_DEGRADATION: 'performance_degradation',
      VISUAL_REGRESSION: 'visual_regression',
      THRESHOLD_BREACH: 'threshold_breach',
      SCHEDULED_TEST_FAILED: 'scheduled_test_failed',
      DISCOVERY_COMPLETE: 'discovery_complete',
      HEALING_SUGGESTION: 'healing_suggestion'
    }),
    severities: ['info', 'warning', 'error', 'critical']
  });
});

module.exports = router;
