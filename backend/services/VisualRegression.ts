import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';
import pixelmatch from 'pixelmatch';

interface VisualRegressionIssue {
  severity: 'critical' | 'warning' | 'info';
  viewport: string;
  difference_percentage: number;
  pixels_changed: number;
  description: string;
}

interface ViewportComparison {
  viewport: string;
  width: number;
  height: number;
  baseline_exists: boolean;
  screenshot_path: string;
  baseline_path?: string;
  diff_path?: string;
  difference_percentage: number;
  pixels_changed: number;
  total_pixels: number;
  is_baseline_run: boolean;
  passed: boolean;
}

interface VisualRegressionResult {
  success: boolean;
  url: string;
  duration_ms: number;
  timestamp: string;
  overall_score: number; // 0-100 (100 = no visual changes)
  is_baseline_run: boolean;
  comparisons: ViewportComparison[];
  issues: VisualRegressionIssue[];
  summary: {
    total_viewports: number;
    passed: number;
    failed: number;
    baseline_created: number;
  };
}

class VisualRegression {
  private static screenshotsDir = path.join(process.cwd(), 'screenshots');
  private static baselineDir = path.join(process.cwd(), 'screenshots', 'baseline');
  private static diffDir = path.join(process.cwd(), 'screenshots', 'diff');

  // Standard viewports to test
  private static viewports = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ];

  /**
   * Run visual regression test on a URL
   */
  static async runTest(url: string, websiteId: number, createBaseline = false): Promise<VisualRegressionResult> {
    const startTime = Date.now();
    const issues: VisualRegressionIssue[] = [];
    const comparisons: ViewportComparison[] = [];

    // Ensure directories exist
    this.ensureDirectories();

    let browser = null;
    try {
      browser = await chromium.launch({ headless: true });

      for (const viewport of this.viewports) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: 1
        });
        const page = await context.newPage();

        // Navigate to page
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait a bit for any animations to settle
        await page.waitForTimeout(1000);

        // Generate file paths
        const sanitizedUrl = this.sanitizeFilename(url);
        const timestamp = Date.now();
        const screenshotFilename = `${websiteId}-${sanitizedUrl}-${viewport.name}-${timestamp}.png`;
        const baselineFilename = `${websiteId}-${sanitizedUrl}-${viewport.name}-baseline.png`;
        const diffFilename = `${websiteId}-${sanitizedUrl}-${viewport.name}-diff-${timestamp}.png`;

        const screenshotPath = path.join(this.screenshotsDir, screenshotFilename);
        const baselinePath = path.join(this.baselineDir, baselineFilename);
        const diffPath = path.join(this.diffDir, diffFilename);

        // Take screenshot
        await page.screenshot({
          path: screenshotPath,
          fullPage: true
        });

        await context.close();

        // Check if baseline exists
        const baselineExists = fs.existsSync(baselinePath);

        let comparison: ViewportComparison;

        if (createBaseline || !baselineExists) {
          // Create baseline
          if (fs.existsSync(screenshotPath)) {
            fs.copyFileSync(screenshotPath, baselinePath);
          }

          comparison = {
            viewport: viewport.name,
            width: viewport.width,
            height: viewport.height,
            baseline_exists: false,
            screenshot_path: screenshotFilename,
            baseline_path: baselineFilename,
            difference_percentage: 0,
            pixels_changed: 0,
            total_pixels: 0,
            is_baseline_run: true,
            passed: true
          };
        } else {
          // Compare with baseline
          const comparisonResult = await this.compareScreenshots(
            baselinePath,
            screenshotPath,
            diffPath
          );

          const passed = comparisonResult.difference_percentage < 1.0; // Less than 1% difference

          comparison = {
            viewport: viewport.name,
            width: viewport.width,
            height: viewport.height,
            baseline_exists: true,
            screenshot_path: screenshotFilename,
            baseline_path: baselineFilename,
            diff_path: diffFilename,
            difference_percentage: comparisonResult.difference_percentage,
            pixels_changed: comparisonResult.pixels_changed,
            total_pixels: comparisonResult.total_pixels,
            is_baseline_run: false,
            passed
          };

          // Add issues if differences found
          if (!passed) {
            const severity: 'critical' | 'warning' | 'info' =
              comparisonResult.difference_percentage > 5 ? 'critical' :
              comparisonResult.difference_percentage > 2 ? 'warning' : 'info';

            issues.push({
              severity,
              viewport: viewport.name,
              difference_percentage: comparisonResult.difference_percentage,
              pixels_changed: comparisonResult.pixels_changed,
              description: `${comparisonResult.difference_percentage.toFixed(2)}% visual difference detected in ${viewport.name} viewport`
            });
          }
        }

        comparisons.push(comparison);
      }

      await browser.close();

      // Calculate summary
      const summary = {
        total_viewports: comparisons.length,
        passed: comparisons.filter(c => c.passed).length,
        failed: comparisons.filter(c => !c.passed).length,
        baseline_created: comparisons.filter(c => c.is_baseline_run).length
      };

      const isBaselineRun = summary.baseline_created > 0;
      const overall_score = this.calculateVisualScore(comparisons);

      return {
        success: summary.failed === 0,
        url,
        duration_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        overall_score,
        is_baseline_run: isBaselineRun,
        comparisons,
        issues,
        summary
      };
    } catch (error: any) {
      if (browser) await browser.close();
      throw new Error(`Visual regression test failed: ${error.message}`);
    }
  }

  /**
   * Compare two screenshots and return difference metrics
   */
  private static async compareScreenshots(
    baselinePath: string,
    currentPath: string,
    diffPath: string
  ): Promise<{
    difference_percentage: number;
    pixels_changed: number;
    total_pixels: number;
  }> {
    try {
      const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
      const current = PNG.sync.read(fs.readFileSync(currentPath));

      const { width, height } = baseline;
      const diff = new PNG({ width, height });

      // Ensure images are same size
      if (baseline.width !== current.width || baseline.height !== current.height) {
        throw new Error('Image dimensions do not match');
      }

      const pixelsDifferent = pixelmatch(
        baseline.data,
        current.data,
        diff.data,
        width,
        height,
        { threshold: 0.1 }
      );

      const totalPixels = width * height;
      const differencePercentage = (pixelsDifferent / totalPixels) * 100;

      // Save diff image
      fs.writeFileSync(diffPath, PNG.sync.write(diff));

      return {
        difference_percentage: differencePercentage,
        pixels_changed: pixelsDifferent,
        total_pixels: totalPixels
      };
    } catch (error: any) {
      throw new Error(`Screenshot comparison failed: ${error.message}`);
    }
  }

  /**
   * Calculate overall visual regression score (0-100)
   * 100 = no changes, 0 = massive changes
   */
  private static calculateVisualScore(comparisons: ViewportComparison[]): number {
    if (comparisons.length === 0) return 100;

    // If all are baseline runs, return 100
    if (comparisons.every(c => c.is_baseline_run)) return 100;

    // Calculate average difference percentage
    const nonBaselineComparisons = comparisons.filter(c => !c.is_baseline_run);
    if (nonBaselineComparisons.length === 0) return 100;

    const avgDifference = nonBaselineComparisons.reduce(
      (sum, c) => sum + c.difference_percentage,
      0
    ) / nonBaselineComparisons.length;

    // Convert to score (higher difference = lower score)
    // 0% diff = 100 score
    // 10% diff = 0 score
    const score = Math.max(0, 100 - (avgDifference * 10));

    return Math.round(score);
  }

  /**
   * Sanitize URL for filename
   */
  private static sanitizeFilename(url: string): string {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .substring(0, 50);
  }

  /**
   * Ensure required directories exist
   */
  private static ensureDirectories(): void {
    [this.screenshotsDir, this.baselineDir, this.diffDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Delete baseline for a website (to recreate)
   */
  static async deleteBaseline(websiteId: number, url: string): Promise<boolean> {
    try {
      const sanitizedUrl = this.sanitizeFilename(url);

      for (const viewport of this.viewports) {
        const baselineFilename = `${websiteId}-${sanitizedUrl}-${viewport.name}-baseline.png`;
        const baselinePath = path.join(this.baselineDir, baselineFilename);

        if (fs.existsSync(baselinePath)) {
          fs.unlinkSync(baselinePath);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to delete baseline:', error);
      return false;
    }
  }
}

export default VisualRegression;
