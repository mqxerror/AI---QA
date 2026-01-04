const fs = require('fs').promises;
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const storage = require('../utils/storage');
const playwrightService = require('./playwright');

/**
 * Visual Regression Service
 * Captures screenshots, compares against baselines, and generates diff images
 */
class VisualRegressionService {
  constructor() {
    this.baselinePath = '/app/artifacts/baselines';
    this.screenshotPath = '/app/artifacts/screenshots';
    this.diffPath = '/app/artifacts/diffs';
    this.threshold = 0.1; // Default threshold: 0.1% difference allowed
  }

  /**
   * Ensure directories exist
   */
  async ensureDirectories() {
    const dirs = [this.baselinePath, this.screenshotPath, this.diffPath];
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory exists
      }
    }
  }

  /**
   * Get baseline path for a website and viewport
   * @param {string} websiteId - Website ID
   * @param {string} viewport - Viewport name
   * @returns {string} - Baseline file path
   */
  getBaselinePath(websiteId, viewport) {
    return path.join(this.baselinePath, `${websiteId}-${viewport}.png`);
  }

  /**
   * Load a PNG image and return its data
   * @param {string} imagePath - Path to PNG file
   * @returns {Promise<PNG>} - PNG image object
   */
  async loadPNG(imagePath) {
    const buffer = await fs.readFile(imagePath);
    return new Promise((resolve, reject) => {
      const png = new PNG();
      png.parse(buffer, (error, data) => {
        if (error) reject(error);
        else resolve(data);
      });
    });
  }

  /**
   * Download image from URL to local path
   * @param {string} url - Image URL
   * @param {string} localPath - Local file path
   */
  async downloadImage(url, localPath) {
    const axios = require('axios');
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    await fs.writeFile(localPath, response.data);
  }

  /**
   * Compare two images using pixelmatch
   * @param {string} baselineUrl - Baseline image URL
   * @param {string} currentUrl - Current image URL
   * @param {Object} options - Comparison options
   * @returns {Promise<Object>} - Comparison result
   */
  async compareImages(baselineUrl, currentUrl, options = {}) {
    const runId = uuidv4();
    await this.ensureDirectories();

    const baselineLocalPath = path.join(this.screenshotPath, `${runId}-baseline.png`);
    const currentLocalPath = path.join(this.screenshotPath, `${runId}-current.png`);
    const diffLocalPath = path.join(this.diffPath, `${runId}-diff.png`);

    try {
      // Download images
      await this.downloadImage(baselineUrl, baselineLocalPath);
      await this.downloadImage(currentUrl, currentLocalPath);

      // Load images
      const baselineImg = await this.loadPNG(baselineLocalPath);
      const currentImg = await this.loadPNG(currentLocalPath);

      // Validate dimensions match
      if (baselineImg.width !== currentImg.width || baselineImg.height !== currentImg.height) {
        return {
          passed: false,
          error: 'Image dimensions do not match',
          baseline_dimensions: `${baselineImg.width}x${baselineImg.height}`,
          current_dimensions: `${currentImg.width}x${currentImg.height}`
        };
      }

      const { width, height } = baselineImg;
      const totalPixels = width * height;

      // Create diff image
      const diff = new PNG({ width, height });

      // Run pixelmatch comparison
      const mismatchedPixels = pixelmatch(
        baselineImg.data,
        currentImg.data,
        diff.data,
        width,
        height,
        {
          threshold: options.threshold || 0.1, // Per-pixel color threshold
          includeAA: options.includeAA !== false, // Include anti-aliased pixels
          alpha: options.alpha || 0.1 // Alpha channel weight
        }
      );

      // Calculate difference percentage
      const differencePercentage = (mismatchedPixels / totalPixels) * 100;
      const passed = differencePercentage <= (options.maxDifference || this.threshold);

      // Write diff image
      const diffBuffer = PNG.sync.write(diff);
      await fs.writeFile(diffLocalPath, diffBuffer);

      // Upload diff image
      const diffUrl = await storage.uploadFile(
        diffLocalPath,
        `diffs/${runId}-diff.png`,
        'image/png'
      );

      // Clean up local files
      await Promise.all([
        fs.unlink(baselineLocalPath).catch(() => {}),
        fs.unlink(currentLocalPath).catch(() => {})
      ]);

      return {
        passed,
        difference_percentage: parseFloat(differencePercentage.toFixed(4)),
        pixels_changed: mismatchedPixels,
        total_pixels: totalPixels,
        diff_url: diffUrl,
        dimensions: { width, height },
        threshold_used: options.maxDifference || this.threshold
      };

    } catch (error) {
      logger.error('Visual comparison error:', error);
      throw error;
    }
  }

  /**
   * Run visual regression test for a website
   * @param {Object} config - Test configuration
   * @returns {Promise<Object>} - Test results
   */
  async runVisualRegression(config) {
    const {
      target_url,
      website_id,
      viewports = [
        { name: 'desktop', width: 1920, height: 1080 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'mobile', width: 375, height: 812 }
      ],
      threshold = 0.1, // Max allowed difference in percentage
      update_baseline = false
    } = config;

    logger.info(`Running visual regression on ${target_url}`, { website_id, viewports: viewports.length });

    await this.ensureDirectories();
    const runId = uuidv4();
    const results = [];
    let isBaselineRun = false;

    // Capture current screenshots
    const captureResult = await playwrightService.captureForVisualRegression({
      target_url,
      viewports
    });

    for (const screenshot of captureResult.screenshots) {
      if (screenshot.error) {
        results.push({
          viewport: screenshot.viewport,
          width: screenshot.width,
          height: screenshot.height,
          passed: false,
          error: screenshot.error
        });
        continue;
      }

      const baselineKey = `baselines/${website_id}-${screenshot.viewport}.png`;

      // Check if baseline exists
      let baselineExists = false;
      let baselineUrl = null;

      try {
        // Try to get baseline from storage
        baselineUrl = await storage.getFileUrl(baselineKey);
        baselineExists = !!baselineUrl;
      } catch (error) {
        baselineExists = false;
      }

      if (!baselineExists || update_baseline) {
        // No baseline exists or update requested - save current as baseline
        isBaselineRun = true;

        try {
          // Download current screenshot and upload as baseline
          const tempPath = path.join(this.screenshotPath, `${runId}-temp-${screenshot.viewport}.png`);
          await this.downloadImage(screenshot.screenshot_url, tempPath);
          await storage.uploadFile(tempPath, baselineKey, 'image/png');
          await fs.unlink(tempPath).catch(() => {});

          results.push({
            viewport: screenshot.viewport,
            width: screenshot.width,
            height: screenshot.height,
            passed: true,
            is_baseline_run: true,
            screenshot_path: screenshot.screenshot_url,
            baseline_exists: false,
            message: 'Baseline captured for future comparisons'
          });
        } catch (error) {
          logger.error(`Error saving baseline for ${screenshot.viewport}:`, error);
          results.push({
            viewport: screenshot.viewport,
            width: screenshot.width,
            height: screenshot.height,
            passed: false,
            error: `Failed to save baseline: ${error.message}`
          });
        }
      } else {
        // Compare with baseline
        try {
          const comparison = await this.compareImages(baselineUrl, screenshot.screenshot_url, {
            maxDifference: threshold
          });

          results.push({
            viewport: screenshot.viewport,
            width: screenshot.width,
            height: screenshot.height,
            passed: comparison.passed,
            difference_percentage: comparison.difference_percentage,
            pixels_changed: comparison.pixels_changed,
            total_pixels: comparison.total_pixels,
            diff_path: comparison.diff_url,
            baseline_path: baselineUrl,
            screenshot_path: screenshot.screenshot_url,
            baseline_exists: true
          });
        } catch (error) {
          logger.error(`Visual comparison error for ${screenshot.viewport}:`, error);
          results.push({
            viewport: screenshot.viewport,
            width: screenshot.width,
            height: screenshot.height,
            passed: false,
            error: error.message
          });
        }
      }
    }

    // Calculate summary
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed && !r.is_baseline_run).length;
    const baselineCaptures = results.filter(r => r.is_baseline_run).length;

    return {
      success: failed === 0,
      run_id: runId,
      target_url,
      website_id,
      is_baseline_run: isBaselineRun,
      comparisons: results,
      summary: {
        total: results.length,
        passed,
        failed,
        baseline_captures: baselineCaptures
      },
      threshold_used: threshold,
      captured_at: new Date().toISOString()
    };
  }

  /**
   * Update baseline for a specific viewport
   * @param {string} websiteId - Website ID
   * @param {string} viewport - Viewport name
   * @param {string} screenshotUrl - Screenshot URL to use as new baseline
   * @returns {Promise<Object>} - Update result
   */
  async updateBaseline(websiteId, viewport, screenshotUrl) {
    await this.ensureDirectories();
    const runId = uuidv4();
    const tempPath = path.join(this.screenshotPath, `${runId}-baseline-update.png`);
    const baselineKey = `baselines/${websiteId}-${viewport}.png`;

    try {
      await this.downloadImage(screenshotUrl, tempPath);
      const url = await storage.uploadFile(tempPath, baselineKey, 'image/png');
      await fs.unlink(tempPath).catch(() => {});

      return {
        success: true,
        website_id: websiteId,
        viewport,
        baseline_url: url,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Baseline update error:', error);
      throw error;
    }
  }

  /**
   * Delete baseline for a website
   * @param {string} websiteId - Website ID
   * @param {string} viewport - Optional viewport (delete all if not specified)
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteBaseline(websiteId, viewport = null) {
    const viewports = viewport
      ? [viewport]
      : ['desktop', 'tablet', 'mobile'];

    const deleted = [];
    for (const vp of viewports) {
      const baselineKey = `baselines/${websiteId}-${vp}.png`;
      try {
        await storage.deleteFile(baselineKey);
        deleted.push(vp);
      } catch (error) {
        // Baseline might not exist
      }
    }

    return {
      success: true,
      website_id: websiteId,
      deleted_viewports: deleted
    };
  }
}

module.exports = new VisualRegressionService();
