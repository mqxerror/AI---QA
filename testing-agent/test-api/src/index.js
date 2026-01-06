const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const smokeRoute = require('./routes/smoke');
const performanceRoute = require('./routes/performance');
const loadRoute = require('./routes/load');
const pixelAuditRoute = require('./routes/pixel-audit');
const visualRegressionRoute = require('./routes/visual-regression');
const reportRoute = require('./routes/report');
const discoveryRoute = require('./routes/discovery');
const healRoute = require('./routes/heal');
const queueRoute = require('./routes/queue');
const schedulerRoute = require('./routes/scheduler');
const alertsRoute = require('./routes/alerts');
const queueService = require('./services/queue');
const schedulerService = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// Test routes
app.use('/api/test/smoke', smokeRoute);
app.use('/api/test/performance', performanceRoute);
app.use('/api/test/load', loadRoute);
app.use('/api/test/pixel-audit', pixelAuditRoute);
app.use('/api/test/visual-regression', visualRegressionRoute);
app.use('/api/test/report', reportRoute);
app.use('/api/test/discover', discoveryRoute);

// Self-healing route
app.use('/api/heal', healRoute);

// Queue management route
app.use('/api/queue', queueRoute);

// Scheduler route
app.use('/api/scheduler', schedulerRoute);

// Alerts route
app.use('/api/alerts', alertsRoute);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Server error:', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize queue service (if Redis available)
try {
  if (process.env.REDIS_HOST) {
    queueService.initializeQueues();
    // Mount Bull Board dashboard at /api/admin/queues
    app.use('/api/admin/queues', queueService.serverAdapter.getRouter());
    logger.info('Queue service initialized with Bull Board at /api/admin/queues');
  } else {
    logger.warn('REDIS_HOST not configured - queue service disabled');
  }
} catch (error) {
  logger.warn('Queue service not available:', error.message);
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Testing Agent API running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`MinIO: ${process.env.MINIO_ENDPOINT || 'not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;
