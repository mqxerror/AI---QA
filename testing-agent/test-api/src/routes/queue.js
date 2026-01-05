const express = require('express');
const router = express.Router();
const queueService = require('../services/queue');
const logger = require('../utils/logger');

/**
 * GET /api/queue/stats
 * Get statistics for all queues
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await queueService.getQueueStats();
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/queue/:queueName/stats
 * Get statistics for a specific queue
 */
router.get('/:queueName/stats', async (req, res) => {
  try {
    const { queueName } = req.params;
    const stats = await queueService.getQueueStats(queueName);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: `Queue '${queueName}' not found`
      });
    }

    res.json({
      success: true,
      queue: queueName,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/queue/:queueName/job/:jobId
 * Get status of a specific job
 */
router.get('/:queueName/job/:jobId', async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    const status = await queueService.getJobStatus(queueName, jobId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.json({
      success: true,
      job: status
    });
  } catch (error) {
    logger.error('Failed to get job status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/queue/discovery
 * Add a discovery job to the queue
 */
router.post('/discovery', async (req, res) => {
  try {
    const { domain, depth = 2, maxPages = 50, webhookUrl } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'domain is required'
      });
    }

    const job = await queueService.addDiscoveryJob({
      domain,
      depth,
      maxPages,
      webhookUrl,
      queuedAt: new Date().toISOString()
    });

    res.status(202).json({
      success: true,
      message: 'Discovery job queued',
      jobId: job.id,
      queue: 'discovery',
      statusUrl: `/api/queue/discovery/job/${job.id}`
    });
  } catch (error) {
    logger.error('Failed to queue discovery job:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/queue/load-test
 * Add a load test job to the queue
 */
router.post('/load-test', async (req, res) => {
  try {
    const { target_url, duration = '30s', vus = 10, webhookUrl } = req.body;

    if (!target_url) {
      return res.status(400).json({
        success: false,
        error: 'target_url is required'
      });
    }

    const job = await queueService.addLoadTestJob({
      target_url,
      duration,
      vus,
      webhookUrl,
      queuedAt: new Date().toISOString()
    });

    res.status(202).json({
      success: true,
      message: 'Load test job queued',
      jobId: job.id,
      queue: 'loadTest',
      statusUrl: `/api/queue/loadTest/job/${job.id}`
    });
  } catch (error) {
    logger.error('Failed to queue load test job:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/queue/full-suite
 * Add a full test suite job to the queue
 */
router.post('/full-suite', async (req, res) => {
  try {
    const { websiteId, target_url, tests, webhookUrl } = req.body;

    if (!websiteId && !target_url) {
      return res.status(400).json({
        success: false,
        error: 'websiteId or target_url is required'
      });
    }

    const job = await queueService.addFullSuiteJob({
      websiteId,
      target_url,
      tests: tests || ['smoke', 'performance', 'accessibility', 'seo'],
      webhookUrl,
      queuedAt: new Date().toISOString()
    });

    res.status(202).json({
      success: true,
      message: 'Full suite job queued',
      jobId: job.id,
      queue: 'fullSuite',
      statusUrl: `/api/queue/fullSuite/job/${job.id}`
    });
  } catch (error) {
    logger.error('Failed to queue full suite job:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/queue/clean
 * Clean old jobs from all queues
 */
router.post('/clean', async (req, res) => {
  try {
    await queueService.cleanOldJobs();
    res.json({
      success: true,
      message: 'Old jobs cleaned from all queues'
    });
  } catch (error) {
    logger.error('Failed to clean queues:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
