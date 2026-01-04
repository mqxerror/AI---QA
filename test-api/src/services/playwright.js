const { chromium, firefox, webkit } = require('playwright');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const storage = require('../utils/storage');

/**
 * Browser Pool for keeping warm browser instances
 * Reduces cold-start time by ~500ms-1s per test
 */
class BrowserPool {
  constructor(options = {}) {
    this.maxInstances = options.maxInstances || 2;
    this.idleTimeout = options.idleTimeout || 60000; // 1 minute
    this.pool = new Map(); // browserType -> { browser, lastUsed, contexts: [] }
    this.cleanupInterval = null;
  }

  async initialize() {
    logger.info('Initializing browser pool...');
    // Pre-warm chromium (most commonly used)
    await this.getBrowser('chromium');

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 30000);
    logger.info('Browser pool initialized with chromium');
  }

  async getBrowser(browserType = 'chromium') {
    const browsers = { chromium, firefox, webkit };

    if (this.pool.has(browserType)) {
      const poolEntry = this.pool.get(browserType);
      poolEntry.lastUsed = Date.now();
      logger.debug(`Reusing warm ${browserType} browser`);
      return poolEntry.browser;
    }

    logger.info(`Launching new ${browserType} browser for pool`);
    const browser = await browsers[browserType].launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    this.pool.set(browserType, {
      browser,
      lastUsed: Date.now(),
      contexts: []
    });

    return browser;
  }

  async createContext(browserType = 'chromium', options = {}) {
    const browser = await this.getBrowser(browserType);
    const context = await browser.newContext({
      viewport: options.viewport || { width: 1920, height: 1080 },
      userAgent: options.userAgent || 'Mozilla/5.0 (compatible; TestingAgent/1.0; +https://testing-agent.com)',
      ...options
    });

    // Track context for cleanup
    const poolEntry = this.pool.get(browserType);
    if (poolEntry) {
      poolEntry.contexts.push(context);
    }

    return context;
  }

  async releaseContext(context) {
    try {
      await context.close();
    } catch (error) {
      logger.warn('Error closing context:', error.message);
    }
  }

  async cleanup() {
    const now = Date.now();
    for (const [browserType, poolEntry] of this.pool.entries()) {
      // Close idle browsers (except chromium which we keep warm)
      if (browserType !== 'chromium' && now - poolEntry.lastUsed > this.idleTimeout) {
        logger.info(`Closing idle ${browserType} browser`);
        try {
          await poolEntry.browser.close();
          this.pool.delete(browserType);
        } catch (error) {
          logger.warn(`Error closing ${browserType}:`, error.message);
        }
      }
    }
  }

  async shutdown() {
    logger.info('Shutting down browser pool...');
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    for (const [browserType, poolEntry] of this.pool.entries()) {
      try {
        await poolEntry.browser.close();
        logger.info(`Closed ${browserType} browser`);
      } catch (error) {
        logger.warn(`Error closing ${browserType}:`, error.message);
      }
    }
    this.pool.clear();
  }
}

// Singleton browser pool
const browserPool = new BrowserPool();

class PlaywrightService {
  constructor() {
    this.browsers = { chromium, firefox, webkit };
    this.pool = browserPool;
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await this.pool.initialize();
      this.initialized = true;
    }
  }

  /**
   * Helper: Capture and upload screenshot
   * @param {Page} page - Playwright page
   * @param {string} name - Screenshot name
   * @param {Object} options - Screenshot options
   * @returns {Promise<string>} - Screenshot URL
   */
  async captureScreenshot(page, name, options = {}) {
    const runId = uuidv4();
    const filename = `${runId}-${name}.png`;
    const localPath = `/app/artifacts/screenshots/${filename}`;

    await page.screenshot({
      path: localPath,
      fullPage: options.fullPage || false,
      ...options
    });

    const url = await storage.uploadFile(localPath, `screenshots/${filename}`, 'image/png');
    return url;
  }

  /**
   * Run smoke tests with browser pool
   * @param {Object} config - Test configuration
   * @returns {Promise<Object>} - Test results
   */
  async runSmokeTests(config) {
    const {
      target_url,
      browser = 'chromium',
      viewport = { width: 1920, height: 1080 },
      tests = ['homepage_loads', 'navigation_works', 'no_console_errors', 'images_load']
    } = config;

    logger.info(`Running smoke tests on ${target_url}`, { browser, viewport });

    // Ensure pool is initialized
    await this.initialize();

    // Use pool for context (much faster than launching new browser)
    const context = await this.pool.createContext(browser, { viewport });
    const page = await context.newPage();
    const results = [];
    const runId = uuidv4();

    try {
      // Collect console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Test 1: Homepage loads
      if (tests.includes('homepage_loads')) {
        const startTime = Date.now();
        try {
          const response = await page.goto(target_url, { waitUntil: 'networkidle', timeout: 30000 });
          const duration = Date.now() - startTime;
          const status = response.status();

          const screenshotUrl = await this.captureScreenshot(page, 'homepage');

          results.push({
            name: 'homepage_loads',
            status: status < 400 ? 'pass' : 'fail',
            duration_ms: duration,
            message: `HTTP ${status}`,
            screenshot: screenshotUrl
          });
        } catch (error) {
          results.push({
            name: 'homepage_loads',
            status: 'fail',
            duration_ms: Date.now() - startTime,
            error: error.message
          });
        }
      }

      // Test 2: No console errors
      if (tests.includes('no_console_errors')) {
        results.push({
          name: 'no_console_errors',
          status: consoleErrors.length === 0 ? 'pass' : 'fail',
          message: consoleErrors.length === 0 ? 'No console errors' : `${consoleErrors.length} console errors`,
          errors: consoleErrors.slice(0, 10)
        });
      }

      // Test 3: All images load
      if (tests.includes('images_load')) {
        const startTime = Date.now();
        try {
          await page.waitForLoadState('networkidle');
          const images = await page.locator('img').all();
          let brokenImages = 0;

          for (const img of images) {
            const src = await img.getAttribute('src');
            if (src && !src.startsWith('data:')) {
              const naturalWidth = await img.evaluate((el) => el.naturalWidth);
              if (naturalWidth === 0) {
                brokenImages++;
              }
            }
          }

          results.push({
            name: 'images_load',
            status: brokenImages === 0 ? 'pass' : 'fail',
            duration_ms: Date.now() - startTime,
            message: brokenImages === 0 ? `All ${images.length} images loaded` : `${brokenImages}/${images.length} images failed`,
            total_images: images.length,
            broken_images: brokenImages
          });
        } catch (error) {
          results.push({
            name: 'images_load',
            status: 'fail',
            error: error.message
          });
        }
      }

      // Test 4: Navigation works
      if (tests.includes('navigation_works')) {
        const startTime = Date.now();
        try {
          const navLinks = await page.locator('nav a, header a').filter({ hasText: /.+/ }).all();
          const linkCount = navLinks.length;

          results.push({
            name: 'navigation_works',
            status: linkCount > 0 ? 'pass' : 'fail',
            duration_ms: Date.now() - startTime,
            message: `Found ${linkCount} navigation links`,
            link_count: linkCount
          });
        } catch (error) {
          results.push({
            name: 'navigation_works',
            status: 'fail',
            error: error.message
          });
        }
      }

      // Test 5: Links valid (first 20)
      if (tests.includes('links_valid')) {
        const startTime = Date.now();
        try {
          const links = await page.locator('a[href]').all();
          const brokenLinks = [];

          for (const link of links.slice(0, 20)) {
            const href = await link.getAttribute('href');
            if (href && href.startsWith('http')) {
              try {
                const response = await page.request.head(href);
                if (response.status() >= 400) {
                  brokenLinks.push({ url: href, status: response.status() });
                }
              } catch (e) {
                brokenLinks.push({ url: href, error: 'failed' });
              }
            }
          }

          results.push({
            name: 'links_valid',
            status: brokenLinks.length === 0 ? 'pass' : 'fail',
            duration_ms: Date.now() - startTime,
            message: brokenLinks.length === 0 ? 'All links valid' : `${brokenLinks.length} broken links`,
            broken_links: brokenLinks
          });
        } catch (error) {
          results.push({
            name: 'links_valid',
            status: 'fail',
            error: error.message
          });
        }
      }

    } catch (error) {
      logger.error('Smoke test error:', error);
      throw error;
    } finally {
      // Release context back to pool (don't close browser)
      await this.pool.releaseContext(context);
    }

    const totalDuration = results.reduce((sum, r) => sum + (r.duration_ms || 0), 0);
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;

    return {
      success: failed === 0,
      duration_ms: totalDuration,
      results,
      summary: {
        total: results.length,
        passed,
        failed
      },
      browser,
      viewport: `${viewport.width}x${viewport.height}`
    };
  }

  /**
   * Run pixel audit tests with browser pool
   * @param {Object} config - Test configuration
   * @returns {Promise<Object>} - Audit results
   */
  async runPixelAudit(config) {
    const {
      target_url,
      incognito = true,
      expected_pixels = [],
      capture_har = true
    } = config;

    logger.info(`Running pixel audit on ${target_url}`);

    // Ensure pool is initialized
    await this.initialize();

    const context = await this.pool.createContext('chromium', {
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();
    const networkRequests = [];
    const runId = uuidv4();

    // Capture network requests
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });

    try {
      await page.goto(target_url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000); // Wait for delayed scripts

      const pixelsFound = [];

      // Check for GA4
      const ga4Requests = networkRequests.filter(r =>
        r.url.includes('google-analytics.com') ||
        r.url.includes('googletagmanager.com/gtag') ||
        r.url.includes('analytics.google.com')
      );

      if (ga4Requests.length > 0 || expected_pixels.includes('GA4')) {
        pixelsFound.push({
          name: 'GA4',
          detected: ga4Requests.length > 0,
          script_url: ga4Requests[0]?.url || null,
          network_calls: ga4Requests.length
        });
      }

      // Check for GTM
      const gtmRequests = networkRequests.filter(r =>
        r.url.includes('googletagmanager.com/gtm.js')
      );
      const gtmScript = await page.locator('script[src*="googletagmanager.com/gtm"]').count();

      if (gtmRequests.length > 0 || gtmScript > 0 || expected_pixels.includes('GTM')) {
        const gtmContainer = await page.evaluate(() => {
          const match = document.documentElement.innerHTML.match(/GTM-[A-Z0-9]+/);
          return match ? match[0] : null;
        });

        pixelsFound.push({
          name: 'GTM',
          detected: gtmRequests.length > 0 || gtmScript > 0,
          container_id: gtmContainer,
          script_url: gtmRequests[0]?.url || null
        });
      }

      // Check for Meta Pixel
      const metaRequests = networkRequests.filter(r =>
        r.url.includes('facebook.com/tr') ||
        r.url.includes('connect.facebook.net')
      );
      const hasFbq = await page.evaluate(() => typeof window.fbq !== 'undefined');

      if (metaRequests.length > 0 || hasFbq || expected_pixels.includes('Meta Pixel')) {
        const pixelId = await page.evaluate(() => {
          const match = document.documentElement.innerHTML.match(/fbq\('init',\s*'(\d+)'/);
          return match ? match[1] : null;
        });

        pixelsFound.push({
          name: 'Meta Pixel',
          detected: metaRequests.length > 0 || hasFbq,
          pixel_id: pixelId,
          script_url: metaRequests[0]?.url || null,
          events: metaRequests.filter(r => r.url.includes('/tr')).length
        });
      }

      // Take screenshot using helper
      const screenshotUrl = await this.captureScreenshot(page, 'pixel-audit', { fullPage: true });

      // Save HAR if requested
      let harUrl = null;
      if (capture_har) {
        const harPath = `/app/artifacts/har/${runId}-audit.json`;
        await fs.writeFile(harPath, JSON.stringify({ log: { entries: networkRequests } }, null, 2));
        harUrl = await storage.uploadFile(harPath, `har/${runId}-audit.json`, 'application/json');
      }

      // Determine missing pixels
      const detectedNames = pixelsFound.filter(p => p.detected).map(p => p.name);
      const missingPixels = expected_pixels.filter(p => !detectedNames.includes(p));

      return {
        success: true,
        pixels_found: pixelsFound,
        missing_pixels: missingPixels,
        total_network_requests: networkRequests.length,
        screenshot_url: screenshotUrl,
        har_url: harUrl
      };

    } catch (error) {
      logger.error('Pixel audit error:', error);
      throw error;
    } finally {
      await this.pool.releaseContext(context);
    }
  }

  /**
   * Capture screenshots for visual regression
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} - Screenshots data
   */
  async captureForVisualRegression(config) {
    const {
      target_url,
      viewports = [
        { name: 'desktop', width: 1920, height: 1080 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'mobile', width: 375, height: 812 }
      ]
    } = config;

    logger.info(`Capturing visual regression screenshots for ${target_url}`);

    await this.initialize();
    const runId = uuidv4();
    const screenshots = [];

    for (const vp of viewports) {
      const context = await this.pool.createContext('chromium', {
        viewport: { width: vp.width, height: vp.height }
      });
      const page = await context.newPage();

      try {
        await page.goto(target_url, { waitUntil: 'networkidle', timeout: 30000 });

        const screenshotUrl = await this.captureScreenshot(page, `vr-${vp.name}`, {
          fullPage: true
        });

        screenshots.push({
          viewport: vp.name,
          width: vp.width,
          height: vp.height,
          screenshot_url: screenshotUrl,
          captured_at: new Date().toISOString()
        });

      } catch (error) {
        logger.error(`Visual regression capture error for ${vp.name}:`, error);
        screenshots.push({
          viewport: vp.name,
          width: vp.width,
          height: vp.height,
          error: error.message
        });
      } finally {
        await this.pool.releaseContext(context);
      }
    }

    return {
      success: true,
      run_id: runId,
      target_url,
      screenshots,
      captured_at: new Date().toISOString()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    await this.pool.shutdown();
  }
}

// Create singleton instance
const playwrightService = new PlaywrightService();

// Handle process termination
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down browser pool');
  await playwrightService.shutdown();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down browser pool');
  await playwrightService.shutdown();
});

module.exports = playwrightService;
