/**
 * Scheduler Routes
 * API endpoints for managing test schedules
 *
 * Task: T1.1, T1.2, P4.3
 */

const express = require('express');
const router = express.Router();
const schedulerService = require('../services/scheduler');
const logger = require('../utils/logger');

/**
 * GET /api/scheduler/status
 * Get all active schedules
 */
router.get('/status', (req, res) => {
  try {
    const schedules = schedulerService.getActiveSchedules();
    res.json({
      success: true,
      schedules,
      count: schedules.length
    });
  } catch (error) {
    logger.error('Failed to get scheduler status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/scheduler/website/:websiteId
 * Get schedules for a specific website
 */
router.get('/website/:websiteId', (req, res) => {
  try {
    const { websiteId } = req.params;
    const schedules = schedulerService.getWebsiteSchedules(websiteId);
    res.json({
      success: true,
      websiteId,
      ...schedules
    });
  } catch (error) {
    logger.error('Failed to get website schedules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scheduler/website/:websiteId/initialize
 * Initialize default schedules for a website
 */
router.post('/website/:websiteId/initialize', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { config } = req.body;

    await schedulerService.initializeWebsiteSchedules(websiteId, config);

    const schedules = schedulerService.getWebsiteSchedules(websiteId);
    res.json({
      success: true,
      message: 'Schedules initialized',
      ...schedules
    });
  } catch (error) {
    logger.error('Failed to initialize schedules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/scheduler/website/:websiteId/:testType
 * Update schedule for a specific test type
 */
router.put('/website/:websiteId/:testType', async (req, res) => {
  try {
    const { websiteId, testType } = req.params;
    const { cron, enabled, description } = req.body;

    // Validate test type
    const validTypes = ['discovery', 'smoke', 'lighthouse', 'visualRegression', 'loadTest'];
    if (!validTypes.includes(testType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid test type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const updated = await schedulerService.updateSchedule(websiteId, testType, {
      cron,
      enabled,
      description
    });

    res.json({
      success: true,
      message: 'Schedule updated',
      testType,
      config: updated
    });
  } catch (error) {
    logger.error('Failed to update schedule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/scheduler/website/:websiteId/:testType
 * Cancel a specific schedule
 */
router.delete('/website/:websiteId/:testType', (req, res) => {
  try {
    const { websiteId, testType } = req.params;
    const cancelled = schedulerService.cancelSchedule(websiteId, testType);

    res.json({
      success: true,
      cancelled,
      message: cancelled ? 'Schedule cancelled' : 'No schedule found'
    });
  } catch (error) {
    logger.error('Failed to cancel schedule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/scheduler/website/:websiteId
 * Cancel all schedules for a website
 */
router.delete('/website/:websiteId', (req, res) => {
  try {
    const { websiteId } = req.params;
    const count = schedulerService.cancelAllSchedules(websiteId);

    res.json({
      success: true,
      cancelledCount: count,
      message: `Cancelled ${count} schedules`
    });
  } catch (error) {
    logger.error('Failed to cancel all schedules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scheduler/website/:websiteId/trigger/:testType
 * Manually trigger a scheduled test
 */
router.post('/website/:websiteId/trigger/:testType', async (req, res) => {
  try {
    const { websiteId, testType } = req.params;

    logger.info(`Manual trigger: ${testType} for ${websiteId}`);

    const result = await schedulerService.executeScheduledTest(websiteId, testType);

    res.json({
      success: true,
      message: `${testType} test triggered`,
      result
    });
  } catch (error) {
    logger.error('Failed to trigger test:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/scheduler/defaults
 * Get default schedule configurations
 */
router.get('/defaults', (req, res) => {
  res.json({
    success: true,
    defaults: schedulerService.constructor.DEFAULT_SCHEDULES
  });
});

module.exports = router;
