const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const storage = require('../utils/storage');

class LighthouseService {
  /**
   * Run Lighthouse performance audit
   * @param {Object} config - Test configuration
   * @returns {Promise<Object>} - Performance metrics
   */
  async runPerformanceAudit(config) {
    // Dynamic imports for ESM modules
    const { default: lighthouse } = await import('lighthouse');
    const { launch: chromeLaunch } = await import('chrome-launcher');
    const {
      target_url,
      device = 'desktop',
      thresholds = {
        LCP: 2500,
        CLS: 0.1,
        TTFB: 800,
        performance_score: 80
      }
    } = config;

    logger.info(`Running Lighthouse on ${target_url}`, { device });

    // Use Puppeteer's bundled Chrome for Lighthouse
    const chromePath = puppeteer.executablePath();

    const chrome = await chromeLaunch({
      chromePath,
      chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
    });

    const options = {
      logLevel: 'error',
      output: ['json', 'html'],
      port: chrome.port,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
    };

    // Device emulation
    if (device === 'mobile') {
      options.formFactor = 'mobile';
      options.screenEmulation = {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 3
      };
    } else {
      options.formFactor = 'desktop';
      options.screenEmulation = {
        mobile: false,
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
      };
    }

    try {
      const runnerResult = await lighthouse(target_url, options);
      await chrome.kill();

      const { lhr, report } = runnerResult;
      const runId = uuidv4();

      // Extract core web vitals
      const metrics = {
        LCP: lhr.audits['largest-contentful-paint']?.numericValue || null,
        CLS: lhr.audits['cumulative-layout-shift']?.numericValue || null,
        FCP: lhr.audits['first-contentful-paint']?.numericValue || null,
        INP: lhr.audits['interaction-to-next-paint']?.numericValue || null,
        TTFB: lhr.audits['server-response-time']?.numericValue || null,
        total_requests: lhr.audits['network-requests']?.details?.items?.length || 0,
        page_size_kb: Math.round((lhr.audits['total-byte-weight']?.numericValue || 0) / 1024)
      };

      // Extract scores
      const scores = {
        performance: Math.round((lhr.categories.performance?.score || 0) * 100),
        accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
        seo: Math.round((lhr.categories.seo?.score || 0) * 100),
        best_practices: Math.round((lhr.categories['best-practices']?.score || 0) * 100)
      };

      // Check thresholds
      const thresholdBreaches = [];
      if (metrics.LCP > thresholds.LCP) {
        thresholdBreaches.push(`LCP ${metrics.LCP}ms > ${thresholds.LCP}ms`);
      }
      if (metrics.CLS > thresholds.CLS) {
        thresholdBreaches.push(`CLS ${metrics.CLS} > ${thresholds.CLS}`);
      }
      if (metrics.TTFB > thresholds.TTFB) {
        thresholdBreaches.push(`TTFB ${metrics.TTFB}ms > ${thresholds.TTFB}ms`);
      }
      if (scores.performance < thresholds.performance_score) {
        thresholdBreaches.push(`Performance ${scores.performance} < ${thresholds.performance_score}`);
      }

      // Determine status
      let status = 'Good';
      if (scores.performance < 50) status = 'Poor';
      else if (scores.performance < 80) status = 'Needs Work';

      // Save HTML report
      const htmlReport = Array.isArray(report) ? report[1] : report;
      const reportPath = `/app/artifacts/reports/${runId}-lighthouse.html`;
      await fs.writeFile(reportPath, htmlReport);
      const reportUrl = await storage.uploadFile(reportPath, `reports/${runId}-lighthouse.html`, 'text/html');

      // Save JSON report
      const jsonReportUrl = await storage.uploadJSON(lhr, `reports/${runId}-lighthouse.json`);

      // Extract recommendations
      const recommendations = [];
      const audits = lhr.audits;

      if (audits['unused-javascript']?.score < 1) {
        recommendations.push({
          title: 'Reduce unused JavaScript',
          impact: audits['unused-javascript'].displayValue,
          savings: audits['unused-javascript'].details?.overallSavingsMs
        });
      }

      if (audits['modern-image-formats']?.score < 1) {
        recommendations.push({
          title: 'Serve images in modern formats',
          impact: audits['modern-image-formats'].displayValue,
          count: audits['modern-image-formats'].details?.items?.length
        });
      }

      if (audits['unminified-css']?.score < 1) {
        recommendations.push({
          title: 'Minify CSS',
          impact: audits['unminified-css'].displayValue
        });
      }

      return {
        success: true,
        metrics,
        scores,
        status,
        threshold_breaches: thresholdBreaches,
        recommendations: recommendations.slice(0, 5),
        report_url: reportUrl,
        json_report_url: jsonReportUrl,
        device,
        tested_at: new Date().toISOString()
      };

    } catch (error) {
      await chrome.kill();
      logger.error('Lighthouse error:', error);
      throw error;
    }
  }
}

module.exports = new LighthouseService();
