const express = require('express');
const router = express.Router();
const ActivityLogger = require('../services/ActivityLogger').default || require('../services/ActivityLogger');

/**
 * GET /api/activities
 * Get activities with optional filtering
 */
router.get('/', (req, res) => {
  try {
    const { limit, user, action, resource, status } = req.query;

    const activities = ActivityLogger.getActivities({
      limit: limit ? parseInt(limit) : 50,
      user,
      action,
      resource,
      status
    });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/activities/stats
 * Get activity statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = ActivityLogger.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/activities
 * Create a new activity log (for manual logging)
 */
router.post('/', (req, res) => {
  try {
    const { action, resource, status, metadata } = req.body;
    const user = req.user?.username || 'system';

    ActivityLogger.log({
      user,
      action,
      resource,
      status,
      metadata
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
