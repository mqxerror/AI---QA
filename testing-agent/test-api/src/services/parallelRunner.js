/**
 * Parallel Test Runner Service
 * Runs tests concurrently across multiple browser contexts
 *
 * Task: D1.1, D1.2, D1.3
 * Owner: Derek
 */

const { chromium } = require('playwright');
const EventEmitter = require('events');
const logger = require('../utils/logger');

class ParallelTestRunner extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxWorkers = options.maxWorkers || 4;
    this.timeout = options.timeout || 30000;
    this.headless = options.headless !== false;
    this.browser = null;
    this.completedCount = 0;
    this.totalCount = 0;
  }

  /**
   * Run tests in parallel across multiple pages
   * @param {Array} pages - Array of page configs { url, name, checks }
   * @param {Object} testConfig - Test configuration
   * @returns {Promise<Array>} Results array
   */
  async runTests(pages, testConfig = {}) {
    this.completedCount = 0;
    this.totalCount = pages.length;

    logger.info(`Starting parallel test run: ${pages.length} pages, ${this.maxWorkers} workers`);

    try {
      // Launch browser
      this.browser = await chromium.launch({
        headless: this.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      // Split pages into chunks for workers
      const chunks = this.chunkArray(pages, Math.ceil(pages.length / this.maxWorkers));

      // Run workers in parallel
      const workerPromises = chunks.map((chunk, workerIndex) =>
        this.runWorker(chunk, workerIndex, testConfig)
      );

      const results = await Promise.all(workerPromises);

      // Flatten results
      const flatResults = results.flat();

      logger.info(`Parallel test run complete: ${flatResults.length} results`);

      return flatResults;
    } finally {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }

  /**
   * Run a single worker processing a chunk of pages
   */
  async runWorker(pages, workerIndex, testConfig) {
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'QA-Testing-Agent/1.0'
    });

    const results = [];

    for (const pageConfig of pages) {
      try {
        const result = await this.runSingleTest(context, pageConfig, testConfig);
        results.push(result);
      } catch (error) {
        results.push({
          url: pageConfig.url,
          name: pageConfig.name,
          status: 'error',
          error: error.message,
          duration: 0
        });
      }

      // Emit progress
      this.completedCount++;
      this.emit('progress', {
        completed: this.completedCount,
        total: this.totalCount,
        percentage: Math.round((this.completedCount / this.totalCount) * 100),
        currentUrl: pageConfig.url,
        workerIndex
      });
    }

    await context.close();
    return results;
  }

  /**
   * Run test on a single page
   */
  async runSingleTest(context, pageConfig, testConfig) {
    const page = await context.newPage();
    const startTime = Date.now();
    const checks = [];

    try {
      // Navigate to page
      const response = await page.goto(pageConfig.url, {
        waitUntil: 'domcontentloaded',
        timeout: this.timeout
      });

      const statusCode = response?.status() || 0;

      // Check 1: Page loads
      checks.push({
        name: 'pageLoads',
        passed: statusCode >= 200 && statusCode < 400,
        details: { statusCode }
      });

      // Check 2: No console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Wait a bit for JS to execute
      await page.waitForTimeout(1000);

      checks.push({
        name: 'noConsoleErrors',
        passed: consoleErrors.length === 0,
        details: { errorCount: consoleErrors.length, errors: consoleErrors.slice(0, 5) }
      });

      // Check 3: Page has content
      const bodyText = await page.evaluate(() => document.body?.innerText?.length || 0);
      checks.push({
        name: 'hasContent',
        passed: bodyText > 100,
        details: { contentLength: bodyText }
      });

      // Check 4: No broken images
      const brokenImages = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).filter(img => !img.complete || img.naturalWidth === 0).length;
      });
      checks.push({
        name: 'noBrokenImages',
        passed: brokenImages === 0,
        details: { brokenCount: brokenImages }
      });

      // Check 5: Page title exists
      const title = await page.title();
      checks.push({
        name: 'hasTitle',
        passed: title && title.length > 0,
        details: { title }
      });

      // Custom checks from config
      if (pageConfig.checks) {
        for (const check of pageConfig.checks) {
          const customResult = await this.runCustomCheck(page, check);
          checks.push(customResult);
        }
      }

      const duration = Date.now() - startTime;
      const passedChecks = checks.filter(c => c.passed).length;
      const status = passedChecks === checks.length ? 'passed' :
                     passedChecks > 0 ? 'partial' : 'failed';

      return {
        url: pageConfig.url,
        name: pageConfig.name || pageConfig.url,
        status,
        statusCode,
        duration,
        checks,
        passedChecks,
        totalChecks: checks.length
      };
    } catch (error) {
      return {
        url: pageConfig.url,
        name: pageConfig.name || pageConfig.url,
        status: 'error',
        error: error.message,
        duration: Date.now() - startTime,
        checks
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Run a custom check
   */
  async runCustomCheck(page, check) {
    try {
      switch (check.type) {
        case 'selector':
          const element = await page.$(check.selector);
          return {
            name: check.name || `selector:${check.selector}`,
            passed: !!element,
            details: { selector: check.selector }
          };

        case 'text':
          const hasText = await page.evaluate((text) => {
            return document.body.innerText.includes(text);
          }, check.text);
          return {
            name: check.name || `text:${check.text}`,
            passed: hasText,
            details: { searchText: check.text }
          };

        case 'script':
          const scriptResult = await page.evaluate(check.script);
          return {
            name: check.name || 'customScript',
            passed: !!scriptResult,
            details: { result: scriptResult }
          };

        default:
          return {
            name: check.name || 'unknown',
            passed: false,
            details: { error: `Unknown check type: ${check.type}` }
          };
      }
    } catch (error) {
      return {
        name: check.name || 'customCheck',
        passed: false,
        details: { error: error.message }
      };
    }
  }

  /**
   * Split array into chunks
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

module.exports = ParallelTestRunner;
