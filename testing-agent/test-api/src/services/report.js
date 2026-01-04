const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const storage = require('../utils/storage');

/**
 * Unified Report Service
 * Generates standardized test reports with artifacts and metrics
 */
class ReportService {
  constructor() {
    this.reportPath = '/app/artifacts/reports';
  }

  /**
   * Ensure report directory exists
   */
  async ensureDirectory() {
    try {
      await fs.mkdir(this.reportPath, { recursive: true });
    } catch (error) {
      // Directory exists
    }
  }

  /**
   * Determine overall status from multiple test results
   * @param {Object} results - Object containing test type results
   * @returns {string} - 'pass', 'fail', or 'partial'
   */
  determineOverallStatus(results) {
    const statuses = [];

    if (results.smoke) {
      statuses.push(results.smoke.success ? 'pass' : 'fail');
    }
    if (results.performance) {
      statuses.push(results.performance.status === 'Pass' ? 'pass' : 'fail');
    }
    if (results.load) {
      statuses.push(results.load.status === 'Pass' ? 'pass' : 'fail');
    }
    if (results.visualRegression) {
      statuses.push(results.visualRegression.success ? 'pass' : 'fail');
    }
    if (results.pixelAudit) {
      const hasAllPixels = results.pixelAudit.missing_pixels?.length === 0;
      statuses.push(hasAllPixels ? 'pass' : 'fail');
    }

    if (statuses.length === 0) return 'unknown';
    if (statuses.every(s => s === 'pass')) return 'pass';
    if (statuses.every(s => s === 'fail')) return 'fail';
    return 'partial';
  }

  /**
   * Generate human-readable summary
   * @param {Object} results - Test results
   * @returns {string} - Summary text
   */
  generateSummary(results) {
    const parts = [];

    if (results.smoke) {
      const { passed, failed } = results.smoke.summary || {};
      if (results.smoke.success) {
        parts.push(`Smoke: ${passed}/${passed + failed} passed`);
      } else {
        parts.push(`Smoke: ${failed} failures`);
      }
    }

    if (results.performance) {
      const lcp = results.performance.metrics?.lcp_ms;
      const cls = results.performance.metrics?.cls;
      if (lcp) {
        const status = lcp < 2500 ? 'good' : lcp < 4000 ? 'needs improvement' : 'poor';
        parts.push(`LCP: ${lcp}ms (${status})`);
      }
      if (cls !== undefined) {
        const status = cls < 0.1 ? 'good' : cls < 0.25 ? 'needs improvement' : 'poor';
        parts.push(`CLS: ${cls.toFixed(3)} (${status})`);
      }
    }

    if (results.load) {
      const { p95_ms, rps, error_rate } = results.load.metrics || {};
      if (p95_ms) parts.push(`Load P95: ${p95_ms}ms`);
      if (rps) parts.push(`RPS: ${rps}`);
      if (error_rate > 0) parts.push(`Errors: ${(error_rate * 100).toFixed(2)}%`);
    }

    if (results.visualRegression) {
      if (results.visualRegression.is_baseline_run) {
        parts.push('Visual: baseline captured');
      } else {
        const { passed, failed } = results.visualRegression.summary || {};
        if (failed > 0) {
          parts.push(`Visual: ${failed} viewport(s) changed`);
        } else {
          parts.push('Visual: no changes');
        }
      }
    }

    if (results.pixelAudit) {
      const found = results.pixelAudit.pixels_found?.filter(p => p.detected).length || 0;
      const missing = results.pixelAudit.missing_pixels?.length || 0;
      parts.push(`Pixels: ${found} found${missing > 0 ? `, ${missing} missing` : ''}`);
    }

    return parts.join(' | ') || 'No tests executed';
  }

  /**
   * Collect artifacts from all test results
   * @param {Object} results - Test results
   * @returns {Object} - Artifacts object
   */
  collectArtifacts(results) {
    const artifacts = {};

    // Smoke test screenshots
    if (results.smoke?.results) {
      const screenshots = results.smoke.results
        .filter(r => r.screenshot)
        .map(r => ({ name: r.name, url: r.screenshot }));
      if (screenshots.length > 0) {
        artifacts.smoke_screenshots = screenshots;
      }
    }

    // Performance report
    if (results.performance?.report_url) {
      artifacts.performance_report = results.performance.report_url;
    }
    if (results.performance?.screenshot_url) {
      artifacts.performance_screenshot = results.performance.screenshot_url;
    }

    // Load test report
    if (results.load?.report_url) {
      artifacts.load_report = results.load.report_url;
    }

    // Visual regression diffs
    if (results.visualRegression?.comparisons) {
      const diffs = results.visualRegression.comparisons
        .filter(c => c.diff_path)
        .map(c => ({
          viewport: c.viewport,
          baseline: c.baseline_path,
          current: c.screenshot_path,
          diff: c.diff_path,
          difference: c.difference_percentage
        }));
      if (diffs.length > 0) {
        artifacts.visual_diffs = diffs;
      }

      const baselines = results.visualRegression.comparisons
        .filter(c => c.is_baseline_run)
        .map(c => ({ viewport: c.viewport, url: c.screenshot_path }));
      if (baselines.length > 0) {
        artifacts.visual_baselines = baselines;
      }
    }

    // Pixel audit HAR
    if (results.pixelAudit?.har_url) {
      artifacts.har = results.pixelAudit.har_url;
    }
    if (results.pixelAudit?.screenshot_url) {
      artifacts.pixel_audit_screenshot = results.pixelAudit.screenshot_url;
    }

    return artifacts;
  }

  /**
   * Collect key metrics from all test results
   * @param {Object} results - Test results
   * @returns {Object} - Metrics object
   */
  collectMetrics(results) {
    const metrics = {};

    // Performance metrics (Core Web Vitals)
    if (results.performance?.metrics) {
      const perf = results.performance.metrics;
      metrics.lcp_ms = perf.lcp_ms;
      metrics.fcp_ms = perf.fcp_ms;
      metrics.cls = perf.cls;
      metrics.tti_ms = perf.tti_ms;
      metrics.tbt_ms = perf.tbt_ms;
      metrics.si_ms = perf.si_ms;
      metrics.performance_score = perf.performance_score;
      metrics.accessibility_score = perf.accessibility_score;
      metrics.best_practices_score = perf.best_practices_score;
      metrics.seo_score = perf.seo_score;
    }

    // Load test metrics
    if (results.load?.metrics) {
      const load = results.load.metrics;
      metrics.load_p50_ms = load.p50_ms;
      metrics.load_p90_ms = load.p90_ms;
      metrics.load_p95_ms = load.p95_ms;
      metrics.load_p99_ms = load.p99_ms;
      metrics.load_rps = load.rps;
      metrics.load_error_rate = load.error_rate;
      metrics.load_total_requests = load.total_requests;
    }

    // Smoke test metrics
    if (results.smoke?.summary) {
      metrics.smoke_passed = results.smoke.summary.passed;
      metrics.smoke_failed = results.smoke.summary.failed;
      metrics.smoke_total = results.smoke.summary.total;
    }

    // Visual regression metrics
    if (results.visualRegression?.summary) {
      const vr = results.visualRegression.summary;
      metrics.visual_passed = vr.passed;
      metrics.visual_failed = vr.failed;
      metrics.visual_baseline_captures = vr.baseline_captures;
    }

    // Pixel audit metrics
    if (results.pixelAudit) {
      metrics.pixels_detected = results.pixelAudit.pixels_found?.filter(p => p.detected).length || 0;
      metrics.pixels_missing = results.pixelAudit.missing_pixels?.length || 0;
      metrics.network_requests = results.pixelAudit.total_network_requests;
    }

    // Remove undefined values
    Object.keys(metrics).forEach(key => {
      if (metrics[key] === undefined) {
        delete metrics[key];
      }
    });

    return metrics;
  }

  /**
   * Generate unified test report
   * @param {Object} options - Report options
   * @returns {Promise<Object>} - Unified report
   */
  async generateReport(options) {
    const {
      target_url,
      website_id,
      test_run_id,
      results = {},
      metadata = {}
    } = options;

    await this.ensureDirectory();

    const runId = test_run_id || uuidv4();
    const status = this.determineOverallStatus(results);
    const summary = this.generateSummary(results);
    const artifacts = this.collectArtifacts(results);
    const metrics = this.collectMetrics(results);

    const report = {
      runId,
      status,
      summary,
      target_url,
      website_id,
      artifacts,
      metrics,
      tests: {
        smoke: results.smoke ? {
          executed: true,
          success: results.smoke.success,
          duration_ms: results.smoke.duration_ms,
          results: results.smoke.results
        } : { executed: false },
        performance: results.performance ? {
          executed: true,
          success: results.performance.status === 'Pass',
          duration_ms: results.performance.duration_ms,
          scores: {
            performance: results.performance.metrics?.performance_score,
            accessibility: results.performance.metrics?.accessibility_score,
            best_practices: results.performance.metrics?.best_practices_score,
            seo: results.performance.metrics?.seo_score
          }
        } : { executed: false },
        load: results.load ? {
          executed: true,
          success: results.load.status === 'Pass',
          virtual_users: results.load.virtual_users,
          duration: results.load.duration,
          threshold_breaches: results.load.threshold_breaches
        } : { executed: false },
        visualRegression: results.visualRegression ? {
          executed: true,
          success: results.visualRegression.success,
          is_baseline_run: results.visualRegression.is_baseline_run,
          comparisons: results.visualRegression.comparisons?.length || 0
        } : { executed: false },
        pixelAudit: results.pixelAudit ? {
          executed: true,
          success: results.pixelAudit.missing_pixels?.length === 0,
          pixels_found: results.pixelAudit.pixels_found,
          missing_pixels: results.pixelAudit.missing_pixels
        } : { executed: false }
      },
      metadata: {
        ...metadata,
        generated_at: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    // Save report locally
    const reportFileName = `${runId}-report.json`;
    const localPath = path.join(this.reportPath, reportFileName);
    await fs.writeFile(localPath, JSON.stringify(report, null, 2));

    // Upload to storage
    let reportUrl = null;
    try {
      reportUrl = await storage.uploadFile(
        localPath,
        `reports/${reportFileName}`,
        'application/json'
      );
      report.report_url = reportUrl;
    } catch (error) {
      logger.warn('Failed to upload report to storage:', error.message);
    }

    logger.info('Report generated', {
      runId,
      status,
      tests_executed: Object.values(report.tests).filter(t => t.executed).length
    });

    return report;
  }

  /**
   * Generate a quick summary report for dashboard display
   * @param {Object} report - Full unified report
   * @returns {Object} - Dashboard summary
   */
  toDashboardSummary(report) {
    return {
      runId: report.runId,
      status: report.status,
      summary: report.summary,
      target_url: report.target_url,
      website_id: report.website_id,
      metrics: {
        lcp: report.metrics.lcp_ms,
        cls: report.metrics.cls,
        performance_score: report.metrics.performance_score,
        p95: report.metrics.load_p95_ms,
        rps: report.metrics.load_rps
      },
      tests: Object.entries(report.tests).reduce((acc, [key, value]) => {
        if (value.executed) {
          acc[key] = value.success ? 'pass' : 'fail';
        }
        return acc;
      }, {}),
      generated_at: report.metadata.generated_at
    };
  }
}

module.exports = new ReportService();
