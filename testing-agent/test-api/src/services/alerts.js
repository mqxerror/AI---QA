/**
 * Alert Service
 * Handles routing alerts to various channels (email, Slack, webhooks)
 *
 * Task: T1.3
 * Owner: Tara (Test Architect)
 */

const logger = require('../utils/logger');

class AlertService {
  constructor() {
    this.channels = new Map();
    this.alertHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Alert severity levels
   */
  static SEVERITY = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
  };

  /**
   * Alert types
   */
  static TYPES = {
    TEST_FAILURE: 'test_failure',
    PERFORMANCE_DEGRADATION: 'performance_degradation',
    VISUAL_REGRESSION: 'visual_regression',
    THRESHOLD_BREACH: 'threshold_breach',
    SCHEDULED_TEST_FAILED: 'scheduled_test_failed',
    DISCOVERY_COMPLETE: 'discovery_complete',
    HEALING_SUGGESTION: 'healing_suggestion'
  };

  /**
   * Register an alert channel
   * @param {string} name - Channel name
   * @param {Object} config - Channel configuration
   */
  registerChannel(name, config) {
    this.channels.set(name, {
      ...config,
      enabled: config.enabled !== false,
      severityFilter: config.severityFilter || ['warning', 'error', 'critical'],
      typeFilter: config.typeFilter || Object.values(AlertService.TYPES)
    });
    logger.info(`Registered alert channel: ${name}`);
  }

  /**
   * Send an alert through all configured channels
   * @param {Object} alert - Alert data
   */
  async sendAlert(alert) {
    const {
      type,
      severity = AlertService.SEVERITY.WARNING,
      websiteId,
      websiteUrl,
      title,
      message,
      data = {},
      timestamp = new Date().toISOString()
    } = alert;

    const alertRecord = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      websiteId,
      websiteUrl,
      title,
      message,
      data,
      timestamp,
      deliveries: []
    };

    // Store in history
    this.addToHistory(alertRecord);

    // Send to all matching channels
    const deliveryPromises = [];

    for (const [channelName, channelConfig] of this.channels) {
      if (!channelConfig.enabled) continue;
      if (!channelConfig.severityFilter.includes(severity)) continue;
      if (!channelConfig.typeFilter.includes(type)) continue;

      const deliveryPromise = this.deliverToChannel(channelName, channelConfig, alertRecord)
        .then(result => {
          alertRecord.deliveries.push({
            channel: channelName,
            success: true,
            timestamp: new Date().toISOString()
          });
          return result;
        })
        .catch(error => {
          alertRecord.deliveries.push({
            channel: channelName,
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          logger.error(`Failed to deliver alert to ${channelName}:`, error);
        });

      deliveryPromises.push(deliveryPromise);
    }

    await Promise.allSettled(deliveryPromises);

    logger.info(`Alert sent: ${title}`, {
      alertId: alertRecord.id,
      type,
      severity,
      channels: alertRecord.deliveries.length
    });

    return alertRecord;
  }

  /**
   * Deliver alert to a specific channel
   */
  async deliverToChannel(channelName, config, alert) {
    switch (config.type) {
      case 'email':
        return this.sendEmailAlert(config, alert);
      case 'slack':
        return this.sendSlackAlert(config, alert);
      case 'webhook':
        return this.sendWebhookAlert(config, alert);
      case 'console':
        return this.logAlert(alert);
      default:
        logger.warn(`Unknown channel type: ${config.type}`);
    }
  }

  /**
   * Send email alert (placeholder - requires email service integration)
   */
  async sendEmailAlert(config, alert) {
    const { recipients, smtpConfig } = config;

    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    logger.info('Email alert (placeholder):', {
      to: recipients,
      subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      body: alert.message
    });

    return { sent: true, recipients };
  }

  /**
   * Send Slack alert
   */
  async sendSlackAlert(config, alert) {
    const { webhookUrl, channel } = config;

    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const severityEmoji = {
      info: ':information_source:',
      warning: ':warning:',
      error: ':x:',
      critical: ':rotating_light:'
    };

    const severityColor = {
      info: '#2196F3',
      warning: '#FF9800',
      error: '#F44336',
      critical: '#9C27B0'
    };

    const payload = {
      channel: channel || undefined,
      attachments: [{
        color: severityColor[alert.severity] || '#757575',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${severityEmoji[alert.severity] || ''} ${alert.title}`,
              emoji: true
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: alert.message
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `*Website:* ${alert.websiteUrl || 'N/A'}`
              },
              {
                type: 'mrkdwn',
                text: `*Type:* ${alert.type}`
              },
              {
                type: 'mrkdwn',
                text: `*Time:* ${new Date(alert.timestamp).toLocaleString()}`
              }
            ]
          }
        ]
      }]
    };

    // Add data details if available
    if (alert.data && Object.keys(alert.data).length > 0) {
      payload.attachments[0].blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '```' + JSON.stringify(alert.data, null, 2).slice(0, 2000) + '```'
        }
      });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    return { sent: true };
  }

  /**
   * Send webhook alert
   */
  async sendWebhookAlert(config, alert) {
    const { url, headers = {}, method = 'POST' } = config;

    if (!url) {
      throw new Error('Webhook URL not configured');
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        event: 'alert',
        alert: {
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          websiteId: alert.websiteId,
          websiteUrl: alert.websiteUrl,
          data: alert.data,
          timestamp: alert.timestamp
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`);
    }

    return { sent: true, status: response.status };
  }

  /**
   * Log alert to console/logger
   */
  logAlert(alert) {
    const logFn = alert.severity === 'critical' || alert.severity === 'error'
      ? logger.error
      : alert.severity === 'warning'
      ? logger.warn
      : logger.info;

    logFn.call(logger, `[ALERT] ${alert.title}`, {
      type: alert.type,
      severity: alert.severity,
      websiteUrl: alert.websiteUrl,
      message: alert.message,
      data: alert.data
    });

    return { logged: true };
  }

  /**
   * Add alert to history
   */
  addToHistory(alert) {
    this.alertHistory.unshift(alert);
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get alert history
   * @param {Object} filters - Optional filters
   */
  getHistory(filters = {}) {
    let history = [...this.alertHistory];

    if (filters.websiteId) {
      history = history.filter(a => a.websiteId === filters.websiteId);
    }
    if (filters.type) {
      history = history.filter(a => a.type === filters.type);
    }
    if (filters.severity) {
      history = history.filter(a => a.severity === filters.severity);
    }
    if (filters.since) {
      const sinceDate = new Date(filters.since);
      history = history.filter(a => new Date(a.timestamp) >= sinceDate);
    }
    if (filters.limit) {
      history = history.slice(0, filters.limit);
    }

    return history;
  }

  /**
   * Get channel configuration
   */
  getChannels() {
    const channels = {};
    for (const [name, config] of this.channels) {
      channels[name] = {
        type: config.type,
        enabled: config.enabled,
        severityFilter: config.severityFilter,
        typeFilter: config.typeFilter
      };
    }
    return channels;
  }

  /**
   * Update channel configuration
   */
  updateChannel(name, updates) {
    const channel = this.channels.get(name);
    if (!channel) {
      throw new Error(`Channel ${name} not found`);
    }
    this.channels.set(name, { ...channel, ...updates });
    logger.info(`Updated alert channel: ${name}`);
  }

  /**
   * Remove a channel
   */
  removeChannel(name) {
    const removed = this.channels.delete(name);
    if (removed) {
      logger.info(`Removed alert channel: ${name}`);
    }
    return removed;
  }

  // Convenience methods for common alerts

  /**
   * Send test failure alert
   */
  async testFailure(websiteId, websiteUrl, testType, failures) {
    return this.sendAlert({
      type: AlertService.TYPES.TEST_FAILURE,
      severity: failures.length > 5 ? AlertService.SEVERITY.ERROR : AlertService.SEVERITY.WARNING,
      websiteId,
      websiteUrl,
      title: `${testType} Test Failures`,
      message: `${failures.length} test(s) failed on ${websiteUrl}`,
      data: { testType, failureCount: failures.length, failures: failures.slice(0, 10) }
    });
  }

  /**
   * Send performance degradation alert
   */
  async performanceDegradation(websiteId, websiteUrl, metrics, thresholds) {
    return this.sendAlert({
      type: AlertService.TYPES.PERFORMANCE_DEGRADATION,
      severity: AlertService.SEVERITY.WARNING,
      websiteId,
      websiteUrl,
      title: 'Performance Degradation Detected',
      message: `Performance scores dropped below thresholds on ${websiteUrl}`,
      data: { metrics, thresholds }
    });
  }

  /**
   * Send visual regression alert
   */
  async visualRegression(websiteId, websiteUrl, changes) {
    return this.sendAlert({
      type: AlertService.TYPES.VISUAL_REGRESSION,
      severity: AlertService.SEVERITY.WARNING,
      websiteId,
      websiteUrl,
      title: 'Visual Changes Detected',
      message: `${changes.length} page(s) with visual differences on ${websiteUrl}`,
      data: { changeCount: changes.length, changes: changes.slice(0, 10) }
    });
  }

  /**
   * Send threshold breach alert
   */
  async thresholdBreach(websiteId, websiteUrl, metric, value, threshold) {
    const severity = value < threshold.critical
      ? AlertService.SEVERITY.CRITICAL
      : AlertService.SEVERITY.WARNING;

    return this.sendAlert({
      type: AlertService.TYPES.THRESHOLD_BREACH,
      severity,
      websiteId,
      websiteUrl,
      title: `${metric} Threshold Breach`,
      message: `${metric} score (${value}) is below ${severity === 'critical' ? 'critical' : 'warning'} threshold (${threshold[severity === 'critical' ? 'critical' : 'warning']}) on ${websiteUrl}`,
      data: { metric, value, threshold }
    });
  }
}

// Create singleton instance
const alertService = new AlertService();

// Register default console channel
alertService.registerChannel('console', {
  type: 'console',
  enabled: true,
  severityFilter: ['warning', 'error', 'critical']
});

module.exports = alertService;
