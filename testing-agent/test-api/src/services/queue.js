const Queue = require('bull');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const logger = require('../utils/logger');

/**
 * Test Queue Service
 * Handles long-running tests (Discovery, Load Tests, Full Suites) via Redis/Bull
 * Prevents API timeouts and enables parallel test execution
 *
 * Task: A1.4 - Bull Board monitoring
 */

// Bull Board adapter (exported for use in main app)
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/api/admin/queues');

// Redis configuration
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3
};

// Queue definitions
const queues = {};

/**
 * Initialize all test queues
 */
function initializeQueues() {
  // Discovery queue - for crawling and page discovery
  queues.discovery = new Queue('discovery', { redis: REDIS_CONFIG });

  // Load test queue - for K6 stress tests
  queues.loadTest = new Queue('load-test', { redis: REDIS_CONFIG });

  // Full suite queue - for running all tests on a site
  queues.fullSuite = new Queue('full-suite', { redis: REDIS_CONFIG });

  // Visual regression queue - for screenshot comparison
  queues.visualRegression = new Queue('visual-regression', { redis: REDIS_CONFIG });

  // Set up event handlers for all queues
  Object.entries(queues).forEach(([name, queue]) => {
    queue.on('completed', (job, result) => {
      logger.info(`Queue [${name}] job ${job.id} completed`, {
        jobId: job.id,
        duration: Date.now() - job.timestamp
      });
    });

    queue.on('failed', (job, err) => {
      logger.error(`Queue [${name}] job ${job.id} failed`, {
        jobId: job.id,
        error: err.message
      });
    });

    queue.on('stalled', (job) => {
      logger.warn(`Queue [${name}] job ${job.id} stalled`);
    });

    queue.on('error', (error) => {
      logger.error(`Queue [${name}] error:`, error);
    });
  });

  // Set up Bull Board with all queues
  createBullBoard({
    queues: [
      new BullAdapter(queues.discovery),
      new BullAdapter(queues.loadTest),
      new BullAdapter(queues.fullSuite),
      new BullAdapter(queues.visualRegression)
    ],
    serverAdapter
  });

  logger.info('Test queues initialized with Bull Board', {
    queues: Object.keys(queues),
    bullBoardPath: '/api/admin/queues'
  });

  return queues;
}

/**
 * Add a job to the discovery queue
 * @param {Object} data - Discovery job data
 * @param {Object} options - Bull job options
 */
async function addDiscoveryJob(data, options = {}) {
  const defaultOptions = {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    timeout: 300000, // 5 minutes
    removeOnComplete: 100,
    removeOnFail: 50
  };

  const job = await queues.discovery.add(data, { ...defaultOptions, ...options });
  logger.info('Added discovery job to queue', { jobId: job.id, domain: data.domain });
  return job;
}

/**
 * Add a job to the load test queue
 * @param {Object} data - Load test job data
 * @param {Object} options - Bull job options
 */
async function addLoadTestJob(data, options = {}) {
  const defaultOptions = {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 10000
    },
    timeout: 600000, // 10 minutes
    removeOnComplete: 50,
    removeOnFail: 25
  };

  const job = await queues.loadTest.add(data, { ...defaultOptions, ...options });
  logger.info('Added load test job to queue', { jobId: job.id, url: data.target_url });
  return job;
}

/**
 * Add a job to the full suite queue
 * @param {Object} data - Full suite job data
 * @param {Object} options - Bull job options
 */
async function addFullSuiteJob(data, options = {}) {
  const defaultOptions = {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 10000
    },
    timeout: 900000, // 15 minutes
    removeOnComplete: 25,
    removeOnFail: 10
  };

  const job = await queues.fullSuite.add(data, { ...defaultOptions, ...options });
  logger.info('Added full suite job to queue', { jobId: job.id, websiteId: data.websiteId });
  return job;
}

/**
 * Add a job to the visual regression queue
 * @param {Object} data - Visual regression job data
 * @param {Object} options - Bull job options
 */
async function addVisualRegressionJob(data, options = {}) {
  const defaultOptions = {
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 5000
    },
    timeout: 180000, // 3 minutes
    removeOnComplete: 100,
    removeOnFail: 50
  };

  const job = await queues.visualRegression.add(data, { ...defaultOptions, ...options });
  logger.info('Added visual regression job to queue', { jobId: job.id, url: data.target_url });
  return job;
}

/**
 * Get job status by ID
 * @param {string} queueName - Queue name
 * @param {string} jobId - Job ID
 */
async function getJobStatus(queueName, jobId) {
  const queue = queues[queueName];
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  const job = await queue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress();

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
    result: job.returnvalue,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn
  };
}

/**
 * Get queue statistics
 * @param {string} queueName - Queue name (optional, returns all if not specified)
 */
async function getQueueStats(queueName) {
  const stats = {};

  const queuesToCheck = queueName ? { [queueName]: queues[queueName] } : queues;

  for (const [name, queue] of Object.entries(queuesToCheck)) {
    if (!queue) continue;

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);

    stats[name] = {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + delayed
    };
  }

  return queueName ? stats[queueName] : stats;
}

/**
 * Process discovery jobs
 * @param {Function} processor - Job processor function
 */
function processDiscoveryJobs(processor) {
  queues.discovery.process(async (job) => {
    logger.info('Processing discovery job', { jobId: job.id });
    return await processor(job);
  });
}

/**
 * Process load test jobs
 * @param {Function} processor - Job processor function
 */
function processLoadTestJobs(processor) {
  queues.loadTest.process(async (job) => {
    logger.info('Processing load test job', { jobId: job.id });
    return await processor(job);
  });
}

/**
 * Process full suite jobs
 * @param {Function} processor - Job processor function
 */
function processFullSuiteJobs(processor) {
  queues.fullSuite.process(async (job) => {
    logger.info('Processing full suite job', { jobId: job.id });
    return await processor(job);
  });
}

/**
 * Process visual regression jobs
 * @param {Function} processor - Job processor function
 */
function processVisualRegressionJobs(processor) {
  queues.visualRegression.process(async (job) => {
    logger.info('Processing visual regression job', { jobId: job.id });
    return await processor(job);
  });
}

/**
 * Clean old jobs from all queues
 */
async function cleanOldJobs() {
  const cleanPromises = Object.values(queues).map(async (queue) => {
    await queue.clean(86400000, 'completed'); // 24 hours
    await queue.clean(86400000 * 7, 'failed'); // 7 days
  });

  await Promise.all(cleanPromises);
  logger.info('Cleaned old jobs from all queues');
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  logger.info('Shutting down queue service...');

  const closePromises = Object.entries(queues).map(async ([name, queue]) => {
    try {
      await queue.close();
      logger.info(`Queue [${name}] closed`);
    } catch (error) {
      logger.error(`Error closing queue [${name}]:`, error);
    }
  });

  await Promise.all(closePromises);
}

module.exports = {
  initializeQueues,
  addDiscoveryJob,
  addLoadTestJob,
  addFullSuiteJob,
  addVisualRegressionJob,
  getJobStatus,
  getQueueStats,
  processDiscoveryJobs,
  processLoadTestJobs,
  processFullSuiteJobs,
  processVisualRegressionJobs,
  cleanOldJobs,
  shutdown,
  queues,
  serverAdapter // Bull Board adapter for mounting in Express
};
