const { chromium } = require('playwright');
const { injectAxe, getViolations } = require('axe-playwright');

class AccessibilityService {
  static async runTest(url) {
    const startTime = Date.now();
    let browser = null;
    let context = null;
    let page = null;

    try {
      // Launch browser
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      });

      page = await context.newPage();

      // Navigate to URL
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Inject axe-core
      await injectAxe(page);

      // Run accessibility scan
      const violations = await getViolations(page);

      const duration = Date.now() - startTime;

      // Format results
      const formattedViolations = violations.map(violation => ({
        id: violation.id,
        impact: violation.impact || 'minor',
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        tags: violation.tags || [],
        nodes: violation.nodes || []
      }));

      return {
        success: violations.length === 0,
        violations: formattedViolations,
        summary: {
          total: violations.length,
          critical: violations.filter(v => v.impact === 'critical').length,
          serious: violations.filter(v => v.impact === 'serious').length,
          moderate: violations.filter(v => v.impact === 'moderate').length,
          minor: violations.filter(v => v.impact === 'minor').length
        },
        duration_ms: duration,
        url: url,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Accessibility test failed: ${error.message}`);
    } finally {
      // Cleanup
      if (page) await page.close().catch(() => {});
      if (context) await context.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
    }
  }
}

module.exports = AccessibilityService;
