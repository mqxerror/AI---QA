/**
 * Test Scheduler Service
 * Handles cron-based test scheduling
 *
 * Task: T1.1, T1.2, T1.3
 * Owner: Tara
 */

const cron = require('node-cron');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.scheduleConfigs = new Map();
  }

  /**
   * Default schedule configurations by test type
   */
  static DEFAULT_SCHEDULES = {
    discovery: {
      cron: '0 3 1 * *',        // Monthly, 1st at 3am
      description: 'Monthly page discovery',
      enabled: true
    },
    smoke: {
      cron: '0 6 * * *',        // Daily at 6am
      description: 'Daily smoke tests',
      enabled: true
    },
    lighthouse: {
      cron: '0 6 * * *',        // Daily at 6am
      description: 'Daily Lighthouse audits',
      enabled: true
    },
    visualRegression: {
      cron: '0 2 * * 6',        // Weekly, Saturday 2am
      description: 'Weekly visual regression',
      enabled: true
    },
    loadTest: {
      cron: null,               // Manual only
      description: 'Load tests (manual trigger)',
      enabled: false
    }
  };

  /**
   * Initialize scheduler for a website
   * @param {string} websiteId - Website ID
   * @param {Object} config - Schedule configuration
   */
  async initializeWebsiteSchedules(websiteId, config = {}) {
    const schedules = { ...SchedulerService.DEFAULT_SCHEDULES, ...config };

    for (const [testType, schedule] of Object.entries(schedules)) {
      if (schedule.enabled && schedule.cron) {
        await this.scheduleTest(websiteId, testType, schedule.cron);
      }
    }

    this.scheduleConfigs.set(websiteId, schedules);
    logger.info(`Initialized schedules for website ${websiteId}`);
  }

  /**
   * Schedule a test to run on cron
   * @param {string} websiteId - Website ID
   * @param {string} testType - Type of test (smoke, lighthouse, etc)
   * @param {string} cronExpression - Cron expression
   */
  async scheduleTest(websiteId, testType, cronExpression) {
    const jobKey = `${websiteId}:${testType}`;

    // Cancel existing job if any
    if (this.jobs.has(jobKey)) {
      this.jobs.get(jobKey).stop();
    }

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    // Create new job
    const job = cron.schedule(cronExpression, async () => {
      logger.info(`Scheduled ${testType} triggered for website ${websiteId}`);

      try {
        await this.executeScheduledTest(websiteId, testType);
      } catch (error) {
        logger.error(`Scheduled ${testType} failed for ${websiteId}:`, error);
        await this.handleTestFailure(websiteId, testType, error);
      }
    }, {
      timezone: 'UTC'
    });

    this.jobs.set(jobKey, job);
    logger.info(`Scheduled ${testType} for ${websiteId}: ${cronExpression}`);

    return jobKey;
  }

  /**
   * Execute a scheduled test
   */
  async executeScheduledTest(websiteId, testType) {
    // Import dynamically to avoid circular deps
    const queueService = require('./queue');

    const jobData = {
      websiteId,
      triggeredBy: 'scheduler',
      scheduledAt: new Date().toISOString()
    };

    switch (testType) {
      case 'discovery':
        return queueService.addDiscoveryJob(jobData);
      case 'smoke':
        // Run smoke tests directly or via queue
        return this.runSmokeTests(websiteId);
      case 'lighthouse':
        return this.runLighthouseAudit(websiteId);
      case 'visualRegression':
        return queueService.addVisualRegressionJob(jobData);
      default:
        throw new Error(`Unknown test type: ${testType}`);
    }
  }

  /**
   * Run smoke tests for a website
   */
  async runSmokeTests(websiteId) {
    const ParallelRunner = require('./parallelRunner');
    const db = require('../utils/database');

    // Get website pages
    const website = await db.get('SELECT * FROM websites WHERE id = ?', [websiteId]);
    if (!website) throw new Error('Website not found');

    const pages = await db.all(
      'SELECT * FROM discovered_pages WHERE website_id = ? AND active = 1',
      [websiteId]
    );

    if (pages.length === 0) {
      logger.warn(`No pages found for website ${websiteId}, running discovery first`);
      return;
    }

    // Run parallel tests
    const runner = new ParallelRunner({ maxWorkers: 4 });
    const results = await runner.runTests(
      pages.map(p => ({ url: p.url, name: p.title || p.url }))
    );

    // Store results
    const testRunId = require('uuid').v4();
    await db.run(
      `INSERT INTO test_runs (id, website_id, test_type, status, results, created_at)
       VALUES (?, ?, 'smoke', 'completed', ?, datetime('now'))`,
      [testRunId, websiteId, JSON.stringify(results)]
    );

    // Check for failures and send alerts
    const failures = results.filter(r => r.status === 'failed' || r.status === 'error');
    if (failures.length > 0) {
      await this.sendAlert(websiteId, 'smoke', failures);
    }

    return { testRunId, results };
  }

  /**
   * Run Lighthouse audit
   */
  async runLighthouseAudit(websiteId) {
    const performanceService = require('./performance');
    const db = require('../utils/database');

    const website = await db.get('SELECT * FROM websites WHERE id = ?', [websiteId]);
    if (!website) throw new Error('Website not found');

    const result = await performanceService.runLighthouse(website.url);

    // Store results
    const testRunId = require('uuid').v4();
    await db.run(
      `INSERT INTO test_runs (id, website_id, test_type, status, results, created_at)
       VALUES (?, ?, 'lighthouse', 'completed', ?, datetime('now'))`,
      [testRunId, websiteId, JSON.stringify(result)]
    );

    // Check thresholds and alert
    const thresholds = await this.getThresholds(websiteId, 'lighthouse');
    if (result.performance < thresholds.performance.critical ||
        result.seo < thresholds.seo.critical ||
        result.accessibility < thresholds.accessibility.critical) {
      await this.sendAlert(websiteId, 'lighthouse', result);
    }

    return { testRunId, result };
  }

  /**
   * Get alert thresholds for a website
   */
  async getThresholds(websiteId, testType) {
    const db = require('../utils/database');

    const website = await db.get('SELECT settings FROM websites WHERE id = ?', [websiteId]);
    const settings = website?.settings ? JSON.parse(website.settings) : {};

    // Default thresholds
    const defaults = {
      lighthouse: {
        performance: { critical: 40, warning: 60 },
        seo: { critical: 60, warning: 80 },
        accessibility: { critical: 70, warning: 85 }
      },
      smoke: {
        failureRate: { critical: 10, warning: 5 }
      },
      visualRegression: {
        diffPercentage: { critical: 15, warning: 5 }
      }
    };

    return settings.thresholds?.[testType] || defaults[testType] || {};
  }

  /**
   * Send alert for test failures
   */
  async sendAlert(websiteId, testType, data) {
    const db = require('../utils/database');
    const alertService = require('./alerts');

    // Get website info
    const website = await db.get('SELECT * FROM websites WHERE id = ?', [websiteId]);
    const websiteUrl = website?.url || 'Unknown';

    // Log alert
    logger.warn(`Alert for ${websiteUrl}: ${testType} issues detected`, data);

    // Send alert via alert service
    try {
      if (Array.isArray(data) && data.length > 0) {
        // Test failures
        await alertService.testFailure(websiteId, websiteUrl, testType, data);
      } else if (data.performance !== undefined || data.seo !== undefined) {
        // Lighthouse results
        await alertService.performanceDegradation(websiteId, websiteUrl, data, {});
      } else if (data.error) {
        // Error alert
        await alertService.sendAlert({
          type: 'scheduled_test_failed',
          severity: 'error',
          websiteId,
          websiteUrl,
          title: `${testType} Test Failed`,
          message: data.error,
          data
        });
      }
    } catch (alertError) {
      logger.error('Failed to send alert:', alertError);
    }
  }

  /**
   * Handle test failure
   */
  async handleTestFailure(websiteId, testType, error) {
    logger.error(`Scheduled test failed: ${websiteId}/${testType}`, error);

    // Store failure record
    const db = require('../utils/database');
    await db.run(
      `INSERT INTO test_runs (id, website_id, test_type, status, error, created_at)
       VALUES (?, ?, ?, 'failed', ?, datetime('now'))`,
      [require('uuid').v4(), websiteId, testType, error.message]
    );

    // Send failure alert
    await this.sendAlert(websiteId, testType, { error: error.message });
  }

  /**
   * Cancel a scheduled test
   */
  cancelSchedule(websiteId, testType) {
    const jobKey = `${websiteId}:${testType}`;

    if (this.jobs.has(jobKey)) {
      this.jobs.get(jobKey).stop();
      this.jobs.delete(jobKey);
      logger.info(`Cancelled schedule: ${jobKey}`);
      return true;
    }

    return false;
  }

  /**
   * Cancel all schedules for a website
   */
  cancelAllSchedules(websiteId) {
    let cancelled = 0;

    for (const [key, job] of this.jobs.entries()) {
      if (key.startsWith(`${websiteId}:`)) {
        job.stop();
        this.jobs.delete(key);
        cancelled++;
      }
    }

    this.scheduleConfigs.delete(websiteId);
    logger.info(`Cancelled ${cancelled} schedules for website ${websiteId}`);

    return cancelled;
  }

  /**
   * Get all active schedules
   */
  getActiveSchedules() {
    const schedules = [];

    for (const [key, job] of this.jobs.entries()) {
      const [websiteId, testType] = key.split(':');
      const config = this.scheduleConfigs.get(websiteId)?.[testType];

      schedules.push({
        websiteId,
        testType,
        cron: config?.cron,
        description: config?.description,
        running: job.running || false
      });
    }

    return schedules;
  }

  /**
   * Get schedule status for a website
   */
  getWebsiteSchedules(websiteId) {
    const config = this.scheduleConfigs.get(websiteId) || {};
    const activeJobs = [];

    for (const [key] of this.jobs.entries()) {
      if (key.startsWith(`${websiteId}:`)) {
        activeJobs.push(key.split(':')[1]);
      }
    }

    return {
      config,
      activeJobs,
      hasSchedules: activeJobs.length > 0
    };
  }

  /**
   * Update schedule for a specific test type
   */
  async updateSchedule(websiteId, testType, newConfig) {
    const config = this.scheduleConfigs.get(websiteId) || {};
    config[testType] = { ...config[testType], ...newConfig };
    this.scheduleConfigs.set(websiteId, config);

    // Cancel existing and reschedule if enabled
    this.cancelSchedule(websiteId, testType);

    if (newConfig.enabled && newConfig.cron) {
      await this.scheduleTest(websiteId, testType, newConfig.cron);
    }

    return config[testType];
  }

  /**
   * Shutdown scheduler
   */
  shutdown() {
    for (const job of this.jobs.values()) {
      job.stop();
    }
    this.jobs.clear();
    this.scheduleConfigs.clear();
    logger.info('Scheduler shutdown complete');
  }
}

// Singleton instance
const schedulerService = new SchedulerService();

module.exports = schedulerService;
