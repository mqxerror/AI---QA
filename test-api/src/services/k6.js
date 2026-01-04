const { exec, spawn } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const { createReadStream } = require('fs');
const readline = require('readline');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const storage = require('../utils/storage');

const execPromise = util.promisify(exec);

class K6Service {
  /**
   * Parse duration string to seconds
   * @param {string} duration - Duration string like "30s", "1m", "2h"
   * @returns {number} - Duration in seconds
   */
  parseDuration(duration) {
    const match = duration.match(/^(\d+)(s|m|h)$/);
    if (!match) return 30; // default
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      default: return 30;
    }
  }

  /**
   * Run k6 load test
   * @param {Object} config - Test configuration
   * @returns {Promise<Object>} - Load test results
   */
  async runLoadTest(config) {
    const {
      target_url,
      virtual_users = 10,
      duration = '30s',
      thresholds = {
        p95: 500,
        error_rate: 0.01
      },
      http_method = 'GET',
      request_body = null
    } = config;

    logger.info(`Running k6 load test on ${target_url}`, { vus: virtual_users, duration });

    const runId = uuidv4();
    const scriptPath = `/app/artifacts/k6/${runId}-script.js`;
    const resultPath = `/app/artifacts/k6/${runId}-results.json`;
    const summaryPath = `/app/artifacts/k6/${runId}-summary.json`;
    const durationSeconds = this.parseDuration(duration);

    // Generate k6 script with improved summary output
    const k6Script = this.generateK6Script({
      target_url,
      virtual_users,
      duration,
      thresholds,
      http_method,
      request_body,
      summaryPath
    });

    try {
      // Ensure directory exists
      await fs.mkdir('/app/artifacts/k6', { recursive: true });

      // Write script to file
      await fs.writeFile(scriptPath, k6Script);

      // Run k6 with JSON output for raw data
      const k6Command = `k6 run --out json=${resultPath} ${scriptPath}`;
      logger.info(`Executing: ${k6Command}`);

      const { stdout, stderr } = await execPromise(k6Command, {
        timeout: 600000, // 10 minutes max
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      if (stderr && !stderr.includes('INFO')) {
        logger.warn('k6 stderr:', stderr);
      }

      // Try to read summary file first (preferred - has aggregate data)
      let results;
      try {
        const summaryContent = await fs.readFile(summaryPath, 'utf8');
        results = this.parseSummaryResults(summaryContent, durationSeconds);
        logger.info('Using k6 summary data for metrics');
      } catch (summaryError) {
        // Fallback to stream parsing of raw results
        logger.info('Summary not available, using stream parser');
        results = await this.parseK6ResultsStream(resultPath, durationSeconds);
      }

      // Upload results to MinIO
      const resultUrl = await storage.uploadFile(resultPath, `k6/${runId}-results.json`, 'application/json');

      // Check thresholds
      const thresholdBreaches = [];
      if (results.p95_ms > thresholds.p95) {
        thresholdBreaches.push(`P95 ${results.p95_ms}ms > ${thresholds.p95}ms`);
      }
      if (results.error_rate > thresholds.error_rate) {
        thresholdBreaches.push(`Error rate ${(results.error_rate * 100).toFixed(2)}% > ${(thresholds.error_rate * 100)}%`);
      }

      const passed = thresholdBreaches.length === 0;

      return {
        success: true,
        status: passed ? 'Pass' : 'Fail',
        metrics: {
          total_requests: results.total_requests,
          rps: results.rps,
          p50_ms: results.p50_ms,
          p90_ms: results.p90_ms,
          p95_ms: results.p95_ms,
          p99_ms: results.p99_ms,
          avg_ms: results.avg_ms,
          min_ms: results.min_ms,
          max_ms: results.max_ms,
          error_rate: results.error_rate,
          data_received_kb: results.data_received_kb,
          data_sent_kb: results.data_sent_kb
        },
        threshold_breaches: thresholdBreaches,
        report_url: resultUrl,
        duration: duration,
        virtual_users,
        tested_at: new Date().toISOString()
      };

    } catch (error) {
      logger.error('k6 load test error:', error);
      throw error;
    } finally {
      // Cleanup script and summary files
      try {
        await fs.unlink(scriptPath);
        await fs.unlink(summaryPath).catch(() => {});
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Generate k6 test script
   * @param {Object} config - Script configuration
   * @returns {string} - k6 JavaScript code
   */
  generateK6Script(config) {
    const {
      target_url,
      virtual_users,
      duration,
      thresholds,
      http_method,
      request_body,
      summaryPath
    } = config;

    return `
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  vus: ${virtual_users},
  duration: '${duration}',
  thresholds: {
    'http_req_duration': ['p(95)<${thresholds.p95}'],
    'errors': ['rate<${thresholds.error_rate}'],
  },
};

export default function () {
  const url = '${target_url}';

  ${http_method === 'POST' ? `
  const payload = ${request_body ? JSON.stringify(request_body) : 'null'};
  const params = {
    headers: { 'Content-Type': 'application/json' }
  };
  const res = http.post(url, JSON.stringify(payload), params);
  ` : `
  const res = http.get(url);
  `}

  const success = check(res, {
    'status is 2xx or 3xx': (r) => r.status >= 200 && r.status < 400,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);

  sleep(1);
}

export function handleSummary(data) {
  // Extract aggregate metrics from k6 summary data
  const httpDuration = data.metrics.http_req_duration || {};
  const httpReqs = data.metrics.http_reqs || {};
  const httpFailed = data.metrics.http_req_failed || {};
  const dataReceived = data.metrics.data_received || {};
  const dataSent = data.metrics.data_sent || {};

  const summary = {
    total_requests: httpReqs.values?.count || 0,
    rps: httpReqs.values?.rate || 0,
    avg_ms: httpDuration.values?.avg || 0,
    min_ms: httpDuration.values?.min || 0,
    max_ms: httpDuration.values?.max || 0,
    p50_ms: httpDuration.values?.['p(50)'] || 0,
    p90_ms: httpDuration.values?.['p(90)'] || 0,
    p95_ms: httpDuration.values?.['p(95)'] || 0,
    p99_ms: httpDuration.values?.['p(99)'] || 0,
    error_rate: httpFailed.values?.rate || 0,
    data_received_bytes: dataReceived.values?.count || 0,
    data_sent_bytes: dataSent.values?.count || 0
  };

  return {
    '${summaryPath}': JSON.stringify(summary, null, 2)
  };
}
`;
  }

  /**
   * Parse k6 summary results (preferred method)
   * @param {string} summaryContent - JSON summary from handleSummary
   * @param {number} durationSeconds - Test duration in seconds
   * @returns {Object} - Parsed metrics
   */
  parseSummaryResults(summaryContent, durationSeconds) {
    const data = JSON.parse(summaryContent);

    return {
      total_requests: data.total_requests || 0,
      rps: parseFloat((data.rps || 0).toFixed(2)),
      avg_ms: Math.round(data.avg_ms || 0),
      min_ms: Math.round(data.min_ms || 0),
      max_ms: Math.round(data.max_ms || 0),
      p50_ms: Math.round(data.p50_ms || 0),
      p90_ms: Math.round(data.p90_ms || 0),
      p95_ms: Math.round(data.p95_ms || 0),
      p99_ms: Math.round(data.p99_ms || 0),
      error_rate: data.error_rate || 0,
      data_received_kb: Math.round((data.data_received_bytes || 0) / 1024),
      data_sent_kb: Math.round((data.data_sent_bytes || 0) / 1024)
    };
  }

  /**
   * Parse k6 JSON results using stream parser (fallback method)
   * More reliable than loading entire file into memory
   * @param {string} resultPath - Path to k6 JSON output file
   * @param {number} durationSeconds - Test duration in seconds
   * @returns {Promise<Object>} - Parsed metrics
   */
  async parseK6ResultsStream(resultPath, durationSeconds) {
    return new Promise((resolve, reject) => {
      const metrics = {
        total_requests: 0,
        failed_requests: 0,
        http_req_duration: [],
        data_received: 0,
        data_sent: 0
      };

      const rl = readline.createInterface({
        input: createReadStream(resultPath),
        crlfDelay: Infinity
      });

      rl.on('line', (line) => {
        if (!line.trim()) return;

        try {
          const data = JSON.parse(line);

          if (data.type === 'Point') {
            switch (data.metric) {
              case 'http_reqs':
                metrics.total_requests++;
                break;
              case 'http_req_duration':
                metrics.http_req_duration.push(data.data.value);
                break;
              case 'http_req_failed':
                if (data.data.value === 1) {
                  metrics.failed_requests++;
                }
                break;
              case 'data_received':
                metrics.data_received += data.data.value;
                break;
              case 'data_sent':
                metrics.data_sent += data.data.value;
                break;
            }
          }
        } catch (e) {
          // Skip invalid JSON lines silently
        }
      });

      rl.on('close', () => {
        // Calculate percentiles efficiently
        metrics.http_req_duration.sort((a, b) => a - b);
        const len = metrics.http_req_duration.length;

        const getPercentile = (p) => {
          if (len === 0) return 0;
          const index = Math.max(0, Math.ceil((len * p) / 100) - 1);
          return Math.round(metrics.http_req_duration[index]);
        };

        const avg = len > 0
          ? Math.round(metrics.http_req_duration.reduce((a, b) => a + b, 0) / len)
          : 0;

        // Use actual duration for RPS calculation
        const rps = durationSeconds > 0
          ? parseFloat((metrics.total_requests / durationSeconds).toFixed(2))
          : 0;

        resolve({
          total_requests: metrics.total_requests,
          rps,
          avg_ms: avg,
          min_ms: len > 0 ? Math.round(metrics.http_req_duration[0]) : 0,
          max_ms: len > 0 ? Math.round(metrics.http_req_duration[len - 1]) : 0,
          p50_ms: getPercentile(50),
          p90_ms: getPercentile(90),
          p95_ms: getPercentile(95),
          p99_ms: getPercentile(99),
          error_rate: metrics.total_requests > 0
            ? metrics.failed_requests / metrics.total_requests
            : 0,
          data_received_kb: Math.round(metrics.data_received / 1024),
          data_sent_kb: Math.round(metrics.data_sent / 1024)
        });
      });

      rl.on('error', reject);
    });
  }
}

module.exports = new K6Service();
